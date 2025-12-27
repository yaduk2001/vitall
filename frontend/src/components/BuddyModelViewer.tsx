import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface BuddyModelViewerProps {
    modelPath: string;
    className?: string;
    autoRotate?: boolean;
    showDebug?: boolean;
    onAnimationsLoaded?: (animations: string[]) => void;
    animationName?: string;
}

// Pre-define external animation paths
const ANIMATION_FILES = {
    'Walking': '/studybuddy/female buddy/Female Buddy Animations/Walking.glb',
    'Rumba Dance': '/studybuddy/female buddy/Female Buddy Animations/Rumba Dance.glb',
    'Stretching': '/studybuddy/female buddy/Female Buddy Animations/Streaching.glb', // Typo in filename
    'Wave': '/studybuddy/female buddy/Female Buddy Animations/Wave.glb'
};

const BuddyScene: React.FC<{
    modelPath: string;
    animationName?: string;
    onAnimationsLoaded?: (animations: string[]) => void;
    showDebug?: boolean;
    setDebugInfo: (info: string[]) => void;
}> = ({ modelPath, animationName, onAnimationsLoaded, showDebug, setDebugInfo }) => {
    const group = useRef<THREE.Group>(null);

    // 1. Load the Main Model
    const { scene: modelScene } = useGLTF(modelPath);
    // Clone the scene to avoid issues if used multiple times
    const clone = useMemo(() => SkeletonUtils.clone(modelScene), [modelScene]);
    const { nodes } = useGraph(clone);

    // 2. Load External Animations
    // We load them all. R3F caches them, so it's efficient.
    const walkingGltf = useGLTF(ANIMATION_FILES['Walking']);
    const rumbaGltf = useGLTF(ANIMATION_FILES['Rumba Dance']);
    const stretchingGltf = useGLTF(ANIMATION_FILES['Stretching']);
    const waveGltf = useGLTF(ANIMATION_FILES['Wave']);

    // 3. Construct Animation List
    const animations = useMemo(() => {
        const anims: THREE.AnimationClip[] = [];

        // Helper to process and name clips
        const addClip = (gltf: any, name: string) => {
            if (gltf.animations && gltf.animations.length > 0) {
                const clip = gltf.animations[0].clone();
                clip.name = name;
                anims.push(clip);
            }
        };

        addClip(walkingGltf, 'Walking');
        addClip(rumbaGltf, 'Rumba Dance');
        addClip(stretchingGltf, 'Stretching');
        addClip(waveGltf, 'Wave');

        // Also include default animations from the model itself (if any)
        // Usually "Armature|mixamo.com|Layer0" etc.
        // We can rename them to "Normal Pose" and "T Pose" if we find them.
        // However, useGLTF(modelPath) might not return animations if they are not in the top level.
        // Let's check the main model's animations.
        // @ts-ignore
        const modelAnims = useGLTF(modelPath).animations;
        if (modelAnims) {
            let defaultCount = 0;
            modelAnims.forEach((clip: THREE.AnimationClip) => {
                if (clip.name.includes('Armature') || clip.name.includes('mixamo.com')) {
                    defaultCount++;
                    const newClip = clip.clone();
                    if (defaultCount === 1) newClip.name = 'Normal Pose';
                    else if (defaultCount === 2) newClip.name = 'T Pose';
                    else newClip.name = `Default ${defaultCount}`;
                    anims.push(newClip);
                }
            });
        }

        return anims;
    }, [walkingGltf, rumbaGltf, stretchingGltf, waveGltf, modelPath]);

    // 4. Setup Mixer & Actions
    const { actions, names } = useAnimations(animations, group);

    // 5. Report Loaded Animations
    useEffect(() => {
        if (onAnimationsLoaded) {
            onAnimationsLoaded(names);
        }
    }, [names, onAnimationsLoaded]);

    // 6. Handle Animation Playback
    useEffect(() => {
        // Stop all current actions
        // Fade out previous, fade in new
        const actionName = animationName || 'Normal Pose'; // Default
        const action = actions[actionName];

        if (action) {
            // Reset and play
            action.reset().fadeIn(0.5).play();

            // Handle looping
            if (actionName === 'T Pose') {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
            } else {
                action.setLoop(THREE.LoopRepeat, Infinity);
            }

            return () => {
                action.fadeOut(0.5);
            };
        } else {
            console.warn(`Animation "${actionName}" not found in`, names);
        }
    }, [animationName, actions, names]);

    // 7. Procedural Animations (Blink & Smile)
    // Find morph targets
    const morphTargets = useMemo(() => {
        const blinks: { mesh: THREE.Mesh, index: number }[] = [];
        const smiles: { mesh: THREE.Mesh, index: number }[] = [];
        const debug: string[] = [];

        clone.traverse((child: any) => {
            if (child.isMesh) {
                // FIX: Prevent mesh from disappearing during animation/rotation
                child.frustumCulled = false;

                // FIX: Ensure materials are visible from both sides
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    // Ensure transparency works correctly if needed
                    if (child.material.transparent) {
                        child.material.depthWrite = true;
                    }

                    // FIX: Hair Rendering
                    // Detect hair by name (common naming conventions)
                    const name = child.name.toLowerCase();
                    if (name.includes('hair') || name.includes('scalp')) {
                        // Hair cards need alphaTest to avoid sorting issues
                        child.material.transparent = true;
                        child.material.alphaTest = 0.5;
                        child.material.depthWrite = true;

                        // Make it look a bit more realistic (shiny but rough)
                        child.material.roughness = 0.6;
                        child.material.metalness = 0.1;
                    }
                }

                child.castShadow = true;
                child.receiveShadow = true;

                if (child.morphTargetDictionary) {
                    const dict = child.morphTargetDictionary;
                    debug.push(`Mesh: ${child.name}`);
                    Object.keys(dict).forEach(key => {
                        debug.push(` - ${key}`);
                        if (key === 'Eye_Blink_L' || key === 'Eye_Blink_R') {
                            blinks.push({ mesh: child, index: dict[key] });
                        }
                        if (key === 'Mouth_Smile_L' || key === 'Mouth_Smile_R') {
                            smiles.push({ mesh: child, index: dict[key] });
                        }
                    });
                }
            }
        });

        if (showDebug) setDebugInfo(debug);
        return { blinks, smiles };
    }, [clone, showDebug, setDebugInfo]);

    // Animation Loop for Morphs
    useFrame((state) => {
        const time = state.clock.elapsedTime;

        // Blinking Logic
        // Simple random blink
        const blinkSpeed = 10;
        const nextBlink = Math.random() > 0.995; // Random trigger
        // We need state for smooth blinking. 
        // Since we are in a functional component, we can use a ref for state or just simple sine wave for now.
        // Better: Use a sine wave that peaks occasionally.
        // Math.sin(time * speed) ... but we want it to stay open mostly.

        // Let's use a continuous function for robustness in R3F loop
        // Blink every ~3 seconds
        const blinkPeriod = 3;
        const t = time % blinkPeriod;
        let blinkValue = 0;
        if (t < 0.1) {
            // Closing
            blinkValue = t * 10;
        } else if (t < 0.2) {
            // Opening
            blinkValue = 1 - (t - 0.1) * 10;
        }

        morphTargets.blinks.forEach(target => {
            if (target.mesh.morphTargetInfluences) {
                target.mesh.morphTargetInfluences[target.index] = THREE.MathUtils.clamp(blinkValue, 0, 1);
            }
        });

        // Smiling Logic
        // Cycle smile every 10 seconds
        const smileCycle = time % 10;
        let smileValue = 0;
        if (smileCycle > 2 && smileCycle < 8) {
            // Smile
            if (smileCycle < 3) smileValue = (smileCycle - 2); // Fade in
            else if (smileCycle < 7) smileValue = 1; // Hold
            else smileValue = 1 - (smileCycle - 7); // Fade out
        }
        const smileIntensity = smileValue * 0.35; // Max intensity

        morphTargets.smiles.forEach(target => {
            if (target.mesh.morphTargetInfluences) {
                target.mesh.morphTargetInfluences[target.index] = THREE.MathUtils.clamp(smileIntensity, 0, 1);
            }
        });
    });

    return <primitive object={clone} ref={group} dispose={null} />;
};

const BuddyModelViewer: React.FC<BuddyModelViewerProps> = ({
    modelPath,
    className,
    autoRotate = true,
    showDebug = false,
    onAnimationsLoaded,
    animationName
}) => {
    const [debugInfo, setDebugInfo] = useState<string[]>([]);

    return (
        <div className={`buddy-model-viewer ${className || ''}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ position: [0, 1.5, 3], fov: 45 }}
                shadows
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.7} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={1024}
                />
                <Environment preset="city" />

                <BuddyScene
                    modelPath={modelPath}
                    animationName={animationName}
                    onAnimationsLoaded={onAnimationsLoaded}
                    showDebug={showDebug}
                    setDebugInfo={setDebugInfo}
                />

                <ContactShadows
                    opacity={0.4}
                    scale={10}
                    blur={2.5}
                    far={4}
                    resolution={256}
                    color="#000000"
                />

                <OrbitControls
                    enablePan={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2}
                    autoRotate={autoRotate}
                    target={[0, 1, 0]}
                />
            </Canvas>

            {/* Debug Overlay */}
            {showDebug && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#00ff00',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    pointerEvents: 'none',
                    maxWidth: '300px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <strong>DEBUG: R3F Mode</strong>
                    <div>Animation: {animationName || 'None'}</div>
                    <div style={{ marginTop: '5px', borderTop: '1px solid #555' }}>
                        <strong>Morph Targets:</strong>
                        {debugInfo.map((info, i) => <div key={i}>{info}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuddyModelViewer;

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Component to load and display the GLB model
type BlinkableMesh = THREE.SkinnedMesh & {
  morphTargetInfluences: number[];
  morphTargetDictionary: Record<string, number>;
};

type IdleBones = {
  spine?: THREE.Object3D;
  chest?: THREE.Object3D;
  neck?: THREE.Object3D;
  head?: THREE.Object3D;
  leftShoulder?: THREE.Object3D;
  rightShoulder?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftForeArm?: THREE.Object3D;
  rightForeArm?: THREE.Object3D;
  leftUpLeg?: THREE.Object3D;
  rightUpLeg?: THREE.Object3D;
  leftLeg?: THREE.Object3D;
  rightLeg?: THREE.Object3D;
};

type OutfitColors = {
  top: string;
  bottom: string;
  footwear: string;
  hair: string;
};

export type AvailableMaterials = {
  top: boolean;
  bottom: boolean;
  footwear: boolean;
  hair: boolean;
};

type BlinkTarget = {
  mesh: BlinkableMesh;
  indices: number[];
};

const BLINK_KEYWORDS = ['blink', 'eyeclose', 'eyesclosed', 'eyelid', 'eyes_close', 'eye_close'];
const EXCLUDE_KEYWORDS = ['mouth', 'lip', 'jaw', 'smile', 'frown', 'teeth', 'tongue', 'look', 'brows', 'eyebrow'];
const EYE_MESH_NAMES = ['eyeleft', 'eyeright', 'eyes', 'eye', 'wolf3d_eyes'];

const BuddyModel: React.FC<{
  modelPath: string;
  outfitColors: OutfitColors;
  onMaterialsFound?: (materials: AvailableMaterials) => void;
  onModelInfo?: (info: { height: number; center: THREE.Vector3; scale: number }) => void;
  renderMode?: 'customizable' | 'original';
}> = ({
  modelPath,
  outfitColors,
  onMaterialsFound,
  onModelInfo,
  renderMode = 'customizable'
}) => {
    useEffect(() => {
      console.log('🔄 BuddyModel modelPath changed:', modelPath);
      // Reset refs when model changes
      blinkTargetsRef.current = [];
      customMaterialsRef.current = {};
      idleBonesRef.current = {};
    }, [modelPath]);

    const gltf = useGLTF(modelPath);

    useEffect(() => {
      console.log('📦 GLTF loaded for:', modelPath, 'Scene:', gltf.scene);
    }, [gltf.scene, modelPath]);
    const groupRef = useRef<THREE.Group>(null);
    const blinkTargetsRef = useRef<BlinkTarget[]>([]);
    const idleBonesRef = useRef<IdleBones>({});
    const customMaterialsRef = useRef<{
      top?: THREE.MeshStandardMaterial;
      bottom?: THREE.MeshStandardMaterial;
      footwear?: THREE.MeshStandardMaterial;
      hair?: THREE.MeshStandardMaterial;
    }>({});
    const outfitColorsRef = useRef(outfitColors);
    const blinkStateRef = useRef({
      value: 0,
      blinking: false,
      closing: true,
      timer: 0,
      delay: THREE.MathUtils.randFloat(2, 4)
    });
    const idleMotionRef = useRef({
      swayOffset: Math.random() * Math.PI * 2,
      bobOffset: Math.random() * Math.PI * 2
    });
    const debugLogRef = useRef(0);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);

    const applyOutfitColors = (colors: OutfitColors) => {
      // Skip color application if in original render mode
      if (renderMode === 'original') return;

      const { top, bottom, footwear, hair } = customMaterialsRef.current;

      if (top) {
        top.color.set(colors.top);
        top.needsUpdate = true;
      }
      if (bottom) {
        bottom.color.set(colors.bottom);
        bottom.needsUpdate = true;
      }
      if (footwear) {
        footwear.color.set(colors.footwear);
        footwear.needsUpdate = true;
      }
      if (hair) {
        hair.color.set(colors.hair);
        hair.needsUpdate = true;
      }
    };

    const { actions, names } = useAnimations(gltf.animations, groupRef);

    useEffect(() => {
      console.log('🎬 Available animations:', names);

      // Reset all animations first
      Object.values(actions).forEach((action: THREE.AnimationAction | null) => action?.stop());

      // Generic animation logic for all models
      // For Hi4, play the first animation if available (likely the pose)
      if (modelPath.includes('hi4')) {
        if (names.length > 0) {
          console.log('▶️ Playing Hi4 default animation:', names[0]);
          actions[names[0]]?.reset().fadeIn(0.5).play();
        }
      } else {
        const idleAnim = names.find((n: string) => n.toLowerCase().includes('idle') || n.toLowerCase().includes('stand'));

        if (idleAnim && actions[idleAnim]) {
          console.log('▶️ Playing idle animation:', idleAnim);
          actions[idleAnim]?.reset().fadeIn(0.5).play();
        } else if (modelPath.includes('walking_man')) {
          // Special handling for walking man if no idle found: stop everything to avoid walking in place
          console.log('🛑 Stopping animations for Walking Man (no idle found)');
          Object.values(actions).forEach((action: THREE.AnimationAction | null) => action?.stop());
        }
      }
    }, [actions, names, modelPath]);

    useEffect(() => {
      console.log('🔵 BuddyModel mounted');
      return () => console.log('🔴 BuddyModel unmounted');
    }, []);

    const clonedScene = useMemo(() => {
      const clone = gltf.scene.clone(true);

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const height = size.y;
      const maxDimension = Math.max(size.x, size.y, size.z);

      // Target height for viewport (adjust based on container height ~600px)
      // Walking man is ~3 units tall, realistic female ~1.75, businessman ~2
      // Aim for model to be ~70% of viewport height
      const targetHeight = 1.6;

      // For walking man specifically, scale more aggressively
      const isWalkingMan = modelPath.includes('walking_man');
      const effectiveTargetHeight = isWalkingMan ? 1.4 : targetHeight;
      let scale = 1;

      // Scale model to fit viewport
      // Scale model to fit viewport (both up and down)
      if (Math.abs(height - effectiveTargetHeight) > 0.1) {
        scale = effectiveTargetHeight / height;
        clone.scale.set(scale, scale, scale);
        // Recalculate after scaling
        box.setFromObject(clone);
        const newSize = box.getSize(new THREE.Vector3());
        const newCenter = box.getCenter(new THREE.Vector3());
        const modelInfo = {
          height: newSize.y,
          center: newCenter,
          scale
        };
        if (onModelInfo) {
          onModelInfo(modelInfo);
        }
        console.log(`📐 Model scaled to ${(scale * 100).toFixed(0)}% (height: ${height.toFixed(2)} → ${newSize.y.toFixed(2)})`);
      } else {
        const modelInfo = {
          height,
          center,
          scale: 1
        };
        if (onModelInfo) {
          onModelInfo(modelInfo);
        }
      }

      // Center the model at origin
      if (Math.abs(center.x) > 0.01 || Math.abs(center.z) > 0.01) {
        clone.position.x = -center.x * scale;
        clone.position.z = -center.z * scale;
      }

      // Position model so feet are at y=0 (or close to it)
      const bottom = box.min.y;
      if (Math.abs(bottom) > 0.01) {
        clone.position.y = -bottom;
        console.log(`📍 Model positioned (bottom: ${bottom.toFixed(2)} → 0)`);
      }

      return clone;
    }, [gltf.scene, modelPath]);

    useEffect(() => {
      const blinkable: BlinkTarget[] = [];
      const customMaterials: typeof customMaterialsRef.current = {};
      const foundMaterials: string[] = [];

      // If renderMode is 'original', we skip the material replacement logic
      // but we still want to find blink targets if possible

      clonedScene.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh & {
          isMesh?: boolean;
          material?: THREE.Material | THREE.Material[];
        };
        const skinnedChild = child as BlinkableMesh & { isMesh?: boolean };

        // Only process materials if we are in customizable mode
        if (renderMode === 'customizable' && mesh?.isMesh && mesh.material) {
          const materialsArray = Array.isArray(mesh.material)
            ? mesh.material.slice()
            : [mesh.material];

          let replaced = false;

          materialsArray.forEach((mat, idx) => {
            const baseMaterial = mat as THREE.MeshStandardMaterial;
            const materialName = (baseMaterial?.name || '').toLowerCase();
            const meshName = (mesh.name || '').toLowerCase();
            const targetName = materialName || meshName;

            // More flexible matching - check both material name and mesh name
            // Realistic female uses: Female_T_Shirt, Denim_shorts, High_Heels
            // Businessman uses: avaturn_look_0_material (clothing), avaturn_shoes_0_material
            // Walking man uses: rp_nathan_animated_003_mat (single material for whole body)

            const isTop =
              targetName.includes('outfit_top') ||
              targetName.includes('top') ||
              targetName.includes('shirt') ||
              targetName.includes('torso') ||
              targetName.includes('upper') ||
              targetName.includes('jacket') ||
              targetName.includes('blouse') ||
              targetName.includes('crop') ||
              targetName.includes('t_shirt') ||
              targetName.includes('look_0') ||
              targetName.includes('dress') ||
              targetName.includes('suit') ||
              targetName.includes('coat') ||
              targetName.includes('sweater') ||
              targetName.includes('hoodie') ||
              targetName.includes('vest') ||
              targetName === 'wolf3d_outfit_top' ||
              targetName === 'female_t_shirt';
            const isBottom =
              targetName.includes('outfit_bottom') ||
              targetName.includes('bottom') ||
              targetName.includes('pants') ||
              targetName.includes('trousers') ||
              targetName.includes('lower') ||
              targetName.includes('shorts') ||
              targetName.includes('skirt') ||
              targetName.includes('jeans') ||
              targetName.includes('leggings') ||
              targetName.includes('denim') ||
              targetName === 'wolf3d_outfit_bottom' ||
              targetName === 'denim_shorts';
            const isFootwear =
              targetName.includes('outfit_footwear') ||
              targetName.includes('footwear') ||
              targetName.includes('shoes') ||
              targetName.includes('boots') ||
              targetName.includes('sneakers') ||
              targetName.includes('feet') ||
              targetName.includes('heels') ||
              targetName.includes('sandals') ||
              targetName === 'wolf3d_outfit_footwear' ||
              targetName === 'high_heels' ||
              targetName === 'avaturn_shoes';
            const isHair =
              targetName.includes('hair') ||
              targetName.includes('head_hair') ||
              targetName.includes('avaturn_hair') ||
              targetName === 'wolf3d_hair';

            if (!baseMaterial || (!isTop && !isBottom && !isFootwear && !isHair)) {
              if (baseMaterial?.name) {
                foundMaterials.push(`${baseMaterial.name} (mesh: ${mesh.name || 'unnamed'})`);
              }
              return;
            }

            // Check if this is a skin/body material - preserve textures for these
            // Realistic female: Std_Skin_Head, Std_Skin_Body, Std_Skin_Arm, Std_Skin_Leg
            // Businessman: avaturn_body_material
            // Walking man: rp_nathan_animated_003_mat (whole body, preserve texture)
            const isSkin =
              targetName.includes('skin') ||
              targetName.includes('body') ||
              (targetName.includes('head') && !targetName.includes('hair')) ||
              targetName.includes('arm') ||
              targetName.includes('leg') ||
              targetName.includes('nails') ||
              targetName.includes('tongue') ||
              targetName.includes('teeth') ||
              targetName.includes('eye') ||
              targetName.includes('cornea') ||
              targetName.includes('eyelash') ||
              targetName.includes('tearline') ||
              targetName.includes('occlusion') ||
              targetName.includes('brow') ||
              targetName === 'wolf3d_skin' ||
              targetName === 'wolf3d_body' ||
              targetName === 'wolf3d_head' ||
              targetName === 'avaturn_body_material' ||
              (targetName.includes('nathan') && targetName.includes('mat')); // Walking man material

            const clonedMaterial = baseMaterial.clone();
            // Only remove texture map for outfit materials, preserve for skin/body
            // if (!isSkin) {
            //   clonedMaterial.map = null;
            // }
            clonedMaterial.needsUpdate = true;

            if (isTop && !customMaterials.top) {
              customMaterials.top = clonedMaterial;
              console.log(`✅ Found top material: ${baseMaterial.name || mesh.name}`);
            } else if (isBottom && !customMaterials.bottom) {
              customMaterials.bottom = clonedMaterial;
              console.log(`✅ Found bottom material: ${baseMaterial.name || mesh.name}`);
            } else if (isFootwear && !customMaterials.footwear) {
              customMaterials.footwear = clonedMaterial;
              console.log(`✅ Found footwear material: ${baseMaterial.name || mesh.name}`);
            } else if (isHair && !customMaterials.hair) {
              customMaterials.hair = clonedMaterial;
              console.log(`✅ Found hair material: ${baseMaterial.name || mesh.name}`);
            }

            materialsArray[idx] = clonedMaterial;
            replaced = true;
          });

          if (replaced) {
            mesh.material = Array.isArray(mesh.material) ? materialsArray : materialsArray[0];
          }
        }

        if (
          skinnedChild?.isMesh &&
          Array.isArray(skinnedChild.morphTargetInfluences) &&
          skinnedChild.morphTargetDictionary
        ) {
          const meshName = (skinnedChild.name || '').toLowerCase();
          const isEyeMesh = EYE_MESH_NAMES.some((name) => meshName.includes(name));

          let indices = Object.entries(skinnedChild.morphTargetDictionary)
            .filter(([name]) => {
              const lower = name.toLowerCase();
              const isMatch = BLINK_KEYWORDS.some((keyword) => lower.includes(keyword));
              const isExcluded = EXCLUDE_KEYWORDS.some((keyword) => lower.includes(keyword));
              return isMatch && !isExcluded;
            })
            .map(([, index]) => index as number);

          // If no blink morph targets found but this is an eye mesh, use all morph targets
          if (indices.length === 0 && isEyeMesh && Object.keys(skinnedChild.morphTargetDictionary).length > 0) {
            indices = Object.values(skinnedChild.morphTargetDictionary).map(
              (value) => value as number
            );
            console.log(`👁️ Using all morph targets for eye mesh: ${skinnedChild.name}`);
          }

          if (indices.length > 0) {
            blinkable.push({ mesh: skinnedChild, indices });
            console.log(`✅ Found blinkable mesh: ${skinnedChild.name} with ${indices.length} morph target(s)`);
          }

          // Debug: Log all available morph targets to find better smile options
          if (Object.keys(skinnedChild.morphTargetDictionary).length > 0) {
            console.log(`😐 Morph targets for ${skinnedChild.name}:`, Object.keys(skinnedChild.morphTargetDictionary));
          }

          // Look for smile morph targets
          // Logic moved to useFrame for dynamic expressions
          /*
          const smileIndices = Object.entries(skinnedChild.morphTargetDictionary)
            .filter(([name]) => {
              const lower = name.toLowerCase();
              return lower.includes('smile') || lower.includes('happy');
            })
            .map(([, index]) => index as number);

          if (smileIndices.length > 0) {
            // Apply smile immediately and permanently
            smileIndices.forEach(index => {
              if (skinnedChild.morphTargetInfluences) {
                skinnedChild.morphTargetInfluences[index] = 0.35; // Reduced to 35% for a softer, "lovely" smile
              }
            });
            console.log(`✅ Applied smile to: ${skinnedChild.name}`);
          }
          */
        }
      });

      customMaterialsRef.current = customMaterials;
      blinkTargetsRef.current = blinkable;

      // Only apply colors if in customizable mode
      if (renderMode === 'customizable') {
        applyOutfitColors(outfitColorsRef.current);
      }

      const availableMaterials: AvailableMaterials = {
        top: !!customMaterials.top,
        bottom: !!customMaterials.bottom,
        footwear: !!customMaterials.footwear,
        hair: !!customMaterials.hair
      };

      if (onMaterialsFound) {
        onMaterialsFound(availableMaterials);
      }

      console.info(`BuddyModel: Materials found:`, {
        top: customMaterials.top ? '✅' : '❌',
        bottom: customMaterials.bottom ? '✅' : '❌',
        footwear: customMaterials.footwear ? '✅' : '❌',
        hair: customMaterials.hair ? '✅' : '❌',
        allMaterials: foundMaterials.slice(0, 10) // Show first 10 for debugging
      });
      console.info(
        `BuddyModel: found ${blinkable.length} blinkable mesh(es)`,
        blinkable.map((target) => target.mesh.name)
      );
    }, [clonedScene, modelPath, renderMode]);

    useEffect(() => {
      outfitColorsRef.current = outfitColors;
      if (renderMode === 'customizable') {
        applyOutfitColors(outfitColors);
      }
    }, [outfitColors, renderMode]);

    useEffect(() => {
      // Debug: Log all bones for walking man specifically to see what we're working with
      // Debug: Log all bones for walking man specifically to see what we're working with
      if (modelPath.includes('walking_man') || modelPath.includes('hi4')) {
        const allBones: string[] = [];
        clonedScene.traverse((child) => {
          if (child.type === 'Bone') allBones.push(child.name);
        });
        console.log(`💀 ALL BONES for ${modelPath}:`, allBones);
      }

      // Check if RP Posed model is rigged
      if (modelPath.includes('rp_posed')) {
        let boneCount = 0;
        let skinnedMeshCount = 0;
        clonedScene.traverse((child) => {
          if (child.type === 'Bone') boneCount++;
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshCount++;
        });
        console.log(`🕵️ Rig Check for ${modelPath}:`, {
          boneCount,
          skinnedMeshCount,
          isRigged: boneCount > 0 || skinnedMeshCount > 0
        });
      }

      // Helper to find a bone by fuzzy name matching
      const findBone = (names: string[]) => {
        let found: THREE.Bone | THREE.Object3D | undefined;
        clonedScene.traverse((child) => {
          if ((child.type === 'Bone' || child.type === 'Object3D') && !found) {
            if (names.some((n) => child.name.toLowerCase().includes(n.toLowerCase()))) {
              found = child;
            }
          }
        });
        return found as THREE.Bone;
      };

      // Debug: Log full hierarchy for Untitled model to find bone names
      if (modelPath.includes('hi4')) {
        const hierarchy: string[] = [];
        clonedScene.traverse((child) => {
          hierarchy.push(`${child.name} [${child.type}]`);
        });
        console.log('🔍 FULL HIERARCHY for Hi4 Model:', hierarchy);
      }

      const boneMap: IdleBones = {
        spine: findBone(['Spine', 'Spine1', 'spine_01', 'spine_02', 'Bip001_Spine', 'CC_Base_Spine01', 'CC_Base_Spine02']),
        chest: findBone(['Spine1', 'Spine2', 'Chest', 'spine_03', 'Bip001_Spine1', 'Bip001_Spine2', 'CC_Base_Spine02', 'CC_Base_Chest']),
        neck: findBone(['Neck', 'neck', 'Bip001_Neck', 'CC_Base_NeckTwist01', 'CC_Base_Neck']),
        head: findBone(['Head', 'head', 'Bip001_Head', 'CC_Base_Head']),
        leftShoulder: findBone(['LeftShoulder', 'shoulder_l', 'Shoulder_L', 'L_Shoulder', 'Bip001_L_Clavicle', 'CC_Base_L_Clavicle']),
        rightShoulder: findBone(['RightShoulder', 'shoulder_r', 'Shoulder_R', 'R_Shoulder', 'Bip001_R_Clavicle', 'CC_Base_R_Clavicle']),
        leftArm: findBone(['LeftArm', 'upperarm_l', 'Arm_L', 'L_Arm', 'Left_Arm', 'Bip001_L_UpperArm', 'CC_Base_L_Upperarm', 'CC_Base_L_UpperArm']),
        rightArm: findBone(['RightArm', 'upperarm_r', 'Arm_R', 'R_Arm', 'Right_Arm', 'Bip001_R_UpperArm', 'CC_Base_R_Upperarm', 'CC_Base_R_UpperArm']),
        leftForeArm: findBone(['LeftForeArm', 'lowerarm_l', 'ForeArm_L', 'L_ForeArm', 'Left_ForeArm', 'Bip001_L_Forearm', 'CC_Base_L_Forearm', 'CC_Base_L_ForeArm']),
        rightForeArm: findBone(['RightForeArm', 'lowerarm_r', 'ForeArm_R', 'R_ForeArm', 'Right_ForeArm', 'Bip001_R_Forearm', 'CC_Base_R_Forearm', 'CC_Base_R_ForeArm']),
        leftUpLeg: findBone(['LeftUpLeg', 'upperleg_l', 'UpLeg_L', 'L_UpLeg', 'Left_UpLeg', 'Bip001_L_Thigh', 'CC_Base_L_Thigh']),
        rightUpLeg: findBone(['RightUpLeg', 'upperleg_r', 'UpLeg_R', 'R_UpLeg', 'Right_UpLeg', 'Bip001_R_Thigh', 'CC_Base_R_Thigh']),
        leftLeg: findBone(['LeftLeg', 'lowerleg_l', 'Leg_L', 'L_Leg', 'Left_Leg', 'Bip001_L_Calf', 'CC_Base_L_Calf']),
        rightLeg: findBone(['RightLeg', 'lowerleg_r', 'Leg_R', 'R_Leg', 'Right_Leg', 'Bip001_R_Calf', 'CC_Base_R_Calf'])
      };

      idleBonesRef.current = boneMap;
      console.info(
        'BuddyModel: idle bones detected',
        Object.entries(boneMap)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
      );
    }, [clonedScene, modelPath]);

    useEffect(() => {
      if (!gltf.animations?.length || !clonedScene) {
        return;
      }

      const mixer = new THREE.AnimationMixer(clonedScene);
      mixerRef.current = mixer;

      // For Hi4 model, we can't load ideal.glb as it was deleted.
      // We will rely on manual bone manipulation in useFrame for the pose.
      if (modelPath.includes('hi4')) {
        console.log('ℹ️ Hi4 model loaded. Relying on manual bone rotation for pose.');
      } else {
        // For other models, try to find and play any non-T-pose animation
        // Prefer animations with names like: idle, stand, pose, default (but not T-pose)
        const nonTPoseAnim = gltf.animations.find(
          (clip) => {
            const lower = clip.name.toLowerCase();
            return (
              (lower.includes('idle') ||
                lower.includes('stand') ||
                lower.includes('pose') ||
                lower.includes('default')) &&
              !lower.includes('t-pose') &&
              !lower.includes('tpose')
            );
          }
        );

        if (nonTPoseAnim) {
          const action = mixer.clipAction(nonTPoseAnim);
          action.play();
          console.log(`✅ Playing non-T-pose animation: ${nonTPoseAnim.name}`);
        } else if (gltf.animations.length > 1) {
          // If no named animation found, use the second animation (index 1) to avoid T-pose
          const action = mixer.clipAction(gltf.animations[1]);
          action.play();
          console.log(`✅ Playing animation index 1 (avoiding T-pose)`);
        } else if (gltf.animations.length === 1) {
          // Only one animation available, use it
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          console.log(`✅ Playing only available animation: ${gltf.animations[0].name}`);
        }
      }

      return () => {
        mixer.stopAllAction();
      };
    }, [gltf.animations, clonedScene, modelPath]);

    useEffect(() => {
      if (!gltf.animations?.length) {
        return;
      }

      gltf.animations.forEach((clip) => {
        const originalLength = clip.tracks.length;
        clip.tracks = clip.tracks.filter(
          (track) => !track.name.toLowerCase().includes('scale')
        );

        if (clip.tracks.length !== originalLength) {
          console.info(
            `BuddyModel: removed ${originalLength - clip.tracks.length} scale track(s) from animation "${clip.name}"`
          );
        }
      });
    }, [gltf.animations]);

    useEffect(() => {
      if (groupRef.current) {
        groupRef.current.scale.set(1, 1, 1);
      }
    }, []);

    useFrame((state, delta) => {
      if (!groupRef.current) {
        return;
      }

      // Update animation mixer FIRST so we can override bones later
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      const beforeX = groupRef.current.scale.x;
      const beforeY = groupRef.current.scale.y;
      const beforeZ = groupRef.current.scale.z;

      groupRef.current.scale.set(1, 1, 1);

      const afterX = groupRef.current.scale.x;
      const afterY = groupRef.current.scale.y;
      const afterZ = groupRef.current.scale.z;

      if (beforeX !== 1 || beforeY !== 1 || beforeZ !== 1) {
        console.warn('⚠️ Scale drift detected:', {
          beforeX,
          beforeY,
          beforeZ,
          afterX,
          afterY,
          afterZ
        });
      }

      const time = state.clock.elapsedTime;
      const idleMotion = idleMotionRef.current;

      groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.18;
      groupRef.current.rotation.x =
        Math.sin(time * 0.08 + idleMotion.swayOffset) * 0.03;
      groupRef.current.rotation.z =
        Math.sin(time * 0.1 + idleMotion.swayOffset * 0.5) * 0.02;
      groupRef.current.position.y =
        Math.sin(time * 0.9 + idleMotion.bobOffset) * 0.02;

      const bones = idleBonesRef.current;

      const chestSway = Math.sin(time * 0.6) * THREE.MathUtils.degToRad(3);
      // Increased breathing amplitude significantly for visibility
      const breath = Math.sin(time * 1.5) * THREE.MathUtils.degToRad(5.0);
      const armSwing = Math.sin(time * 0.8) * THREE.MathUtils.degToRad(6);
      const forearmSwing =
        Math.sin(time * 0.95 + 1) * THREE.MathUtils.degToRad(4.5);
      const headTilt = Math.sin(time * 0.7) * THREE.MathUtils.degToRad(2.5);
      const hipShift = Math.sin(time * 0.5) * THREE.MathUtils.degToRad(2);
      const legShift = Math.sin(time * 0.5 + Math.PI) * THREE.MathUtils.degToRad(1.5);

      bones.spine?.rotation.set(hipShift * 0.2, 0, hipShift * 0.15);
      bones.chest?.rotation.set(breath + chestSway * 0.4, 0, chestSway);
      bones.neck?.rotation.set(0, 0, headTilt * 0.4);
      bones.head?.rotation.set(headTilt * 0.6, headTilt * 0.3, headTilt);

      bones.leftShoulder?.rotation.set(0, 0, THREE.MathUtils.degToRad(-2));
      bones.rightShoulder?.rotation.set(0, 0, THREE.MathUtils.degToRad(2));

      // Dynamic Expressions Logic
      // Cycle between expressions: Neutral -> Smile -> Neutral -> ...
      const expressionTime = time % 10; // 10 second cycle
      let smileIntensity = 0;

      if (expressionTime < 2) {
        // Neutral (0-2s)
        smileIntensity = 0;
      } else if (expressionTime < 3) {
        // Fade in smile (2-3s)
        smileIntensity = (expressionTime - 2) * 0.35;
      } else if (expressionTime < 7) {
        // Hold smile (3-7s)
        smileIntensity = 0.35;
      } else if (expressionTime < 8) {
        // Fade out smile (7-8s)
        smileIntensity = 0.35 - (expressionTime - 7) * 0.35;
      } else {
        // Neutral (8-10s)
        smileIntensity = 0;
      }

      // Apply dynamic smile intensity
      // We need to find the smile morph targets again or store them
      // For now, we'll traverse to find them (optimization: store in ref later)
      groupRef.current.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh && (child as THREE.SkinnedMesh).morphTargetDictionary) {
          const mesh = child as THREE.SkinnedMesh;
          Object.entries(mesh.morphTargetDictionary!).forEach(([name, index]) => {
            const lower = name.toLowerCase();
            if (lower.includes('smile') || lower.includes('happy')) {
              if (mesh.morphTargetInfluences) {
                mesh.morphTargetInfluences[index] = smileIntensity;
              }
            }
          });
        }
      });

      // Standard rotation for other models - Arms down by side
      // Standard rotation for other models - Arms down by side
      // For Hi4, we skip this entirely to preserve the native hands-down pose
      if (bones.leftArm && !modelPath.includes('hi4')) {
        bones.leftArm.rotation.set(
          THREE.MathUtils.degToRad(-5) + breath * 0.4,
          0,
          THREE.MathUtils.degToRad(75) + armSwing * 0.1
        );
      }

      if (bones.rightArm && !modelPath.includes('hi4')) {
        bones.rightArm.rotation.set(
          THREE.MathUtils.degToRad(-5) + breath * 0.4,
          0,
          THREE.MathUtils.degToRad(-75) - armSwing * 0.1
        );
      }

      // Forearms
      if (bones.leftForeArm) {
        bones.leftForeArm.rotation.set(
          THREE.MathUtils.degToRad(15) + forearmSwing,
          0,
          THREE.MathUtils.degToRad(5)
        );
      }

      if (bones.rightForeArm) {
        bones.rightForeArm.rotation.set(
          THREE.MathUtils.degToRad(15) + forearmSwing,
          0,
          THREE.MathUtils.degToRad(-5)
        );
      }

      // Legs
      if (bones.leftUpLeg) {
        bones.leftUpLeg.rotation.set(
          THREE.MathUtils.degToRad(-2) + legShift * 0.5,
          0,
          THREE.MathUtils.degToRad(2)
        );
      }

      if (bones.rightUpLeg) {
        bones.rightUpLeg.rotation.set(
          THREE.MathUtils.degToRad(-2) - legShift * 0.5,
          0,
          THREE.MathUtils.degToRad(-2)
        );
      }

      // Lower legs
      if (bones.leftLeg) bones.leftLeg.rotation.set(THREE.MathUtils.degToRad(5), 0, 0);
      if (bones.rightLeg) bones.rightLeg.rotation.set(THREE.MathUtils.degToRad(5), 0, 0);

      // Handle blinking animation
      const blinkState = blinkStateRef.current;
      blinkState.timer += delta;

      if (!blinkState.blinking && blinkState.timer >= blinkState.delay) {
        blinkState.blinking = true;
        blinkState.closing = true;
      }

      if (blinkState.blinking) {
        const direction = blinkState.closing ? 1 : -1;
        const speed = blinkState.closing ? 8 : 5;
        blinkState.value = THREE.MathUtils.clamp(
          blinkState.value + direction * speed * delta,
          0,
          1
        );

        if (blinkState.value >= 1) {
          blinkState.closing = false;
        }

        if (!blinkState.closing && blinkState.value <= 0) {
          blinkState.blinking = false;
          blinkState.timer = 0;
          blinkState.delay = THREE.MathUtils.randFloat(2, 5);
        }
      }

      blinkTargetsRef.current.forEach(({ mesh, indices }) => {
        indices.forEach((index) => {
          mesh.morphTargetInfluences[index] = blinkState.value;
        });
      });

      // Mixer update moved to top of useFrame
    });

    return (
      <group ref={groupRef}>
        <primitive object={clonedScene} />
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <DebugOverlay
            materials={customMaterialsRef.current}
            bones={idleBonesRef.current}
            modelPath={modelPath}
          />
        </Html>
      </group>
    );
  };

// Preload all models
useGLTF.preload('/studybuddy/hi4.glb');
// useGLTF.preload('/studybuddy/ideal.glb');

// Component to update camera when props change
const CameraUpdater: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}> = ({ position, target, fov }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    console.log('📸 Updating camera:', { position, target, fov });
    camera.position.set(...position);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
    }
    camera.updateProjectionMatrix();

    // Update controls if they exist (we can't easily access the OrbitControls instance here 
    // without a ref passed down or context, but changing camera position usually works)
  }, [camera, position, fov]);

  return null;
};

const Buddy3DViewer: React.FC<{
  paletteColors?: string[];
  showGrid?: boolean;
  outfitColors?: OutfitColors;
  modelPath?: string;
  onMaterialsFound?: (materials: AvailableMaterials) => void;
  renderMode?: 'customizable' | 'original';
}> = ({
  paletteColors = ['#1e3a8a', '#9333ea'],
  showGrid = true,
  outfitColors = {
    top: '#f97316',
    bottom: '#0f172a',
    footwear: '#2563eb',
    hair: '#d97706'
  },
  modelPath = '/studybuddy/realistic_female.glb',
  onMaterialsFound,
  renderMode = 'customizable'
}) => {
    const [modelInfo, setModelInfo] = useState<{ height: number; center: THREE.Vector3; scale: number } | null>(null);

    // Adjust camera dynamically based on model info
    const isWalkingMan = modelPath.includes('walking_man');
    const isRealisticFemale = modelPath.includes('realistic_female');
    const isBusinessman = modelPath.includes('businessman');

    // Calculate camera position based on model height
    // Camera should be positioned to see full model with some padding
    const modelHeight = modelInfo?.height || 1.8;
    const distanceMultiplier = isWalkingMan ? 3.5 : 1.8; // Reduced for closer view
    const cameraDistance = Math.max(3, modelHeight * distanceMultiplier);
    const cameraHeight = modelHeight * 0.5; // Camera at mid-point of model

    const cameraPosition: [number, number, number] = [
      0,
      cameraHeight,
      cameraDistance
    ];

    // Adjust target to move model down (look higher = model moves down)
    const targetY = isWalkingMan ? modelHeight * 0.65 : modelHeight * 0.5;

    const cameraTarget: [number, number, number] = [
      0,
      targetY,
      0
    ];

    // Use consistent FOV for all models
    const cameraFov = 45;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const logSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          console.log('📏 Buddy3DViewer container size:', rect.width, 'x', rect.height);
        }
      };

      logSize();
      window.addEventListener('resize', logSize);
      return () => window.removeEventListener('resize', logSize);
    }, []);

    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Canvas
          camera={{ position: cameraPosition as [number, number, number], fov: cameraFov }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <CameraUpdater position={cameraPosition} target={cameraTarget} fov={cameraFov} />
          <Suspense fallback={
            <Html center>
              <div style={{ color: '#e2e8f0', textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    borderTop: '4px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 12px'
                  }}
                />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading 3D model...</p>
              </div>
            </Html>
          }>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} />

            {/* Environment for better reflections */}
            <Environment preset="city" />

            {/* The 3D model */}
            <group position={[0, 0, 0]}>
              <BuddyModel
                key={modelPath}
                modelPath={modelPath}
                outfitColors={outfitColors}
                onMaterialsFound={onMaterialsFound}
                onModelInfo={setModelInfo}
                renderMode={renderMode}
              />
            </group>

            {/* Camera controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={false}
              enableRotate={true}
              minDistance={Math.max(2, modelHeight * 1.5)}
              maxDistance={Math.max(6, modelHeight * 4)}
              target={cameraTarget}
              autoRotate={false}
            />
          </Suspense>
        </Canvas>

        {/* Grid overlay if enabled */}
        {showGrid && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    );
  };

// Debug Overlay Component
const DebugOverlay: React.FC<{
  materials: any;
  bones: any;
  modelPath: string;
}> = ({ materials, bones, modelPath }) => {
  // if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: '#00ff00',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '10px',
      pointerEvents: 'none',
      zIndex: 1000,
      maxWidth: '250px',
      maxHeight: '80%',
      overflowY: 'auto'
    }}>
      <h4 style={{ margin: '0 0 5px', color: '#fff' }}>Debug Info</h4>
      <div style={{ marginBottom: '5px' }}>
        <strong style={{ color: '#fff' }}>Model:</strong> {modelPath.split('/').pop()}
      </div>

      <div style={{ marginBottom: '5px' }}>
        <strong style={{ color: '#fff' }}>Materials Found:</strong>
        {Object.entries(materials).map(([key, val]) => (
          <div key={key} style={{ color: val ? '#00ff00' : '#ff0000' }}>
            {key}: {val ? 'YES' : 'NO'}
          </div>
        ))}
      </div>

      <div>
        <strong style={{ color: '#fff' }}>Key Bones:</strong>
        {Object.entries(bones).map(([key, val]) => (
          <div key={key} style={{ color: val ? '#00ff00' : '#ff0000' }}>
            {key}: {val ? 'YES' : 'NO'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Buddy3DViewer;

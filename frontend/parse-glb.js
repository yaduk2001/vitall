import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple GLB parser to extract JSON structure
function parseGLB(filePath) {
    const buffer = fs.readFileSync(filePath);

    // GLB Header (12 bytes)
    const magic = buffer.readUInt32LE(0);
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);

    console.log('GLB Header:', { magic: magic.toString(16), version, length });

    // JSON Chunk (starts at byte 12)
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);

    if (chunkType !== 0x4E4F534A) { // 'JSON' in ASCII
        console.error('First chunk is not JSON!');
        return null;
    }

    const jsonData = buffer.slice(20, 20 + chunkLength).toString('utf8');
    const gltf = JSON.parse(jsonData);

    return gltf;
}

// Main execution
const glbPath = path.join(__dirname, 'public', 'studybuddy', 'hi4.glb');
console.log('Parsing:', glbPath);
console.log('='.repeat(80));

const gltf = parseGLB(glbPath);

if (gltf) {
    console.log('\n📦 GLTF COMPLETE STRUCTURE:');
    console.log('Scenes:', gltf.scenes?.length || 0);
    console.log('Nodes:', gltf.nodes?.length || 0);
    console.log('Meshes:', gltf.meshes?.length || 0);
    console.log('Materials:', gltf.materials?.length || 0);
    console.log('Animations:', gltf.animations?.length || 0);
    console.log('Skins:', gltf.skins?.length || 0);
    console.log('Accessors:', gltf.accessors?.length || 0);
    console.log('BufferViews:', gltf.bufferViews?.length || 0);

    // DETAILED ANIMATION ANALYSIS
    console.log('\n' + '='.repeat(80));
    console.log('🎬 DETAILED ANIMATION ANALYSIS:');
    console.log('='.repeat(80));
    if (gltf.animations && gltf.animations.length > 0) {
        gltf.animations.forEach((anim, index) => {
            console.log(`\n📹 Animation ${index}: "${anim.name || 'Unnamed'}"`);
            console.log(`   Channels: ${anim.channels?.length || 0}`);
            console.log(`   Samplers: ${anim.samplers?.length || 0}`);

            if (anim.channels) {
                console.log(`\n   Channel Details:`);
                anim.channels.forEach((channel, chIdx) => {
                    const targetNode = gltf.nodes[channel.target.node];
                    const sampler = anim.samplers[channel.sampler];
                    const inputAccessor = gltf.accessors[sampler.input];
                    const outputAccessor = gltf.accessors[sampler.output];

                    console.log(`   [${chIdx}] Target: Node ${channel.target.node} (${targetNode.name || 'Unnamed'})`);
                    console.log(`       Path: ${channel.target.path}`);
                    console.log(`       Interpolation: ${sampler.interpolation || 'LINEAR'}`);
                    console.log(`       Keyframes: ${inputAccessor.count}`);
                    console.log(`       Duration: ~${inputAccessor.max?.[0] || 'unknown'}s`);
                });
            }
        });
    } else {
        console.log('  ❌ No animations found.');
    }

    // DETAILED NODE HIERARCHY
    console.log('\n' + '='.repeat(80));
    console.log('🌳 COMPLETE NODE HIERARCHY:');
    console.log('='.repeat(80));

    function printNodeTree(nodeIndex, indent = 0, visited = new Set()) {
        if (visited.has(nodeIndex)) return;
        visited.add(nodeIndex);

        const node = gltf.nodes[nodeIndex];
        const prefix = '  '.repeat(indent);

        let nodeInfo = `${prefix}[${nodeIndex}] ${node.name || 'Unnamed'}`;

        if (node.mesh !== undefined) nodeInfo += ` 📦Mesh:${node.mesh}`;
        if (node.skin !== undefined) nodeInfo += ` 🦴Skin:${node.skin}`;
        if (node.camera !== undefined) nodeInfo += ` 📷Camera:${node.camera}`;
        if (node.translation) nodeInfo += ` 📍Pos`;
        if (node.rotation) nodeInfo += ` 🔄Rot`;
        if (node.scale) nodeInfo += ` 📏Scale`;

        console.log(nodeInfo);

        if (node.children) {
            node.children.forEach(childIndex => {
                printNodeTree(childIndex, indent + 1, visited);
            });
        }
    }

    if (gltf.scenes && gltf.scenes[0]) {
        console.log('\nScene 0 Root Nodes:');
        gltf.scenes[0].nodes.forEach(nodeIndex => {
            printNodeTree(nodeIndex);
        });
    }

    // SKIN/BONE DETAILED ANALYSIS
    console.log('\n' + '='.repeat(80));
    console.log('🦴 DETAILED SKIN/BONE ANALYSIS:');
    console.log('='.repeat(80));
    if (gltf.skins && gltf.skins.length > 0) {
        gltf.skins.forEach((skin, skinIndex) => {
            console.log(`\n🦴 Skin ${skinIndex}:`);
            console.log(`   Skeleton Root: Node ${skin.skeleton} (${gltf.nodes[skin.skeleton]?.name || 'Unnamed'})`);
            console.log(`   Total Joints: ${skin.joints.length}`);
            console.log(`\n   Joint Hierarchy:`);

            // Print first 20 joints
            skin.joints.slice(0, 20).forEach((jointIndex, idx) => {
                const jointNode = gltf.nodes[jointIndex];
                console.log(`   ${idx.toString().padStart(3)}: [${jointIndex.toString().padStart(3)}] ${jointNode.name || 'Unnamed'}`);
            });

            if (skin.joints.length > 20) {
                console.log(`   ... and ${skin.joints.length - 20} more joints`);
            }
        });
    }

    // MATERIAL ANALYSIS
    console.log('\n' + '='.repeat(80));
    console.log('🎨 MATERIAL ANALYSIS:');
    console.log('='.repeat(80));
    if (gltf.materials) {
        gltf.materials.forEach((material, index) => {
            console.log(`\n[${index}] ${material.name || 'Unnamed'}`);
            if (material.pbrMetallicRoughness) {
                const pbr = material.pbrMetallicRoughness;
                if (pbr.baseColorTexture) console.log(`   ✅ Base Color Texture: ${pbr.baseColorTexture.index}`);
                if (pbr.baseColorFactor) console.log(`   🎨 Base Color: [${pbr.baseColorFactor.join(', ')}]`);
                if (pbr.metallicFactor !== undefined) console.log(`   ⚙️ Metallic: ${pbr.metallicFactor}`);
                if (pbr.roughnessFactor !== undefined) console.log(`   📐 Roughness: ${pbr.roughnessFactor}`);
            }
        });
    }

    // MORPH TARGET ANALYSIS
    console.log('\n' + '='.repeat(80));
    console.log('🙂 MORPH TARGET ANALYSIS:');
    console.log('='.repeat(80));
    if (gltf.meshes) {
        gltf.meshes.forEach((mesh, index) => {
            if (mesh.primitives) {
                mesh.primitives.forEach((prim, pIndex) => {
                    if (prim.targets) {
                        console.log(`\nMesh ${index} "${mesh.name || 'Unnamed'}" Primitive ${pIndex}:`);
                        console.log(`   Has ${prim.targets.length} morph targets.`);

                        // Check for target names in extras
                        if (mesh.extras && mesh.extras.targetNames) {
                            console.log('   Target Names (mesh.extras):', mesh.extras.targetNames);
                        } else if (prim.extras && prim.extras.targetNames) {
                            console.log('   Target Names (prim.extras):', prim.extras.targetNames);
                        } else {
                            console.log('   ❌ No target names found in extras.');
                        }
                    }
                });
            }
        });
    }

    // Save full JSON to file for inspection
    const outputPath = path.join(__dirname, 'untitled-glb-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(gltf, null, 2));
    console.log(`\n✅ Full GLTF JSON saved to: ${outputPath}`);
}

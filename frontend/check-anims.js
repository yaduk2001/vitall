import fs from 'fs';

const data = JSON.parse(fs.readFileSync('untitled-glb-analysis.json', 'utf8'));

console.log('='.repeat(80));
console.log('ANIMATION SUMMARY');
console.log('='.repeat(80));
console.log('Total Animations:', data.animations?.length || 0);

if (data.animations) {
    data.animations.forEach((anim, i) => {
        console.log(`\nAnimation ${i}: "${anim.name}"`);
        console.log(`  Channels: ${anim.channels?.length || 0}`);
        console.log(`  Samplers: ${anim.samplers?.length || 0}`);

        // Get duration from first sampler
        if (anim.samplers && anim.samplers[0]) {
            const inputAccessor = data.accessors[anim.samplers[0].input];
            console.log(`  Duration: ${inputAccessor.max?.[0] || 'unknown'}s`);
            console.log(`  Keyframes: ${inputAccessor.count}`);
        }
    });
}

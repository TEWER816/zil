const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { default: pngToIco } = require('png-to-ico');

const svgPath = path.resolve(__dirname, '../public/favicon.svg');
const buildDir = path.resolve(__dirname, '../build');

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

(async () => {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outPath = path.join(buildDir, `icon-${size}.png`);
    const buf = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    fs.writeFileSync(outPath, buf);
    console.log(`Generated icon-${size}.png`);
  }

  const icoBuf = await pngToIco([
    path.join(buildDir, 'icon-256.png'),
    path.join(buildDir, 'icon-128.png'),
    path.join(buildDir, 'icon-64.png'),
    path.join(buildDir, 'icon-48.png'),
    path.join(buildDir, 'icon-32.png'),
    path.join(buildDir, 'icon-16.png'),
  ]);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);
  console.log('Generated icon.ico');

  fs.copyFileSync(path.join(buildDir, 'icon-1024.png'), path.join(buildDir, 'icon.png'));
  console.log('Generated icon.png');
})();

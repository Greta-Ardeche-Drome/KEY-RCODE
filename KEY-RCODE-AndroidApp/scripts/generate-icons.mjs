import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets', 'images');

const srcPath     = path.join(assetsDir, 'keyrcode-logo.png');
const iconPath    = path.join(assetsDir, 'icon.png');
const fgPath      = path.join(assetsDir, 'android-icon-foreground.png');

const SIZE      = 1024;
const SAFE      = Math.round(SIZE * 0.66); // 677px safe zone adaptive icon
const PAD       = Math.round((SIZE - SAFE) / 2);

/** Supprime le fond blanc (pixels > 240 sur R,G,B deviennent transparents) */
async function removeWhiteBg(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }
  return sharp(Buffer.from(data), { raw: { width, height, channels } }).png();
}

async function main() {
  // --- icon.png : logo centré sur fond #111111, 1024x1024 ---
  const logoBuf = await (await removeWhiteBg(srcPath))
    .resize(870, 870, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 17, g: 17, b: 17, alpha: 255 } }
  })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .png()
    .toFile(iconPath);
  console.log('✅  icon.png généré');

  // --- android-icon-foreground.png : logo dans la safe zone, fond transparent ---
  const fgBuf = await (await removeWhiteBg(srcPath))
    .resize(SAFE, SAFE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: fgBuf, gravity: 'center' }])
    .png()
    .toFile(fgPath);
  console.log('✅  android-icon-foreground.png généré');
}

main().catch(err => { console.error('❌', err); process.exit(1); });

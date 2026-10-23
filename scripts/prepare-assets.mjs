import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/assets'); await mkdir(output, { recursive: true });
const hero = resolve(root, 'design/generated/mansion-v2.png');
await sharp(hero).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toFile(resolve(output, 'mansion-v2.webp'));
await sharp(hero).resize({ width: 800 }).webp({ quality: 82 }).toFile(resolve(output, 'mansion-v2-mobile.webp'));
await sharp(hero).resize({ width: 1440 }).jpeg({ quality: 83, mozjpeg: true }).toFile(resolve(output, 'mansion-v2.jpg'));
const atlas = resolve(root, 'design/generated/mascots-v2.png');
const metadata = await sharp(atlas).metadata();
const cell = Math.floor(metadata.width / 3);
for (const [index, name] of ['witch', 'vampire', 'ghost'].entries()) {
  await sharp(atlas).extract({ left: index * cell, top: 0, width: index === 2 ? metadata.width - cell * 2 : cell, height: metadata.height }).resize({ width: 480 }).webp({ quality: 85 }).toFile(resolve(output, `${name}-v2.webp`));
}
console.log('Arte v2 optimizado: mansión y tres retratos en public/assets/.');

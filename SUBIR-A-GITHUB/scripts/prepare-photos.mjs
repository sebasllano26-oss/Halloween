import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'public/assets'), { recursive: true });
for (const name of ['antonia', 'guillermo', 'andrea']) {
  const source = resolve(root, 'design/photos', `${name}.png`);
  const target = resolve(root, 'public/assets', `${name}.webp`);
  await sharp(source).rotate().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 86 }).toFile(target);
  const metadata = await sharp(target).metadata();
  console.log(JSON.stringify({ name, width: metadata.width, height: metadata.height, bytes: metadata.size }));
}

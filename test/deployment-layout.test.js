import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('la raíz de despliegue contiene la aplicación y la configuración de Vercel', () => {
  const root = process.cwd();
  for (const file of ['package.json', 'package-lock.json', 'vercel.json', 'api/rpc.js', 'scripts/build.mjs', 'public/index.html', 'src/client/app.js']) {
    assert.ok(existsSync(resolve(root, file)), `Falta ${file} en la raíz que Vercel está publicando`);
  }
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(config.buildCommand, 'npm run build');
});

import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(resolve(root, 'index.html'), 'utf8');

test('index.html declara doctype y viewport', () => {
  if (!/<!doctype html/i.test(index)) throw new Error('falta <!doctype html>');
  if (!/name="viewport"/i.test(index)) throw new Error('falta meta viewport');
});

test('todos los assets locales referenciados por index.html existen', () => {
  const refs = [...index.matchAll(/(?:src|href)="(?!https?:|\/\/|#|data:)([^"]+)"/g)]
    .map((m) => m[1].split('?')[0].split('#')[0]);
  if (refs.length === 0) throw new Error('index.html no referencia ningun asset local');
  for (const ref of refs) {
    if (!existsSync(resolve(root, ref))) throw new Error('asset faltante: ' + ref);
  }
});

test('index.html carga main.js y este importa sim.js y render.js', () => {
  if (!/src="[^"]*js\/main\.js/.test(index)) {
    throw new Error('index.html no carga js/main.js');
  }
  const main = readFileSync(resolve(root, 'js/main.js'), 'utf8');
  for (const mod of ['js/sim.js', 'js/render.js']) {
    const base = mod.replace('js/', './');
    if (!main.includes(base.split('?')[0].replace(/^\.\//, './'))) {
      throw new Error('js/main.js no importa ' + mod);
    }
    if (!existsSync(resolve(root, mod))) throw new Error('no existe ' + mod);
  }
});

test('los JS del simulador parsean como modulos ES validos', () => {
  for (const mod of ['js/main.js', 'js/sim.js', 'js/render.js']) {
    const source = readFileSync(resolve(root, mod), 'utf8')
      .replace(/(from\s+["'][^"']+)(\?v=\d+)(["'])/g, '$1$3'); // quita ?v= para node
    execFileSync(process.execPath, ['--input-type=module', '--check'],
                 { input: source });
  }
});

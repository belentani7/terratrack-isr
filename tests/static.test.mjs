import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const landing = readFileSync(resolve(root, 'index.html'), 'utf8');
const app = readFileSync(resolve(root, 'app.html'), 'utf8');

test('la landing presenta el producto y abre la demo funcional', () => {
  if (!/<!doctype html/i.test(landing)) throw new Error('falta <!doctype html>');
  if (!/name="viewport"/i.test(landing)) throw new Error('falta meta viewport');
  if (!/TerraTrack ISR/.test(landing)) throw new Error('falta el nombre del producto');
  if (!/href="app\.html"/.test(landing)) throw new Error('la landing no enlaza con la demo');
});

test('todos los assets locales referenciados por la landing existen', () => {
  const refs = [...landing.matchAll(/(?:src|href)="(?![a-z][a-z0-9+.-]*:|\/\/|#)([^"?#]+)[^"]*"/gi)]
    .map((m) => m[1]);
  if (refs.length === 0) throw new Error('la landing no referencia assets locales');
  for (const ref of refs) {
    if (!existsSync(resolve(root, ref))) throw new Error('asset faltante: ' + ref);
  }
});

test('la demo incluye todos los controles que necesita la consola', () => {
  for (const id of [
    'map', 'sensorList', 'layerToggles', 'trackList', 'eventLog', 'chipClock',
    'chipSensors', 'chipTracks', 'chipAlerts', 'alertCount', 'detailBar', 'dId',
    'dType', 'dClass', 'dPos', 'dCog', 'dSog', 'dAlt', 'dSrc', 'dConf', 'dHist',
    'dClose', 'cursorPos', 'trackTooltip', 'btnPlay', 'speed', 'speedVal', 'btnReset'
  ]) {
    if (!new RegExp(`id="${id}"`).test(app)) throw new Error('falta el control #' + id);
  }
  if (!/src="[^\"]*js\/main\.js/.test(app)) throw new Error('app.html no carga js/main.js');
});

test('la consola carga sus módulos locales', () => {
  const main = readFileSync(resolve(root, 'js/main.js'), 'utf8');
  for (const mod of ['./sim.js', './render.js']) {
    if (!main.includes(mod)) throw new Error('js/main.js no importa ' + mod);
    if (!existsSync(resolve(root, 'js', mod.slice(2)))) throw new Error('no existe ' + mod);
  }
});

test('los JS del simulador parsean como módulos ES válidos', () => {
  for (const mod of ['js/main.js', 'js/sim.js', 'js/render.js']) {
    const source = readFileSync(resolve(root, mod), 'utf8')
      .replace(/(from\s+["'][^"']+)(\?v=\d+)(["'])/g, '$1$3');
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: source });
  }
});

test('Vercel sirve el producto desde la raíz estática del repositorio', () => {
  const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  if (vercel.builds) throw new Error('Vercel depende de un build sin package.json');
  if (JSON.stringify(vercel.routes || []).includes('/site/')) {
    throw new Error('Vercel todavía redirige al directorio site de plantilla');
  }
});

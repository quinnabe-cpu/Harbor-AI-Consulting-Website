// Render the PNG icon fallbacks from favicon.svg.
// Run after editing favicon.svg, with the dev server up:
//
//   node serve.mjs &
//   node render-icons.mjs
//
// Produces:
//   favicon-32.png       — PNG fallback for browsers that don't take an SVG icon
//   apple-touch-icon.png — 180x180, square with no rounded corners, because iOS
//                          applies its own corner mask. Rounding it here would
//                          leave transparent notches at the corners.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const svg = fs.readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8');

// iOS masks its own corners, so strip the rounding for the apple-touch variant.
const squared = svg.replace(/ rx="10"/, '');

const targets = [
  { file: 'favicon-32.png', size: 32, source: svg },
  { file: 'apple-touch-icon.png', size: 180, source: squared },
];

const browser = await puppeteer.launch();
try {
  for (const { file, size, source } of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    const html = `<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
      svg{display:block;width:${size}px;height:${size}px}</style>${source}`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({
      path: path.join(ROOT, file),
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    await page.close();
    const kb = (fs.statSync(path.join(ROOT, file)).size / 1024).toFixed(1);
    console.log(`  ${file}  ${size}x${size}  ${kb}KB`);
  }
} finally {
  await browser.close();
}

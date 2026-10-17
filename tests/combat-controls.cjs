const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ ...(process.env.CH ? { executablePath: process.env.CH } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../dist/index.html')).href + '?webgl&notravel');
    await page.waitForFunction(() => window.__game?.SKIN.ready, null, { timeout: 90000 });
    for (const name of ['combat-input', 'cutscene', 'staff', 'blade', 'mobility', 'ep5']) {
      const checks = await page.evaluate(fs.readFileSync(path.join(__dirname, name + '.scenario.js'), 'utf8'));
      console.log(`${name}: ${checks.length} checks passed`);
    }
    if (errors.length) throw Error(errors.join('\n'));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

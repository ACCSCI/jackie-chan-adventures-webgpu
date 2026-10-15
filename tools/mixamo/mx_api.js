// 在已登录的 Mixamo 页面里调用其 API
const { chromium } = require('/vercel/sandbox/node_modules/playwright');
(async () => {
  const b = await chromium.connectOverCDP(process.env.AGENT_BROWSER_CDP);
  const pg = b.contexts()[0].pages().find(p => p.url().includes('mixamo.com'));
  const code = require('fs').readFileSync(process.argv[2], 'utf8');
  const arg = process.argv[3] ? JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8')) : null;
  const r = await pg.evaluate(new Function('arg', `return (async () => { const H = { Authorization: 'Bearer ' + localStorage.access_token, 'X-Api-Key': 'mixamo2', 'Content-Type': 'application/json', Accept: 'application/json' };
    const api = async (path, opt = {}) => { const r = await fetch('https://www.mixamo.com/api/v1' + path, Object.assign({ headers: H }, opt)); const t = await r.text(); try { return JSON.parse(t); } catch (e) { return { status: r.status, text: t.slice(0, 300) }; } };
    ${code} })()`), arg);
  console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 0));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

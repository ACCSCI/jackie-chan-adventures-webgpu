import * as THREE from 'three/webgpu';
import { pass, toonOutlinePass, uniform } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
'use strict';
// ================= 基础 =================
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const QS = new URLSearchParams(location.search);
// 设置（保存在本地）
const SETTINGS = Object.assign({ hq: false, fps: false, sens: 1, music: true }, (() => { try { return JSON.parse(localStorage.getItem('jc_set') || '{}'); } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem('jc_set', JSON.stringify(SETTINGS)); } catch (e) { } }
let MODE = 'story';
const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: QS.has('webgl') });
let PR_MAX = Math.min(devicePixelRatio, QS.has('hq') || SETTINGS.hq ? 2 : 1.5);
function setQuality(hq) { SETTINGS.hq = hq; saveSettings(); PR_MAX = Math.min(devicePixelRatio, hq ? 2 : 1.5); prCur = PR_MAX; renderer.setPixelRatio(prCur); }
let prCur = PR_MAX; renderer.setPixelRatio(prCur);
// 动态分辨率：帧率掉下来时自动降低渲染分辨率，恢复后再升回去
const perf = { acc: 0, n: 0, slow: 0, fast: 0, fps: 60 };
function perfTick(rdt) {
  perf.acc += rdt; perf.n++;
  if (perf.acc < 1) return;
  const ms = perf.acc / perf.n * 1000; perf.fps = Math.round(perf.n / perf.acc); perf.acc = 0; perf.n = 0;
  if (ms > 24) { perf.slow++; perf.fast = 0; } else if (ms < 17.5) { perf.fast++; perf.slow = 0; } else { perf.slow = perf.fast = 0; }
  let np = prCur;
  if (perf.slow >= 2) { np = Math.max(0.6, prCur - 0.2); perf.slow = 0; }
  if (perf.fast >= 5) { np = Math.min(PR_MAX, prCur + 0.1); perf.fast = 0; }
  if (Math.abs(np - prCur) > 0.01) { prCur = np; renderer.setPixelRatio(prCur); }
  { let el = document.getElementById('fpsx'); if (!(QS.has('fps') || SETTINGS.fps)) { if (el) el.remove(); return; } }
  { let el = document.getElementById('fpsx'); if (!el) { el = document.createElement('div'); el.id = 'fpsx'; el.style.cssText = 'position:fixed;left:6px;bottom:6px;color:#0f0;font:12px monospace;z-index:99'; document.body.appendChild(el); } el.textContent = perf.fps + ' fps · ' + ms.toFixed(1) + ' ms · 分辨率 ×' + prCur.toFixed(2); }
}
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG = 0xd99a6c;
scene.fog = new THREE.Fog(FOG, 32, 95);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.05, 400);

// 后期：卡通描边 + 泛光
const pipeline = new THREE.RenderPipeline(renderer);
const scenePass = toonOutlinePass(scene, camera, new THREE.Color(0x1b0e08), 0.0032, 1);
const bloomPass = bloom(scenePass, 0.55, 0.35, 0.92);
pipeline.outputNode = scenePass.add(bloomPass);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

scene.add(new THREE.HemisphereLight(0xffe6c8, 0x6a4a3a, 1.1));
const sun = new THREE.DirectionalLight(0xffd6a8, 2.6);
sun.position.set(-20, 28, 14);
sun.castShadow = true; scene.add(sun.target);
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 90 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
scene.add(sun);

// 卡通三阶色带
const toonGrad = (() => { const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const M = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad }, o));
const MS = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
const glowMat = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; if (parent) parent.add(m); return m;
}
function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
function canvasTex(w, h, draw, rep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}

// ================= 场景：唐人街广场 =================
const colliders = [];
const ARENA = 27;
const AREA = { name: 'street', cx: 0, cz: 0, hx: ARENA, hz: ARENA, room: false };
const _preWorld = scene.children.length;
(function buildWorld() {
  // 天空渐变
  const skyGeo = new THREE.SphereGeometry(300, 32, 16);
  const cols = [], pos = skyGeo.attributes.position, top = new THREE.Color(0x3d5b8f), mid = new THREE.Color(0xf0a56b), low = new THREE.Color(0xffd9a0);
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / 300, c = h > 0.08 ? mid.clone().lerp(top, Math.min(1, (h - 0.08) / 0.6)) : low.clone().lerp(mid, Math.max(0, (h + 0.1) / 0.18));
    cols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
  const sunDisk = mesh(new THREE.SphereGeometry(9, 24, 12), glowMat(3, 1.8, 0.9), -120, 40, 140, scene, false); sunDisk.material.fog = false;

  // 石板地面
  const tex = canvasTex(1024, 1024, (g, W) => {
    g.fillStyle = '#5e5045'; g.fillRect(0, 0, W, W);
    const n = 12, s = W / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const off = (y % 2) * s / 2, v = 135 + Math.random() * 45 | 0;
      g.fillStyle = `rgb(${v},${v * 0.88 | 0},${v * 0.74 | 0})`;
      g.fillRect(x * s + off + 3, y * s + 3, s - 6, s - 6);
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(40,25,15,${Math.random() * 0.12})`; g.fillRect(x * s + off + Math.random() * s, y * s + Math.random() * s, 6, 6); }
    }
  }, [16, 16]);
  const ground = mesh(new THREE.PlaneGeometry(160, 160), MS(0xffffff, { map: tex, roughness: 0.95 }), 0, 0, 0, scene, false);
  ground.rotation.x = -Math.PI / 2;
  // 中心太极圆
  const circ = canvasTex(1024, 1024, (g, W) => {
    const c = W / 2; g.clearRect(0, 0, W, W);
    g.strokeStyle = '#7c1b12'; g.lineWidth = 28; g.beginPath(); g.arc(c, c, c - 20, 0, TAU); g.stroke();
    g.strokeStyle = '#c99a3c'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 60, 0, TAU); g.stroke();
    const r = c - 120;
    g.fillStyle = 'rgba(240,230,210,.85)'; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(30,20,18,.9)'; g.beginPath(); g.arc(c, c, r, -Math.PI / 2, Math.PI / 2); g.arc(c, c + r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true); g.arc(c, c - r / 2, r / 2, Math.PI / 2, -Math.PI / 2); g.fill();
    g.beginPath(); g.arc(c, c + r / 2, r / 7, 0, TAU); g.fill();
    g.fillStyle = 'rgba(240,230,210,.95)'; g.beginPath(); g.arc(c, c - r / 2, r / 7, 0, TAU); g.fill();
  });
  const disc = mesh(new THREE.PlaneGeometry(14, 14), MS(0xffffff, { map: circ, transparent: true, roughness: 0.7, depthWrite: false }), 0, 0.01, 0, scene, false);
  disc.rotation.x = -Math.PI / 2;

  const wallCols = [0xb8452f, 0xe2cfa6, 0x8f3324, 0xcf9450, 0x7b8a63, 0xd8b98a];
  const roofCols = [0x2f5a45, 0x9a2318, 0x3b3f5c];
  const winMat = glowMat(2.2, 1.4, 0.55), frameMat = M(0x3b2416), dark = M(0x2a1a12), gold = M(0xd8a53a);
  const signWords = ['茶楼', '药材', '面馆', '武馆', '当铺', '饼家', '酒家', '布庄', '书局', '金铺'];
  const awningTex = canvasTex(256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f3e6c8' : '#b52a1e'; g.fillRect(i * 32, 0, 32, 64); } });
  function building(x, z, w, d, h, face) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = face; scene.add(grp);
    // 局部坐标：+Z 为面向广场一侧
    const wc = wallCols[Math.random() * wallCols.length | 0];
    box(w, h, d, M(wc), 0, h / 2, 0, grp);
    box(w + 0.1, 0.25, d + 0.1, M(new THREE.Color(wc).multiplyScalar(0.7)), 0, 3.1, 0, grp); // 楼层腰线
    box(w + 0.1, 0.4, d + 0.1, dark, 0, 0.2, 0, grp);
    // 店面
    box(w * 0.7, 2.4, 0.1, dark, 0, 1.4, d / 2 + 0.02, grp);
    mesh(new THREE.PlaneGeometry(w * 0.62, 1.6), glowMat(1.6, 1.0, 0.45), 0, 1.6, d / 2 + 0.08, grp, false);
    const aw = mesh(new THREE.BoxGeometry(w * 0.8, 0.06, 1.3), M(0xffffff, { map: awningTex }), 0, 2.85, d / 2 + 0.6, grp); aw.rotation.x = 0.35;
    // 窗户
    const floors = Math.floor((h - 3.2) / 2.6);
    const nw = Math.max(1, Math.floor(w / 2.2));
    for (let f = 0; f < floors; f++) for (let i = 0; i < nw; i++) {
      const wx = -w / 2 + w / nw * (i + 0.5), wy = 4.4 + f * 2.6;
      box(0.95, 1.25, 0.12, frameMat, wx, wy, d / 2 + 0.02, grp);
      if (Math.random() < 0.75) mesh(new THREE.PlaneGeometry(0.75, 1.05), winMat, wx, wy, d / 2 + 0.09, grp, false);
      else box(0.75, 1.05, 0.05, M(0x5a3420), wx, wy, d / 2 + 0.08, grp);
    }
    if (floors > 0 && Math.random() < 0.6) { // 阳台
      box(w * 0.6, 0.12, 0.8, frameMat, 0, 3.9, d / 2 + 0.4, grp);
      for (let i = 0; i <= 8; i++) box(0.05, 0.6, 0.05, frameMat, -w * 0.3 + i * w * 0.6 / 8, 4.25, d / 2 + 0.78, grp);
      box(w * 0.6, 0.06, 0.06, frameMat, 0, 4.55, d / 2 + 0.78, grp);
    }
    // 竖招牌
    const word = signWords[Math.random() * signWords.length | 0];
    const st = canvasTex(64, 192, (g) => { g.fillStyle = '#7d1610'; g.fillRect(0, 0, 64, 192); g.strokeStyle = '#e8b84a'; g.lineWidth = 4; g.strokeRect(4, 4, 56, 184); g.fillStyle = '#ffd86a'; g.font = 'bold 50px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.fillText(word[0], 32, 80); g.fillText(word[1], 32, 150); });
    const sg = mesh(new THREE.BoxGeometry(0.6, 1.8, 0.08), [dark, dark, dark, dark, new THREE.MeshBasicMaterial({ map: st }), dark], w / 2 - 0.5, 4.6, d / 2 + 0.35, grp);
    sg.rotation.y = Math.PI / 2 * 0; sg.position.z = d / 2 + 0.06;
    // 飞檐屋顶
    const rc = roofCols[Math.random() * roofCols.length | 0], rm = M(rc);
    const roof = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.74, 2.0, 4), rm, 0, h + 1.0, 0, grp);
    roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d) * 1.05, 1, d / Math.max(w, d) * 1.05);
    box(w + 0.8, 0.22, d + 0.8, rm, 0, h + 0.05, 0, grp);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { const e = box(0.25, 0.25, 0.9, rm, sx * (w / 2 + 0.3), h + 0.25, sz * (d / 2 + 0.3), grp); e.rotation.set(-sz * 0.4, 0, 0); });
    box(0.3, 0.3, 0.3, gold, 0, h + 2.05, 0, grp);
    grp.updateMatrixWorld(true); const wb = new THREE.Box3().setFromObject(grp.children[0]);
    colliders.push({ x0: wb.min.x, x1: wb.max.x, z0: wb.min.z, z1: wb.max.z });
    return grp;
  }
  for (let i = -3; i <= 3; i++) {
    if (i !== 0) building(i * 8.5, 33, 7.5, 8, rand(7, 13), Math.PI);
    if (i !== 0) building(i * 8.5, -33, 7.5, 8, rand(7, 13), 0);
    building(33, i * 8.5, 7.5, 8, rand(7, 13), -Math.PI / 2);
    building(-33, i * 8.5, 7.5, 8, rand(7, 13), Math.PI / 2);
  }
  // 老爹古董店（正对广场）
  const shop = building(0, -33, 8, 8, 9, 0);
  const sc = canvasTex(512, 128, (g) => { g.fillStyle = '#5c120c'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#e8b84a'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116); g.fillStyle = '#ffd34d'; g.font = 'bold 74px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.fillText('老爹古董店', 256, 90); });
  mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: sc }), 0, 3.6, 4.2, shop, false);
  // 牌坊
  const red = M(0xb8241a), green = M(0x2f5a45);
  [-4.5, 4.5].forEach(x => {
    mesh(new THREE.CylinderGeometry(0.42, 0.48, 8, 16), red, x, 4, 29, scene);
    box(1.4, 0.8, 1.4, M(0x8d8278), x, 0.4, 29);
    colliders.push({ x0: x - .6, x1: x + .6, z0: 28.4, z1: 29.6 });
  });
  box(12, 0.8, 1.0, red, 0, 7.0, 29); box(10, 0.5, 0.8, red, 0, 6.0, 29);
  const gr = mesh(new THREE.ConeGeometry(8.6, 1.5, 4), green, 0, 8.4, 29); gr.rotation.y = Math.PI / 4; gr.scale.set(1, 1, 0.22);
  const plaque = canvasTex(256, 96, (g) => { g.fillStyle = '#1e3b2c'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#ffd34d'; g.font = 'bold 60px "Noto Sans SC",sans-serif'; g.textAlign = 'center'; g.fillText('唐人街', 128, 72); });
  const pq = mesh(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: plaque }), 0, 6.5, 28.45, scene, false); pq.rotation.y = Math.PI;
  // 灯笼串
  const lanMat = glowMat(3.2, 0.6, 0.25), lanCap = M(0x2a1a10), tassel = M(0xd8a53a);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2a1a10 });
  for (let k = 0; k < 4; k++) {
    const z = -20 + k * 13.3, pts = [];
    for (let x = -27; x <= 27; x += 0.5) pts.push(new THREE.Vector3(x, 9.2 - Math.cos(x / 27 * Math.PI / 2) * 1.8, z));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    for (let x = -24; x <= 24; x += 3) {
      const y = 9.2 - Math.cos(x / 27 * Math.PI / 2) * 1.8 - 0.45;
      const l = mesh(new THREE.SphereGeometry(0.26, 14, 10), lanMat, x, y, z, scene, false); l.scale.y = 1.2;
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10), lanCap, x, y + 0.32, z, scene, false);
      mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10), lanCap, x, y - 0.32, z, scene, false);
      mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.3, 6), tassel, x, y - 0.5, z, scene, false);
    }
  }
  // 街灯
  [[-20, -20], [20, -20], [-20, 20], [20, 20]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.2, 10), dark, x, 2.1, z, scene);
    mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), glowMat(3, 2, 0.9), x, 4.4, z, scene, false);
    const roofL = mesh(new THREE.ConeGeometry(0.5, 0.35, 4), dark, x, 4.85, z, scene); roofL.rotation.y = Math.PI / 4;
    const pl = new THREE.PointLight(0xffb060, 18, 12, 2); pl.position.set(x, 4.2, z); scene.add(pl);
    colliders.push({ x0: x - .15, x1: x + .15, z0: z - .15, z1: z + .15 });
  });
  // 木箱、木桶
  const crateTex = canvasTex(128, 128, (g) => { g.fillStyle = '#a2703f'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#6e4322'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 32 + 28, 128, 4); g.fillRect(0, 0, 128, 10); g.fillRect(0, 118, 128, 10); g.fillRect(0, 0, 10, 128); g.fillRect(118, 0, 10, 128); g.save(); g.translate(64, 64); g.rotate(Math.PI / 4); g.fillRect(-90, -6, 180, 12); g.restore(); });
  const crate = M(0xffffff, { map: crateTex });
  [[-9, -6], [-10.3, -6.4], [11, 9], [12.2, 7.8], [-14, 12], [8, -14], [16, -4], [-17, -15]].forEach(([x, z], i) => {
    const s = rand(1, 1.25); box(s, s, s, crate, x, s / 2, z).rotation.y = rand(0, 1);
    if (i % 3 === 0) box(s * 0.7, s * 0.7, s * 0.7, crate, x + 0.1, s + s * 0.35, z).rotation.y = rand(0, 1);
    colliders.push({ x0: x - s / 2, x1: x + s / 2, z0: z - s / 2, z1: z + s / 2 });
  });
  const barrel = M(0x7c4b27), hoop = M(0x2f2a26);
  [[13, -12], [-12, 8], [18, 14], [-19, -2]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.1, 16), barrel, x, 0.55, z, scene);
    [0.2, 0.9].forEach(y => mesh(new THREE.TorusGeometry(0.44, 0.03, 6, 20), hoop, x, y, z, scene).rotation.x = Math.PI / 2);
    colliders.push({ x0: x - .45, x1: x + .45, z0: z - .45, z1: z + .45 });
  });
})();

const STREET_OBJS = scene.children.slice(_preWorld);
function collideCircle(p, r) {
  p.x = clamp(p.x, AREA.cx - AREA.hx, AREA.cx + AREA.hx); p.z = clamp(p.z, AREA.cz - AREA.hz, AREA.cz + AREA.hz);
  for (const c of colliders) {
    const cx = clamp(p.x, c.x0, c.x1), cz = clamp(p.z, c.z0, c.z1);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) { if (d2 === 0) { p.x += r; continue; } const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
  }
}

// ================= 音效 =================
let AC = null, noiseBuf = null;
function initAudio() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function sfx(type) {
  if (!AC) return;
  const t = AC.currentTime, src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(), gn = AC.createGain();
  src.connect(f); f.connect(gn); gn.connect(AC.destination);
  const P = { whoosh: [900, 2.5, .18, .08], hit: [600, 1, .9, .12], heavy: [250, .8, 1.2, .22], block: [2500, 6, .7, .1], clang: [3200, 12, .8, .3], hurt: [400, 1, 1, .15] }[type] || [800, 1, .5, .1];
  f.type = type === 'whoosh' ? 'bandpass' : 'lowpass'; f.frequency.setValueAtTime(P[0], t); f.Q.value = P[1];
  if (type === 'whoosh') f.frequency.exponentialRampToValueAtTime(P[0] * 2.5, t + P[3]);
  gn.gain.setValueAtTime(P[2], t); gn.gain.exponentialRampToValueAtTime(0.001, t + P[3]);
  src.start(t); src.stop(t + P[3] + 0.02);
}

// ================= 粒子（实例化，WebGPU 友好） =================
const PMAX = 400;
const pMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), PMAX);
pMesh.frustumCulled = false; pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(pMesh);
const parts = [];
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
for (let i = 0; i < PMAX; i++) { parts.push({ life: 0, max: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, c: new THREE.Color(), s: 1 }); pMesh.setColorAt(i, _c.setRGB(0, 0, 0)); }
let pIdx = 0;
function burst(pos, color, n = 16, spd = 5) {
  for (let i = 0; i < n; i++) {
    const p = parts[pIdx = (pIdx + 1) % PMAX];
    p.life = p.max = rand(0.25, 0.55); p.x = pos.x; p.y = pos.y; p.z = pos.z; p.s = rand(0.6, 1.6);
    p.vx = rand(-1, 1) * spd; p.vy = rand(-0.3, 1) * spd; p.vz = rand(-1, 1) * spd; p.c.set(color).multiplyScalar(2.5);
  }
}
function updateParts(dt) {
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i];
    if (p.life > 0) { p.life -= dt; p.vy -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
    const k = Math.max(0, p.life / p.max);
    _p.set(p.x, p.life > 0 ? p.y : -99, p.z); _s.setScalar(p.s * (0.3 + k)); _q.setFromAxisAngle(_s.clone().normalize(), p.life * 10);
    pMesh.setMatrixAt(i, _m4.compose(_p, _q, _s));
    pMesh.setColorAt(i, _c.copy(p.c).multiplyScalar(k));
  }
  pMesh.instanceMatrix.needsUpdate = true; pMesh.instanceColor.needsUpdate = true;
}
const rings = [];
// 冲击波环：对象池复用（避免运行时新建材质导致着色器编译卡顿）
const RING_GEO = new THREE.RingGeometry(0.3, 0.45, 40), ringPool = [];
for (let i = 0; i < 10; i++) {
  const m = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -50; m.frustumCulled = false; scene.add(m); ringPool.push(m);
}
let ringI = 0;
function shock(pos, color, size = 2) {
  const m = ringPool[ringI++ % ringPool.length];
  const old = rings.findIndex(r => r.m === m); if (old >= 0) rings.splice(old, 1);
  m.material.color.set(color).multiplyScalar(2); m.position.copy(pos); m.position.y = Math.max(0.05, pos.y); m.visible = true;
  rings.push({ m, t: 0, size });
}
function updateRings(dt) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt; const k = r.t / 0.4;
    r.m.scale.setScalar(1 + k * r.size * 3); r.m.material.opacity = Math.max(0, 1 - k);
    if (k >= 1) { r.m.position.y = -50; r.m.material.opacity = 0; rings.splice(i, 1); }
  }
}
// 招式拖尾
const TRAIL_N = 14;
class Trail {
  constructor() {
    this.pts = []; const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(TRAIL_N * 2 * 3); this.col = new Float32Array(TRAIL_N * 2 * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const idx = []; for (let i = 0; i < TRAIL_N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; scene.add(this.mesh); this.color = new THREE.Color(1, 1, 1);
  }
  push(a, b, on) {
    // 环形缓冲，避免每帧分配
    if (!this.buf) { this.buf = []; for (let i = 0; i < TRAIL_N; i++) this.buf.push([new THREE.Vector3(), new THREE.Vector3(), false]); this.head = 0; }
    this.head = (this.head + TRAIL_N - 1) % TRAIL_N; const h = this.buf[this.head]; h[2] = on; if (on) { h[0].copy(a); h[1].copy(b); }
    let last = null; const P = this.pos, C = this.col, cr = this.color.r * 1.8, cg = this.color.g * 1.8, cb = this.color.b * 1.8;
    for (let i = 0; i < TRAIL_N; i++) {
      const e = this.buf[(this.head + i) % TRAIL_N], live = e[2]; if (live) last = e;
      const k = live ? (1 - i / TRAIL_N) : 0, E = live ? e : last, A = E ? E[0] : a, B = E ? E[1] : a, j = i * 6;
      P[j] = A.x; P[j + 1] = A.y; P[j + 2] = A.z; P[j + 3] = B.x; P[j + 4] = B.y; P[j + 5] = B.z;
      C[j] = cr * k; C[j + 1] = cg * k; C[j + 2] = cb * k; C[j + 3] = C[j + 4] = C[j + 5] = 0;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}

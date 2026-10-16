// ================= 蒙皮角色（Blender 自建模型 + Mixamo 动作） =================
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const SKIN = { ready: false, chars: {}, clips: {}, pending: [], cache: {}, err: null };
const SK_H = { jackie: 1.8, uncle: 1.78, jade: 1.75, thug: 1.84, khan: 1.86, tohru: 1.78 };
function b64buf(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
SKIN.load = (async () => {
  try {
    const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
    const parse = s => L.parseAsync(b64buf(s), '');
    const A = await parse(GLB_DATA.anims);
    let ar = null; A.scene.traverse(o => { if (!ar && /Hips$/.test(o.name)) ar = o.position.clone(); });
    SKIN.animHip = ar;
    for (const c of A.animations) SKIN.clips[c.name] = c;
    for (const n of Object.keys(SK_H)) {
      const g = await parse(GLB_DATA[n]);
      let hip = null; g.scene.traverse(o => { if (!hip && o.isBone && /Hips$/.test(o.name)) hip = o.position.clone(); });
      skMerge(g.scene);
      g.scene.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(g.scene, true);
      SKIN.chars[n] = { scene: g.scene, hip, h: bb.max.y - bb.min.y, minY: bb.min.y };
    }
    SKIN.ready = true; SKIN.pending.splice(0).forEach(f => f());
    // 后台分批预处理所有动作（每批 ≤4ms），避免第一次出招/出场时临时处理造成卡顿
    const Q = []; for (const n of Object.keys(SK_H)) for (const k in SKIN.clips) Q.push([n, k, 'L'], [n, k, 'U']);
    const pump = () => { const t0 = performance.now(); while (Q.length && performance.now() - t0 < 4) skClip(...Q.shift()); if (Q.length) setTimeout(pump, 16); };
    setTimeout(pump, 50);
  } catch (e) { SKIN.err = e; console.error('SKIN', e); }
})();
// 性能：把同一角色按材质拆开的多个蒙皮网格合并成一个（颜色写进顶点色），每个角色只剩 1 次绘制
function skMerge(root) {
  const groups = new Map();
  root.traverse(o => { if (o.isSkinnedMesh && !/glow/.test(o.material.name || '')) { const k = o.skeleton.uuid; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); } });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const geos = list.map(o => {
      const g = new THREE.BufferGeometry(), src = o.geometry, n = src.attributes.position.count;
      for (const a of ['position', 'normal', 'skinIndex', 'skinWeight']) g.setAttribute(a, src.attributes[a]);
      const c = /lens/.test(o.material.name || '') ? new THREE.Color(0x0a0a0c) : o.material.color, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (src.index) g.setIndex(src.index); return g;
    });
    const merged = mergeGeometries(geos.map(g => g.index ? g : g.toNonIndexed()), false);
    const a = list[0], mm = new THREE.SkinnedMesh(merged, new THREE.MeshStandardMaterial({ name: 'merged' }));
    mm.name = a.name; mm.position.copy(a.position); mm.quaternion.copy(a.quaternion); mm.scale.copy(a.scale);
    a.parent.add(mm); mm.bind(a.skeleton, a.bindMatrix);
    list.forEach(o => o.removeFromParent());
  }
}
// 为某个角色准备动作：髋部只保留竖直位移（按髋高缩放），水平位移交给游戏逻辑
const SK_LOWER = /(Hips|UpLeg|Leg|Foot|ToeBase)\./;
const SK_VSCALE = { boss_stomp: 0.35, knee_combo: 0.5 };
function skClip(char, key, half) {
  const ck = char + ':' + key + ':' + half; if (SKIN.cache[ck]) return SKIN.cache[ck];
  const src = SKIN.clips[key]; if (!src) return null;
  const c = src.clone(), ch = SKIN.chars[char], ar = SKIN.animHip, hr = ch.hip;
  const ax = [Math.abs(ar.x), Math.abs(ar.y), Math.abs(ar.z)]; const v = ax.indexOf(Math.max(...ax));
  const ratio = hr.getComponent(v) / ar.getComponent(v);
  c.tracks = c.tracks.filter(t => !/\.(scale)$/.test(t.name) && !(/position$/.test(t.name) && !/Hips\.position$/.test(t.name)) && (half === 'L') === SK_LOWER.test(t.name));
  const vs = SK_VSCALE[key] ?? 1, rv = ar.getComponent(v) * ratio;
  for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) {
    const a = t.values = t.values.slice();
    for (let i = 0; i < a.length; i += 3) for (let k = 0; k < 3; k++) a[i + k] = k === v ? rv + (a[i + k] * ratio - rv) * vs : hr.getComponent(k);
  }
  return SKIN.cache[ck] = c;
}
const SK_BONES = { lHand: 'LeftHand', rHand: 'RightHand', lE: 'LeftForeArm', rE: 'RightForeArm', lFoot: 'LeftToeBase', rFoot: 'RightToeBase', lK: 'LeftLeg', rK: 'RightLeg', headB: 'Head', neckB: 'Neck', hipB: 'Hips', spineB: 'Spine2' };
function ghostRig() {
  const g = () => new THREE.Object3D();
  return { root: g(), hips: g(), spine: g(), neck: g(), lS: g(), lE: g(), rS: g(), rE: g(), lH: g(), lK: g(), rH: g(), rK: g(), cur: zeroPose() };
}
const SK_GRIP = new THREE.Vector3(Math.cos(0.55), Math.sin(0.55), 0);
const SK_FINAL = { jackie: 1.8, uncle: 1.55, jade: 1.32, thug: 1.82, khan: 1.82, tohru: 2.6 };
function makeSkinRig(name, scale = 1) {
  const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner); root.scale.setScalar(scale);
  const ghost = ghostRig();
  const rig = { skin: true, name, root, inner, ghost, mats: [], bones: {}, get cur() { return ghost.cur; } };
  for (const k in SK_BONES) rig[k] = new THREE.Group();
  rig.grip = new THREE.Group(); rig.grip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), SK_GRIP); rig.grip.position.set(.01, .062, .02); rig.rHand.add(rig.grip); // 握持中心在拳心而非手腕
  let headHidden = false;
  rig.headParts = [{ set visible(v) { headHidden = !v; if (rig.bones.Head) rig.bones.Head.scale.setScalar(v ? 1 : 0.001); } }];
  rig.sk = new SkinAnim(rig);
  const attach = () => {
    const C = SKIN.chars[name], m = SkeletonUtils.clone(C.scene);
    const s = SK_FINAL[name] / (C.h * scale); inner.scale.setScalar(s); inner.position.y = -C.minY * s;
    inner.add(m);
    m.traverse(o => {
      if (o.isBone) rig.bones[o.name.replace(/^mixamorig:?/, '')] = o;
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        const om = o.material, nm = om.name || '';
        let mat;
        if (/glow/.test(nm)) mat = glowMat(4, 0.35, 0.2);
        else if (/lens/.test(nm)) mat = M(0x0a0a0c, { emissive: 0x000000 });
        else if (nm === 'merged') mat = M(0xffffff, { emissive: 0x000000, vertexColors: true });
        else { mat = M(om.color.getHex(), { emissive: 0x000000 }); }
        mat.name = nm; o.material = mat; if (mat.emissive) rig.mats.push(mat);
      }
    });
    m.updateMatrixWorld(true);
    for (const k in SK_BONES) { const b = rig.bones[SK_BONES[k]]; if (!b) continue; b.add(rig[k]); const ws = new THREE.Vector3(); b.getWorldScale(ws); rig[k].scale.setScalar(1 / ws.x * root.scale.x); }
    
    if (headHidden) rig.bones.Head.scale.setScalar(0.001);
    rig.sk.bind(m);
    rig.loaded = true;
  };
  if (SKIN.ready) attach(); else SKIN.pending.push(attach);
  return rig;
}
// 动画层：自管权重的交叉淡入；一次性动作用手动时间（与招式判定帧对齐）
class SkinAnim {
  constructor(rig) { this.rig = rig; this.L = new Map(); this.key = null; this.fadeR = 8; }
  bind(model) { this.mixer = new THREE.AnimationMixer(model); this.model = model; }
  act(key, h) {
    const id = key + '|' + h; let e = this.L.get(id); if (e) return e;
    const c = skClip(this.rig.name, key, h); if (!c) return null;
    const a = this.mixer.clipAction(c); a.setEffectiveWeight(0);
    e = { a, w: 0, tgt: 0, h, dur: c.duration, on: false }; this.L.set(id, e); return e;
  }
  // 切换动作组：lower/upper = {片段: 权重}；上下半身分别归一化，可做“边走边格挡”“蹲着出拳”
  set(id, lower, upper, fade = 0.15) {
    if (!this.mixer) return;
    if (id !== this.key) { this.key = id; this.fadeR = 1 / Math.max(0.01, fade); }
    for (const e of this.L.values()) e.tgt = 0;
    for (const k in lower) { const e = this.act(k, 'L'); if (e) e.tgt = lower[k]; }
    for (const k in (upper || lower)) { const e = this.act(k, 'U'); if (e) e.tgt = (upper || lower)[k]; }
  }
  // 手动设置时间（秒）
  time(k, t) { for (const h of 'LU') { const e = this.act(k, h); if (e) { e.a.timeScale = 0; e.a.time = Math.max(0, Math.min(e.dur - 1e-3, t)); } } }
  speed(k, s) { for (const h of 'LU') { const e = this.act(k, h); if (e) e.a.timeScale = s; } }
  dur(k) { const c = SKIN.clips[k]; return c ? c.duration : 1; }
  update(dt) {
    if (!this.mixer) return;
    const r = this.fadeR * dt, sum = { L: 0, U: 0 };
    for (const e of this.L.values()) { e.w += Math.max(-r, Math.min(r, e.tgt - e.w)); sum[e.h] += e.w; }
    for (const e of this.L.values()) {
      const w = sum[e.h] > 0 ? e.w / sum[e.h] : 0;
      if (w > 0.001 || e.tgt > 0) { if (!e.on) { const t = e.a.time, ts = e.a.timeScale; e.a.play(); e.a.time = t; e.a.timeScale = ts; e.on = true; } e.a.enabled = true; e.a.setEffectiveWeight(w); }
      else if (e.on) { e.a.stop(); e.on = false; }
    }
    this.mixer.update(dt);
  }
}

// Dedicated staff choreography. Coordinates are metres in the character's facing
// frame; authored shaft paths drive the hands, collision and effects together.
const STAFF_CARRY = { hand: [.38, .86, -.02], yaw: 2.8, pitch: 1.1, twist: -.08 };
const STAFF_POSES = {
  chop: [[0, [.38,.98,.12], .9,.65,-.3], [.24,[.18,1.48,.12],.55,1.25,-.45], [.46,[.2,1.02,.58],-.65,-.32,.28], [.68,[.02,.91,.46],-1.3,-.4,.38], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  sweep: [[0,[.3,1.05,.25],-1.5,.08,-.45], [.22,[.2,1.12,.28],-1.9,.12,-.6], [.45,[.13,1.06,.53],.1,.02,.12], [.7,[.2,1.02,.28],1.85,.08,.6], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  reverse: [[0,[.3,1.08,.2],1.7,.1,.5], [.23,[.2,1.15,.22],2,.12,.65], [.5,[.1,1.03,.56],-.15,.1,-.15], [.74,[.25,1.04,.25],-1.9,.2,-.6], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  slam: [[0,[.28,1.15,.2],.5,.7,-.25], [.28,[.12,1.53,.12],.1,1.45,-.3], [.51,[.12,.93,.58],0,-.45,.12], [.7,[.16,.83,.5],0,-.55,.25], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  thrust: [[0,[.3,1.03,.16],.1,.06,-.3], [.25,[.38,1.02,.02],.08,.08,-.5], [.47,[.12,1.14,.61],0,.06,.2], [.66,[.16,1.12,.53],0,.06,.25], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  low: [[0,[.3,.91,.15],-1.4,-.15,-.4], [.24,[.2,.63,.22],-1.9,-.12,-.5], [.46,[.12,.59,.55],0,-.24,.1], [.73,[.26,.7,.22],1.9,-.18,.5], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  rise: [[0,[.3,.98,.2],.6,.4,-.2], [.24,[.24,.72,.3],.05,-.55,-.4], [.52,[.12,1.15,.56],0,.65,.3], [.74,[.12,1.42,.3],.1,1.2,.4], [1,[.38,.86,-.02],2.8,1.1,-.08]],
  spin: [[0,[.3,.95,.2],-1.7,.05,-.3], [.15,[.15,.88,.3],-2.6,.1,-.5], [.32,[.14,.94,.54],0,0,.3], [.46,[.24,.93,.25],2.9,.1,.5], [.62,[.14,.94,.54],6.28,0,-.3], [.8,[.3,1,.2],8.8,.1,.5], [1,[.38,.86,-.02],9.08,1.1,-.08]],
};
const staffEase = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function staffPose(kind, t) {
  const frames = STAFF_POSES[kind] || STAFF_POSES.chop;
  let i = 0; while (i < frames.length - 2 && t > frames[i + 1][0]) i++;
  const a = frames[i], b = frames[i + 1], k = staffEase((t - a[0]) / (b[0] - a[0]));
  return { hand: a[1].map((v, n) => lerp(v, b[1][n], k)), yaw: lerp(a[2], b[2], k), pitch: lerp(a[3], b[3], k), twist: lerp(a[4], b[4], k) };
}
function tryStaffCharge() {
  const p = player;
  if (!p.weapon || wcls() !== 'staff' || p.mode !== 'fist' || !p.grounded || p.crouch || !canAct(p)) return false;
  buffer.type = null; p.move = null; p.staffTrace = null; p.chargeT = 0; p.chargeFull = false;
  setState(p, 'staffCharge', .1); p.guard = false;
  showMove('蓄势 · 松开右键出棍', STYLES[p.style].css);
  return true;
}
function releaseStaffCharge() {
  const p = player;
  if (p.state !== 'staffCharge') return;
  if (cutscene || !locked || gameOver || wcls() !== 'staff') { setState(p, 'loco'); return; }
  const level = clamp(p.chargeT / 1.1, 0, 1), m = WMOVES.staff[p.style].H;
  if (!startMove({ ...m, dmg: m.dmg * (1 + .6 * level), cost: m.cost * (1 + .25 * level), chargeLevel: level })) setState(p, 'loco', .1);
  p.chargeT = 0;
}
// Bake each mesh's local transform once. Bending is anchored at the grip (z=0),
// bounded to a few centimetres, and recalculated from rest vertices every frame.
function initStaffMesh(mesh, type) {
  const broom = WEAPONS[type].kind === 'broom';
  mesh.rotation.set(0, 0, 0);
  const data = mesh.userData.staff = { type, min: broom ? -.325 : -.45, max: broom ? 1.49 : 1.35, bend: 0, velocity: 0, pieces: [], previousQ: new THREE.Quaternion(), ready: false };
  mesh.traverse(o => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone(); o.updateMatrix(); o.geometry.applyMatrix4(o.matrix);
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix();
    data.pieces.push({ mesh: o, rest: o.geometry.attributes.position.array.slice(), normals: o.geometry.attributes.normal?.array.slice() });
    o.frustumCulled = false;
  });
  return data;
}
function bendStaff(mesh, force, dt, attacking) {
  const d = mesh.userData.staff, iron = WEAPONS[d.type].kind === 'iron';
  const limit = iron ? .035 : .105;
  const target = attacking ? clamp(force, -limit, limit) : 0;
  // Stable analytic damping at low frame rates as well as 60/120 Hz.
  const steps = Math.max(1, Math.ceil(dt / .012)), h = dt / steps;
  for (let i = 0; i < steps; i++) { d.velocity += (240 * (target - d.bend) - 24 * d.velocity) * h; d.bend = clamp(d.bend + d.velocity * h, -limit, limit); }
  for (const piece of d.pieces) {
    const a = piece.mesh.geometry.attributes.position.array, r = piece.rest, na = piece.mesh.geometry.attributes.normal?.array, nr = piece.normals;
    for (let i = 0; i < a.length; i += 3) {
      const z = r[i + 2], f = z / d.max;
      a[i] = r[i] + d.bend * f * f; a[i + 1] = r[i + 1]; a[i + 2] = z;
      if (na) { const slope = 2 * d.bend * z / (d.max * d.max), nx = nr[i], ny = nr[i + 1], nz = nr[i + 2] - slope * nx, len = Math.hypot(nx, ny, nz); na[i] = nx / len; na[i + 1] = ny / len; na[i + 2] = nz / len; }
    }
    piece.mesh.geometry.attributes.position.needsUpdate = true;
    if (na) piece.mesh.geometry.attributes.normal.needsUpdate = true;
  }
}
function staffPoint(mesh, z, out = new THREE.Vector3()) {
  const d = mesh.userData.staff;
  return mesh.localToWorld(out.set(d.bend * (z / d.max) ** 2, 0, z));
}
function staffAimBone(bone, child, dir) {
  const start = bone.getWorldPosition(new THREE.Vector3());
  const current = child.getWorldPosition(new THREE.Vector3()).sub(start).normalize();
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  world.premultiply(new THREE.Quaternion().setFromUnitVectors(current, dir.clone().normalize()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
  bone.updateWorldMatrix(false, true);
}
function staffArm(rig, side, target, wristQ, weight = 1) {
  const B = rig.bones, upper = B[side + 'Arm'], lower = B[side + 'ForeArm'], hand = B[side + 'Hand'];
  if (!upper || !lower || !hand) return;
  const original = [upper.quaternion.clone(), lower.quaternion.clone(), hand.quaternion.clone()];
  const start = upper.getWorldPosition(new THREE.Vector3()), elbow = lower.getWorldPosition(new THREE.Vector3()), end = hand.getWorldPosition(new THREE.Vector3());
  const a = start.distanceTo(elbow), b = elbow.distanceTo(end), axis = target.clone().sub(start);
  const d = clamp(axis.length(), Math.abs(a - b) + .001, a + b - .005); axis.normalize();
  const pole = new THREE.Vector3(side === 'Right' ? 1 : -1, -.65, -.3).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()));
  pole.addScaledVector(axis, -pole.dot(axis)).normalize();
  const along = (a * a - b * b + d * d) / (2 * d);
  const knee = start.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, a * a - along * along)));
  staffAimBone(upper, lower, knee.sub(start));
  const actual = lower.getWorldPosition(new THREE.Vector3());
  const reachable = start.clone().addScaledVector(axis, d);
  staffAimBone(lower, hand, reachable.sub(actual));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(wristQ));
  if (weight < 1) [upper, lower, hand].forEach((bone, i) => bone.quaternion.slerpQuaternions(original[i], bone.quaternion.clone(), weight));
  upper.updateWorldMatrix(false, true);
}
function driveStaff(p, dt) {
  const w = p.weapon;
  if (!w || WEAPONS[w.type].cls !== 'staff' || !p.rig.loaded) { p.staffTrace = null; return; }
  const rig = p.rig, mesh = w.mesh, d = mesh.userData.staff || initStaffMesh(mesh, w.type);
  const attack = !cutscene && p.state === 'attack' && p.move?.staff, charge = !cutscene && p.state === 'staffCharge';
  const own = !cutscene && (p.state === 'loco' || attack || charge) && !p.guard;
  rig.root.updateMatrixWorld(true);
  if (!own) {
    mesh.position.copy(rig.root.worldToLocal(rig.grip.getWorldPosition(new THREE.Vector3())));
    mesh.quaternion.copy(rig.root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rig.grip.getWorldQuaternion(new THREE.Quaternion())));
    bendStaff(mesh, 0, dt, false); p.staffTrace = null; d.ready = false; return;
  }
  let pose = STAFF_CARRY;
  if (attack) pose = staffPose(p.move.staff, clamp(p.mt, 0, 1));
  if (charge) pose = { hand: [.16,1.42,.13], yaw: .15, pitch: 1.3, twist: -.35 };
  if (rig.bones.Spine) rig.bones.Spine.rotation.y += pose.twist;
  if (rig.bones.Spine1) rig.bones.Spine1.rotation.z += attack && p.style === 2 ? Math.sin(p.mt * Math.PI) * .18 : 0;
  rig.root.updateMatrixWorld(true);
  const hand = new THREE.Vector3(...pose.hand), direction = new THREE.Vector3(Math.sin(pose.yaw) * Math.cos(pose.pitch), Math.sin(pose.pitch), Math.cos(pose.yaw) * Math.cos(pose.pitch));
  // Slight carry sway follows actual movement; the left arm remains free at rest.
  if (!attack && !charge) { hand.y += Math.sin(p.walkPh) * Math.min(.025, p.vel.length() * .008); if (p.crouch) hand.y -= .32; }
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  const k = d.ready ? 1 - Math.exp(-dt * (attack ? 45 : 20)) : 1;
  mesh.position.lerp(hand, k); mesh.quaternion.slerp(q, k);
  const worldQ = rig.root.getWorldQuaternion(new THREE.Quaternion()).multiply(mesh.quaternion);
  const wristQ = worldQ.clone().multiply(rig.grip.quaternion.clone().invert());
  let target = rig.root.localToWorld(mesh.position.clone());
  staffArm(rig, 'Right', target, wristQ);
  // Anchor the shaft to the solved palm, even when a requested pose is just beyond reach.
  mesh.position.copy(rig.root.worldToLocal(rig.bones.RightHand.getWorldPosition(new THREE.Vector3())));
  mesh.updateWorldMatrix(true, true);
  const twoHands = charge || attack && !p.move.air;
  if (twoHands) {
    target = staffPoint(mesh, p.move?.staff === 'thrust' ? -.32 : -.28);
    const gripW = charge ? 1 : staffEase(p.mt / .12) * staffEase((1 - p.mt) / .18);
    staffArm(rig, 'Left', target, wristQ, gripW);
  }
  const angle = d.ready ? d.previousQ.angleTo(mesh.quaternion) / Math.max(dt, 1e-4) : 0;
  const cross = new THREE.Vector3(0,0,1).applyQuaternion(d.previousQ).cross(direction);
  bendStaff(mesh, Math.sign(cross.y || cross.x || 1) * angle * .008, dt, !!attack);
  d.previousQ.copy(mesh.quaternion); d.ready = true;
  mesh.updateWorldMatrix(true, true);
  const a = staffPoint(mesh, d.min), b = staffPoint(mesh, d.max);
  const same = p.staffTrace && p.staffTrace.atk === p.atkN;
  const prevA = same ? p.staffTrace.a : a, prevB = same ? p.staffTrace.b : b;
  p.staffTrace = { a, b, prevA, prevB, atk: p.atkN, progress: attack ? p.mt : 0 };
}
// Moving shaft against a standing body capsule. Substeps prevent fast sweeps
// skipping a target between simulation ticks; each hit window keeps its own Set.
function staffHitCheck(p, dt) {
  const m = p.move, trace = p.staffTrace;
  if (!trace || !m?.staff) return;
  const previous = p.mt - dt / (m.dur / moveSpeed());
  for (let hi = 0; hi < m.hits.length; hi++) {
    const ht = m.hits[hi], lo = ht - .10, high = ht + .10;
    if (p.mt < lo || previous > high) continue;
    const targets = new Set(), span = Math.max(trace.a.distanceTo(trace.prevA), trace.b.distanceTo(trace.prevB));
    const steps = Math.min(16, Math.max(2, Math.ceil(span / .12)));
    const from = clamp((lo - previous) / Math.max(.001, p.mt - previous), 0, 1), to = clamp((high - previous) / Math.max(.001, p.mt - previous), 0, 1);
    for (let i = 0; i <= steps; i++) {
      const t = lerp(from, to, i / steps), a = trace.prevA.clone().lerp(trace.a, t), b = trace.prevB.clone().lerp(trace.b, t);
      const shaft = new THREE.Line3(a, b), closest = new THREE.Vector3();
      for (const e of enemies) {
        if (e.dead || e.hidden || p.hitDone[hi].has(e)) continue;
        // Sample the torso capsule vertically, so low sweeps and overhead strikes
        // hit the actual opponent rather than a large invisible attack sector.
        for (const y of [.35, .8, 1.25]) {
          const center = e.pos.clone(); center.y += y * e.scale;
          shaft.closestPointToPoint(center, true, closest);
          if (closest.distanceTo(center) < e.radius + .18) { targets.add(e); break; }
        }
      }
    }
    if (targets.size) playerHitCheck(m, hi, targets);
    if (!p.weapon) break;
  }
}
// Fixed pool: no mesh/material allocation during a swing. Each echo snapshots
// the bent shaft vertices and then fades in world space for 140 milliseconds.
const STAFF_ECHOES = [];
let staffEchoT = 0, staffEchoIndex = 0;
function updateStaffEchoes(dt) {
  for (const e of STAFF_ECHOES) { e.life -= dt; e.mesh.visible = e.life > 0; if (e.mesh.visible) e.mesh.material.opacity = .20 * (e.life / .14) ** 2; }
  const p = player, m = p.move, w = p.weapon;
  if (!w || !m?.staff || p.state !== 'attack' || cutscene || gameOver) { staffEchoT = 0; return; }
  const active = m.hits.some(h => Math.abs(p.mt - h) < .18);
  if (!active || (staffEchoT -= dt) > 0) return;
  staffEchoT = .025;
  if (!STAFF_ECHOES.length) for (let i = 0; i < 7; i++) {
    const g = new THREE.CylinderGeometry(.029, .029, 1.8, 6, 18); g.rotateX(Math.PI / 2); g.translate(0,0,.45);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe7d5ab, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; scene.add(mesh);
    STAFF_ECHOES.push({ mesh, life: 0, rest: g.attributes.position.array.slice() });
  }
  const e = STAFF_ECHOES[staffEchoIndex++ % STAFF_ECHOES.length], d = w.mesh.userData.staff, a = e.mesh.geometry.attributes.position.array;
  for (let i = 0; i < a.length; i += 3) { const z = e.rest[i+2]; a[i] = e.rest[i] + d.bend * (z / d.max) ** 2; a[i+1] = e.rest[i+1]; a[i+2] = z; }
  e.mesh.geometry.attributes.position.needsUpdate = true;
  e.mesh.matrix.copy(w.mesh.matrixWorld); e.mesh.matrixWorldNeedsUpdate = true; e.mesh.visible = true; e.life = .14; e.mesh.material.opacity = .20;
}

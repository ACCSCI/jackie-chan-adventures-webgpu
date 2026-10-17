// ================= 修复包：NPC 不再穿进柜子 / 说话的 NPC 一定在镜头里 / 靠墙镜头 / 休眠敌人 =================
// ---------- NPC 碰撞：走路和站位都会被柜子、柜台、墙推出来；走不过去就停下 ----------
function npcFree(x, z, r = 0.32) {
  for (const c of areaCols()) { if ((c.h ?? 3) < 0.35) continue; const cx = clamp(x, c.x0, c.x1), cz = clamp(z, c.z0, c.z1); if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false; }
  const m = 0.45; if (x < AREA.cx - AREA.hx + m || x > AREA.cx + AREA.hx - m || z < AREA.cz - AREA.hz + m || z > AREA.cz + AREA.hz - m) return false;
  if (typeof WORLD !== 'undefined' && WORLD.cur && !WORLD.walk(x, z)) return false;
  return true;
}
function npcPush(n) {
  const r = 0.3 * (n.scale / 0.75 + 0.2), p = n.pos; let moved = false;
  if (Math.abs(p.x - AREA.cx) > AREA.hx + 6 || Math.abs(p.z - AREA.cz) > AREA.hz + 6) return false; // 不在当前区域就不管
  for (let it = 0; it < 2; it++) for (const c of areaCols()) {
    if ((c.h ?? 3) < 0.35) continue;
    const cx = clamp(p.x, c.x0, c.x1), cz = clamp(p.z, c.z0, c.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 < 1e-8) { // 中心已经在盒子里：从最近的一边推出去
        const e = [[p.x - c.x0, -1, 0], [c.x1 - p.x, 1, 0], [p.z - c.z0, 0, -1], [c.z1 - p.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
        p.x += e[1] * (e[0] + r); p.z += e[2] * (e[0] + r);
      } else { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      moved = true;
    }
  }
  if (AREA.room) { const m = r + 0.1; p.x = clamp(p.x, AREA.cx - AREA.hx + m, AREA.cx + AREA.hx - m); p.z = clamp(p.z, AREA.cz - AREA.hz + m, AREA.cz + AREA.hz - m); }
  return moved;
}
{
  const _up = NPC.prototype.update;
  NPC.prototype.update = function (dt) {
    if (!this.rig.root.visible) return;
    const x0 = this.pos.x, z0 = this.pos.z, w = this.walk;
    _up.call(this, dt);
    if (npcPush(this)) {
      this.rig.root.position.copy(this.pos);
      if (w && this.walk) { // 被挡住：0.5 秒没前进就停在原地，不在柜子边上来回磨
        const prog = Math.hypot(this.pos.x - x0, this.pos.z - z0);
        this._stuck = prog < (w.spd || 2) * dt * 0.25 ? (this._stuck || 0) + dt : 0;
        if (this._stuck > 0.5) { this.walk = null; this._stuck = 0; }
      }
    }
  };
  const _pl = NPC.prototype.place;
  NPC.prototype.place = function (x, z, yaw) { _pl.call(this, x, z, yaw); npcPush(this); this.rig.root.position.copy(this.pos); };
}
// 小玉躲到柜台后面：原目标点在柜台里，改到柜台后面的空地
{
  const L = (typeof INTRO !== 'undefined' ? INTRO : []).find(l => l.who === 'jade' && /躲到柜台后面/.test(l.text || ''));
  if (L) { const a = L.act; L.act = () => { a(); const f = (x, z) => npcFree(x, z, 0.36); const c = [[SC.x + 1.2, SC.z - 6.3], [SC.x + 2.4, SC.z - 6.2], [SC.x + 3.2, SC.z - 5.4], [SC.x - 2.6, SC.z - 6.2]].find(([x, z]) => f(x, z)); if (c) jade.walkTo(c[0], c[1], 3.6); }; }
}
// ---------- 说话的老爹 / 小玉不在场：自动站到成龙身边的空地上（不会站进柜子、墙里） ----------
function npcSpotNear(n) {
  const p = player, base = Math.atan2(camera.position.x - p.pos.x, camera.position.z - p.pos.z);
  const tries = [0.9, -0.9, 0.5, -0.5, 1.4, -1.4, 0, 2.2, -2.2, Math.PI];
  for (const R of [2.0, 2.6, 1.6, 3.2]) for (const a of tries) {
    const x = p.pos.x + Math.sin(base + a) * R, z = p.pos.z + Math.cos(base + a) * R;
    if (!npcFree(x, z, 0.4)) continue;
    if (enemies.some(e => !e.dead && Math.hypot(e.pos.x - x, e.pos.z - z) < 1.0)) continue;
    const other = n === jade ? uncle : jade; if (other.rig.root.visible && Math.hypot(other.pos.x - x, other.pos.z - z) < 0.9) continue;
    return [x, z];
  }
  return [p.pos.x + Math.sin(base + 0.9) * 1.8, p.pos.z + Math.cos(base + 0.9) * 1.8];
}
{
  const _aim = Story.aim;
  Story.aim = function (L) {
    const n = L && !L.off && (L.who === 'jade' ? jade : L.who === 'uncle' ? uncle : null);
    if (n && MODE === 'story' && !(typeof SOUL !== 'undefined' && SOUL.form && AREA.name === 'spirit')) {
      const far = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) > 22;
      if (!n.rig.root.visible || far) { const [x, z] = npcSpotNear(n); n.place(x, z, Math.atan2(player.pos.x - x, player.pos.z - z)); n.spd = 0; }
    }
    return _aim.call(this, L);
  };
}
// ---------- 相机离人物太近（靠墙被拉回）时抬高、俯看，保证始终看得到成龙 ----------
{
  const _uc = updateCamera;
  updateCamera = function (dt) {
    _uc(dt);
    if (cutscene || player.view !== 'third' || window.__camO) return;
    const p = player, head = new THREE.Vector3(p.pos.x, 1.35 + p.pos.y, p.pos.z), d = camera.position.distanceTo(head);
    const want = d < 2.4 ? (2.4 - d) : 0; CAMFIX.lift += (want - CAMFIX.lift) * (1 - Math.exp(-dt * 10));
    if (CAMFIX.lift > 0.01) {
      let y = camera.position.y + CAMFIX.lift * 1.1; if (AREA.room && AREA.h) y = Math.min(y, AREA.h - 0.25);
      camera.position.y = y;
      const fwd = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
      camera.lookAt(head.clone().addScaledVector(fwd, 1.2 * (1 - Math.min(1, CAMFIX.lift / 1.6))).setY(head.y - 0.2 * CAMFIX.lift));
    }
  };
}
const CAMFIX = { lift: 0, t: 0 };
// ---------- 休眠敌人（大地图里的巡逻队）：玩家靠近或被打到之前只站岗 / 巡逻 ----------
function dormantTick(e, dt) {
  if (e.dead) { e.dormant = false; return e.update(dt); }
  const p = player, d = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
  if (d < (e.aggroR || 12) || e.hp < e.maxHp) { wakePack(e); return e.update(dt); }
  if (e.beast) { e.idle && e.idle(dt); return; }
  // 巡逻：在出生点附近慢慢走
  const P = e.patrol; let sp = 0;
  if (P) {
    if (!P.tgt || Math.hypot(P.tgt[0] - e.pos.x, P.tgt[1] - e.pos.z) < 0.4) { P.wait = (P.wait || 0) - dt; if (P.wait <= 0) { P.tgt = [P.x + rand(-P.r, P.r), P.z + rand(-P.r, P.r)]; P.wait = rand(1.5, 4); } }
    else { const dx = P.tgt[0] - e.pos.x, dz = P.tgt[1] - e.pos.z, dd = Math.hypot(dx, dz); sp = 1.3; e.pos.x += dx / dd * sp * dt; e.pos.z += dz / dd * sp * dt; e.yaw += angDiff(e.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-dt * 4)); }
  }
  e.ph = (e.ph || 0) + dt * sp * 3.2;
  e.anim.update(locoPose(e.target, e.base, sp, e.ph), dt);
  e.rig.root.position.copy(e.pos); e.rig.root.rotation.y = e.yaw; driveSkinEnemy(e, dt, true);
}
function wakePack(e) {
  if (!e.dormant) return; const pk = e.pack;
  for (const o of enemies) if (o.dormant && (o === e || (pk && o.pack === pk))) { o.dormant = false; o.cd = Math.max(o.cd || 0, rand(0.4, 1.2)); floatText(o.pos.clone().setY(2.3 * (o.scale || 1)), '！', '#ff5a3a', 30); }
}

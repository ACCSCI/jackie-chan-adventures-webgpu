import bpy, json, os, sys
from mathutils import Vector
FB = '/data/game/bl/fbx/'
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
# ---------- 角色模型 ----------
for name in ['jackie', 'uncle', 'jade', 'thug', 'khan', 'tohru']:
    clean()
    bpy.ops.import_scene.fbx(filepath=FB + name + '_skin.fbx')
    for a in list(bpy.data.actions): bpy.data.actions.remove(a)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; arm.animation_data_clear(); arm.name = name
    for o in bpy.data.objects:
        if o.type == 'MESH':
            o.name = name + '_mesh'
            for m in o.data.materials:
                m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
                if b: b.inputs['Base Color'].default_value = m.diffuse_color; b.inputs['Roughness'].default_value = 0.85; b.inputs['Metallic'].default_value = 0
                for n in list(m.node_tree.nodes):
                    if n.type == 'TEX_IMAGE': m.node_tree.nodes.remove(n)
    bpy.ops.export_scene.gltf(filepath=f'/data/game/bl/glb/{name}.glb', export_format='GLB', export_animations=False, export_skins=True, export_yup=True, export_apply=False, export_texcoords=False)
# ---------- 动作库 ----------
clean()
bpy.ops.import_scene.fbx(filepath=FB + 'jackie_skin.fbx')
for o in [o for o in bpy.data.objects if o.type == 'MESH']: bpy.data.objects.remove(o)
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; arm.name = 'rig'
keys = json.load(open('/data/game/bl/anims_ids.json'))
info = {}
for k in keys:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=FB + k + '.fbx')
    new = [o for o in bpy.data.objects if o not in before]
    src = [o for o in new if o.type == 'ARMATURE'][0]
    act = src.animation_data.action; act.name = k; act.use_fake_user = True
    for o in new: bpy.data.objects.remove(o)
    if not arm.animation_data: arm.animation_data_create()
    tr = arm.animation_data.nla_tracks.new(); tr.name = k
    st = tr.strips.new(k, int(act.frame_range[0]), act); tr.mute = True
    # 分析：末端位置（相对髋部，角色面朝 -Y）
    arm.animation_data.action = act
    if hasattr(arm.animation_data, 'action_slot') and act.slots: arm.animation_data.action_slot = act.slots[0]
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
    sc = bpy.context.scene; rows = []
    for f in range(f0, f1 + 1):
        sc.frame_set(f)
        P = lambda b: arm.matrix_world @ arm.pose.bones['mixamorig:' + b].head
        h = P('Hips'); r = {'f': f, 'hip': list(h)}
        for b in ['LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'Head']: e = P(b); r[b] = [e.x - h.x, e.y - h.y, e.z - h.z]
        rows.append(r)
    info[k] = {'f0': f0, 'f1': f1, 'rows': rows}
    arm.animation_data.action = None
json.dump(info, open('/data/game/bl/anim_info.json', 'w'))
for tr in arm.animation_data.nla_tracks: tr.mute = False
bpy.ops.export_scene.gltf(filepath='/data/game/bl/glb/anims.glb', export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_yup=True, export_force_sampling=True, export_frame_step=1, export_optimize_animation_size=True, export_def_bones=False)
print('DONE')

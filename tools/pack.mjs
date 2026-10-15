import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { resample, prune, dedup, meshopt, weld, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const D = '/data/game/bl/glb/';
for (const f of ['anims', 'jackie', 'uncle', 'jade', 'thug', 'khan', 'tohru']) {
  const doc = await io.read(D + f + '.glb');
  if (f === 'anims') {
    for (const a of doc.getRoot().listAnimations()) for (const ch of a.listChannels()) {
      const keep = ch.getTargetPath() === 'rotation' || (ch.getTargetPath() === 'translation' && /Hips$/.test(ch.getTargetNode().getName()));
      if (!keep) { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
    }
    for (const m of doc.getRoot().listMeshes()) m.dispose();
  }
  await doc.transform(dedup(), resample({ tolerance: 0.0004 }), prune(), weld(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(D + f + '.min.glb', doc);
}

// Offline Poly Haven rock preparation. Tools live outside the application package.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
const toolRequire = createRequire(path.resolve('artifacts/tools/package.json'));
const importTool = async (name) => import(pathToFileURL(toolRequire.resolve(name)).href);
const { NodeIO } = await importTool('@gltf-transform/core');
const { ALL_EXTENSIONS } = await importTool('@gltf-transform/extensions');
const { weld, unweld, compactPrimitive, prune, dedup, tangents, meshopt, textureCompress, getBounds } = await importTool('@gltf-transform/functions');
const { generateTangents } = await importTool('mikktspace');
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await importTool('meshoptimizer');
const { default: sharp } = await importTool('sharp');
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
});
const input = path.resolve('artifacts/model-source/boulder_01/boulder_01_2k.gltf');
const lod = process.argv.includes('--lod');
const targetTriangles = lod ? 4000 : 18000;
const outputName = lod ? 'ocean-crag-lod' : 'ocean-crag';
const output = path.resolve(`public/models/${outputName}.glb`);
const doc = await io.read(input);
const triangleCount = (document) => document.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((s,p) => s + p.getIndices().getCount()/3, 0), 0);
const originalTriangles = triangleCount(doc);
await doc.transform(weld());
for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
  const positions = primitive.getAttribute('POSITION').getArray();
  const normals = primitive.getAttribute('NORMAL').getArray();
  const uv = primitive.getAttribute('TEXCOORD_0').getArray();
  const attributes = new Float32Array(positions.length/3*5);
  for(let i=0;i<positions.length/3;i++) attributes.set([normals[i*3],normals[i*3+1],normals[i*3+2],uv[i*2],uv[i*2+1]],i*5);
  const [indices, error] = MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(primitive.getIndices().getArray()), positions,3, attributes,5,[0.1,0.1,0.1,0.5,0.5],null,targetTriangles*3,0.04,['Permissive']);
  primitive.getIndices().setArray(indices);
  compactPrimitive(primitive);
  console.log('Attribute-aware simplification error:', error);
}
await doc.transform(unweld(), tangents({generateTangents}), weld(), dedup(), prune());
for (const material of doc.getRoot().listMaterials()) {
  material.setDoubleSided(false).setMetallicFactor(0).setRoughnessFactor(1);
  // Poly Haven ARM already includes occlusion in red, roughness in green.
  material.setOcclusionTexture(material.getMetallicRoughnessTexture());
}
await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: lod ? [1024,1024] : [2048, 2048], quality: 87 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(output, doc);
const checked = await io.read(output);
const bounds = getBounds(checked.getRoot().listScenes()[0]);
const report = { output: `/models/${outputName}.glb`, sizeBytes: (await fs.stat(output)).size, originalTriangles, triangles: triangleCount(checked), bounds, dimensions: bounds.max.map((v,i) => v-bounds.min[i]), textures: checked.getRoot().listTextures().map(t=>({name:t.getName(),format:t.getMimeType(),bytes:t.getImage().byteLength})), decoder: 'Three.js MeshoptDecoder from three/addons/libs/meshopt_decoder.module.js', source: 'https://polyhaven.com/a/boulder_01', license: 'CC0 1.0 Universal' };
await fs.writeFile(`artifacts/model-${outputName}-report.json`, JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

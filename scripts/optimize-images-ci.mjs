/**
 * optimize-images-ci.mjs
 * Versió per a GitHub Actions — usa process.cwd() en lloc de rutes relatives.
 * Executa: node scripts/optimize-images-ci.mjs
 */

import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, basename, dirname } from "path";

const ROOT = process.cwd();

const TARGETS = [
  { dir: "public/images/club",       width: 1920, quality: 82 },
  { dir: "public/images/equips",     width: 1200, quality: 80 },
  { dir: "public/images/club/junta", width: 400,  quality: 78 },
  { dir: "public/images/sponsors",   width: 400,  quality: 85 },
  { dir: "public/images/historia",   width: 1200, quality: 88 },
];

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

function webpPath(filePath) {
  const dir = dirname(filePath);
  const name = basename(filePath, extname(filePath));
  return join(dir, `${name}.webp`);
}

async function isNewer(src, dest) {
  try {
    const [srcStat, destStat] = await Promise.all([stat(src), stat(dest)]);
    return destStat.mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false;
  }
}

async function getImages(dir) {
  let files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && EXTENSIONS.has(extname(e.name).toLowerCase())) {
        files.push(join(dir, e.name));
      }
    }
    console.log(`📂 ${dir}: ${files.length} imatge(s) trobada(es)`);
  } catch {
    console.warn(`⚠️  Carpeta no trobada: ${dir}`);
  }
  return files;
}

let totalOriginal = 0;
let totalOptimized = 0;
let skipped = 0;
let processed = 0;

for (const { dir, width, quality } of TARGETS) {
  const absDir = join(ROOT, dir);
  const images = await getImages(absDir);

  for (const src of images) {
    const dest = webpPath(src);

    if (await isNewer(src, dest)) {
      skipped++;
      continue;
    }

    const originalSize = (await stat(src)).size;

    try {
      const { size: optimizedSize } = await sharp(src)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(dest);

      const saving = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);
      console.log(
        `✅ ${basename(src).padEnd(40)} ${(originalSize / 1024).toFixed(0).padStart(5)} KB → ${(optimizedSize / 1024).toFixed(0).padStart(4)} KB  (-${saving}%)`
      );

      totalOriginal += originalSize;
      totalOptimized += optimizedSize;
      processed++;
    } catch (err) {
      console.error(`❌ Error processant ${src}: ${err.message}`);
    }
  }
}

console.log("");
console.log("─".repeat(60));
console.log(`Processades : ${processed} imatges`);
console.log(`Omeses      : ${skipped} (ja actualitzades)`);
if (processed > 0) {
  const totalSaving = (((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1);
  console.log(`Original    : ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimitzat  : ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Estalvi     : ${totalSaving}% 🎉`);
}

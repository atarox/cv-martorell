import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const INPUT_DIR = "./logos-clubs";
const OUTPUT_DIR = "./logos-transparentes";

// Determina si un píxel es "casi blanco"
function esBlanco(r, g, b, umbral = 245) {
  return r >= umbral && g >= umbral && b >= umbral;
}

async function quitarFondo(inputFile, outputFile) {
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  const visitado = new Uint8Array(width * height);
  const cola = [];

  function push(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    const pos = y * width + x;
    if (visitado[pos]) return;

    const idx = pos * 4;

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (!esBlanco(r, g, b)) return;

    visitado[pos] = 1;
    cola.push([x, y]);
  }

  // Buscar blancos desde todos los bordes
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }

  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  // Flood fill
  while (cola.length) {
    const [x, y] = cola.pop();

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Hacer transparente SOLO el fondo conectado al borde
  for (let pos = 0; pos < visitado.length; pos++) {
    if (!visitado[pos]) continue;

    const idx = pos * 4;
    data[idx + 3] = 0;
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputFile);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = await readdir(INPUT_DIR);

  const imagenes = files.filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );

  console.log(`Encontradas ${imagenes.length} imágenes`);

  for (const file of imagenes) {
    const input = path.join(INPUT_DIR, file);

    const nombre = path.parse(file).name;
    const output = path.join(
      OUTPUT_DIR,
      `${nombre}.png`
    );

    try {
      await quitarFondo(input, output);
      console.log(`✅ ${file}`);
    } catch (err) {
      console.log(`❌ ${file}: ${err.message}`);
    }
  }

  console.log(`\nTerminado. PNGs en ${OUTPUT_DIR}`);
}

main().catch(console.error);
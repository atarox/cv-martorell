// scrape-logos-clubs-v2.mjs
//
// Descarga el logo de cada club listado en la competició, leyendo
// directamente src + alt de cada <img> del listado_clubs.php
// (no hace falta visitar la ficha de cada club por separado).
//
// Uso:
//   node scrape-logos-clubs-v2.mjs
//
// Requisitos: Node 18+ (usa fetch nativo). Sin dependencias externas.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const LISTADO_URL =
  "https://resultadosvoleibol.isquad.es/listado_clubs.php?seleccion=0&id=4035&id_ambito=0&id_territorial=17&id_superficie=1&iframe=0&id_categoria=200067&id_competicion=1577";

const OUTPUT_DIR = "./logos-clubs";
const DELAY_MS = 250; // pausa entre descargas de imagen

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CVMartorell-LogoScraper/1.0)",
  "Accept-Language": "ca,es;q=0.9",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(nom) {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizarUrl(src) {
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `https://resultadosvoleibol.isquad.es${src}`;
  return src;
}

// Extreu un atribut (src, alt...) sense importar l'ordre ni el tipus de
// cometes, i evitant falsos positius com onerror="this.src='...'"
// (exigeix que vagi precedit d'un espai o de l'inici dels atributs).
function extreureAtribut(attrsText, nom) {
  const re = new RegExp(`(?:^|\\s)${nom}\\s*=\\s*(["'])((?:(?!\\1).)*)\\1`, "i");
  const m = attrsText.match(re);
  return m ? m[2] : null;
}

async function getClubsAmbLogo() {
  const res = await fetch(LISTADO_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`Listado HTTP ${res.status}`);
  const html = await res.text();

  // DEBUG: guarda el HTML crudo tal cual llega, per poder inspeccionar-lo
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "_debug.html"), html);
  console.log(`(debug) HTML rebut: ${html.length} caràcters`);

  const tagRe = /<img\b([^>]*)>/gi;
  const clubs = [];
  const vistos = new Set();
  let tm;
  let totalImgs = 0;

  while ((tm = tagRe.exec(html))) {
    totalImgs++;
    const attrs = tm[1];

    const src = extreureAtribut(attrs, "src");
    const altRaw = extreureAtribut(attrs, "alt");

    if (!src || !altRaw) continue;

    const nom = decodeEntities(altRaw).trim();

    // descarta el logo genèric "sin escudo" i el logo de la federació
    if (!nom || src.includes("sinescudo") || src.includes("/images/logo.png")) continue;

    if (!vistos.has(nom)) {
      vistos.add(nom);
      clubs.push({ nom, src: normalizarUrl(src) });
    }
  }

  console.log(`(debug) etiquetes <img> trobades en total: ${totalImgs}\n`);

  return clubs;
}

async function descarregarImatge(url, destPath) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Imatge HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log("Obtenint llistat de clubs i logos...");
  const clubs = await getClubsAmbLogo();
  console.log(`${clubs.length} clubs amb logo trobats.\n`);

  const resultats = [];

  for (const [i, club] of clubs.entries()) {
    const slug = slugify(club.nom);
    process.stdout.write(`[${i + 1}/${clubs.length}] ${club.nom} `);

    try {
      const ext = path.extname(new URL(club.src).pathname) || ".jpg";
      const fitxer = `${slug}${ext}`;
      await descarregarImatge(club.src, path.join(OUTPUT_DIR, fitxer));

      console.log(`→ ${fitxer}`);
      resultats.push({ nom: club.nom, slug, logo: fitxer, src: club.src, ok: true });
    } catch (err) {
      console.log(`→ ERROR: ${err.message}`);
      resultats.push({ nom: club.nom, slug, logo: null, src: club.src, ok: false, error: String(err) });
    }

    await sleep(DELAY_MS);
  }

  await writeFile(
    path.join(OUTPUT_DIR, "_index.json"),
    JSON.stringify(resultats, null, 2)
  );

  const ok = resultats.filter((r) => r.ok).length;
  console.log(`\nFet: ${ok}/${clubs.length} logos descarregats a ${OUTPUT_DIR}/`);
  console.log(`Índex complet a ${OUTPUT_DIR}/_index.json`);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});

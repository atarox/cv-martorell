// export-isquad-detalls.mjs
//
// Llegeix isquad-export/martorell-equips.json, que conte una fila per
// combinacio equip + competicio + fase descoberta, i descarrega els detalls
// de TOTES les fases trobades per a cada equip.
//
// Genera:
//   - fases.csv
//   - classificacions.csv
//   - partits.csv
//   - jugadors.csv
//   - detalls-per-equip.json
//
// La classificacio i els partits es guarden per fase.
// La plantilla es consulta una sola vegada per id_equipo per evitar duplicats.
//
// Us:
//   node export-isquad-detalls.mjs
//
// Darrere la VPN/proxy corporatiu, nomes si falla la validacio TLS:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node export-isquad-detalls.mjs
//
// Requisits: Node.js 18+. Sense dependencies externes.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://resultadosvoleibol.isquad.es";
const OUTPUT_DIR = "./isquad-export";
const INPUT_FILE = path.join(OUTPUT_DIR, "martorell-equips.json");
const DELAY_MS = 300;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CVMartorell-Detalls/4.0)",
  "Accept-Language": "ca,es;q=0.9",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(value) {
  let text = String(value ?? "");

  // Dues passades permeten tractar entitats escapades una o dues vegades.
  for (let i = 0; i < 2; i++) {
    text = text
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&#x27;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&nbsp;/gi, " ");
  }

  return text;
}

function stripTags(value) {
  return decodeEntities(String(value ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function htmlAttr(attrs, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(["'])((?:(?!\\1).)*)\\1`,
    "i",
  );
  const match = String(attrs ?? "").match(regex);
  return match ? decodeEntities(match[2]) : null;
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.join(";");
  const lines = rows.map((row) =>
    columns.map((column) => csvCell(row[column])).join(";"),
  );

  // BOM UTF-8 i CRLF per obrir correctament amb Excel.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

function buildEquipUrl(idEquipo, idFase) {
  const url = new URL("/equipo.php", BASE_URL);
  url.searchParams.set("seleccion", "0");
  url.searchParams.set("id_equipo", String(idEquipo));
  url.searchParams.set("id", String(idFase));
  return url.toString();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: HEADERS,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

function parseClasificacio(html) {
  const rows = [];
  const match = html.match(
    /id=['"]clasificacion['"][\s\S]*?(<table[\s\S]*?<\/table>)/i,
  );
  if (!match) return rows;

  const trMatches = [...match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (td) => stripTags(td[1]),
    );

    if (cells.length >= 8 && /^\d+$/.test(cells[0])) {
      rows.push({
        pos: Number.parseInt(cells[0], 10),
        equip_classificacio: cells[2] || cells[1] || "",
        punts: Number.parseInt(cells[3], 10) || 0,
        jug: Number.parseInt(cells[4], 10) || 0,
        gan: Number.parseInt(cells[5], 10) || 0,
        per: Number.parseInt(cells[7], 10) || 0,
      });
    }
  }

  return rows;
}

function parsePartits(html) {
  const partits = [];
  const match = html.match(
    /id=['"]partidos['"][\s\S]*?(<table[\s\S]*?<\/table>)/i,
  );
  if (!match) return partits;

  const trMatches = [...match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (tdMatches.length < 4) continue;

    const namesDiv = tdMatches[0][1].match(
      /class=['"]nombres-equipos['"][^>]*>([\s\S]*?)<\/div>/i,
    );
    if (!namesDiv) continue;

    const teamLinks = [
      ...namesDiv[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi),
    ];
    if (teamLinks.length < 2) continue;

    const local = stripTags(teamLinks[0][1]);
    const visitant = stripTags(teamLinks[1][1]);
    const marcadorText = stripTags(tdMatches[1][1]);
    const marcadorMatch = marcadorText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const data = tdMatches[7] ? stripTags(tdMatches[7][1]) : "";

    partits.push({
      local,
      visitant,
      marcador: marcadorMatch ? `${marcadorMatch[1]}-${marcadorMatch[2]}` : "",
      data,
      estat: /Finalizado/i.test(tr[1]) ? "jugat" : "pendent",
    });
  }

  return partits;
}

function parsePlantilla(html) {
  const jugadors = [];
  const match = html.match(
    /id=['"]plantilla['"][\s\S]*?(<table[\s\S]*?<\/table>)/i,
  );
  if (!match) return jugadors;

  const trMatches = [...match[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  let seccioActual = "";

  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];

    if (tdMatches.length === 1) {
      const text = stripTags(tdMatches[0][1]);
      if (text) seccioActual = text;
      continue;
    }

    if (tdMatches.length < 4) continue;

    const primeraCell = tdMatches[0][1];
    const nom = stripTags(primeraCell);
    if (!nom || /^(jugadores|invitados|tecnicos|técnicos)$/i.test(nom)) continue;

    const imageTag = primeraCell.match(/<img\b([^>]*)>/i);
    const fotoRaw = imageTag ? htmlAttr(imageTag[1], "src") : "";
    let foto = fotoRaw || "";

    if (foto) {
      try {
        foto = new URL(foto, BASE_URL).toString();
      } catch {
        // Conserva el valor original si no es pot normalitzar.
      }
    }

    jugadors.push({
      seccio: seccioActual,
      nom,
      perfil: stripTags(tdMatches[1][1]),
      edat: stripTags(tdMatches[2][1]),
      gols: tdMatches[3] ? stripTags(tdMatches[3][1]) : "",
      foto,
    });
  }

  return jugadors;
}

function normalizeInput(rows) {
  const normalized = [];
  const seen = new Set();

  for (const row of rows) {
    const idEquipo = String(row?.id_equipo ?? "").trim();
    const idFase = String(row?.id ?? row?.id_fase ?? "").trim();
    if (!idEquipo || !idFase) continue;

    const item = {
      id_categoria: String(row.id_categoria ?? "").trim(),
      categoria: String(row.categoria ?? "").trim(),
      id_competicion: String(row.id_competicion ?? "").trim(),
      competicion: String(row.competicion ?? "").trim(),
      id: idFase,
      descripcion_fase: String(row.descripcion_fase ?? "").trim(),
      slug_fase: String(row.slug_fase ?? "").trim(),
      equipo: String(row.equipo ?? row.equip ?? "").trim(),
      id_equipo: idEquipo,
      url_equipo: buildEquipUrl(idEquipo, idFase),
      url_competicion: String(row.url_competicion ?? "").trim(),
    };

    // Una mateixa fase pot aparèixer més d'una vegada en el JSON d'entrada.
    const key = `${item.id_equipo}|${item.id_competicion}|${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
  }

  return normalized;
}

function contextFase(item) {
  return {
    id_categoria: item.id_categoria,
    categoria: item.categoria,
    id_competicion: item.id_competicion,
    competicion: item.competicion,
    id_fase: item.id,
    descripcion_fase: item.descripcion_fase,
    slug_fase: item.slug_fase,
    id_equipo: item.id_equipo,
    equip: item.equipo,
    url_equipo: item.url_equipo,
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const inputText = await readFile(INPUT_FILE, "utf8");
  const input = JSON.parse(inputText.replace(/^\uFEFF/, ""));

  if (!Array.isArray(input)) {
    throw new Error(`${INPUT_FILE} no conte un array JSON`);
  }

  const fasesEntrada = normalizeInput(input);
  const equipsUnics = new Set(fasesEntrada.map((item) => item.id_equipo));

  console.log(`${fasesEntrada.length} fases a processar de ${equipsUnics.size} equips`);
  console.log(`Entrada: ${INPUT_FILE}\n`);

  const fases = [];
  const classificacions = [];
  const partits = [];
  const jugadors = [];
  const detallsPerEquip = new Map();
  const plantillaProcessada = new Set();

  for (const [index, item] of fasesEntrada.entries()) {
    const faseLabel = item.descripcion_fase || `fase ${item.id}`;
    process.stdout.write(
      `[${index + 1}/${fasesEntrada.length}] ${item.equipo} | ` +
      `${item.competicion} | ${faseLabel} `,
    );

    const context = contextFase(item);

    try {
      // S'utilitza l'id de fase descobert pel primer script. No es resol
      // nomes una fase actual: es processen totes les files d'entrada.
      const html = await fetchHtml(item.url_equipo);
      const rowsClassificacio = parseClasificacio(html);
      const rowsPartits = parsePartits(html);

      const faseRow = {
        ...context,
        files_classificacio: rowsClassificacio.length,
        partits: rowsPartits.length,
        partits_jugats: rowsPartits.filter((row) => row.estat === "jugat").length,
        partits_pendents: rowsPartits.filter((row) => row.estat === "pendent").length,
      };
      fases.push(faseRow);

      for (const row of rowsClassificacio) {
        classificacions.push({ ...context, ...row });
      }

      for (const row of rowsPartits) {
        partits.push({ ...context, ...row });
      }

      // La plantilla no depen de la classificacio de cada fase. Es consulta
      // una sola vegada per equip, emprant la primera fase accessible.
      if (!plantillaProcessada.has(item.id_equipo)) {
        const rowsPlantilla = parsePlantilla(html);
        for (const row of rowsPlantilla) {
          jugadors.push({
            id_equipo: item.id_equipo,
            equip: item.equipo,
            id_categoria: item.id_categoria,
            categoria: item.categoria,
            id_competicion: item.id_competicion,
            competicion: item.competicion,
            id_fase_origen: item.id,
            ...row,
          });
        }
        plantillaProcessada.add(item.id_equipo);
      }

      if (!detallsPerEquip.has(item.id_equipo)) {
        detallsPerEquip.set(item.id_equipo, {
          id_equipo: item.id_equipo,
          equip: item.equipo,
          categoria: item.categoria,
          fases: [],
        });
      }

      detallsPerEquip.get(item.id_equipo).fases.push({
        ...faseRow,
        classificacio: rowsClassificacio,
        partits: rowsPartits,
      });

      console.log(
        `-> ${rowsClassificacio.length} classificacio, ` +
        `${rowsPartits.length} partits`,
      );
    } catch (error) {
      fases.push({
        ...context,
        files_classificacio: 0,
        partits: 0,
        partits_jugats: 0,
        partits_pendents: 0,
        error: error.message,
      });
      console.log(`-> ERROR: ${error.message}`);
    }

    await sleep(DELAY_MS);
  }

  const faseColumns = [
    "id_categoria", "categoria", "id_competicion", "competicion",
    "id_fase", "descripcion_fase", "slug_fase", "id_equipo", "equip",
    "files_classificacio", "partits", "partits_jugats", "partits_pendents",
    "url_equipo", "error",
  ];

  const classificacioColumns = [
    "id_categoria", "categoria", "id_competicion", "competicion",
    "id_fase", "descripcion_fase", "slug_fase", "id_equipo", "equip",
    "pos", "equip_classificacio", "punts", "jug", "gan", "per",
    "url_equipo",
  ];

  const partitColumns = [
    "id_categoria", "categoria", "id_competicion", "competicion",
    "id_fase", "descripcion_fase", "slug_fase", "id_equipo", "equip",
    "local", "visitant", "marcador", "data", "estat", "url_equipo",
  ];

  const jugadorColumns = [
    "id_equipo", "equip", "id_categoria", "categoria", "id_competicion",
    "competicion", "id_fase_origen", "seccio", "nom", "perfil", "edat",
    "gols", "foto",
  ];

  await writeFile(
    path.join(OUTPUT_DIR, "fases.csv"),
    toCsv(fases, faseColumns),
    "utf8",
  );

  await writeFile(
    path.join(OUTPUT_DIR, "classificacions.csv"),
    toCsv(classificacions, classificacioColumns),
    "utf8",
  );

  await writeFile(
    path.join(OUTPUT_DIR, "partits.csv"),
    toCsv(partits, partitColumns),
    "utf8",
  );

  await writeFile(
    path.join(OUTPUT_DIR, "jugadors.csv"),
    toCsv(jugadors, jugadorColumns),
    "utf8",
  );

  const jsonOutput = [...detallsPerEquip.values()];
  await writeFile(
    path.join(OUTPUT_DIR, "detalls-per-equip.json"),
    JSON.stringify(jsonOutput, null, 2) + "\n",
    "utf8",
  );

  console.log("\nResultat");
  console.log(`  Equips: ${equipsUnics.size}`);
  console.log(`  Fases: ${fases.length}`);
  console.log(`  Files de classificacio: ${classificacions.length}`);
  console.log(`  Partits: ${partits.length}`);
  console.log(`  Jugadors: ${jugadors.length}`);
  console.log(`  Sortida: ${OUTPUT_DIR}/`);
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});

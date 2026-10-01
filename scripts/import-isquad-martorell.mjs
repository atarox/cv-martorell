// export-isquad-csv.mjs (v4)
// Jerarquia correcta: categoria -> EMBED_COMPETICIONES -> competicion_completa -> fases/equipos.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://resultadosvoleibol.isquad.es";
const OUTPUT_DIR = "./isquad-export";
const ID_TEMP = "2627";
const ID_TERRITORIAL = "17";
const ID_SUPERFICIE = "1";
const DELAY_MS = 300;
const CLUB_PATTERN = /martorell/i;
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; CVMartorell-Export/4.0)",
  "Accept-Language": "ca,es;q=0.9",
};

const CATEGORIES = {
  "350": "CAMPIONAT DE CATALUNYA DE PRIMERA DIVISIO SENIOR",
  "351": "CAMPIONAT DE CATALUNYA DE SEGONA DIVISIO SENIOR",
  "352": "CAMPIONAT DE CATALUNYA DE TERCERA DIVISIO SENIOR",
  "353": "CAMPIONAT DE CATALUNYA DE QUARTA DIVISIO SENIOR",
  "354": "CAMPIONAT DE CATALUNYA DE PRIMERA DIVISIO JUNIOR",
  "355": "CAMPIONAT DE CATALUNYA DE SEGONA DIVISIO JUNIOR",
  "356": "CAMPIONAT DE CATALUNYA DE PRIMERA DIVISIO JUVENIL",
  "357": "CAMPIONAT DE CATALUNYA DE SEGONA DIVISIO JUVENIL",
  "358": "CAMPIONAT DE CATALUNYA DE TERCERA DIVISIO JUVENIL",
  "359": "CAMPIONAT DE CATALUNYA DE QUARTA DIVISIO JUVENIL",
  "360": "CAMPIONAT DE CATALUNYA DE PRIMERA DIVISIO CADET",
  "361": "CAMPIONAT DE CATALUNYA DE SEGONA DIVISIO CADET",
  "362": "CAMPIONAT DE CATALUNYA DE TERCERA DIVISIO CADET",
  "363": "CAMPIONAT DE CATALUNYA DE QUARTA DIVISIO CADET",
  "364": "CAMPIONAT DE CATALUNYA DE JUVENIL PREFERENT",
  "365": "CAMPIONAT DE CATALUNYA DE CADET PREFERENT",
  "366": "CAMPIONAT DE CATALUNYA DE INFANTIL PREFERENT",
  "367": "CAMPIONAT DE CATALUNYA DE PRIMERA DIVISIO INFANTIL",
  "368": "CAMPIONAT DE CATALUNYA DE SEGONA DIVISIO INFANTIL",
  "369": "CAMPIONAT DE CATALUNYA ALEVI (3X3)",
  "373": "CAMPIONAT DE CATALUNYA AMATEUR 1A DIV",
  "374": "CAMPIONAT DE CATALUNYA AMATEUR 2A DIV",
  "385": "LLIGUES CATALANES",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(value) {
  let s = String(value ?? "");
  for (let i = 0; i < 2; i++) {
    s = s.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
      .replace(/&#0*39;|&#x27;|&apos;/gi, "'").replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">").replace(/&nbsp;/gi, " ");
  }
  return s;
}

function stripTags(value) {
  return decodeEntities(String(value ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

function htmlAttr(attrs, name) {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])((?:(?!\\1).)*)\\1`, "i"));
  return match ? decodeEntities(match[2]) : null;
}

function slug(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function csvCell(value) {
  const s = value == null ? "" : String(value);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  return "\uFEFF" + [columns.join(";"), ...rows.map((row) =>
    columns.map((column) => csvCell(row[column])).join(";"))].join("\r\n");
}

async function fetchHtml(url) {
  const response = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

function extractJsValue(html, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const assignment = new RegExp(`(?:(?:const|let|var)\\s+${escaped}|window\\.${escaped})\\s*=`, "i").exec(html);
  if (!assignment) return null;
  const from = assignment.index + assignment[0].length;
  const starts = [html.indexOf("[", from), html.indexOf("{", from)].filter((x) => x >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts), open = html[start], close = open === "[" ? "]" : "}";
  let depth = 0, quote = null, escapedChar = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (escapedChar) escapedChar = false;
      else if (ch === "\\") escapedChar = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) return html.slice(start, i + 1);
  }
  return null;
}

function parseEmbedCompeticiones(html) {
  const raw = extractJsValue(html, "EMBED_COMPETICIONES");
  if (!raw) return [];
  let value;
  try { value = JSON.parse(raw); }
  catch { value = Function(`"use strict"; return (${raw});`)(); }
  return Array.isArray(value) ? value : Object.values(value ?? {});
}

function categoryUrl(idCategoria) {
  const url = new URL("/competicion.php", BASE_URL);
  Object.entries({ seleccion: "0", id_ambito: "0", id_territorial: ID_TERRITORIAL,
    id_superficie: ID_SUPERFICIE, id_temp: ID_TEMP, id_categoria: idCategoria })
    .forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function fullCompetitionUrl(competition, idGrupReal) {
  const url = new URL("/competicion_completa.php", BASE_URL);
  Object.entries({ seleccion: "0", id: idGrupReal, id_ambito: "0",
    id_territorial: ID_TERRITORIAL, id_superficie: ID_SUPERFICIE, iframe: "0",
    id_categoria: competition.id_categoria, id_competicion: competition.id_competicion })
    .forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function competitionAutoUrl(idCategoria, idCompeticion) {
  const url = new URL("/competicion.php", BASE_URL);
  Object.entries({ seleccion: "0", id_ambito: "0", id_territorial: ID_TERRITORIAL,
    id_superficie: ID_SUPERFICIE, id_temp: ID_TEMP,
    id_categoria: idCategoria, id_competicion: idCompeticion })
    .forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

// competicion.php, donat id_categoria+id_competicion (sense id ni id_equipo),
// s'autoresol al primer grup real de la competició. En traiem el "id" bo
// llegint l'enllaç de text "Resultados" (no "RESULTADOS GLOBALES").
async function resoldreGrupReal(idCategoria, idCompeticion) {
  const html = await fetchHtml(competitionAutoUrl(idCategoria, idCompeticion));

  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let am;
  while ((am = aRe.exec(html))) {
    const text = stripTags(am[2]);
    if (/^resultados$/i.test(text)) {
      const href = htmlAttr(am[1], "href");
      if (href && href.includes("competicion.php")) {
        const qs = href.split("?")[1];
        const id = new URLSearchParams(qs).get("id");
        if (id) return id;
      }
    }
  }
  return null;
}

async function getCategoryCompetitions(idCategoria, categoria) {
  const html = await fetchHtml(categoryUrl(idCategoria));
  const embedded = parseEmbedCompeticiones(html);
  if (!embedded.length) {
    await writeFile(path.join(OUTPUT_DIR, `_debug-categoria-${idCategoria}.html`), html, "utf8");
    return [];
  }

  const rows = [];
  for (const raw of embedded) {
    // IMPORTANTE: raw.id es el ID de COMPETICION, no el ID de fase.
    const idCompeticion = String(raw.id ?? raw.id_competicion ?? "").trim();
    const competicion = decodeEntities(String(raw.nombre ?? raw.name ?? raw.competicion ?? "").trim());
    if (!idCompeticion) continue;

    const row = { id_categoria: idCategoria, categoria, id_competicion: idCompeticion, competicion };

    let idGrupReal = null;
    try {
      idGrupReal = await resoldreGrupReal(idCategoria, idCompeticion);
    } catch (err) {
      console.log(`\n   (avis) no s'ha pogut resoldre grup real de ${idCompeticion}: ${err.message}`);
    }
    await sleep(DELAY_MS);

    if (!idGrupReal) {
      console.log(`\n   (avis) ${idCompeticion} | ${competicion} -> sense grup real, s'omet`);
      continue;
    }

    rows.push({ ...row, url_competicion: fullCompetitionUrl(row, idGrupReal) });
  }

  return rows;
}

function scrapeCompetition(html, competition) {
  const phases = new Map();
  const martorell = [];
  const seenClub = new Set();
  let currentPhase = "";

  // Mantiene el orden del documento para asociar cada enlace al encabezado de fase/grupo anterior.
  const tokenRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>|<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = tokenRegex.exec(html))) {
    if (match[1]) {
      const heading = stripTags(match[2]);
      if (heading && !/^grupos de la competici[oó]n$/i.test(heading) &&
          !/^resultados de la competici[oó]n$/i.test(heading)) currentPhase = heading;
      continue;
    }

    const href = htmlAttr(match[3], "href");
    if (!href || !/equipo\.php(?:\?|$)/i.test(href)) continue;
    let teamUrl;
    try { teamUrl = new URL(href, BASE_URL); } catch { continue; }

    const idEquipo = teamUrl.searchParams.get("id_equipo") || "";
    const idFase = teamUrl.searchParams.get("id") || "";
    const equipo = stripTags(match[4]);
    if (!idEquipo || !idFase || !equipo) continue;

    if (!phases.has(idFase)) {
      phases.set(idFase, {
        id_categoria: competition.id_categoria,
        categoria: competition.categoria,
        id_competicion: competition.id_competicion,
        competicion: competition.competicion,
        id: idFase,
        descripcion_fase: currentPhase,
        slug_fase: slug(currentPhase),
        url_competicion: competition.url_competicion,
      });
    } else if (!phases.get(idFase).descripcion_fase && currentPhase) {
      phases.get(idFase).descripcion_fase = currentPhase;
      phases.get(idFase).slug_fase = slug(currentPhase);
    }

    if (!CLUB_PATTERN.test(equipo)) continue;
    const key = `${idEquipo}|${idFase}`;
    if (seenClub.has(key)) continue;
    seenClub.add(key);
    martorell.push({
      ...phases.get(idFase), equipo, id_equipo: idEquipo,
      url_equipo: teamUrl.toString(),
    });
  }

  return { phases: [...phases.values()], martorell };
}

function dedupe(rows, keyFn) {
  const map = new Map();
  for (const row of rows) if (!map.has(keyFn(row))) map.set(keyFn(row), row);
  return [...map.values()];
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const competitions = [];

  console.log(`Temporada ${ID_TEMP}: leyendo categorias y EMBED_COMPETICIONES`);
  for (const [idCategoria, categoria] of Object.entries(CATEGORIES)) {
    process.stdout.write(`${idCategoria} - ${categoria} `);
    try {
      const found = await getCategoryCompetitions(idCategoria, categoria);
      competitions.push(...found);
      console.log(`-> ${found.length} competiciones`);
      for (const item of found) console.log(`   ${item.id_competicion} | ${item.competicion}`);
    } catch (error) { console.log(`-> ERROR: ${error.message}`); }
    await sleep(DELAY_MS);
  }

  const finalCompetitions = dedupe(competitions, (r) => `${r.id_categoria}|${r.id_competicion}`);
  const phases = [], clubRows = [];
  console.log("\nScrapeando todas las competiciones, incluidas FEM y MASC");

  for (const [index, competition] of finalCompetitions.entries()) {
    process.stdout.write(`[${index + 1}/${finalCompetitions.length}] ${competition.id_competicion} | ${competition.competicion} `);
    try {
      const html = await fetchHtml(competition.url_competicion);
      const result = scrapeCompetition(html, competition);
      phases.push(...result.phases);
      clubRows.push(...result.martorell);
      console.log(`-> ${result.phases.length} fases, ${result.martorell.length} Martorell`);
      for (const row of result.martorell) {
        console.log(`   ${row.equipo} | id_equipo=${row.id_equipo} | id_fase=${row.id}`);
      }
    } catch (error) { console.log(`-> ERROR: ${error.message}`); }
    await sleep(DELAY_MS);
  }

  const finalPhases = dedupe(phases, (r) => `${r.id_categoria}|${r.id_competicion}|${r.id}`);
  const finalClub = dedupe(clubRows, (r) => `${r.id_categoria}|${r.id_competicion}|${r.id}|${r.id_equipo}`);

  const competitionColumns = ["id_categoria", "categoria", "id_competicion", "competicion", "url_competicion"];
  const phaseColumns = ["id_categoria", "categoria", "id_competicion", "competicion", "id", "descripcion_fase", "slug_fase", "url_competicion"];
  const clubColumns = [...phaseColumns, "equipo", "id_equipo", "url_equipo"];

  await writeFile(path.join(OUTPUT_DIR, "competicions.csv"), toCsv(finalCompetitions, competitionColumns), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "competicions-fases.csv"), toCsv(finalPhases, phaseColumns), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "martorell-equips.csv"), toCsv(finalClub, clubColumns), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "martorell-equips.json"), JSON.stringify(finalClub, null, 2) + "\n", "utf8");

  console.log(`\nCompeticiones: ${finalCompetitions.length}`);
  console.log(`Fases descubiertas: ${finalPhases.length}`);
  console.log(`Coincidencias MARTORELL: ${finalClub.length}`);
  console.log(`Salida: ${OUTPUT_DIR}/`);
}

main().catch((error) => { console.error("Error fatal:", error); process.exitCode = 1; });

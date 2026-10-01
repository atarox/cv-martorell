#!/usr/bin/env node

// Dashboard setmanal de partits del Club Voleibol Martorell.
// Fonts: partits.csv + detalls-per-equip.json
// Versio Canva-safe: formes simples, fonts Arial, sense ombres ni arcs complexos.
// Dependencia: npm install pptxgenjs
//
// Us habitual:
// node genera-ppt-partits-setmana-dashboard.mjs --logo ./android-chrome-192x192.png --sponsors ./faldon_sponsors.png
//
// Setmana concreta:
// node genera-ppt-partits-setmana-dashboard.mjs --data 2026-09-30 --logo ./android-chrome-192x192.png

import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Club Voleibol Martorell";
pptx.company = "Club Voleibol Martorell";
pptx.subject = "Partits de la setmana";
pptx.title = "Partits de la setmana";
pptx.lang = "ca-ES";
pptx.theme = {
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  lang: "ca-ES",
};
pptx.defineLayout({ name: "WIDE_EXACT", width: 13.333, height: 7.5 });
pptx.layout = "WIDE_EXACT";

const C = {
  bg: "03070C",
  panel: "09141E",
  panelAlt: "0D1E2B",
  sky: "70D7F2",
  neon: "00D9FF",
  neonSoft: "1F8FA8",
  pink: "FF69B1",
  pinkSoft: "7A3155",
  white: "F4FBFF",
  muted: "91AABA",
  darkMuted: "456170",
  home: "0C2938",
  away: "111C27",
};

const argv = process.argv.slice(2);
function arg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
function existing(...paths) {
  return paths.find((p) => p && fs.existsSync(p));
}

const csvPath = existing(
  arg("--csv"),
  path.resolve(process.cwd(), "isquad-export/partits.csv"),
  path.resolve(process.cwd(), "partits.csv"),
);
const jsonPath = existing(
  arg("--json"),
  path.resolve(process.cwd(), "isquad-export/detalls-per-equip.json"),
  path.resolve(process.cwd(), "detalls-per-equip.json"),
);
const logoPath = existing(
  arg("--logo"),
  path.resolve(process.cwd(), "android-chrome-192x192.png"),
  path.resolve(process.cwd(), "logo.png"),
);
const sponsorsPath = existing(
  arg("--sponsors"),
  path.resolve(process.cwd(), "faldon_sponsors.png"),
  path.resolve(process.cwd(), "isquad-export/faldon_sponsors.png"),
);
const outputPath = path.resolve(
  process.cwd(),
  arg("--out") || "partits-setmana-cv-martorell.pptx",
);

if (!csvPath) throw new Error("No s'ha trobat partits.csv. Usa --csv <ruta>.");
if (!jsonPath) throw new Error("No s'ha trobat detalls-per-equip.json. Usa --json <ruta>.");
if (!logoPath) throw new Error("No s'ha trobat el logo. Usa --logo <ruta-del-png>.");
if (!sponsorsPath) throw new Error("No s'ha trobat el faldó de patrocinadors. Usa --sponsors <ruta-del-png>.");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ";") { row.push(cell); cell = ""; }
    else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((v) => v !== "")) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])));
}

function parseDate(value) {
  const m = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, hh, mm, dd, MM, yyyy] = m;
  const d = new Date(+yyyy, +MM - 1, +dd, +hh, +mm);
  return Number.isNaN(d.getTime()) ? null : d;
}
function monday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay() || 7;
  d.setDate(d.getDate() - weekday + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, days) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shortDate(d) {
  return new Intl.DateTimeFormat("ca-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
function dayName(d) {
  const text = new Intl.DateTimeFormat("ca-ES", { weekday: "long", day: "numeric", month: "long" }).format(d);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function timeText(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function titleCase(value) {
  return String(value || "").toLocaleLowerCase("ca-ES")
    .replace(/(^|[\s'-])\p{L}/gu, (m) => m.toLocaleUpperCase("ca-ES"));
}
function cleanName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function metadataMap(data) {
  const map = new Map();
  for (const team of data) for (const phase of team.fases || []) {
    map.set(`${team.id_equipo}|${phase.id_fase}`, phase);
  }
  return map;
}
function teamLabel(row, metadata) {
  const meta = metadata.get(`${row.id_equipo}|${row.id_fase}`);
  const competition = row.competicion || meta?.competicion || "";
  const category = row.categoria || meta?.categoria || "";
  const color = String(row.equip || "").replace(/^CV\s+MARTORELL\s*/i, "").trim();
  let level = "Equip";
  if (/SEN/i.test(competition) || /SENIOR/i.test(category)) level = "Sènior";
  else if (/JUV/i.test(competition) || /JUVENIL/i.test(category)) level = "Juvenil";
  else if (/CAD/i.test(competition) || /CADET/i.test(category)) level = "Cadet";
  else if (/INF/i.test(competition) || /INFANTIL/i.test(category)) level = "Infantil";
  else if (/ALEV/i.test(competition) || /ALEVI/i.test(category)) level = "Aleví";
  let gender = "";
  if (/MASC/i.test(competition)) gender = " Masculí";
  else if (/FEM/i.test(competition)) gender = " Femení";
  else if (/MIX/i.test(competition) || /MIXT/i.test(category) || /mixte/i.test(row.equip)) gender = " Mixt";
  return `${level}${gender}${color ? ` ${titleCase(color)}` : ""}`.trim();
}

function shadow() {
  // Sense ombres: Canva importa millor els elements plans.
  return undefined;
}

function addCourtBackground(slide, accent = C.neon, secondary = C.sky, soft = C.neonSoft) {
  slide.background = { color: C.bg };

  // Fons d'impacte Canva-safe: només rectangles i línies simples editables.
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.55, y: 0.08, w: 5.78, h: 5.85,
    fill: { color: accent, transparency: 90 },
    line: { color: accent, transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 10.45, y: 0.08, w: 2.88, h: 5.85,
    fill: { color: secondary, transparency: 92 },
    line: { color: secondary, transparency: 100 },
  });

  // Pista de voleibol esquemàtica en perspectiva lleugera.
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.20, y: 0.55, w: 5.55, h: 5.15,
    fill: { color: C.bg, transparency: 100 },
    line: { color: soft, width: 1.0, transparency: 64 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 9.975, y: 0.55, w: 0.001, h: 5.15,
    line: { color: accent, width: 2.0, transparency: 38 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 8.85, y: 0.55, w: 0.001, h: 5.15,
    line: { color: secondary, width: 0.7, transparency: 66 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 11.10, y: 0.55, w: 0.001, h: 5.15,
    line: { color: secondary, width: 0.7, transparency: 66 },
  });

  // Feixos diagonals grans, simples i fàcils d'editar després d'importar.
  const beams = [
    { x: 5.65, y: 5.55, w: 7.30, h: -4.55, width: 3.1, t: 55 },
    { x: 6.40, y: 5.72, w: 6.35, h: -3.85, width: 1.15, t: 58 },
    { x: 7.20, y: 5.85, w: 5.35, h: -3.05, width: 0.7, t: 64 },
  ];
  for (const beam of beams) {
    slide.addShape(pptx.ShapeType.line, {
      x: beam.x, y: beam.y, w: beam.w, h: beam.h,
      line: { color: accent, width: beam.width, transparency: beam.t },
    });
  }

  // Tira esportiva inferior tipus pinzell, feta amb rectangles plans.
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.55, w: 4.45, h: 0.18,
    rotate: -1.5,
    fill: { color: accent, transparency: 68 },
    line: { color: accent, transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.2, y: 5.78, w: 3.75, h: 0.07,
    rotate: 1,
    fill: { color: secondary, transparency: 70 },
    line: { color: secondary, transparency: 100 },
  });
}
function addLogo(slide, x, y, size, accent = C.neon) {
  // El PNG del club ja es circular i transparent. No es retalla ni es deforma.
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x - 0.05, y: y - 0.05, w: size + 0.1, h: size + 0.1,
    fill: { color: C.bg, transparency: 100 },
    line: { color: accent, width: 1.4, transparency: 14 },
  });
  slide.addImage({ path: logoPath, x, y, w: size, h: size, transparency: 0 });
}

function addTopBar(slide, weekStart, accent = C.neon, secondary = C.sky) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.08,
    fill: { color: accent }, line: { color: accent, transparency: 100 },
  });
  addLogo(slide, 0.48, 0.28, 0.8, accent);
  slide.addText("PARTITS DE LA SETMANA", {
    x: 1.48, y: 0.31, w: 5.1, h: 0.38,
    fontFace: "Arial", fontSize: 23, bold: true, color: C.white, margin: 0,
  });
  slide.addText(`${shortDate(weekStart)}  —  ${shortDate(addDays(weekStart, 6))}`, {
    x: 1.5, y: 0.77, w: 3.5, h: 0.22,
    fontFace: "Arial", fontSize: 9.5, bold: true, color: secondary, margin: 0,
  });
}
function addDayRail(slide, matches, accent = C.neon, secondary = C.sky) {
  const days = [...new Map(matches.map((m) => [dateKey(m._date), m._date])).values()];
  if (!days.length) return;
  const cardWidth = Math.min(1.34, 6.15 / days.length);
  days.forEach((day, i) => {
    const count = matches.filter((m) => dateKey(m._date) === dateKey(day)).length;
    const x = 0.49 + i * (cardWidth + 0.08);
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.22, w: cardWidth, h: 0.55,
      rectRadius: 0.05,
      fill: { color: C.panel, transparency: 2 },
      line: { color: secondary, width: 0.7, transparency: 60 },
    });
    slide.addText(new Intl.DateTimeFormat("ca-ES", { weekday: "short" }).format(day).toUpperCase(), {
      x: x + 0.08, y: 1.31, w: cardWidth - 0.37, h: 0.16,
      fontFace: "Arial", fontSize: 7.2, bold: true, color: secondary,
      margin: 0,
    });
    slide.addText(String(count), {
      x: x + cardWidth - 0.31, y: 1.28, w: 0.22, h: 0.2,
      fontFace: "Arial", fontSize: 11, bold: true, color: accent,
      align: "right", margin: 0,
    });
    slide.addText(new Intl.DateTimeFormat("ca-ES", { day: "2-digit", month: "2-digit" }).format(day), {
      x: x + 0.08, y: 1.51, w: cardWidth - 0.16, h: 0.12,
      fontFace: "Arial", fontSize: 6.4, color: C.muted, margin: 0,
    });
  });
}


function addCourtIcon(slide, x, y, scale = 1, accent = C.neon, secondary = C.sky) {
  const w = 0.40 * scale, h = 0.25 * scale;
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { color: C.bg, transparency: 100 },
    line: { color: secondary, width: 0.65, transparency: 20 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + w / 2, y, w: 0, h,
    line: { color: accent, width: 0.75, transparency: 10 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + w * 0.27, y, w: 0, h,
    line: { color: secondary, width: 0.4, transparency: 45 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + w * 0.73, y, w: 0, h,
    line: { color: secondary, width: 0.4, transparency: 45 },
  });
}

function addNetIcon(slide, x, y, scale = 1, accent = C.neon, secondary = C.sky) {
  const w = 0.38 * scale, h = 0.27 * scale;
  slide.addShape(pptx.ShapeType.line, {
    x, y: y + h, w: 0, h: -h,
    line: { color: accent, width: 0.8 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + w, y: y + h, w: 0, h: -h,
    line: { color: accent, width: 0.8 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x, y: y + 0.04 * scale, w, h: 0,
    line: { color: secondary, width: 0.75 },
  });
  for (let i = 1; i < 4; i++) {
    slide.addShape(pptx.ShapeType.line, {
      x: x + (w * i) / 4, y: y + 0.04 * scale, w: 0, h: h - 0.04 * scale,
      line: { color: secondary, width: 0.28, transparency: 38 },
    });
  }
  for (let i = 1; i < 3; i++) {
    slide.addShape(pptx.ShapeType.line, {
      x, y: y + (h * i) / 3, w, h: 0,
      line: { color: secondary, width: 0.28, transparency: 38 },
    });
  }
}

function addBallIcon(slide, x, y, size = 0.28, accent = C.neon, secondary = C.sky) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: size, h: size,
    fill: { color: C.panelAlt, transparency: 0 },
    line: { color: accent, width: 0.8, transparency: 5 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + size * 0.18, y: y + size * 0.48,
    w: size * 0.64, h: 0.001,
    rotate: 24,
    line: { color: secondary, width: 0.45, transparency: 5 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: x + size * 0.48, y: y + size * 0.17,
    w: 0.001, h: size * 0.66,
    rotate: -22,
    line: { color: secondary, width: 0.45, transparency: 5 },
  });
}

function addMatchCard(slide, match, x, y, w, h, accent = C.neon, secondary = C.sky) {
  const home = /MARTORELL/i.test(match.local);
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.06,
    fill: { color: home ? C.home : C.away, transparency: 1 },
    line: { color: secondary, width: 0.8, transparency: 55 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.055, h,
    fill: { color: accent }, line: { color: accent, transparency: 100 },
  });

  slide.addText(match._teamLabel.toUpperCase(), {
    x: x + 0.2, y: y + 0.12, w: w - 1.0, h: 0.17,
    fontFace: "Arial", fontSize: 7.2, bold: true, color: secondary,
    margin: 0, charSpacing: 0.45, fit: "shrink",
  });
  slide.addText(timeText(match._date), {
    x: x + w - 0.82, y: y + 0.08, w: 0.65, h: 0.25,
    fontFace: "Arial", fontSize: 14, bold: true, color: accent,
    align: "right", margin: 0,
  });

  addCourtIcon(slide, x + 0.20, y + 0.34, 0.82, accent, secondary);
  addNetIcon(slide, x + 0.59, y + 0.32, 0.82, accent, secondary);
  addBallIcon(slide, x + w - 1.13, y + 0.34, 0.22, accent, secondary);

  slide.addText(cleanName(match.local), {
    x: x + 0.2, y: y + 0.61, w: w - 0.4, h: 0.25,
    fontFace: "Arial", fontSize: 11.8, bold: home,
    color: home ? C.white : secondary, margin: 0, fit: "shrink",
  });
  slide.addText("VS", {
    x: x + 0.2, y: y + 0.90, w: 0.3, h: 0.12,
    fontFace: "Arial", fontSize: 6.2, bold: true, color: accent, margin: 0,
  });
  slide.addText(cleanName(match.visitant), {
    x: x + 0.2, y: y + 1.06, w: w - 0.4, h: 0.25,
    fontFace: "Arial", fontSize: 11.8, bold: !home,
    color: !home ? C.white : secondary, margin: 0, fit: "shrink",
  });

  slide.addShape(pptx.ShapeType.line, {
    x: x + 0.2, y: y + h - 0.35, w: w - 0.4, h: 0,
    line: { color: accent, width: 0.55, transparency: 70 },
  });
  slide.addText(home ? "LOCAL" : "VISITANT", {
    x: x + 0.2, y: y + h - 0.25, w: 0.72, h: 0.12,
    fontFace: "Arial", fontSize: 5.8, bold: true, color: C.muted,
    margin: 0, charSpacing: 0.8,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 1.0, y: y + h - 0.29, w: w - 1.2, h: 0.2,
    rectRadius: 0.025,
    fill: { color: C.panel, transparency: 5 },
    line: { color: accent, width: 0.45, transparency: 55 },
  });
  slide.addText(match.descripcion_fase || "FASE SENSE INFORMAR", {
    x: x + 1.08, y: y + h - 0.245, w: w - 1.36, h: 0.1,
    fontFace: "Arial", fontSize: 5.4, bold: true, color: C.muted,
    align: "right", margin: 0, fit: "shrink",
  });
}


function addSponsorsFooter(slide, accent = C.neon) {
  // El faldó original és molt panoràmic. Es conserva la proporció aproximada
  // i es centra en una franja blanca independent del dashboard.
  const x = 3.23;
  const y = 6.12;
  const w = 6.88;
  const h = 0.91;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - 0.10, y: y - 0.07, w: w + 0.20, h: h + 0.14,
    rectRadius: 0.04,
    fill: { color: "FFFFFF", transparency: 0 },
    line: { color: accent, width: 0.8, transparency: 15 },
    shadow: { type: "outer", color: "000000", opacity: 0.28, angle: 45, blur: 1.0, distance: 0.5 },
  });
  slide.addImage({ path: sponsorsPath, x, y, w, h });
}


const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
const details = JSON.parse(fs.readFileSync(jsonPath, "utf8").replace(/^\uFEFF/, ""));
const metadata = metadataMap(details);
const referenceDate = arg("--data") ? new Date(`${arg("--data")}T12:00:00`) : new Date();
if (Number.isNaN(referenceDate.getTime())) throw new Error("--data ha de tenir format YYYY-MM-DD.");
const weekStart = monday(referenceDate);
const weekEnd = addDays(weekStart, 7);
const seen = new Set();

const matches = rows
  .map((row) => ({ ...row, _date: parseDate(row.data) }))
  .filter((row) => row._date && row._date >= weekStart && row._date < weekEnd)
  .filter((row) => /MARTORELL/i.test(`${row.local} ${row.visitant}`))
  .filter((row) => {
    const key = `${row.id_equipo}|${row.id_fase}|${row.local}|${row.visitant}|${row.data}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  })
  .map((row) => ({ ...row, _teamLabel: teamLabel(row, metadata) }))
  .sort((a, b) => a._date - b._date || a._teamLabel.localeCompare(b._teamLabel, "ca"));

const homeMatches = matches.filter((m) => /MARTORELL/i.test(m.local));
const awayMatches = matches.filter((m) => !/MARTORELL/i.test(m.local));
const homeCount = homeMatches.length;
const awayCount = awayMatches.length;

function chunksOf(rows, size = 8) {
  if (!rows.length) return [[]];
  return Array.from({ length: Math.ceil(rows.length / size) }, (_, i) =>
    rows.slice(i * size, i * size + size),
  );
}

const sections = [
  {
    type: "home",
    matches: homeMatches,
    accent: C.neon,
    secondary: C.sky,
    soft: C.neonSoft,
  },
  {
    type: "away",
    matches: awayMatches,
    accent: C.pink,
    secondary: C.pink,
    soft: C.pinkSoft,
  },
];

for (const section of sections) {
  const sectionChunks = chunksOf(section.matches);

  sectionChunks.forEach((chunk) => {
    const slide = pptx.addSlide();
    addCourtBackground(slide, section.accent, section.secondary, section.soft);
    addTopBar(slide, weekStart, section.accent, section.secondary);

    // Dies exclusivament d'aquesta secció.
    addDayRail(slide, section.matches, section.accent, section.secondary);

    // Reubica visualment la llegenda més a la dreta deixant el títol de secció a l'esquerra.
    if (!chunk.length) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.25, y: 2.45, w: 10.8, h: 2.45,
        rectRadius: 0.08,
        fill: { color: C.panel, transparency: 2 },
        line: { color: section.accent, width: 1.2, transparency: 35 },
      });
      slide.addText(
        section.type === "home"
          ? "AQUESTA SETMANA NO HI HA PARTITS A CASA"
          : "AQUESTA SETMANA NO HI HA PARTITS FORA",
        {
          x: 1.75, y: 3.02, w: 9.8, h: 0.48,
          fontFace: "Arial", fontSize: 23, bold: true, color: C.white,
          align: "center", margin: 0,
        },
      );
      slide.addText("La diapositiva es manté per conservar l'estructura setmanal.", {
        x: 2, y: 3.72, w: 9.3, h: 0.25,
        fontFace: "Arial", fontSize: 10.5, color: section.secondary,
        align: "center", margin: 0,
      });
    } else {
      const startY = 1.84;
      const cardW = 3.0;
      const cardH = 1.88;
      const gapX = 0.16;
      const gapY = 0.16;
      chunk.forEach((match, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 0.48 + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);
        addMatchCard(slide, match, x, y, cardW, cardH, section.accent, section.secondary);
      });
    }

    addSponsorsFooter(slide, section.accent);
    slide.addShape(pptx.ShapeType.line, {
      x: 0.5, y: 7.12, w: 12.28, h: 0,
      line: { color: section.accent, width: 1.1, transparency: 30 },
    });
    slide.addText("CLUB VOLEIBOL MARTORELL", {
      x: 0.53, y: 7.18, w: 4.2, h: 0.16,
      fontFace: "Arial", fontSize: 6.7, bold: true, color: section.secondary,
      margin: 0, charSpacing: 1.6,
    });
  });
}

await pptx.writeFile({ fileName: outputPath });
console.log(`PPT generat: ${outputPath}`);
console.log(`Setmana: ${shortDate(weekStart)} - ${shortDate(addDays(weekStart, 6))}`);
console.log(`Partits inclosos: ${matches.length} (${homeCount} local, ${awayCount} fora)`);
console.log(`Logo integrat: ${logoPath}`);
console.log(`Patrocinadors integrats: ${sponsorsPath}`);

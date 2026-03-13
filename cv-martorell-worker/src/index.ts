interface Env {
  EQUIPS_DATA: KVNamespace;
  SCRAPE_SECRET: string;
  PAGES_DEPLOY_HOOK: string;
}

interface Equip {
  slug: string;
  id_equipo: string;
  id: string;
  nom: string;
}

interface FilaClassificacio {
  pos: number;
  equip: string;
  punts: number;
  jug: number;
  gan: number;
  per: number;
}

interface Partit {
  local: string;
  visitant: string;
  marcador: string | null;
  data: string | null;
  estat: "jugat" | "pendent";
}

interface DadesEquip {
  slug: string;
  nom: string;
  actualitzat: string;
  posicio: FilaClassificacio | null;
  clasificacion: FilaClassificacio[];
  ultimResultat: Partit | null;
  propersPartits: Partit[];
  jugats: Partit[];
}

const EQUIPS: Equip[] = [
  { slug: "senior-femeni-negre",    id_equipo: "2774", id: "2542", nom: "Sènior Femení Negre"    },
  { slug: "cadet-femeni-negre",     id_equipo: "2794", id: "2572", nom: "Cadet Femení Negre"     },
  { slug: "juvenil-femeni-negre",   id_equipo: "2800", id: "2564", nom: "Juvenil Femení Negre"   },
  { slug: "cadet-femeni-blau",      id_equipo: "2824", id: "2520", nom: "Cadet Femení Blau"      },
  { slug: "juvenil-femeni-blau",    id_equipo: "3424", id: "2509", nom: "Juvenil Femení Blau"    },
  { slug: "senior-femeni-blau",     id_equipo: "3425", id: "2551", nom: "Sènior Femení Blau"     },
  { slug: "alevi-mixt",             id_equipo: "3426", id: "2461", nom: "Aleví Mixt"             },
  { slug: "junior-femeni-negre",    id_equipo: "3430", id: "2498", nom: "Júnior Femení Negre"    },
  { slug: "infantil-masculi-negre", id_equipo: "3431", id: "2623", nom: "Infantil Masculí Negre" },
  { slug: "infantil-femeni-negre",  id_equipo: "3432", id: "2607", nom: "Infantil Femení Negre"  },
  { slug: "infantil-femeni-blau",   id_equipo: "3433", id: "2613", nom: "Infantil Femení Blau"   },
  { slug: "infantil-femeni-vermell",id_equipo: "3434", id: "2630", nom: "Infantil Femení Vermell"},
];

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseClasificacio(html: string): FilaClassificacio[] {
  const rows: FilaClassificacio[] = [];
  const match = html.match(/id=['"]clasificacion['"][\s\S]*?(<table[\s\S]*?<\/table>)/i);
  if (!match) return rows;
  const tabla = match[1];
  const trMatches = [...tabla.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(td => stripTags(td[1]));
    if (cells.length >= 8 && /^\d+$/.test(cells[0])) {
      rows.push({
        pos:   parseInt(cells[0]),
        equip: cells[2] || cells[1] || "",
        punts: parseInt(cells[3]) || 0,
        jug:   parseInt(cells[4]) || 0,
        gan:   parseInt(cells[5]) || 0,
        per:   parseInt(cells[7]) || 0,
      });
    }
  }
  return rows;
}

function parsePartits(html: string): Partit[] {
  const partits: Partit[] = [];
  const match = html.match(/id=['"]partidos['"][\s\S]*?(<table[\s\S]*?<\/table>)/i);
  if (!match) return partits;
  const tabla = match[1];
  const trMatches = [...tabla.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (tdMatches.length < 4) continue;

    const nomesDiv = tdMatches[0][1].match(/class=["']nombres-equipos["']>([\s\S]*?)<\/div>/i);
    if (!nomesDiv) continue;
    const aLinks = [...nomesDiv[1].matchAll(/<a[^>]*>\s*([\s\S]*?)\s*<\/a>/gi)];
    if (aLinks.length < 2) continue;
    const local    = stripTags(aLinks[0][1]).trim();
    const visitant = stripTags(aLinks[1][1]).trim();

    const marcadorText = stripTags(tdMatches[1][1]);
    const marcadorMatch = marcadorText.match(/(\d+)\s*[-–]\s*(\d+)/);

    const dataText = tdMatches[7] ? stripTags(tdMatches[7][1]).trim() : null;

    const rowHtml = tr[1];
    const estat: "jugat" | "pendent" = rowHtml.includes("Finalizado") ? "jugat" : "pendent";

    partits.push({
      local,
      visitant,
      marcador: marcadorMatch ? `${marcadorMatch[1]}-${marcadorMatch[2]}` : null,
      data: dataText || null,
      estat,
    });
  }
  return partits;
}

async function scrapeEquip(equip: Equip): Promise<DadesEquip> {
  const url = `https://resultadosvoleibol.isquad.es/equipo.php?seleccion=0&id_equipo=${equip.id_equipo}&id=${equip.id}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CVMartorell/1.0)",
      "Accept-Language": "ca,es;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`iSquad HTTP ${res.status} per a ${equip.slug}`);
  const html = await res.text();
  const clasificacion = parseClasificacio(html);
  const partits       = parsePartits(html);
  const jugats        = partits.filter(p => p.estat === "jugat");
  const pendents      = partits.filter(p => p.estat === "pendent");
  const ultimResultat = jugats.at(-1) ?? null;
  const posicio       = clasificacion.find(r =>
    r.equip.toUpperCase().includes("MARTORELL")
  ) ?? null;
  return {
    slug:           equip.slug,
    nom:            equip.nom,
    actualitzat:    new Date().toISOString(),
    posicio,
    clasificacion,
    ultimResultat,
    propersPartits: pendents.slice(0, 3),
    jugats,
  };
}

export default {

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log("🏐 Iniciant scraping iSquad...");
    const resultats: { slug: string; ok: boolean; error?: string }[] = [];
    for (const equip of EQUIPS) {
      try {
        console.log(`  → ${equip.slug}`);
        const dades = await scrapeEquip(equip);
        await env.EQUIPS_DATA.put(
          `equip:${equip.slug}`,
          JSON.stringify(dades),
          { expirationTtl: 60 * 60 * 24 * 8 }
        );
        resultats.push({ slug: equip.slug, ok: true });
        console.log(`  ✓ ${equip.slug}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${equip.slug}: ${msg}`);
        resultats.push({ slug: equip.slug, ok: false, error: msg });
      }
    }
    await env.EQUIPS_DATA.put(
      "meta:ultima-execucio",
      JSON.stringify({ data: new Date().toISOString(), resultats })
    );

    // Trigger build de Cloudflare Pages
    if (env.PAGES_DEPLOY_HOOK) {
      await fetch(env.PAGES_DEPLOY_HOOK, { method: "POST" });
      console.log("🚀 Build de Pages disparat");
    }

    console.log("✅ Scraping completat");
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://cv-martorell.pages.dev",
    };

    if (url.pathname === "/debug") {
      const res = await fetch(
        "https://resultadosvoleibol.isquad.es/equipo.php?seleccion=0&id_equipo=3432&id=2607",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const html = await res.text();
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    if (url.pathname === "/scrape") {
      if (url.searchParams.get("secret") !== env.SCRAPE_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      }
      await this.scheduled({} as ScheduledEvent, env, {} as ExecutionContext);
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    const equipMatch = url.pathname.match(/^\/equip\/(.+)$/);
    if (equipMatch) {
      const dades = await env.EQUIPS_DATA.get(`equip:${equipMatch[1]}`);
      if (!dades) return new Response(JSON.stringify({ error: "No trobat" }), { status: 404, headers });
      return new Response(dades, { headers: { ...headers, "Cache-Control": "public, max-age=3600" } });
    }

    if (url.pathname === "/meta") {
      const meta = await env.EQUIPS_DATA.get("meta:ultima-execucio");
      return new Response(meta ?? "{}", { headers });
    }

    return new Response("CV Martorell Scraper Worker 🏐", { status: 200 });
  },
};
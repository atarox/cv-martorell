export type Equip = {
  categoria: string;
  genere: string;
  icon: string;
  edats: string;
  color: string;
  accent: string;

  equip: string;
  foto: string;
  entrenador: string;
  divisio: string;

  slug?: string;

  patrocinador?: {
    nom: string;
    logo: string;
    url: string;
  };
};

export const equips: Equip[] = [
  {
    categoria: "Aleví",
    genere: "Mixt",
    icon: "🏐",
    edats: "Sub-12",
    color: "from-sky-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Federat",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Laia Balastegui",
    divisio: "Competició 3x3",
    slug: "alevi-mixt",
  },

  {
    categoria: "Aleví",
    genere: "Mixt",
    icon: "🏐",
    edats: "Sub-12",
    color: "from-sky-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Escolar",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "José Meoniz",
    divisio: "Trobades competició única",
  },

  {
    categoria: "Infantil",
    genere: "Mixt",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Escolar",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Adrià Anguera",
    divisio: "Trobades competició única",
    slug: "infantil-mixt-escolar-INVENTED",
  },

  {
    categoria: "Infantil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#2B6E7F",
    equip: "Negre",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Aroa Carpio",
    divisio: "2a Divisió Femenina",
    slug: "infantil-femeni-negre", 
	patrocinador: {
		nom: "NOMAD SALUD",
		logo: "images/sponsors/sponsor5.webp",
		url: "https://nomadsalud.com/",
	},
   },

  {
    categoria: "Cadet",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#F2CB40",
    equip: "Preferent",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Aina Cabrera",
    divisio: "Preferent Cadet",
    slug: "cadet-femeni-preferent-INVENTED",
  },

  {
    categoria: "Cadet",
    genere: "Masculí",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#F2CB40",
    equip: "Preferent",
    foto: "/images/equips/dummy_m.webp",
    entrenador: "Adrià Anguera",
    divisio: "Preferent Cadet",
    slug: "cadet-masculi-preferent-INVENTED",
  },

  {
    categoria: "Cadet",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#F2CB40",
    equip: "Negre",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Rafa Corts",
    divisio: "3a Divisió Cadet",
    slug: "cadet-femeni-negre",
	patrocinador: {
		nom: "Bar Restaurante El Cortijo",
		logo: "images/sponsors/sponsor4.webp",
		url: "https://www.instagram.com/restauranteelcortijo81/",
	},
  },

  {
    categoria: "Cadet",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Juanjo Ibáñez",
    divisio: "4a Divisió Cadet",
    slug: "cadet-femeni-blau",
	patrocinador: {
		nom: "La Secre Immobiliaria",
		logo: "https://lasecre.es/wp-content/uploads/2026/08/Disseny-sense-titol.png",
		url: "https://lasecre.es/",
	},
  },

  {
    categoria: "Juvenil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-18",
    color: "from-indigo-900/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Rafa Corts",
    divisio: "3a Divisió Juvenil",
    slug: "juvenil-femeni-negre",

    patrocinador: {
      nom: "NOVA AUTOESCOLA",
      logo: "https://www.08760nova.com/images/logo.png",
      url: "https://www.08760nova.com",
    },
  },

  {
    categoria: "Juvenil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-18",
    color: "from-indigo-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Juanjo Ibáñez",
    divisio: "4a Divisió Juvenil",
    slug: "juvenil-femeni-blau",
	    patrocinador: {
      nom: "NOVA AUTOESCOLA",
      logo: "https://www.08760nova.com/images/logo.png",
      url: "https://www.08760nova.com",
    },
  },

  {
    categoria: "Juvenil",
    genere: "Mixt",
    icon: "🏐",
    edats: "Sub-18",
    color: "from-indigo-900/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Escolar",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Ana Tena",
    divisio: "Trobades competició única",
  },

  {
    categoria: "Sènior",
    genere: "Femení",
    icon: "🏐",
    edats: "Absolut",
    color: "from-zinc-800/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Mikaela Morales",
    divisio: "3a Divisió Sènior",
    slug: "senior-femeni-negre",
	patrocinador: {
		nom: "Quality Blends",
		logo: "images/sponsors/sponsor6.webp",
		url: "https://qualityblends.coffee/",
	},
  },

  {
    categoria: "Sènior",
    genere: "Masculí",
    icon: "🏐",
    edats: "Absolut",
    color: "from-zinc-800/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/dummy_m.webp",
    entrenador: "Águeda Núñez",
    divisio: "2a Divisió Sènior",
    slug: "senior-masculi-negre-INVENTED",
  },

  {
    categoria: "Sènior",
    genere: "Femení",
    icon: "🏐",
    edats: "Absolut",
    color: "from-zinc-800/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Adrià Anguera",
    divisio: "4a Divisió Sènior",
    slug: "senior-femeni-blau",
  },

  {
    categoria: "Màster",
    genere: "Mixt",
    icon: "🏐",
    edats: "Absolut",
    color: "from-sky-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    foto: "/images/equips/dummy_f.webp",
    entrenador: "Laia Balastegui",
	patrocinador: {
		nom: "Bar Restaurante El Cortijo",
		logo: "/images/sponsors/sponsor4.webp",
		url: "https://www.instagram.com/restauranteelcortijo81/",
	},
  },
];
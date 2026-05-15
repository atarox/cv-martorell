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
    foto: "/images/equips/alevi-mixt.jpg",
    entrenador: "Laia Balastegui i Aina Cabrera",
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
    foto: "/images/equips/alevi-mixt-escolar.jpg",
    entrenador: "Laia Balastegui i Aina Cabrera",
    divisio: "Trobades competició única",
  },

  {
    categoria: "Infantil",
    genere: "Masculí",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#2B6E7F",
    equip: "Negre",
    foto: "/images/equips/infantil-masculi-negre.jpg",
    entrenador: "Águeda Núñez",
    divisio: "2a Divisió Masculina",
    slug: "infantil-masculi-negre"
  },

  {
    categoria: "Infantil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#2B6E7F",
    equip: "Negre",
    foto: "/images/equips/infantil-femeni-negre.jpg",
    entrenador: "José Meoniz",
    divisio: "2a Divisió Femenina",
    slug: "infantil-femeni-negre" 
  },

  {
    categoria: "Infantil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/infantil-femeni-blau.jpg",
    entrenador: "Laia Segura i Jan Bigas",
    divisio: "2a Divisió Femenina",
    slug: "infantil-femeni-blau",
  },

  {
    categoria: "Infantil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-14",
    color: "from-teal-900/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Vermell",
    foto: "/images/equips/infantil-femeni-vermell.jpg",
    entrenador: "Dídac Ondoño i Aroa Carpio",
    divisio: "Preferente Infantil",
    slug: "infantil-femeni-vermell",
  },

  {
    categoria: "Cadet",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#F2CB40",
    equip: "Negre",
    foto: "/images/equips/cadet-femeni-negre.jpg",
    entrenador: "Rafa Corts",
    divisio: "3a Divisió Cadet",
    slug: "cadet-femeni-negre",
  },

  {
    categoria: "Cadet",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-16",
    color: "from-cyan-900/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/cadet-femeni-blau.jpg",
    entrenador: "Águeda Núñez",
    divisio: "4a Divisió Cadet",
    slug: "cadet-femeni-blau",
  },

  {
    categoria: "Juvenil",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-18",
    color: "from-indigo-900/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/juvenil-femeni-negre.jpg",
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
    foto: "/images/equips/juvenil-femeni-blau.jpg",
    entrenador: "Juanjo Ibáñez",
    divisio: "4a Divisió Juvenil",
    slug: "juvenil-femeni-blau",
  },

  {
    categoria: "Juvenil",
    genere: "Mixt",
    icon: "🏐",
    edats: "Sub-18",
    color: "from-indigo-900/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Vermell",
    foto: "/images/equips/juvenil-mixt-vermell.jpg",
    entrenador: "Ana Tena",
  },

  {
    categoria: "Júnior",
    genere: "Femení",
    icon: "🏐",
    edats: "Sub-20",
    color: "from-slate-800/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/junior-femeni-negre.jpg",
    entrenador: "José Meoniz",
    divisio: "2a Divisió Júnior",
    slug: "junior-femeni-negre",
  },

  {
    categoria: "Sènior",
    genere: "Femení",
    icon: "🏐",
    edats: "Absolut",
    color: "from-zinc-800/80 to-brand-dark/90",
    accent: "#C4372B",
    equip: "Negre",
    foto: "/images/equips/senior-femeni-negre.jpg",
    entrenador: "Richard Álvarez",
    divisio: "3a Divisió Sènior",
    slug: "senior-femeni-negre",
  },

  {
    categoria: "Sènior",
    genere: "Femení",
    icon: "🏐",
    edats: "Absolut",
    color: "from-zinc-800/80 to-brand-dark/90",
    accent: "#76AFC2",
    equip: "Blau",
    foto: "/images/equips/senior-femeni-blau.jpg",
    entrenador: "Juanjo Ibáñez",
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
    foto: "/images/equips/master-mixt.jpg",
    entrenador: "José Meoniz",
  },
];
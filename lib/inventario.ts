import type { Producto } from "./productos";

// Inventario de muestra que amplía el catálogo. Fotos reales; precios y stock
// inventados para la demo. Lo último de cada lista sale primero en "Recién llegado".

type Semilla = Pick<
  Producto,
  | "slug"
  | "nombre"
  | "categoria"
  | "idioma"
  | "precio"
  | "stock"
  | "vendidos"
  | "descripcion"
> &
  Partial<
    Pick<
      Producto,
      "precioAntes" | "etiqueta" | "llegada" | "parado" | "categoriaCorta"
    >
  >;

const CORTAS: Record<string, string> = {
  ETB: "ETB",
  "Booster bundle": "Bundle",
  "Booster box": "Box",
  "Booster pack": "Sobre",
  "Blister / sleeved booster": "Blister",
  "Tin o caja de colección": "Tin",
  "Colección premium / UPC": "Premium",
  Mazos: "Mazo",
  "Figuras y peluches": "Figura",
  "Sleeves y fundas": "Sleeves",
  Accesorios: "Accesorio",
  "Caja misteriosa": "Misteriosa",
};

const ETB = "ETB";
const BUNDLE = "Booster bundle";
const BOX = "Booster box";
const SOBRE = "Booster pack";
const BLISTER = "Blister / sleeved booster";
const TIN = "Tin o caja de colección";
const PREMIUM = "Colección premium / UPC";
const MAZO = "Mazos";
const FIGURA = "Figuras y peluches";
const ACCESORIO = "Accesorios";
const SLEEVES = "Sleeves y fundas";
const MISTERIOSA = "Caja misteriosa";

const DICIEMBRE = "2026-12-11T12:00:00-06:00";
const GRENINJA = "2026-12-18T12:00:00-06:00";
const ENERO = "2027-01-29T12:00:00-06:00";
const FEBRERO = "2027-02-26T12:00:00-06:00";

const SELLADO: Semilla[] = [
  { slug: "dragon-shield-perfect-fit", nombre: "Dragon Shield Perfect Fit x100", categoria: SLEEVES, idioma: "Otro", precio: 3500, stock: 14, vendidos: 9, descripcion: "La funda interior que va pegadita a la carta, antes de la funda normal." },
  { slug: "sleeves-energia-fuego", nombre: "Sleeves Energía Fuego x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 8, vendidos: 5, descripcion: "Fundas con diseño de energía para que tu mazo pegue más fuerte." },
  { slug: "sleeves-poke-ball", nombre: "Sleeves Poké Ball x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 11, vendidos: 12, descripcion: "El clásico que nunca falla en la mesa." },
  { slug: "sleeves-charmander", nombre: "Sleeves Charmander x65", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 7, vendidos: 6, descripcion: "Fundas estilo Kanto para tu mazo favorito." },
  { slug: "sleeves-pokemon-center", nombre: "Sleeves Pokémon Center Japón", categoria: SLEEVES, idioma: "Otro", precio: 7500, stock: 5, etiqueta: "Nuevo", vendidos: 4, descripcion: "Los de la tienda oficial de Japón, de esos que no se consiguen en cualquier lado." },
  { slug: "sleeves-iono-bellibolt", nombre: "Sleeves Iono y Bellibolt x65", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 6, etiqueta: "Nuevo", vendidos: 3, descripcion: "Para que tu mazo tenga más estilo que el de tu rival." },
  { slug: "sleeves-armarouge", nombre: "Sleeves Armarouge x65", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 6, vendidos: 2, descripcion: "Arte de Armarouge para mazos que pegan fuerte." },
  { slug: "sleeves-ceruledge", nombre: "Sleeves Ceruledge x65", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 6, vendidos: 2, descripcion: "La pareja de los de Armarouge, en azul y bien serios." },
  { slug: "sleeves-energia-agua", nombre: "Sleeves Energía Agua x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 8, vendidos: 4, descripcion: "Fundas con diseño de energía para tu mazo de agua." },
  { slug: "sleeves-energia-planta", nombre: "Sleeves Energía Planta x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 8, vendidos: 3, descripcion: "Fundas con diseño de energía para tu mazo de planta." },
  { slug: "sleeves-energia-psiquica", nombre: "Sleeves Energía Psíquica x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 7, vendidos: 3, descripcion: "Fundas con diseño de energía para tu mazo psíquico." },
  { slug: "sleeves-energia-oscura", nombre: "Sleeves Energía Oscura x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 7, vendidos: 2, descripcion: "Fundas con diseño de energía para tu mazo oscuro." },
  { slug: "sleeves-energia-lucha", nombre: "Sleeves Energía Lucha x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 7, vendidos: 2, descripcion: "Fundas con diseño de energía para tu mazo de lucha." },
  { slug: "sleeves-energia-dragon", nombre: "Sleeves Energía Dragón x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 6, vendidos: 2, descripcion: "Fundas con diseño de energía para tu mazo de dragones." },
  { slug: "sleeves-energia-incolora", nombre: "Sleeves Energía Incolora x65", categoria: SLEEVES, idioma: "Otro", precio: 5000, stock: 6, vendidos: 1, descripcion: "Las que combinan con cualquier mazo." },
  { slug: "dragon-shield-matte-negro", nombre: "Dragon Shield Matte Negro x100", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 10, vendidos: 7, descripcion: "Cien fundas mate, resistentes y fáciles de barajar." },
  { slug: "dragon-shield-matte-carmesi", nombre: "Dragon Shield Matte Carmesí x100", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 8, vendidos: 4, descripcion: "Cien fundas mate en rojo oscuro." },
  { slug: "dragon-shield-matte-purpura", nombre: "Dragon Shield Matte Púrpura x100", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 8, vendidos: 3, descripcion: "Cien fundas mate en morado." },
  { slug: "dragon-shield-matte-dorado", nombre: "Dragon Shield Matte Dorado x100", categoria: SLEEVES, idioma: "Otro", precio: 5500, stock: 6, vendidos: 3, descripcion: "Cien fundas mate para el mazo que se quiere lucir." },
  { slug: "ultra-pro-pro-gloss-x100", nombre: "Ultra Pro PRO-Gloss Rojo x100", categoria: SLEEVES, idioma: "Otro", precio: 3500, stock: 12, vendidos: 6, descripcion: "Cien fundas brillantes a buen precio, para jugar seguido sin gastar de más." },
  { slug: "dragon-shield-perfect-fit-sellable", nombre: "Dragon Shield Perfect Fit Sellable x100", categoria: SLEEVES, idioma: "Otro", precio: 4500, stock: 9, vendidos: 4, descripcion: "Funda interior con cierre: la carta queda sellada y no entra polvo." },
  { slug: "deck-box-snorlax", nombre: "Deck box Snorlax y Munchlax", categoria: ACCESORIO, idioma: "Otro", precio: 6000, stock: 5, vendidos: 4, descripcion: "Caja de vista completa para guardar tu mazo. Snorlax incluido, la siesta no." },
  { slug: "deck-box-togepi", nombre: "Deck box Togepi", categoria: ACCESORIO, idioma: "Otro", precio: 7500, stock: 4, vendidos: 3, descripcion: "Caja con tapa abatible y un diseño bien tierno." },
  { slug: "album-charmander", nombre: "Álbum Kanto Charmander", categoria: ACCESORIO, idioma: "Otro", precio: 11500, stock: 6, vendidos: 8, descripcion: "Carpeta de argollas para tener tu colección ordenada." },
  { slug: "acrilico-etb", nombre: "Protector acrílico para ETB", categoria: ACCESORIO, idioma: "Otro", precio: 12000, stock: 6, vendidos: 7, descripcion: "Cierre magnético reforzado. Para que tu ETB sellada no agarre ni polvo." },
  { slug: "acrilico-booster-box", nombre: "Protector acrílico para Booster Box", categoria: ACCESORIO, idioma: "Otro", precio: 14500, stock: 5, vendidos: 5, descripcion: "Vitrina individual para esa caja que no pensás abrir." },
  { slug: "playmat-iono-bellibolt", nombre: "Playmat Iono y Bellibolt", categoria: ACCESORIO, idioma: "Otro", precio: 16500, stock: 3, vendidos: 4, descripcion: "Tapete de juego con bastante color y cero aburrimiento." },
  { slug: "playmat-togepi", nombre: "Playmat Togepi cosido", categoria: ACCESORIO, idioma: "Otro", precio: 18000, stock: 3, vendidos: 2, descripcion: "Bordes cosidos para que dure muchas partidas." },
  { slug: "gaming-trove-pikachu", nombre: "Gaming Trove Pikachu", categoria: ACCESORIO, idioma: "Otro", precio: 24000, stock: 3, vendidos: 3, parado: true, descripcion: "Maletín para llevar mazos, playmat y dados a cualquier lado." },
  { slug: "squishmallow-clip-on", nombre: "Squishmallow con clip", categoria: FIGURA, categoriaCorta: "Peluche", idioma: "Otro", precio: 6500, stock: 12, vendidos: 19, descripcion: "Peluchito de 9 cm para el bulto o las llaves. Te toca uno al azar." },
  { slug: "blind-box-pikachu-30-aniversario", nombre: "Blind box Pikachu 30 aniversario", categoria: FIGURA, categoriaCorta: "Blind box", idioma: "Otro", precio: 7500, stock: 8, vendidos: 10, descripcion: "Caja sorpresa con una figura de Pikachu al azar." },
  { slug: "blind-box-aquatic", nombre: "Blind box Dream Painting Aquatic", categoria: FIGURA, categoriaCorta: "Blind box", idioma: "Otro", precio: 7500, stock: 7, vendidos: 6, descripcion: "Figura sorpresa de los Pokémon de agua." },
  { slug: "figura-vinil-4-pulgadas", nombre: "Figura de vinil Pichu", categoria: FIGURA, idioma: "Otro", precio: 10000, stock: 5, vendidos: 4, descripcion: "Figura de 10 cm, de las que dan ganas de dejar en el escritorio." },
  { slug: "figura-takara-tomy-kanto", nombre: "Set Takara Tomy iniciales de Kanto", categoria: FIGURA, idioma: "Otro", precio: 13500, stock: 4, vendidos: 7, descripcion: "Bulbasaur, Charmander y Squirtle en miniatura, línea japonesa del aniversario 30." },
  { slug: "peluche-halloween", nombre: "Peluche Pikachu Halloween 20 cm", categoria: FIGURA, categoriaCorta: "Peluche", idioma: "Otro", precio: 11500, precioAntes: 14500, stock: 4, etiqueta: "Oferta", vendidos: 16, descripcion: "Se nos pasó octubre y aquí sigue con su ayote. Rebajado para que se vaya a una casa." },
  { slug: "peluche-30-aniversario-pastel", nombre: "Peluche Pikachu 30 aniversario", categoria: FIGURA, categoriaCorta: "Peluche", idioma: "Otro", precio: 15500, stock: 5, vendidos: 11, descripcion: "Edición en tonos pastel para celebrar los 30 años." },
  { slug: "calendario-funko-bitty-pop", nombre: "Calendario de adviento Funko Bitty Pop", categoria: FIGURA, categoriaCorta: "Figura", idioma: "Otro", precio: 26000, stock: 4, vendidos: 6, descripcion: "24 días, 24 sorpresas. Si lo pedís ya, llega justo para diciembre." },
  { slug: "tin-trio-mega-forces", nombre: "Tin trío Mega Forces", categoria: TIN, categoriaCorta: "Tin", idioma: "Español", precio: 12500, stock: 8, vendidos: 9, descripcion: "Latita con sobres. Diseño al azar." },
  { slug: "mini-tin-mega-heroes", nombre: "Mini tin Mega Heroes", categoria: TIN, categoriaCorta: "Mini tin", idioma: "Español", precio: 9500, stock: 9, vendidos: 11, descripcion: "Latita pequeña con sobres y arte para coleccionar." },
  { slug: "tin-poke-ball", nombre: "Tin Poké Ball", categoria: TIN, idioma: "Inglés", precio: 16500, stock: 5, vendidos: 8, descripcion: "La lata con forma de Poké Ball, con sobres adentro." },
  { slug: "tin-paradox-clash", nombre: "Tin Paradox Clash", categoria: TIN, idioma: "Inglés", precio: 14500, precioAntes: 17000, stock: 4, etiqueta: "Oferta", vendidos: 5, descripcion: "Lata de colección con sobres y carta promocional." },
  { slug: "tin-azure-legends", nombre: "Tin Azure Legends", categoria: TIN, idioma: "Español", precio: 18000, stock: 6, vendidos: 7, descripcion: "Lata con sobres y una carta promocional. Diseño al azar." },
  { slug: "sobre-abyss-eye", nombre: "Sobre Abyss Eye", categoria: SOBRE, idioma: "Japonés", precio: 3500, stock: 18, vendidos: 12, descripcion: "Sobre japonés para probar suerte sin gastar mucho." },
  { slug: "sobre-ninja-spinner", nombre: "Sobre Ninja Spinner", categoria: SOBRE, idioma: "Japonés", precio: 3500, stock: 0, vendidos: 25, descripcion: "Volaron. Dejá tus datos y te avisamos cuando vuelvan." },
  { slug: "sleeved-temporal-forces", nombre: "Sleeved booster Temporal Forces", categoria: BLISTER, idioma: "Español", precio: 4900, stock: 12, vendidos: 8, descripcion: "Sobre con empaque protector, ideal para regalar." },
  { slug: "sleeved-chaos-rising", nombre: "Sleeved booster Chaos Rising", categoria: BLISTER, idioma: "Español", precio: 5200, stock: 16, vendidos: 14, descripcion: "Sobre con empaque protector. Diseño al azar." },
  { slug: "build-and-battle-pitch-black", nombre: "Build & Battle Pitch Black", categoria: MAZO, idioma: "Español", precio: 13500, stock: 6, vendidos: 4, descripcion: "Armá tu mazo desde cero con la colección más nueva." },
  { slug: "deck-mundial-2025", nombre: "Mazo del Mundial 2025", categoria: MAZO, idioma: "Inglés", precio: 17500, precioAntes: 21000, stock: 4, etiqueta: "Oferta", vendidos: 3, descripcion: "El mazo de un competidor del Mundial, listo para jugar. Diseño al azar." },
  { slug: "battle-academy-2", nombre: "Battle Academy 2", categoria: MAZO, idioma: "Inglés", precio: 27000, stock: 4, vendidos: 6, descripcion: "Tres mazos y un tablero para aprender a jugar en la mesa de la casa." },
  { slug: "caja-palafin-ex", nombre: "Caja Palafin ex", categoria: PREMIUM, categoriaCorta: "Caja ex", idioma: "Español", precio: 11500, precioAntes: 13500, stock: 5, etiqueta: "Oferta", vendidos: 4, descripcion: "Caja con carta promocional y sobres." },
  { slug: "caja-hops-zacian-ex", nombre: "Caja Zacian ex de Hop", categoria: PREMIUM, categoriaCorta: "Caja ex", idioma: "Español", precio: 17500, stock: 5, vendidos: 7, descripcion: "Caja con carta promocional y sobres." },
  { slug: "caja-ex-ascended-heroes", nombre: "Caja Mega Meganium ex Ascended Heroes", categoria: PREMIUM, categoriaCorta: "Caja ex", idioma: "Español", precio: 19500, stock: 6, vendidos: 9, descripcion: "Caja con carta promocional y sobres. Diseño al azar." },
  { slug: "set-premium-espeon-umbreon", nombre: "Set premium Espeon y Umbreon", categoria: PREMIUM, idioma: "Japonés", precio: 36000, stock: 3, vendidos: 10, descripcion: "Set japonés del aniversario 30 con mazos de Espeon y Umbreon." },
  { slug: "premium-mega-zygarde-ex", nombre: "Colección premium Mega Zygarde ex", categoria: PREMIUM, idioma: "Español", precio: 38000, stock: 4, vendidos: 5, descripcion: "Colección con sobres, cartas promocionales y arte de Mega Zygarde." },
  { slug: "booster-bundle-temporal-forces", nombre: "Booster Bundle Temporal Forces", categoria: BUNDLE, idioma: "Español", precio: 23000, stock: 5, vendidos: 6, descripcion: "Seis sobres de un solo." },
  { slug: "booster-bundle-paradox-rift", nombre: "Booster Bundle Paradox Rift", categoria: BUNDLE, idioma: "Español", precio: 19900, precioAntes: 23000, stock: 6, etiqueta: "Oferta", vendidos: 8, descripcion: "Seis sobres a precio de ganga. Hasta que se acaben." },
  { slug: "booster-bundle-shrouded-fable", nombre: "Booster Bundle Fábula Sombría", categoria: BUNDLE, idioma: "Español", precio: 24000, stock: 4, vendidos: 5, descripcion: "Seis sobres de una de las colecciones más lindas de la temporada." },
  { slug: "booster-box-terastal-festival", nombre: "Booster Box Terastal Festival", categoria: BOX, idioma: "Japonés", precio: 46000, stock: 3, vendidos: 9, descripcion: "Caja japonesa llena de eeveelutions. Sellada." },
  { slug: "booster-box-shiny-treasure", nombre: "Booster Box Shiny Treasure", categoria: BOX, idioma: "Japonés", precio: 48000, stock: 2, vendidos: 11, descripcion: "La caja japonesa de los shiny. Sellada." },
  { slug: "booster-box-mega-dream", nombre: "Booster Box Mega Dream", categoria: BOX, idioma: "Japonés", precio: 52000, stock: 3, vendidos: 7, descripcion: "Caja japonesa sellada, de las que dan gusto abrir." },
  { slug: "booster-box-glory-team-rocket", nombre: "Booster Box Glory of Team Rocket", categoria: BOX, idioma: "Japonés", precio: 54000, stock: 2, vendidos: 8, descripcion: "El Team Rocket volvió y viene en caja japonesa sellada." },
  { slug: "booster-box-stellar-crown", nombre: "Booster Box Stellar Crown", categoria: BOX, idioma: "Español", precio: 85000, stock: 2, vendidos: 3, descripcion: "Caja completa en español. Sellada de fábrica." },
  { slug: "booster-box-chaos-rising", nombre: "Booster Box Chaos Rising", categoria: BOX, idioma: "Español", precio: 98000, stock: 3, vendidos: 4, descripcion: "Caja completa en español, para abrir con los compas." },
  { slug: "ultra-premium-prismatic-evolutions", nombre: "Super-Premium Prismatic Evolutions", categoria: PREMIUM, categoriaCorta: "Premium", idioma: "Inglés", precio: 165000, stock: 1, vendidos: 2, descripcion: "La colección más buscada de Prismatic Evolutions. Hay una y es para quien se apure." },
  { slug: "super-premium-charizard-ex", nombre: "Super-Premium Charizard ex", categoria: PREMIUM, categoriaCorta: "Premium", idioma: "Español", precio: 79000, stock: 2, vendidos: 6, descripcion: "Caja grande con sobres, cartas promocionales y mucho Charizard." },
  { slug: "caja-misteriosa-grande", nombre: "Caja misteriosa La Grande", categoria: MISTERIOSA, idioma: "Otro", precio: 50000, stock: 3, vendidos: 8, descripcion: "La más grande: producto sellado, cartas raras y un accesorio grande. Deke la arma a mano." },
  { slug: "caja-misteriosa-mediana", nombre: "Caja misteriosa Mediana", categoria: MISTERIOSA, idioma: "Otro", precio: 25000, stock: 6, vendidos: 17, descripcion: "Sobres, una carta rara y un accesorio. Deke la arma a mano. Abrila grabando." },
  { slug: "caja-misteriosa-chiquita", nombre: "Caja misteriosa Chiquita", categoria: MISTERIOSA, idioma: "Otro", precio: 10000, stock: 10, vendidos: 26, descripcion: "Un sobre, cartas sueltas y un detallito. Perfecta para probar." },
  { slug: "booster-bundle-ascended-heroes", nombre: "Booster Bundle Ascended Heroes", categoria: BUNDLE, idioma: "Español", precio: 29500, stock: 7, vendidos: 15, descripcion: "Seis sobres de la colección que todo el mundo anda buscando." },
  { slug: "etb-chaos-rising", nombre: "ETB Chaos Rising", categoria: ETB, idioma: "Español", precio: 46000, stock: 5, etiqueta: "Nuevo", vendidos: 7, descripcion: "Sellada de fábrica. Trae sobres, fundas, dados y la caja para guardar tus cartas." },
  { slug: "preventa-mini-tin-30th", nombre: "Mini tin 30th Celebration", categoria: TIN, categoriaCorta: "Mini tin", idioma: "Inglés", precio: 10500, stock: 12, etiqueta: "Preventa", llegada: FEBRERO, vendidos: 6, descripcion: "Apartá tu latita del aniversario 30. Diseño al azar." },
  { slug: "preventa-etb-30th-celebration", nombre: "ETB 30th Celebration", categoria: ETB, idioma: "Inglés", precio: 58000, stock: 5, etiqueta: "Preventa", llegada: FEBRERO, vendidos: 11, descripcion: "La ETB del aniversario 30. Apartá con adelanto: esta se va a volar." },
  { slug: "preventa-booster-box-pitch-black", nombre: "Booster Box Pitch Black", categoria: BOX, idioma: "Inglés", precio: 82000, stock: 3, etiqueta: "Preventa", llegada: ENERO, vendidos: 4, descripcion: "Caja completa y sellada. Apartá con adelanto y te avisamos apenas llegue." },
  { slug: "preventa-etb-pitch-black", nombre: "ETB Pitch Black", categoria: ETB, idioma: "Inglés", precio: 49000, stock: 6, etiqueta: "Preventa", llegada: ENERO, vendidos: 5, descripcion: "Apartá la tuya con un adelanto y pagás el resto cuando llegue." },
  { slug: "preventa-premium-mega-greninja", nombre: "Colección premium Mega Greninja ex", categoria: PREMIUM, idioma: "Español", precio: 30000, stock: 5, etiqueta: "Preventa", llegada: GRENINJA, vendidos: 7, descripcion: "Colección con sobres y cartas promocionales. Apartá con adelanto." },
  { slug: "preventa-sleeved-delta-reign", nombre: "Sleeved booster Delta Reign", categoria: BLISTER, idioma: "Inglés", precio: 5500, stock: 20, etiqueta: "Preventa", llegada: DICIEMBRE, vendidos: 9, descripcion: "Apartá tus sobres de la colección que viene." },
  { slug: "blister-3-sobres-delta-reign", nombre: "Blister 3 sobres Delta Reign", categoria: BLISTER, idioma: "Inglés", precio: 14900, stock: 8, etiqueta: "Preventa", llegada: DICIEMBRE, vendidos: 5, descripcion: "Tres sobres y una carta promocional. Apartá con adelanto." },
  { slug: "booster-bundle-delta-reign", nombre: "Booster Bundle Delta Reign", categoria: BUNDLE, idioma: "Inglés", precio: 30000, stock: 8, etiqueta: "Preventa", llegada: DICIEMBRE, vendidos: 8, descripcion: "Seis sobres de la colección que viene. Apartá con adelanto." },
];

type SemillaCarta = {
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  vendidos: number;
  coleccion: string;
  numero: string;
  rareza: string;
  condicion?: string;
  etiqueta?: Producto["etiqueta"];
};

const CARTAS: SemillaCarta[] = [
  { slug: "giovanni-charisma-carta-suelta", nombre: "Giovanni's Charisma", precio: 7500, stock: 3, vendidos: 4, coleccion: "151", numero: "204/165", rareza: "Special Illustration Rare" },
  { slug: "erika-invitation-carta-suelta", nombre: "Erika's Invitation", precio: 8500, stock: 2, vendidos: 6, coleccion: "151", numero: "203/165", rareza: "Special Illustration Rare" },
  { slug: "charizard-ex-dorada-carta-suelta", nombre: "Charizard ex dorada", precio: 17500, stock: 2, vendidos: 9, coleccion: "Obsidian Flames", numero: "228/197", rareza: "Hyper Rare" },
  { slug: "ivysaur-carta-suelta", nombre: "Ivysaur", precio: 19500, stock: 2, vendidos: 3, coleccion: "151", numero: "167/165", rareza: "Illustration Rare" },
  { slug: "iono-carta-suelta", nombre: "Iono", precio: 23000, stock: 2, vendidos: 12, coleccion: "Paldea Evolved", numero: "269/193", rareza: "Special Illustration Rare" },
  { slug: "charmeleon-carta-suelta", nombre: "Charmeleon", precio: 27000, stock: 1, vendidos: 4, coleccion: "151", numero: "169/165", rareza: "Illustration Rare" },
  { slug: "alakazam-ex-carta-suelta", nombre: "Alakazam ex", precio: 29000, stock: 2, vendidos: 3, coleccion: "151", numero: "201/165", rareza: "Special Illustration Rare" },
  { slug: "bulbasaur-carta-suelta", nombre: "Bulbasaur", precio: 30000, stock: 1, vendidos: 5, coleccion: "151", numero: "166/165", rareza: "Illustration Rare" },
  { slug: "pikachu-carta-suelta", nombre: "Pikachu", precio: 33000, stock: 2, vendidos: 15, coleccion: "151", numero: "173/165", rareza: "Illustration Rare" },
  { slug: "zapdos-ex-carta-suelta", nombre: "Zapdos ex", precio: 41000, stock: 1, vendidos: 3, coleccion: "151", numero: "202/165", rareza: "Special Illustration Rare" },
  { slug: "charmander-carta-suelta", nombre: "Charmander", precio: 42000, stock: 1, vendidos: 6, coleccion: "151", numero: "168/165", rareza: "Illustration Rare" },
  { slug: "squirtle-carta-suelta", nombre: "Squirtle", precio: 45000, stock: 1, vendidos: 7, coleccion: "151", numero: "170/165", rareza: "Illustration Rare" },
  { slug: "venusaur-ex-carta-suelta", nombre: "Venusaur ex", precio: 46000, stock: 1, vendidos: 2, coleccion: "151", numero: "198/165", rareza: "Special Illustration Rare" },
  { slug: "charizard-ex-obsidian-flames-carta-suelta", nombre: "Charizard ex Obsidian Flames", precio: 47000, stock: 1, vendidos: 8, coleccion: "Obsidian Flames", numero: "223/197", rareza: "Special Illustration Rare" },
  { slug: "blastoise-ex-carta-suelta", nombre: "Blastoise ex", precio: 55000, stock: 1, vendidos: 4, coleccion: "151", numero: "200/165", rareza: "Special Illustration Rare" },
  { slug: "eevee-ex-carta-suelta", nombre: "Eevee ex", precio: 82000, stock: 1, vendidos: 5, coleccion: "Prismatic Evolutions", numero: "167/131", rareza: "Special Illustration Rare" },
  { slug: "mewtwo-vstar-carta-suelta", nombre: "Mewtwo VSTAR", precio: 115000, stock: 1, vendidos: 2, coleccion: "Crown Zenith", numero: "GG44/GG70", rareza: "Galarian Gallery" },
  { slug: "charizard-ex-paldean-fates-carta-suelta", nombre: "Charizard ex Paldean Fates", precio: 125000, stock: 1, vendidos: 4, coleccion: "Paldean Fates", numero: "234/091", rareza: "Special Illustration Rare" },
  { slug: "espeon-ex-carta-suelta", nombre: "Espeon ex", precio: 140000, stock: 1, vendidos: 2, coleccion: "Prismatic Evolutions", numero: "155/131", rareza: "Special Illustration Rare" },
  { slug: "greninja-ex-carta-suelta", nombre: "Greninja ex", precio: 155000, stock: 1, vendidos: 3, coleccion: "Twilight Masquerade", numero: "214/167", rareza: "Special Illustration Rare" },
  { slug: "magikarp-carta-suelta", nombre: "Magikarp", precio: 170000, stock: 1, vendidos: 2, coleccion: "Paldea Evolved", numero: "203/193", rareza: "Illustration Rare" },
  { slug: "mew-ex-paldean-fates-carta-suelta", nombre: "Mew ex Paldean Fates", precio: 420000, stock: 1, vendidos: 1, coleccion: "Paldean Fates", numero: "232/091", rareza: "Special Illustration Rare" },
  { slug: "rayquaza-vmax-carta-suelta", nombre: "Rayquaza VMAX", precio: 595000, stock: 1, vendidos: 1, coleccion: "Evolving Skies", numero: "218/203", rareza: "Secret Rare", etiqueta: "Nuevo" },
  { slug: "umbreon-ex-carta-suelta", nombre: "Umbreon ex", precio: 620000, stock: 1, vendidos: 1, coleccion: "Prismatic Evolutions", numero: "161/131", rareza: "Special Illustration Rare", etiqueta: "Nuevo" },
];

const GRADADAS: SemillaCarta[] = [
  { slug: "iono-gradada-10", nombre: "Iono gradada 10", precio: 62000, stock: 1, vendidos: 1, coleccion: "Paldea Evolved", numero: "269/193", rareza: "Special Illustration Rare", condicion: "Gradada 10" },
  { slug: "eevee-ex-gradada-10", nombre: "Eevee ex gradada 10", precio: 145000, stock: 1, vendidos: 1, coleccion: "Prismatic Evolutions", numero: "167/131", rareza: "Special Illustration Rare", condicion: "Gradada 10" },
  { slug: "greninja-ex-gradada-9", nombre: "Greninja ex gradada 9", precio: 198000, stock: 1, vendidos: 1, coleccion: "Twilight Masquerade", numero: "214/167", rareza: "Special Illustration Rare", condicion: "Gradada 9" },
  { slug: "charizard-ex-gradada-10", nombre: "Charizard ex gradada 10", precio: 265000, stock: 1, vendidos: 2, coleccion: "Paldean Fates", numero: "234/091", rareza: "Special Illustration Rare", condicion: "Gradada 10" },
];

/** No sale en el catálogo: se compra escogiendo sobre en /caja-compartida. */
export const CUPO_COMPARTIDA: Producto = {
  id: "D001",
  slug: "sobre-caja-compartida-chaos-rising",
  nombre: "Sobre de la caja compartida de Chaos Rising",
  juego: "Pokémon",
  categoria: "Caja compartida",
  categoriaCorta: "Caja compartida",
  idioma: "Español",
  precio: 3000,
  stock: 36,
  vendidos: 0,
  orden: 0,
  enlace: "/caja-compartida",
  fotos: ["/productos/booster-box-chaos-rising.webp"],
  descripcion: "Un sobre de la caja, abierto en vivo.",
};

const base = (orden: number) => ({
  id: `C${String(orden + 4).padStart(3, "0")}`,
  juego: "Pokémon",
  orden,
});

export function inventarioNuevo(ordenInicial: number): Producto[] {
  const siguiente = ordenInicial + GRADADAS.length;

  const cartas = CARTAS.map(
    ({ coleccion, numero, rareza, condicion, nombre, ...semilla }, indice) => ({
      ...semilla,
      ...base(siguiente + indice),
      nombre: `${nombre} (carta suelta)`,
      categoria: "Carta suelta (single)",
      categoriaCorta: "Suelta",
      idioma: "Inglés",
      fotos: [`/productos/${semilla.slug}.webp`],
      descripcion: `${coleccion}, número ${numero}. Guardada en funda y toploader desde que salió del sobre.`,
      carta: {
        coleccion,
        numero,
        rareza,
        condicion: condicion ?? "Near Mint",
      },
    }),
  );

  const gradadas = GRADADAS.map(
    ({ coleccion, numero, rareza, condicion, ...semilla }, indice) => ({
      ...semilla,
      ...base(ordenInicial + indice),
      categoria: "Carta gradada",
      categoriaCorta: "Gradada",
      idioma: "Inglés",
      fotos: [`/productos/${semilla.slug}.webp`],
      descripcion: `Carta gradada de ${coleccion}. Pieza única: cuando se va, se fue.`,
      carta: {
        coleccion,
        numero,
        rareza,
        condicion: condicion ?? "Gradada",
      },
    }),
  );

  const sellado = SELLADO.map((semilla, indice) => ({
    categoriaCorta: CORTAS[semilla.categoria],
    ...semilla,
    ...base(siguiente + cartas.length + indice),
    fotos: [`/productos/${semilla.slug}.webp`],
  }));

  return [...sellado, ...gradadas, ...cartas];
}

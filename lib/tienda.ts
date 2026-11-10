import { conMayusculas } from "./formato";
// Datos generales de la tienda.

export const TIENDA = {
  nombre: "Pokedeke",
  sinpe: "8781-2831",
  whatsapp: "50687812831",
  // Servicio al cliente: llega a la cuenta de la tienda por Cloudflare Email Routing.
  correo: "sac@pokedeke.store",
  plazoPagoHoras: 24,
  adelantoPreventa: 0.5,
};

/** Subcarpeta donde vive la página. En la compu va vacía. */
export const RUTA_BASE = process.env.NEXT_PUBLIC_RUTA_BASE ?? "";

/** La dirección oficial: Google solo debe mostrar esta, no la copia de GitHub Pages. */
export const SITIO = "https://pokedeke.store";
export const INDEXAR = !RUTA_BASE;

/** Dirección del servidor de la hoja (apps-script/Pedidos.gs). */
export const PEDIDOS_URL = process.env.NEXT_PUBLIC_PEDIDOS_URL ?? "";

/** Sin esto la página es una demo: nadie debe pagar si el pedido no se anota. */
export const TIENDA_ABIERTA =
  PEDIDOS_URL !== "" && process.env.NEXT_PUBLIC_TIENDA_ABIERTA === "si";

export const LEMA = "Del mezzanine a tu colección";

export const LUGAR = {
  nombre: "Edificio Omni",
  zona: "San José centro",
  mapa: "https://www.google.com/maps/search/?api=1&query=Edificio%20Omni%20San%20Jos%C3%A9%20Costa%20Rica",
};

export type OpcionEnvio = {
  id: string;
  nombre: string;
  detalle: string;
  pideDireccion: boolean;
  /** El cliente elige la tienda de TIENDAS_DESTINO, u "Otra tienda". */
  pideTienda?: boolean;
  /** Sale en los días de despacho (miércoles y sábados). */
  despacho?: boolean;
};

export type TiendaDestino = {
  id: string;
  nombre: string;
  detalle: string;
  precio: number;
};

/**
 * A dónde mandamos con envío entre tiendas y cuánto cuesta. El envío va en el
 * mismo SINPE. Debe coincidir con CONFIG.tiendas en apps-script/Pedidos.gs.
 */
export const TIENDAS_DESTINO: TiendaDestino[] = [
  {
    id: "kira-barrio-chino",
    nombre: "Kira Shop / Barrio Chino",
    detalle: "Costado este del Parque de las Garantías Sociales.",
    precio: 600,
  },
  {
    id: "perron-zapote",
    nombre: "Perron Store / Zapote",
    detalle: "Centro Comercial Plaza del Castillo.",
    precio: 800,
  },
  {
    id: "omega-heredia",
    nombre: "OMEGA Card Games Store / Heredia",
    detalle: "125 metros al norte de la Municipalidad de Heredia.",
    precio: 700,
  },
  {
    id: "omega-alajuela",
    nombre: "OMEGA Card Games Store / Alajuela",
    detalle: "175 metros al norte de la Municipalidad de Alajuela.",
    precio: 900,
  },
  {
    id: "omega-cartago",
    nombre: "OMEGA Card Games Store / Cartago",
    detalle: "100 metros noroeste de los Tribunales de Justicia de Cartago.",
    precio: 900,
  },
];

/** Una tienda que no está en la lista: el precio se confirma por WhatsApp. */
export const OTRA_TIENDA = "otra";

export const ENVIO_TIENDAS_DESDE = Math.min(
  ...TIENDAS_DESTINO.map((tienda) => tienda.precio),
);

export const DIAS_DE_DESPACHO = "los Miércoles y Sábados";

/**
 * "Vendenos tus cartas" queda guardada sin enlaces hasta Enero de 2027: la
 * página /vender sigue existiendo, pero nada la anuncia. Para abrirla, true.
 */
export const VENDER_ABIERTO = false;

/**
 * Encargos de Estados Unidos: el cliente pide cualquier producto TCG y se le
 * cotiza por WhatsApp. El formulario se esconde solo después de `hasta`.
 */
export const ENCARGOS_EEUU = {
  hasta: "2026-11-30T23:59:59-06:00",
  entrega: "2026-12-06T12:00:00-06:00",
};
const ZONA_CR = "America/Costa_Rica";
const SEMANA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Días que faltan para despachar, según el día del pedido (0 es domingo).
const FALTAN_PARA_DESPACHO = [3, 2, 1, 3, 2, 1, 4];

/**
 * Lo que se pide de sábado a martes sale el miércoles; de miércoles a viernes,
 * el sábado. Debe calcular igual que diaDeDespacho en apps-script/Pedidos.gs.
 */
export function diaDeDespacho(desde: Date = new Date()) {
  const dia = SEMANA.indexOf(
    new Intl.DateTimeFormat("en-US", { timeZone: ZONA_CR, weekday: "short" }).format(desde),
  );
  return new Date(desde.getTime() + FALTAN_PARA_DESPACHO[dia] * 86_400_000);
}

/** "Miércoles 12 de Noviembre". */
export function fechaDeDespacho(desde: Date = new Date()) {
  return conMayusculas(
    new Intl.DateTimeFormat("es-CR", {
      timeZone: ZONA_CR,
      weekday: "long",
      day: "numeric",
      month: "long",
    })
      .format(diaDeDespacho(desde))
      .replace(",", ""),
  );
}

/** Deben coincidir con CONFIG.envios en apps-script/Pedidos.gs. */
export const ENVIOS: OpcionEnvio[] = [
  {
    id: "correos",
    nombre: "Correos de Costa Rica",
    detalle: "A todo el país, con rastreo. Depende de tu cantón y del peso",
    pideDireccion: true,
    despacho: true,
  },
  {
    id: "entre-tiendas",
    nombre: "Envío entre tiendas",
    detalle: "Lo retirás en una tienda de cartas. Tarda según la tienda",
    pideDireccion: false,
    pideTienda: true,
    despacho: true,
  },
  {
    id: "retiro-omni",
    nombre: "Retiro en Edificio Omni",
    detalle: "Gratis, cuadramos día y hora por WhatsApp",
    pideDireccion: false,
  },
];

/**
 * Tarifa EMS Nacional Paquetes saliendo de la GAM, con el 13% de IVA incluido.
 * Fuente: correos.go.cr/servicio-ems, revisada el 6/11/2026.
 * Debe coincidir con CONFIG en apps-script/Pedidos.gs.
 */
export const TARIFA_CORREOS = {
  gam: { primerKilo: 2450, kiloAdicional: 1400 },
  resto: { primerKilo: 3350, kiloAdicional: 1550 },
};

/** Gramos que se le suman al pedido por la caja y el relleno. */
export const PESO_EMPAQUE = 100;

/** Los 31 cantones de la GAM, escritos como en datos/ubicaciones-cr.json. */
export const CANTONES_GAM: Record<string, string[]> = {
  "San José": [
    "Central",
    "Escazú",
    "Desamparados",
    "Aserrí",
    "Mora",
    "Goicoechea",
    "Santa Ana",
    "Alajuelita",
    "Vázquez De Coronado",
    "Tibás",
    "Moravia",
    "Montes De Oca",
    "Curridabat",
  ],
  Alajuela: ["Central", "Atenas", "Poás"],
  Cartago: [
    "Central",
    "Paraíso",
    "La Unión",
    "Alvarado",
    "Oreamuno",
    "El Guarco",
  ],
  Heredia: [
    "Central",
    "Barva",
    "Santo Domingo",
    "Santa Barbara",
    "San Rafael",
    "San Isidro",
    "Belén",
    "Flores",
    "San Pablo",
  ],
};

/** Correos cobra por kilo empezado, y el primer kilo cubre desde el primer gramo. */
export function tarifaCorreos(provincia: string, canton: string, gramos: number) {
  const zona = CANTONES_GAM[provincia]?.includes(canton) ? "gam" : "resto";
  const tarifa = TARIFA_CORREOS[zona];
  const kilos = Math.max(Math.ceil((gramos + PESO_EMPAQUE) / 1000), 1);
  return tarifa.primerKilo + (kilos - 1) * tarifa.kiloAdicional;
}

export type Cupon = {
  codigo: string;
  tipo: "porcentaje" | "monto";
  valor: number;
};

/**
 * Apagados hasta decidir las promociones. Para activar uno, agregalo aquí y en
 * CONFIG de apps-script/Pedidos.gs. CUPON_SOBRE (lib/sobre.ts) enciende el premio
 * del sobre del día.
 */
export const CUPONES: Cupon[] = [];

/** Desde este subtotal, Correos va por cuenta de la tienda. Es una propuesta. */
export const ENVIO_GRATIS_DESDE = 50000;

export function costoDeEnvio(costo: number, subtotal: number) {
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : costo;
}

/** Abre el chat con la tienda, con el mensaje ya escrito. */
export function enlaceWhatsApp(texto: string) {
  return `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/** Deja elegir a quién mandarle el mensaje. */
export function enlaceCompartir(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/** El Instagram de la tienda. */
export const INSTAGRAM = {
  usuario: "pokedek.cr",
  enlace: "https://www.instagram.com/pokedek.cr/",
};

/** Invitación al grupo de WhatsApp de la tienda (sin los datos de rastreo del enlace). */
export const ENLACE_GRUPO = "https://chat.whatsapp.com/LFK9vTc7v2q8l3YIqDm6Yc";

// Datos generales de la tienda.

export const TIENDA = {
  nombre: "Pokedeke",
  sinpe: "8781-2831",
  whatsapp: "50687812831",
  correo: "pokedekestore@gmail.com",
  plazoPagoHoras: 24,
  adelantoPreventa: 0.5,
};

/** Subcarpeta donde vive la página. En la compu va vacía. */
export const RUTA_BASE = process.env.NEXT_PUBLIC_RUTA_BASE ?? "";

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
  /** El cliente escribe a qué tienda se lo mandamos. */
  pideTienda?: boolean;
  /** Si existe, el envío no entra en el SINPE: el cliente lo paga al retirar. */
  cobroAlRetirar?: string;
};

/** Deben coincidir con CONFIG.envios en apps-script/Pedidos.gs. */
export const ENVIOS: OpcionEnvio[] = [
  {
    id: "correos",
    nombre: "Correos de Costa Rica",
    detalle: "A todo el país, con rastreo. Depende de tu cantón y del peso",
    pideDireccion: true,
  },
  {
    id: "entre-tiendas",
    nombre: "Envío entre tiendas",
    detalle: "Te lo mandamos a la tienda que nos digás. Tarda según la tienda",
    pideDireccion: false,
    pideTienda: true,
    cobroAlRetirar: "₡500 a ₡600",
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

export const ENLACE_GRUPO = enlaceWhatsApp(
  `¡Hola! Quiero unirme al grupo de WhatsApp de ${TIENDA.nombre}.`,
);

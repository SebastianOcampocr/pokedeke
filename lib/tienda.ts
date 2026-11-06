// Datos generales de la demo. Todo lo que cambia de tienda en tienda está aquí.

export const TIENDA = {
  nombre: "Pokedeke",
  sinpe: "8781-2831",
  correo: "pokedekestorecr@gmail.com",
  plazoPagoHoras: 24,
  adelantoPreventa: 0.5,
};

/** Subcarpeta donde vive la página. En la compu va vacía. */
export const RUTA_BASE = process.env.NEXT_PUBLIC_RUTA_BASE ?? "";

/**
 * Dirección del servidor de pedidos (apps-script/Pedidos.gs). Mientras esté
 * vacía la página es solo una demo: nadie debe pagar si el pedido no se anota.
 */
export const PEDIDOS_URL = process.env.NEXT_PUBLIC_PEDIDOS_URL ?? "";
export const TIENDA_ABIERTA = PEDIDOS_URL !== "";

export const LEMA = "Del mezzanine a tu colección";

export const LUGAR = {
  nombre: "Edificio Omni",
  zona: "San José centro",
  mapa: "https://www.google.com/maps/search/?api=1&query=Edificio%20Omni%20San%20Jos%C3%A9%20Costa%20Rica",
};

export const ENVIOS = [
  {
    id: "correos",
    nombre: "Correos de Costa Rica",
    detalle: "A cualquier parte del país",
    costo: 2500,
    pideDireccion: true,
  },
  {
    id: "retiro-omni",
    nombre: "Retiro en Edificio Omni",
    detalle: "Gratis, cuadramos día y hora por WhatsApp",
    costo: 0,
    pideDireccion: false,
  },
];

export type Cupon = {
  codigo: string;
  tipo: "porcentaje" | "monto";
  valor: number;
};

export const CUPONES: Cupon[] = [
  { codigo: "TICO10", tipo: "porcentaje", valor: 10 },
  { codigo: "BIENVENIDA", tipo: "monto", valor: 2000 },
  { codigo: "SOBRE5", tipo: "porcentaje", valor: 5 },
  { codigo: "DEKESHINY", tipo: "porcentaje", valor: 15 },
];

/** Desde este subtotal, Correos va por cuenta de la tienda. Es una propuesta. */
export const ENVIO_GRATIS_DESDE = 50000;

export function costoDeEnvio(costo: number, subtotal: number) {
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : costo;
}

export function enlaceWhatsApp(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export const ENLACE_GRUPO = enlaceWhatsApp(
  `¡Hola! Quiero unirme al grupo de WhatsApp de ${TIENDA.nombre}.`,
);

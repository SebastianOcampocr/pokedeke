import { PEDIDOS_URL, TIENDA_ABIERTA } from "./tienda";

/** Lo que el servidor de la hoja responde siempre: `ok` y, si falló, `error`. */
type Respuesta<T> = ({ ok: true } & T) | { ok: false; error: string };

export type PedidoNuevo = {
  cliente: string;
  whatsapp: string;
  correo: string;
  envio: string;
  ubicacion: string;
  direccion: string;
  /** Solo envío entre tiendas: el id de TIENDAS_DESTINO u "otra". */
  tienda?: string;
  /** Número anónimo del carrito, para marcarlo como "Pidió" en la pestaña Carritos. */
  carrito?: string;
  cupon: string | null;
  lineas: { slug: string; cantidad: number }[];
  /** Campo escondido: si viene lleno, lo mandó un robot. */
  sitio: string;
};

export type PedidoCreado = {
  numero: string;
  clave: string;
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  lineas: { nombre: string; cantidad: number; precio: number }[];
};

export type PedidoPublico = {
  numero: string;
  estado: string;
  total: number;
  envio: string;
  guia: string;
  lineas: { nombre: string; cantidad: number }[];
  /** Trae un pedido especial: "después del 5/12". */
  especial?: string;
};

const SIN_CONEXION = "No pudimos conectar. Revisá tu internet e intentá otra vez.";

/** Sin encabezados especiales: así el navegador no pide permiso previo a Google. */
async function enviar<T>(datos: object): Promise<Respuesta<T>> {
  try {
    const respuesta = await fetch(PEDIDOS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos),
    });
    return (await respuesta.json()) as Respuesta<T>;
  } catch {
    return { ok: false, error: SIN_CONEXION };
  }
}

/**
 * Anónimo: qué productos hay en un carrito, para la pestaña Carritos de la hoja.
 * No lleva nombre ni contacto. Si falla, no pasa nada.
 */
export function avisarCarrito(
  id: string,
  lineas: { slug: string; cantidad: number }[],
  alSalir = false,
) {
  if (!TIENDA_ABIERTA || !PEDIDOS_URL) return;
  const cuerpo = JSON.stringify({ accion: "carrito", id, lineas });
  if (alSalir && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      PEDIDOS_URL,
      new Blob([cuerpo], { type: "text/plain;charset=utf-8" }),
    );
    return;
  }
  void fetch(PEDIDOS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Comentario de la página Danos tu opinión. `sitio` es el campo trampa para
 * robots. `pedido` y `clave` vienen del correo de "¿Cómo te fue?": con ellos la
 * hoja sabe que es una compra real.
 */
export const mandarComentario = (datos: {
  calificacion: number;
  comentario: string;
  nombre: string;
  contacto: string;
  sitio: string;
  /** La persona marcó que se puede mostrar en la página. */
  permiso: boolean;
  pedido?: string;
  clave?: string;
}) => enviar<object>({ accion: "comentario", ...datos });

/** "Avisame cuando vuelva": la hoja escribe sola cuando vuelve a haber. */
export const pedirAviso = (slug: string, nombre: string, contacto: string) =>
  enviar<{ porCorreo?: boolean }>({ accion: "aviso", slug, nombre, contacto });

const ROBOT = /bot|crawl|spider|slurp|lighthouse|headless|preview/i;
/** Lo que ya se contó hoy en este navegador. Se vacía solo al cambiar el día. */
const CONTADOS = "pokedeke-contados";

/**
 * Anónimo: cuenta que alguien abrió un producto ("vista") o lo agregó al
 * carrito, para la pestaña Lo más visto. Una vez al día por navegador y
 * producto, para que recargar no infle la cuenta. Si falla, no pasa nada.
 */
export function contarVisita(slug: string, tipo: "vista" | "carrito") {
  if (!TIENDA_ABIERTA || !PEDIDOS_URL) return;
  if (navigator.webdriver || ROBOT.test(navigator.userAgent)) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const marca = `${tipo}:${slug}`;
  try {
    const guardado = JSON.parse(localStorage.getItem(CONTADOS) ?? "null") as {
      dia: string;
      marcas: string[];
    } | null;
    const marcas = guardado?.dia === hoy ? guardado.marcas : [];
    if (marcas.includes(marca)) return;
    localStorage.setItem(
      CONTADOS,
      JSON.stringify({ dia: hoy, marcas: [...marcas, marca] }),
    );
  } catch {
    // Sin almacenamiento se cuenta igual.
  }
  const cuerpo = JSON.stringify({ accion: "visto", slug, tipo });
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(
      PEDIDOS_URL,
      new Blob([cuerpo], { type: "text/plain;charset=utf-8" }),
    );
    return;
  }
  void fetch(PEDIDOS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => undefined);
}

export const crearPedido = (pedido: PedidoNuevo) =>
  enviar<PedidoCreado>({ accion: "pedido", ...pedido });

export const mandarComprobante = (
  numero: string,
  clave: string,
  comprobante: string,
) => enviar<object>({ accion: "comprobante", numero, clave, comprobante });

export const anotarInteresado = (
  nombre: string,
  contacto: string,
  producto: string,
) => enviar<object>({ accion: "interesado", nombre, contacto, producto });

/** Lo que la página necesita para el pago con tarjeta. Sin llaves en la hoja, no hay botón. */
export type ConfigPaypal = {
  clientId: string;
  modo: "sandbox" | "live";
  colonesPorDolar: number;
};

let configPaypalGuardada: Promise<ConfigPaypal | null> | null = null;

export function configPaypal() {
  if (!TIENDA_ABIERTA || !PEDIDOS_URL) return Promise.resolve(null);
  configPaypalGuardada ??= fetch(`${PEDIDOS_URL}?accion=paypal`)
    .then((respuesta) => respuesta.json())
    .then((datos) =>
      datos?.ok && datos.clientId
        ? ({
            clientId: String(datos.clientId),
            modo: datos.modo === "live" ? "live" : "sandbox",
            colonesPorDolar: Number(datos.colonesPorDolar) || 500,
          } as ConfigPaypal)
        : null,
    )
    .catch(() => null);
  return configPaypalGuardada;
}

/** El monto lo pone la hoja: aquí solo van el número y la clave del pedido. */
export const crearPagoPaypal = (numero: string, clave: string) =>
  enviar<{ id: string; dolares: string }>({ accion: "paypal-crear", numero, clave });

export const capturarPagoPaypal = (numero: string, clave: string, orden: string) =>
  enviar<{ numero: string }>({ accion: "paypal-capturar", numero, clave, orden });

export async function consultarPedido(
  numero: string,
  whatsapp: string,
): Promise<Respuesta<{ pedido: PedidoPublico }>> {
  const consulta = new URLSearchParams({ accion: "estado", numero, whatsapp });
  try {
    const respuesta = await fetch(`${PEDIDOS_URL}?${consulta}`);
    return (await respuesta.json()) as Respuesta<{ pedido: PedidoPublico }>;
  } catch {
    return { ok: false, error: SIN_CONEXION };
  }
}

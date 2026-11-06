import { PEDIDOS_URL } from "./tienda";

/** Lo que el servidor de la hoja responde siempre: `ok` y, si falló, `error`. */
type Respuesta<T> = ({ ok: true } & T) | { ok: false; error: string };

export type PedidoNuevo = {
  cliente: string;
  whatsapp: string;
  correo: string;
  envio: string;
  ubicacion: string;
  direccion: string;
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

"use client";

import { useMemo, useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { colones, fechaCorta } from "@/lib/formato";
import {
  actualizarPedido,
  ESTADOS,
  usePedidos,
  type Estado,
  type Pedido,
} from "@/lib/pedidos";
import { estaAgotado, PRODUCTOS } from "@/lib/productos";
import { RUTA_BASE, TIENDA_ABIERTA } from "@/lib/tienda";
import { IconoCheque } from "./Iconos";

const AVISOS: Partial<Record<Estado, string>> = {
  Pagado:
    "Venta anotada en la hoja con el canal Página web y correo enviado al cliente (simulado).",
  Enviado: "Correo con la guía enviado al cliente (simulado).",
  Entregado: "Correo de entrega enviado al cliente (simulado).",
};

const COBRADOS: Estado[] = ["Pagado", "Pagado (PayPal)", "Enviado", "Entregado"];

function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const [aviso, setAviso] = useState("");

  return (
    <article className="marco flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="font-display text-lg text-azul">{pedido.numero}</h3>
        <p className="text-sm text-gris">{fechaCorta(pedido.fecha)}</p>
      </div>
      <div className="text-[15px] leading-snug">
        <p className="font-bold">{pedido.cliente}</p>
        <p>
          {pedido.telefono} · {pedido.correo}
        </p>
        <p className="text-gris">
          {pedido.envio} · {pedido.ubicacion}
        </p>
      </div>
      <ul className="border-y-2 border-tinta py-2 text-[15px]">
        {pedido.lineas.map((linea) => (
          <li key={linea.id} className="flex justify-between gap-3">
            <span>
              {linea.cantidad} × {linea.nombre}
            </span>
            <span className="whitespace-nowrap">
              {colones(linea.precio * linea.cantidad)}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-3 font-extrabold">
        <span>Total · {pedido.metodoPago}</span>
        <span className="whitespace-nowrap">{colones(pedido.total)}</span>
      </p>
      <p className="text-sm text-gris">
        Comprobante: {pedido.referencia || "todavía no lo mandan"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`estado-${pedido.numero}`} className="rotulo-campo">
            Estado
          </label>
          <select
            id={`estado-${pedido.numero}`}
            className="campo"
            value={pedido.estado}
            onChange={(evento) => {
              const estado = evento.target.value as Estado;
              actualizarPedido(pedido.numero, { estado });
              setAviso(AVISOS[estado] ?? "");
            }}
          >
            {ESTADOS.map((estado) => (
              <option key={estado}>{estado}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`guia-${pedido.numero}`} className="rotulo-campo">
            Número de guía
          </label>
          <input
            id={`guia-${pedido.numero}`}
            className="campo"
            value={pedido.guia}
            onChange={(evento) =>
              actualizarPedido(pedido.numero, { guia: evento.target.value })
            }
          />
        </div>
      </div>
      {aviso ? (
        <p role="status" className="flex gap-2 text-sm font-bold text-verde-oscuro">
          <span className="shrink-0">
            <IconoCheque tamano={18} />
          </span>
          {aviso}
        </p>
      ) : null}
    </article>
  );
}

function Pedidos({ pedidos }: { pedidos: Pedido[] }) {
  const [filtro, setFiltro] = useState<Estado | "Todos">("Todos");
  const visibles = pedidos
    .filter((pedido) => filtro === "Todos" || pedido.estado === filtro)
    .reverse();

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["Todos", ...ESTADOS] as const).map((opcion) => {
          const cantidad =
            opcion === "Todos"
              ? pedidos.length
              : pedidos.filter((pedido) => pedido.estado === opcion).length;
          return (
            <button
              key={opcion}
              type="button"
              className="chip"
              aria-pressed={filtro === opcion}
              onClick={() => setFiltro(opcion)}
            >
              {opcion} ({cantidad})
            </button>
          );
        })}
      </div>
      {visibles.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visibles.map((pedido) => (
            <TarjetaPedido key={pedido.numero} pedido={pedido} />
          ))}
        </div>
      ) : (
        <p className="marco bg-crema p-4 font-bold">
          No hay pedidos en este estado.
        </p>
      )}
    </div>
  );
}

function Dato({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="marco shadow-dura flex flex-col gap-1 p-4">
      <p className="text-sm font-bold text-gris">{rotulo}</p>
      <p className="text-3xl font-extrabold text-azul">{valor}</p>
    </div>
  );
}

function ListaProductos({
  titulo,
  vacio,
  filas,
}: {
  titulo: string;
  vacio: string;
  filas: { id: string; nombre: string; detalle: string }[];
}) {
  return (
    <section>
      <h3 className="mb-2 font-display text-xl text-rojo">{titulo}</h3>
      {filas.length === 0 ? <p>{vacio}</p> : null}
      {filas.map((fila) => (
        <p
          key={fila.id}
          className="flex justify-between gap-4 border-b-2 border-tinta py-2 text-[15px] last:border-b-0"
        >
          <span>{fila.nombre}</span>
          <span className="font-bold whitespace-nowrap">{fila.detalle}</span>
        </p>
      ))}
    </section>
  );
}

function Numeros({ pedidos }: { pedidos: Pedido[] }) {
  const hoy = new Date().toDateString();
  const mes = new Date().toISOString().slice(0, 7);
  const cobrados = pedidos.filter((pedido) =>
    COBRADOS.includes(pedido.estado),
  );
  const venta = (lista: Pedido[]) =>
    lista.reduce((suma, pedido) => suma + pedido.total - pedido.costoEnvio, 0);
  const parados = PRODUCTOS.filter((producto) => producto.parado);
  // Las cartas son piezas únicas: tener una sola no es una alerta.
  const pocoStock = PRODUCTOS.filter(
    (producto) =>
      !estaAgotado(producto) &&
      !producto.carta &&
      producto.stock <= 3,
  )
    .sort((a, b) => a.stock - b.stock || b.vendidos - a.vendidos)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Dato
          rotulo="Ventas de hoy"
          valor={colones(
            venta(
              cobrados.filter(
                (pedido) => new Date(pedido.fecha).toDateString() === hoy,
              ),
            ),
          )}
        />
        <Dato
          rotulo="Ventas del mes"
          valor={colones(
            venta(cobrados.filter((pedido) => pedido.fecha.startsWith(mes))),
          )}
        />
        <Dato
          rotulo="Pendientes de pago"
          valor={String(
            pedidos.filter((pedido) => pedido.estado === "Pendiente de pago")
              .length,
          )}
        />
        <Dato rotulo="Productos parados" valor={String(parados.length)} />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <ListaProductos
          titulo="Parados"
          vacio="Nada parado por ahora."
          filas={parados.map((producto) => ({
            id: producto.id,
            nombre: producto.nombre,
            detalle: `${producto.stock} en stock`,
          }))}
        />
        <ListaProductos
          titulo="Poco stock"
          vacio="Todo con buen stock."
          filas={pocoStock.map((producto) => ({
            id: producto.id,
            nombre: producto.nombre,
            detalle: `Quedan ${producto.stock}`,
          }))}
        />
      </div>
    </div>
  );
}

function TextoWhatsApp() {
  const [copiado, setCopiado] = useState(false);
  const texto = useMemo(() => {
    const origen = `${window.location.origin}${RUTA_BASE}`;
    const lineas = PRODUCTOS.filter((producto) => !estaAgotado(producto)).map(
      (producto) =>
        `• ${producto.nombre}: ${colones(producto.precio)}\n${origen}/producto/${producto.slug}`,
    );
    return `*Disponible hoy*\n\n${lineas.join("\n\n")}\n\nPedí por la página o escribime por aquí.`;
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <label htmlFor="texto-whatsapp" className="rotulo-campo">
        Listo para pegar en los grupos
      </label>
      <textarea
        id="texto-whatsapp"
        readOnly
        rows={16}
        value={texto}
        className="campo font-mono text-sm"
      />
      <button type="button" onClick={copiar} className="boton boton-verde w-fit">
        {copiado ? "¡Copiado!" : "Copiar texto"}
      </button>
    </div>
  );
}

const PESTANAS = [
  { id: "pedidos", texto: "Pedidos" },
  { id: "numeros", texto: "Ventas y stock" },
  { id: "whatsapp", texto: "Texto para WhatsApp" },
] as const;

export function Panel() {
  const hidratado = useHidratado();
  const pedidos = usePedidos();
  const [pestana, setPestana] =
    useState<(typeof PESTANAS)[number]["id"]>("pedidos");

  if (!hidratado) return <p>Cargando el panel…</p>;

  if (TIENDA_ABIERTA) {
    return (
      <div className="flex flex-col gap-6">
        <p className="marco max-w-2xl bg-crema p-4 font-medium">
          Los pedidos se manejan en la pestaña Pedidos web de la hoja. Aquí
          queda el texto para los grupos. Las imágenes y textos para redes
          están en el{" "}
          <a href={RUTA_BASE + "/estudio"} className="font-bold underline">
            Estudio de contenido
          </a>
          .
        </p>
        <TextoWhatsApp />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PESTANAS.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className="chip"
            aria-pressed={pestana === opcion.id}
            onClick={() => setPestana(opcion.id)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
      {pestana === "pedidos" ? <Pedidos pedidos={pedidos} /> : null}
      {pestana === "numeros" ? <Numeros pedidos={pedidos} /> : null}
      {pestana === "whatsapp" ? <TextoWhatsApp /> : null}
    </div>
  );
}

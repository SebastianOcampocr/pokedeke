"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import ubicaciones from "@/datos/ubicaciones-cr.json";
import { useHidratado } from "@/lib/almacen";
import { crearPedido, mandarComprobante } from "@/lib/api-pedidos";
import { useCarrito, vaciarCarrito } from "@/lib/carrito";
import { lanzarConfeti } from "@/lib/confeti";
import { calcularTotales, colones } from "@/lib/formato";
import { ganarLogro } from "@/lib/logros";
import { refrescarInventario } from "@/lib/vivo";
import {
  actualizarPedido,
  guardarPedido,
  siguienteNumero,
  usePedidos,
  type Pedido,
} from "@/lib/pedidos";
import {
  costoDeEnvio,
  enlaceWhatsApp,
  ENVIO_GRATIS_DESDE,
  ENVIOS,
  LUGAR,
  type OpcionEnvio,
  TARIFA_CORREOS,
  tarifaCorreos,
  TIENDA,
  TIENDA_ABIERTA,
} from "@/lib/tienda";
import { Deke } from "./Deke";
import { IconoCheque } from "./Iconos";
import { CarritoVacio, Linea } from "./VistaCarrito";

const METODO_PAGO = "SINPE Móvil";

function Campo({
  id,
  rotulo,
  tipo = "text",
  autoCompletar,
  requerido = true,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  autoCompletar?: string;
  requerido?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        autoComplete={autoCompletar}
        className="campo"
        required={requerido}
      />
    </div>
  );
}

function SelectorUbicacion({
  id,
  rotulo,
  valor,
  opciones,
  alCambiar,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opciones: string[];
  alCambiar: (valor: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <select
        id={id}
        className="campo"
        required
        disabled={opciones.length === 0}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
      >
        <option value="">Elegí una opción</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function Opcion({
  grupo,
  activa,
  titulo,
  detalle,
  extra,
  alElegir,
}: {
  grupo: string;
  activa: boolean;
  titulo: string;
  detalle?: string;
  extra?: string;
  alElegir: () => void;
}) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border-2 border-tinta p-3 ${
        activa ? "bg-crema" : "bg-white"
      }`}
    >
      <input
        type="radio"
        name={grupo}
        checked={activa}
        onChange={alElegir}
        className="size-5 accent-azul"
      />
      <span className="flex grow flex-col">
        <span className="font-bold">{titulo}</span>
        {detalle ? <span className="text-sm text-gris">{detalle}</span> : null}
      </span>
      {extra ? <span className="font-extrabold whitespace-nowrap">{extra}</span> : null}
    </label>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-display text-[22px] text-rojo">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Confirmacion({
  pedido,
  precioCambio,
}: {
  pedido: Pedido;
  precioCambio: boolean;
}) {
  const [referencia, setReferencia] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const precioAparte = ENVIOS.find(
    (opcion) => opcion.nombre === pedido.envio,
  )?.precioAparte;

  useEffect(() => lanzarConfeti(), []);

  async function avisarPago(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (TIENDA_ABIERTA) {
      setEnviando(true);
      setError("");
      const respuesta = await mandarComprobante(
        pedido.numero,
        pedido.clave ?? "",
        referencia,
      );
      setEnviando(false);
      if (!respuesta.ok) {
        setError(respuesta.error);
        return;
      }
    }
    actualizarPedido(pedido.numero, { referencia });
    setEnviado(true);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="marco shadow-dura flex items-center gap-4 bg-crema p-5">
        <Deke animo="guino" className="deke h-24 shrink-0" />
        <div className="flex min-w-0 flex-col gap-2 overflow-x-clip">
          <p className="sello font-display text-2xl leading-tight text-azul">
            Pedido {pedido.numero} recibido
          </p>
          <p className="leading-snug">
            Gracias, {pedido.cliente.split(" ")[0]}. Tu producto queda apartado{" "}
            {TIENDA.plazoPagoHoras} horas mientras hacés el pago.
            {TIENDA_ABIERTA
              ? ` Te mandamos la confirmación a ${pedido.correo}.`
              : null}
          </p>
        </div>
      </div>

      <div className="marco flex flex-col gap-2 p-5">
        <p className="font-bold">
          {precioAparte ? "Tus productos suman:" : "Hacé el SINPE Móvil por:"}
        </p>
        <p className="text-4xl font-extrabold text-azul">
          {colones(pedido.total)}
        </p>
        {precioAparte ? (
          <p className="font-bold">
            Antes de pagar, esperá nuestro WhatsApp con el costo del envío entre
            tiendas. Hacé un solo SINPE por los productos más el envío.
          </p>
        ) : null}
        {precioCambio ? (
          <p role="status" className="font-bold text-rojo">
            Los precios se actualizaron: este es el monto correcto.
          </p>
        ) : null}
        <p className="mt-1">
          Al número <strong>{TIENDA.sinpe}</strong>. En el detalle poné{" "}
          <strong>{pedido.numero}</strong>.
        </p>
        {TIENDA_ABIERTA ? null : (
          <p className="text-sm text-gris">
            Esta página todavía es una demo: no pagués nada.
          </p>
        )}
      </div>

      {enviado ? (
        <p
          role="status"
          className="marco flex items-center gap-3 bg-white p-4 font-bold text-verde-oscuro"
        >
          <IconoCheque />
          Recibimos tu comprobante. Apenas confirmemos el SINPE te avisamos por
          correo y por WhatsApp.
        </p>
      ) : (
        <form className="marco flex flex-col gap-3 p-5" onSubmit={avisarPago}>
          <div>
            <label htmlFor="referencia" className="rotulo-campo">
              Número de comprobante del SINPE
            </label>
            <input
              id="referencia"
              className="campo"
              inputMode="numeric"
              required
              value={referencia}
              onChange={(evento) => setReferencia(evento.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="font-bold text-rojo">
              {error}
            </p>
          ) : null}
          <button type="submit" className="boton boton-rojo" disabled={enviando}>
            {enviando ? "Enviando…" : "Ya pagué"}
          </button>
        </form>
      )}

      <Link
        href={`/pedido?numero=${pedido.numero}`}
        className="boton boton-amarillo"
      >
        Ver el estado de mi pedido
      </Link>
      <a
        href={enlaceWhatsApp(`¡Hola! Les escribo por mi pedido ${pedido.numero}.`)}
        target="_blank"
        rel="noreferrer"
        className="boton boton-verde"
      >
        Escribinos por WhatsApp
      </a>
    </div>
  );
}

export function Pago() {
  const hidratado = useHidratado();
  const { lineas, cupon } = useCarrito();
  const pedidos = usePedidos();
  const [envioId, setEnvioId] = useState(ENVIOS[0].id);
  const [provincia, setProvincia] = useState("");
  const [canton, setCanton] = useState("");
  const [distrito, setDistrito] = useState("");
  const [confirmado, setConfirmado] = useState<Pedido | null>(null);
  const [precioCambio, setPrecioCambio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Next deja viva esta página al navegar: sin esto, la siguiente compra
  // mostraría la confirmación del pedido anterior en vez del formulario.
  useLayoutEffect(() => () => setConfirmado(null), []);

  if (confirmado) {
    return <Confirmacion pedido={confirmado} precioCambio={precioCambio} />;
  }
  if (!hidratado) return <p>Cargando…</p>;
  if (lineas.length === 0) return <CarritoVacio />;

  const envio = ENVIOS.find((opcion) => opcion.id === envioId) ?? ENVIOS[0];
  const { subtotal } = calcularTotales(lineas, cupon, 0);
  const gramos = lineas.reduce(
    (suma, { producto, cantidad }) => suma + (producto.peso ?? 0) * cantidad,
    0,
  );
  const costoCorreos = canton ? tarifaCorreos(provincia, canton, gramos) : null;
  const costoElegido = envio.pideDireccion ? costoCorreos : 0;
  const totales = calcularTotales(
    lineas,
    cupon,
    costoDeEnvio(costoElegido ?? 0, subtotal),
  );
  const faltaCanton = costoElegido === null && subtotal < ENVIO_GRATIS_DESDE;

  function precioDeOpcion({ pideDireccion, precioAparte }: OpcionEnvio) {
    if (precioAparte) return precioAparte;
    if (!pideDireccion || subtotal >= ENVIO_GRATIS_DESDE) return "Gratis";
    return costoCorreos === null
      ? `Desde ${colones(TARIFA_CORREOS.gam.primerKilo)}`
      : colones(costoCorreos);
  }

  const datosProvincia = ubicaciones.find((p) => p.nombre === provincia);
  const datosCanton = datosProvincia?.cantones.find((c) => c.nombre === canton);

  async function hacerPedido(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const datos = new FormData(evento.currentTarget);
    const texto = (campo: string) => String(datos.get(campo) ?? "").trim();
    let pedido: Pedido = {
      numero: siguienteNumero(pedidos),
      fecha: new Date().toISOString(),
      cliente: texto("nombre"),
      telefono: texto("telefono"),
      correo: texto("correo"),
      ubicacion: envio.pideDireccion
        ? [provincia, canton, distrito].join(", ")
        : envio.pideTienda
          ? ""
          : `${LUGAR.nombre}, San José`,
      direccion: envio.pideTienda
        ? texto("tienda")
        : texto("direccion") || "Retiro coordinado por WhatsApp",
      envio: envio.nombre,
      lineas: lineas.map(({ producto, cantidad, precio }) => ({
        id: producto.id,
        nombre: producto.nombre,
        cantidad,
        precio,
      })),
      subtotal: totales.subtotal,
      descuento: totales.descuento,
      costoEnvio: totales.envio,
      total: totales.total,
      metodoPago: METODO_PAGO,
      referencia: "",
      estado: "Pendiente de pago",
      guia: "",
    };

    if (TIENDA_ABIERTA) {
      setEnviando(true);
      setError("");
      const respuesta = await crearPedido({
        cliente: pedido.cliente,
        whatsapp: pedido.telefono,
        correo: pedido.correo,
        envio: envio.id,
        ubicacion: pedido.ubicacion,
        direccion: pedido.direccion,
        cupon: cupon?.codigo ?? null,
        lineas: lineas.map(({ producto, cantidad }) => ({
          slug: producto.slug,
          cantidad,
        })),
        sitio: texto("sitio"),
      });
      setEnviando(false);
      if (!respuesta.ok) {
        setError(respuesta.error);
        return;
      }
      void refrescarInventario();
      // Lo que manda es lo que calculó el servidor con los datos de la hoja.
      setPrecioCambio(respuesta.total !== pedido.total);
      pedido = {
        ...pedido,
        numero: respuesta.numero,
        clave: respuesta.clave,
        subtotal: respuesta.subtotal,
        descuento: respuesta.descuento,
        costoEnvio: respuesta.costoEnvio,
        total: respuesta.total,
      };
    }

    guardarPedido(pedido);
    vaciarCarrito();
    ganarLogro("pedido");
    setProvincia("");
    setCanton("");
    setDistrito("");
    setConfirmado(pedido);
    window.scrollTo({ top: 0 });
  }

  return (
    <form
      onSubmit={hacerPedido}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
    >
      <div className="flex flex-col gap-8">
        <Bloque titulo="Tus datos">
          <Campo id="nombre" rotulo="Nombre completo" autoCompletar="name" />
          <Campo
            id="telefono"
            rotulo="WhatsApp, para coordinar la entrega"
            tipo="tel"
            autoCompletar="tel"
          />
          <Campo
            id="correo"
            rotulo="Correo, para mandarte la confirmación"
            tipo="email"
            autoCompletar="email"
          />
          {/* Trampa para robots: la gente nunca ve este campo. */}
          <input
            type="text"
            name="sitio"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
        </Bloque>

        <Bloque titulo="Cómo te llega">
          {ENVIOS.map((opcion) => (
            <Opcion
              key={opcion.id}
              grupo="envio"
              activa={opcion.id === envio.id}
              titulo={opcion.nombre}
              detalle={opcion.detalle}
              extra={precioDeOpcion(opcion)}
              alElegir={() => setEnvioId(opcion.id)}
            />
          ))}
          {subtotal >= ENVIO_GRATIS_DESDE ? (
            <p className="text-sm font-bold text-verde-oscuro">
              Tu compra pasa de {colones(ENVIO_GRATIS_DESDE)}: el envío por
              Correos va por nuestra cuenta.
            </p>
          ) : null}

          {envio.pideTienda ? (
            <div className="mt-2 flex flex-col gap-2">
              <Campo
                id="tienda"
                rotulo="¿A qué tienda te lo enviamos? Nombre de la tienda y la sucursal"
              />
              <p className="text-sm leading-snug text-gris">
                El precio del envío varía según la tienda. Te escribimos por
                WhatsApp con el monto y lo pagás en el mismo SINPE de tu pedido.
              </p>
            </div>
          ) : null}

          {envio.pideDireccion ? (
            <div className="mt-2 flex flex-col gap-3">
              <SelectorUbicacion
                id="provincia"
                rotulo="Provincia"
                valor={provincia}
                opciones={ubicaciones.map((p) => p.nombre)}
                alCambiar={(valor) => {
                  setProvincia(valor);
                  setCanton("");
                  setDistrito("");
                }}
              />
              <SelectorUbicacion
                id="canton"
                rotulo="Cantón"
                valor={canton}
                opciones={datosProvincia?.cantones.map((c) => c.nombre) ?? []}
                alCambiar={(valor) => {
                  setCanton(valor);
                  setDistrito("");
                }}
              />
              <SelectorUbicacion
                id="distrito"
                rotulo="Distrito"
                valor={distrito}
                opciones={datosCanton?.distritos ?? []}
                alCambiar={setDistrito}
              />
              <Campo id="direccion" rotulo="Dirección exacta" />
            </div>
          ) : null}
        </Bloque>

        <Bloque titulo="Cómo pagás">
          <Opcion
            grupo="pago"
            activa
            titulo={METODO_PAGO}
            alElegir={() => undefined}
          />
          <div className="flex min-h-14 items-center justify-between gap-3 rounded-md border-2 border-dashed border-gris p-3 text-gris">
            <span className="font-bold">Tarjeta</span>
            <span className="text-sm">Muy pronto</span>
          </div>
        </Bloque>
      </div>

      <aside className="marco shadow-dura flex flex-col gap-3 p-4 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-azul">Tu pedido</h2>
        <ul className="flex flex-col gap-2 text-[15px]">
          {lineas.map(({ producto, cantidad, precio }) => (
            <li key={producto.slug} className="flex justify-between gap-3">
              <span className="min-w-0">
                {cantidad} × {producto.nombre}
              </span>
              <span className="whitespace-nowrap">
                {colones(precio * cantidad)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5 border-t-2 border-tinta pt-3">
          <Linea rotulo="Subtotal" monto={colones(totales.subtotal)} />
          {totales.descuento > 0 ? (
            <Linea
              rotulo={`Cupón ${cupon?.codigo}`}
              monto={`−${colones(totales.descuento)}`}
            />
          ) : null}
          <Linea
            rotulo="Envío"
            monto={
              envio.precioAparte
                ? "Por WhatsApp"
                : faltaCanton
                  ? "Falta tu cantón"
                  : totales.envio === 0
                    ? "Gratis"
                    : colones(totales.envio)
            }
          />
          <Linea rotulo="Total" monto={colones(totales.total)} fuerte />
          {envio.precioAparte ? (
            <p className="text-sm leading-snug text-gris">
              Más el envío, que te confirmamos por WhatsApp.
            </p>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="font-bold text-rojo">
            {error}
          </p>
        ) : null}
        <button type="submit" className="boton boton-rojo" disabled={enviando}>
          {enviando ? "Enviando tu pedido…" : "Hacer el pedido"}
        </button>
        <p className="text-sm leading-snug text-gris">
          Tu producto queda apartado {TIENDA.plazoPagoHoras} horas. Al seguir
          aceptás los{" "}
          <Link href="/politicas#terminos" className="underline">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/politicas#privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

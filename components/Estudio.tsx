"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { colones } from "@/lib/formato";
import {
  dibujarPlantilla,
  FORMATOS,
  TIPOS_DE_CONTENIDO,
  type TipoDeContenido,
} from "@/lib/plantillas";
import {
  buscarProducto,
  coincide,
  esPedidoEspecial,
  estaAgotado,
  PRODUCTOS,
} from "@/lib/productos";
import {
  altDe,
  captionDe,
  hashtagsDe,
  planDeLaSemana,
  PREGUNTAS,
  reelDe,
  whatsappDe,
} from "@/lib/textos-contenido";
import { conDatosVivos, useInventarioVivo } from "@/lib/vivo";

const SEMANA = 7 * 24 * 60 * 60 * 1000;

function Copiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="boton boton-amarillo boton-chico w-fit"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1800);
        } catch {
          setCopiado(false);
        }
      }}
    >
      {copiado ? "¡Copiado!" : rotulo}
    </button>
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
    <section className="marco flex flex-col gap-3 p-4">
      <h3 className="font-display text-lg text-rojo">{titulo}</h3>
      {children}
    </section>
  );
}

/**
 * Estudio de contenido: escoger un producto del catálogo y sacar la imagen y los
 * textos para Instagram y WhatsApp. Todo sale de los datos reales; nada se
 * publica solo: la imagen se descarga y la sube una persona.
 */
export function Estudio() {
  const hidratado = useHidratado();
  const vivo = useInventarioVivo();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [busqueda, setBusqueda] = useState("");
  const [slug, setSlug] = useState("");
  const [tipo, setTipo] = useState<TipoDeContenido>("disponible");
  const [formato, setFormato] = useState<string>(FORMATOS[1].id);
  const [motivo, setMotivo] = useState("");
  const [pregunta, setPregunta] = useState(PREGUNTAS[0]);
  const [version, setVersion] = useState(0);
  const [fotoLista, setFotoLista] = useState(true);

  const base = buscarProducto(slug);
  const producto = useMemo(
    () => (base ? conDatosVivos(base, vivo) : undefined),
    [base, vivo],
  );
  const esPregunta = tipo === "pregunta";
  const medida = FORMATOS.find((opcion) => opcion.id === formato) ?? FORMATOS[1];

  const encontrados = useMemo(
    () =>
      busqueda.trim().length < 2
        ? []
        : PRODUCTOS.filter((opcion) => coincide(opcion, busqueda)).slice(0, 6),
    [busqueda],
  );
  const plan = useMemo(
    () => (hidratado ? planDeLaSemana(Math.floor(Date.now() / SEMANA)) : []),
    [hidratado],
  );

  const precio = producto?.precio;
  useEffect(() => {
    if (!lienzo.current || (!esPregunta && !producto)) return;
    let vigente = true;
    void dibujarPlantilla(lienzo.current, {
      formato: medida,
      tipo,
      producto: esPregunta ? undefined : producto,
      motivo,
      pregunta,
    }).then((lista) => {
      if (vigente) setFotoLista(lista);
    });
    return () => {
      vigente = false;
    };
    // El precio en vivo cambia el dibujo; el resto del producto no cambia sin cambiar de slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, precio, tipo, medida, motivo, pregunta, esPregunta]);

  function descargar() {
    lienzo.current?.toBlob(
      (archivo) => {
        if (!archivo) return;
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(archivo);
        enlace.download =
          "pokedeke-" + (esPregunta ? "pregunta" : slug) + "-" + medida.id + ".jpg";
        enlace.click();
        window.setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
      },
      "image/jpeg",
      0.92,
    );
  }

  const listo = esPregunta || Boolean(producto);
  const caption = listo ? captionDe(tipo, version, producto, motivo, pregunta) : "";
  const hashtags = hashtagsDe(esPregunta ? undefined : producto);
  const reel = reelDe(tipo, version, producto);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          Qué publicar esta semana
        </h2>
        <p className="max-w-2xl text-[15px] leading-snug">
          Cinco ideas con lo que hay hoy en el catálogo. Cambian cada semana.
          Mejor pocas y buenas que muchas repetidas.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plan.map((sugerencia) => (
            <button
              key={sugerencia.dia}
              type="button"
              className="marco tarjeta flex flex-col gap-1 bg-crema p-3 text-left"
              onClick={() => {
                setTipo(sugerencia.tipo);
                setVersion(0);
                if (sugerencia.producto) setSlug(sugerencia.producto.slug);
                if (sugerencia.pregunta) setPregunta(sugerencia.pregunta);
                document
                  .getElementById("armar")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-sm font-bold text-azul">
                {sugerencia.dia} ·{" "}
                {TIPOS_DE_CONTENIDO.find((opcion) => opcion.id === sugerencia.tipo)?.nombre}
              </span>
              <span className="leading-tight font-extrabold">
                {sugerencia.producto?.nombre ?? sugerencia.pregunta}
              </span>
              <span className="text-[13px] leading-snug text-gris">
                {sugerencia.porQue}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="armar" className="flex scroll-mt-24 flex-col gap-4">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          Armá una publicación
        </h2>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="rotulo-campo">Tipo de publicación</p>
              <div className="flex flex-wrap gap-2">
                {TIPOS_DE_CONTENIDO.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    className="chip"
                    aria-pressed={tipo === opcion.id}
                    disabled={
                      opcion.id === "eeuu" && Boolean(producto) && !esPedidoEspecial(producto!)
                    }
                    onClick={() => {
                      setTipo(opcion.id);
                      setVersion(0);
                    }}
                  >
                    {opcion.nombre}
                  </button>
                ))}
              </div>
            </div>

            {esPregunta ? (
              <div>
                <label htmlFor="estudio-pregunta" className="rotulo-campo">
                  Pregunta
                </label>
                <select
                  id="estudio-pregunta"
                  className="campo"
                  value={pregunta}
                  onChange={(evento) => setPregunta(evento.target.value)}
                >
                  {PREGUNTAS.map((opcion) => (
                    <option key={opcion}>{opcion}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="estudio-producto" className="rotulo-campo">
                  Producto
                </label>
                <input
                  id="estudio-producto"
                  type="search"
                  className="campo"
                  placeholder="Buscá por nombre…"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                />
                {encontrados.length > 0 ? (
                  <ul className="marco mt-2 divide-y-2 divide-tinta overflow-hidden">
                    {encontrados.map((opcion) => (
                      <li key={opcion.slug}>
                        <button
                          type="button"
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-crema"
                          onClick={() => {
                            setSlug(opcion.slug);
                            setBusqueda("");
                            setVersion(0);
                            if (tipo === "eeuu" && !esPedidoEspecial(opcion)) {
                              setTipo("disponible");
                            }
                          }}
                        >
                          <span className="font-bold">{opcion.nombre}</span>
                          <span className="text-sm whitespace-nowrap">
                            {colones(opcion.precio)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {producto ? (
                  <p className="mt-2 text-[15px]">
                    Elegido: <strong>{producto.nombre}</strong> ·{" "}
                    {colones(producto.precio)} ·{" "}
                    {estaAgotado(producto)
                      ? "agotado"
                      : "quedan " + producto.stock}
                  </p>
                ) : null}
                {producto && estaAgotado(producto) ? (
                  <p role="alert" className="mt-1 font-bold text-rojo">
                    Está agotado: no lo publiqués como disponible.
                  </p>
                ) : null}
              </div>
            )}

            {tipo === "pick" ? (
              <div>
                <label htmlFor="estudio-motivo" className="rotulo-campo">
                  ¿Por qué lo escogerían? (con sus palabras)
                </label>
                <textarea
                  id="estudio-motivo"
                  className="campo"
                  rows={3}
                  maxLength={160}
                  placeholder="Ej.: El arte de esta carta es de los más bonitos del set."
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                />
              </div>
            ) : null}

            <div>
              <p className="rotulo-campo">Formato</p>
              <div className="flex flex-wrap gap-2">
                {FORMATOS.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    className="chip"
                    aria-pressed={formato === opcion.id}
                    onClick={() => setFormato(opcion.id)}
                  >
                    {opcion.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {listo ? (
              <>
                <canvas
                  ref={lienzo}
                  aria-label="Vista previa de la publicación"
                  className="marco shadow-dura mx-auto h-auto w-full max-w-[380px]"
                />
                {!fotoLista && !esPregunta ? (
                  <p role="alert" className="font-bold text-rojo">
                    Este producto no tiene una foto propia que se pueda usar:
                    subile una antes de publicarlo.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="boton boton-rojo"
                  onClick={descargar}
                  disabled={!fotoLista && !esPregunta}
                >
                  Descargar imagen ({medida.ancho} × {medida.alto})
                </button>
              </>
            ) : (
              <p className="marco bg-crema p-4 font-medium">
                Escogé un producto o una idea de la semana para ver la imagen.
              </p>
            )}
          </div>
        </div>
      </section>

      {listo ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <Bloque titulo="Texto para Instagram">
            <textarea
              key={caption}
              className="campo text-[15px]"
              rows={10}
              defaultValue={caption}
              aria-label="Texto para Instagram"
            />
            <div className="flex flex-wrap gap-2">
              <Copiar texto={caption + "\n\n" + hashtags} rotulo="Copiar con hashtags" />
              <button
                type="button"
                className="boton boton-blanco boton-chico w-fit"
                onClick={() => setVersion((actual) => actual + 1)}
              >
                Otra versión
              </button>
            </div>
            <p className="text-[15px] break-words">{hashtags}</p>
            <p className="text-sm text-gris">
              Revisá precio y stock antes de publicar: aquí salen como están en
              la hoja en este momento.
            </p>
          </Bloque>

          <div className="flex flex-col gap-5">
            <Bloque titulo="Texto alternativo">
              <p className="text-[15px]">{altDe(tipo, producto, pregunta)}</p>
              <Copiar texto={altDe(tipo, producto, pregunta)} />
            </Bloque>
            {producto && !esPregunta ? (
              <Bloque titulo="Para los grupos de WhatsApp">
                <p className="text-[15px] whitespace-pre-line">
                  {whatsappDe(producto)}
                </p>
                <Copiar texto={whatsappDe(producto)} />
              </Bloque>
            ) : null}
          </div>

          {reel ? (
            <div className="lg:col-span-2">
              <Bloque titulo="Idea para un Reel">
                <p>
                  <strong>Arranque:</strong> “{reel.hook}”
                </p>
                <ol className="list-decimal pl-5 text-[15px] leading-snug">
                  {reel.escenas.map((escena) => (
                    <li key={escena}>{escena}</li>
                  ))}
                </ol>
                <p className="text-[15px]">
                  <strong>Texto en pantalla:</strong> {reel.enPantalla}
                  <br />
                  <strong>Cierre:</strong> {reel.cta}
                  <br />
                  <strong>Duración:</strong> {reel.duracion}
                  <br />
                  <strong>Audio:</strong> {reel.audio}
                </p>
              </Bloque>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

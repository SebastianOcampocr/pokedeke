# Pokedeke

Tienda en línea de Pokedeke, en beta, con el estilo Rótulo. Por ahora solo Pokémon; los demás TCG salen como "Próximamente".

Los productos, el precio y el stock son reales y salen de la hoja de Google. La página funciona en dos modos:

- **Demo:** sale el aviso negro y los pedidos se guardan solo en el navegador. Nadie debe pagar.
- **Tienda abierta:** con la variable de GitHub `TIENDA_ABIERTA` en `si`. Sale el aviso de beta y el sello junto al logo. Los pedidos caen en la hoja y llegan por correo. Es plata de verdad.

Hoy está abierta en GitHub Pages de forma temporal, mientras AWS verifica la cuenta. Las reglas de GitHub Pages no permiten tiendas en línea y pueden bajar la página. Para volver a la demo, borrá `TIENDA_ABIERTA` y corré **Publicar demo**.

En ambos modos el inventario se lee de la hoja por medio de la variable `PEDIDOS_URL`.

## Cómo se actualiza el inventario

Nada se edita en el código. Todo sale de la pestaña **Catálogo web** de la hoja "Control del negocio TCG":

1. Anotá la compra en **Compras**, como siempre. Aparece sola en Catálogo web, en la misma fila.
2. En **Catálogo web** escribí el **Precio de venta**. Si lo dejás vacío, la página usa el Precio sugerido.
3. El precio y lo que queda se actualizan solos en unos segundos, porque la página se los pregunta a la hoja. Un producto nuevo, sus fotos y su texto tardan más: GitHub revisa la hoja cada 15 minutos, o menos seguido si tiene mucha carga.

Las demás columnas amarillas son opcionales:

| Columna | Para qué sirve |
|---|---|
| Nombre para mostrar | Otro nombre en la página, sin cambiar el de Compras |
| Descripción | El texto de "De qué se trata" |
| Fotos (URL) | Enlace de una foto, o el nombre de un archivo de `public/productos/` |
| Publicado | Con `no`, no sale en la página |
| Destacado | Con `sí`, sale en Destacados |
| Etiqueta | Nuevo, Preventa u Oferta |
| Llega (preventas) | Fecha dd/mm/yyyy para el reloj de la preventa |
| Peso (g) | Gramos del producto, para calcular el envío. Vacío usa un estimado por categoría |

Reglas que conviene saber:

- Dos compras con el mismo nombre en Compras son un solo producto: se suma el stock y manda el precio más reciente.
- Lo que tiene stock en 0 sale como Agotado. Para quitarlo, poné `no` en Publicado.
- Solo se publican los productos con Juego = Pokémon.
- Si un producto se llama igual que una foto de `public/productos/` (por ejemplo `ETB 30th Celebration`), la foto se pone sola. Si no, sale Deke con "Foto pronto".
- No ordenés ni borrés filas: cada fila de Catálogo web corresponde a la misma fila de Compras.
- Si la pestaña se daña o Google no responde, la página se queda con el último catálogo que estuvo bien.

El proceso lo hace `scripts/traer-catalogo.mjs`, que lee la pestaña desde el servidor de la hoja (variable de GitHub `PEDIDOS_URL`) y genera `datos/catalogo.json`.

## Cómo funcionan los pedidos

GitHub Pages no tiene servidor, así que el servidor vive adentro de la hoja: es el archivo `apps-script/Pedidos.gs`, pegado en **Extensiones > Apps Script**.

1. El cliente hace el pedido. Cae en la pestaña **Pedidos web**, llega un aviso a pokedekestore@gmail.com y el cliente recibe la confirmación en el correo que escribió.
2. El cliente paga por SINPE y escribe el comprobante. Te llega otro aviso.
3. Revisá que el SINPE haya entrado y cambiá el **Estado** a **Pagado**.
4. La venta pasa sola a **Ventas**, con el cliente, y en Notas el pedido, el envío, el comprobante y el WhatsApp. El stock baja solo y el cliente recibe el correo de pago confirmado.

Lo que conviene saber:

- Los precios y el stock se leen de la hoja. Lo que manda el navegador no se usa para cobrar.
- Un pedido sin pagar aparta el producto 24 horas: los demás lo ven como reservado en unos segundos, y dos personas no pueden pedir la misma unidad.
- Marcar Pagado dos veces no duplica la venta.
- Si no hay stock al marcar Pagado, el Estado se devuelve y la razón queda en Notas.
- Si cancelás un pedido que ya estaba en Ventas, borrá esas filas de Ventas a mano.
- Las ventas de WhatsApp o en persona se siguen anotando en Ventas.
- El costo de envío no se anota en Ventas, como dice "Cómo usarlo".
- Los correos salen de la cuenta que hizo la implementación del script, y siempre debe ser pokedekestore@gmail.com. Si el script corre con otra cuenta, el cliente no recibe correos.
- Pasar a Ventas y el correo de pago confirmado dependen de un activador. Se instala una sola vez: con la cuenta de la tienda, en Apps Script, elegí la función `instalarAvisos` y tocá **Ejecutar**. Sin eso, marcar Pagado no hace nada.

Si cambiás el WhatsApp, las tarifas, los cupones o el envío gratis en `lib/tienda.ts`, cambialos también en `CONFIG`, al inicio de `apps-script/Pedidos.gs`. Después de editar ese archivo hay que pegarlo otra vez en Apps Script y crear una versión nueva en **Implementar > Administrar implementaciones**.

## Cómo se calcula el envío por Correos

La página y la hoja usan la tarifa EMS Nacional Paquetes de [Correos](https://correos.go.cr/servicio-ems/), saliendo de la GAM, con IVA:

| Destino | Primer kilo | Cada kilo más |
|---|---|---|
| GAM | ₡2 450 | ₡1 400 |
| Resto del país | ₡3 350 | ₡1 550 |

- El destino sale de la provincia y el cantón. La GAM son 31 cantones. Correos no publica su lista, así que puede tratar distinto algún cantón.
- El peso es la suma de los productos más 100 g de empaque. Cada producto usa la columna **Peso (g)** o, si está vacía, el estimado por categoría en `CONFIG.pesos`.
- La hoja vuelve a calcular el envío al recibir el pedido. Lo que cuenta es ese monto.
- Con el registro en Pymexpress la tarifa baja un poco. Si se aprueba, hay que cambiar los montos en `lib/tienda.ts` y en `CONFIG`.

## Cómo abrirla en tu compu

1. Abrí una terminal y corré esto:

   ```bash
   export PATH="$HOME/.local/lib/node-v24.22.2-linux-x64/bin:$PATH"
   cd ~/tienda-tcg
   npm run build
   npm start
   ```

2. Entrá a <http://localhost:3000> en el navegador.
3. Para apagarla, volvé a la terminal y apretá `Ctrl + C`.

## Publicar en AWS

`infra/pokedeke.yml` crea los archivos privados en S3 y CloudFront delante. Va en `us-east-2`, la región del proyecto: en `us-east-1` el proyecto solo permite servicios globales.

Cuando existen las variables de GitHub `AWS_BUCKET` y `AWS_DISTRIBUCION`, y los secretos `AWS_CLAVE_ID` y `AWS_CLAVE_SECRETA`, la página se publica en AWS en vez de GitHub Pages. La clave debe poder tocar solo ese bucket y refrescar esa distribución.

## La demo en GitHub

La demo se publica sola en GitHub Pages: cada cambio que llega a la rama `main` se arma y se publica en un par de minutos. Eso lo hace `.github/workflows/publicar-demo.yml`.

- GitHub Pages no tiene servidor, así que publica la página ya armada. Por eso `next.config.ts` cambia de modo cuando existe `NEXT_PUBLIC_RUTA_BASE`.
- GitHub revisa la hoja cada 15 minutos. Solo vuelve a publicar si el catálogo cambió, y a veces atrasa esa revisión cuando tiene mucha carga. También se puede correr a mano en la pestaña Actions del repositorio, con **Publicar demo > Run workflow**.
- El repositorio es público porque así lo pide el plan gratis de GitHub para usar Pages. No subás nunca llaves ni contraseñas.
- La página no sale en Google, pero cualquiera que tenga el enlace puede entrar.
- Cada persona ve su propio carrito y sus pedidos, guardados en su navegador. Los pedidos de muestra no le llegan a nadie.

La página armada vive en GitHub Pages y el servidor de pedidos en la hoja de Google.

## Recorrido para mostrarla

1. Entrá a un producto y agregalo al carrito.
2. Terminá la compra con datos inventados.
3. Con el número de pedido, entrá a **Mi pedido** para ver en qué va.
4. Escribí `/panel` en la dirección del navegador (no tiene link en la página), marcá el pedido como **Pagado** y volvé a **Mi pedido**: el estado cambió.
5. En el panel, abrí **Texto para WhatsApp** para ver el mensaje listo para los grupos.

## Cómo aguanta muchos productos

- **Fotos:** `npm run build` crea cuatro tamaños de cada foto en `public/miniaturas/`, que no va a git. El navegador baja el que le sirve. Los anchos están en `scripts/hacer-miniaturas.mjs` y en `next.config.ts`.
- **Stock en vivo:** la página le manda a la hoja la versión que tiene. Si nada cambió, la hoja responde solo "igual". Los pedidos y las ediciones de la hoja actualizan el dato de una vez.
- **Límites:** Compras y Catálogo web llegan a unas 990 filas. Cada pedido acepta hasta 100 productos distintos. Gmail deja mandar unos 100 correos al día, y cada pedido gasta hasta 4.

## Dónde se cambia cada cosa

| Qué querés cambiar | Dónde |
|---|---|
| Productos, precios y stock | Hoja de Google, pestaña Catálogo web |
| Nombre de la tienda, SINPE, WhatsApp, envíos y cupones | `lib/tienda.ts` |
| Nombre que sale al instalar la página | `app/manifest.webmanifest` |
| Nombres de las categorías en la página | `lib/productos.ts` |
| Juegos de "Próximamente" | `components/Proximamente.tsx` |
| Historia y preguntas frecuentes | `app/nosotros/page.tsx` |
| Edificio Omni, lema y envíos | `lib/tienda.ts` |
| Fotos de los productos | `public/productos/` |
| Colores, botones y animaciones | `app/globals.css` |
| Aviso de beta y sello junto al logo | `components/Estructura.tsx` |
| Texto de la caja compartida (próximamente) | `app/caja-compartida/page.tsx` |
| Texto de las cajas misteriosas (próximamente) | `app/cajas-misteriosas/page.tsx` |
| Reglas del sobre del día | `lib/sobre.ts` y `lib/album.ts` |
| Stickers y rangos | `lib/logros.ts` |
| Diseño de la Cédula de Coleccionista | `lib/cedula.ts` |
| Porcentajes de "Vendenos tus cartas" | `components/Vender.tsx` |
| Tractos: plazos y monto mínimo | `components/Tractos.tsx` |
| Lo que dice Deke | `components/DekeCompa.tsx` |
| Monto del envío gratis | `lib/tienda.ts` |

## Lo que hace única a la tienda

| Función | Dónde verla |
|---|---|
| Sobre del día: uno cada 24 horas por navegador; rasgalo, voltea las cartas y llená el álbum | `/sobre` |
| Caja compartida (próximamente): 36 sobres de una caja, cada persona compra los suyos | `/caja-compartida` |
| Cédula de Coleccionista con stickers, descargable como imagen | `/cedula` |
| Cajas misteriosas (próximamente) con valor mínimo y lista adentro | `/cajas-misteriosas` |
| Apartado en tractos, sin intereses | En productos desde ₡30 000 |
| Vendenos tus cartas, con calculadora de oferta | `/vender` |
| Guía de Deke: 3 preguntas y te recomienda qué comprar | `/guia` |
| Lista de deseos que se manda por WhatsApp | `/favoritos` |
| Secreto: tocá a Deke 7 veces | Abajo a la derecha |

Los montos, porcentajes y plazos de estas funciones son propuestas de muestra.

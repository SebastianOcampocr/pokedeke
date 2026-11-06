# Demo de Pokedeke

Demo visual de la tienda en línea de Pokedeke, con el estilo Rótulo. Por ahora solo Pokémon; los demás TCG salen como "Próximamente". Sirve para mostrar cómo se vería y cómo se usaría la página.

Los productos, el precio y el stock son reales y salen de la hoja de Google. La página funciona en dos modos:

- **Demo:** sale el aviso negro y los pedidos se guardan solo en el navegador. Nadie debe pagar.
- **Tienda abierta:** con la variable de GitHub `TIENDA_ABIERTA` en `si`. Los pedidos caen en la hoja y llegan por correo. Es plata de verdad.

En ambos modos el inventario se lee de la hoja por medio de la variable `PEDIDOS_URL`.

## Cómo se actualiza el inventario

Nada se edita en el código. Todo sale de la pestaña **Catálogo web** de la hoja "Control del negocio TCG":

1. Anotá la compra en **Compras**, como siempre. Aparece sola en Catálogo web, en la misma fila.
2. En **Catálogo web** escribí el **Precio de venta**. Si lo dejás vacío, la página usa el Precio sugerido.
3. En unos 15 minutos la página se actualiza sola. Cambiar un precio o una venta en Ventas funciona igual.

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

1. El cliente paga por SINPE y escribe el comprobante. El pedido cae en la pestaña **Pedidos web** y llega un correo a pokedekestore@gmail.com.
2. Revisá que el SINPE haya entrado y cambiá el **Estado** a **Pagado**.
3. La venta pasa sola a **Ventas**, con el cliente, y en Notas el pedido, el envío, el comprobante y el WhatsApp. El stock baja solo.

Lo que conviene saber:

- Los precios y el stock se leen de la hoja. Lo que manda el navegador no se usa para cobrar.
- Un pedido sin pagar aparta el producto 24 horas.
- Marcar Pagado dos veces no duplica la venta.
- Si no hay stock al marcar Pagado, el Estado se devuelve y la razón queda en Notas.
- Si cancelás un pedido que ya estaba en Ventas, borrá esas filas de Ventas a mano.
- Las ventas de WhatsApp o en persona se siguen anotando en Ventas.
- El costo de envío no se anota en Ventas, como dice "Cómo usarlo".

Si cambiás envíos, cupones o el envío gratis en `lib/tienda.ts`, cambialos también en `CONFIG`, al inicio de `apps-script/Pedidos.gs`. Después de editar ese archivo hay que pegarlo otra vez en Apps Script y crear una versión nueva en **Implementar > Administrar implementaciones**.

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

## La demo en GitHub

La demo se publica sola en GitHub Pages: cada cambio que llega a la rama `main` se arma y se publica en un par de minutos. Eso lo hace `.github/workflows/publicar-demo.yml`.

- GitHub Pages no tiene servidor, así que publica la página ya armada. Por eso `next.config.ts` cambia de modo cuando existe `NEXT_PUBLIC_RUTA_BASE`.
- GitHub revisa la hoja cada 10 minutos. Solo vuelve a publicar si el catálogo cambió, y a veces atrasa esa revisión cuando tiene mucha carga.
- El repositorio es público porque así lo pide el plan gratis de GitHub para usar Pages. No subás nunca llaves ni contraseñas.
- La página no sale en Google, pero cualquiera que tenga el enlace puede entrar.
- Cada persona ve su propio carrito y sus pedidos, guardados en su navegador. Los pedidos de muestra no le llegan a nadie.

La página armada vive en GitHub Pages y el servidor de pedidos en la hoja de Google.

## Recorrido para mostrarla

1. Entrá a un producto y agregalo al carrito.
2. En el carrito, probá el cupón `TICO10`.
3. Terminá la compra con datos inventados.
4. Con el número de pedido, entrá a **Mi pedido** para ver en qué va.
5. Escribí `/panel` en la dirección del navegador (no tiene link en la página), marcá el pedido como **Pagado** y volvé a **Mi pedido**: el estado cambió.
6. En el panel, abrí **Texto para WhatsApp** para ver el mensaje listo para los grupos.

## Dónde se cambia cada cosa

| Qué querés cambiar | Dónde |
|---|---|
| Productos, precios y stock | Hoja de Google, pestaña Catálogo web |
| Nombre de la tienda, SINPE, envíos y cupones | `lib/tienda.ts` |
| Nombre que sale al instalar la página | `app/manifest.webmanifest` |
| Nombres de las categorías en la página | `lib/productos.ts` |
| Juegos de "Próximamente" | `components/Proximamente.tsx` |
| Historia y preguntas frecuentes | `app/nosotros/page.tsx` |
| Edificio Omni, lema y envíos | `lib/tienda.ts` |
| Fotos de los productos | `public/productos/` |
| Colores, botones y animaciones | `app/globals.css` |
| Aviso negro de "Demo" | `components/Estructura.tsx` |
| Texto de la caja compartida (próximamente) | `app/caja-compartida/page.tsx` |
| Texto de las cajas misteriosas (próximamente) | `app/cajas-misteriosas/page.tsx` |
| Reglas del sobre del día | `lib/sobre.ts` |
| Stickers y rangos | `lib/logros.ts` |
| Diseño de la Cédula de Coleccionista | `lib/cedula.ts` |
| Porcentajes de "Vendenos tus cartas" | `components/Vender.tsx` |
| Tractos: plazos y monto mínimo | `components/Tractos.tsx` |
| Lo que dice Deke | `components/DekeCompa.tsx` |
| Monto del envío gratis | `lib/tienda.ts` |

## Lo que hace única a la tienda

| Función | Dónde verla |
|---|---|
| Sobre del día: rasgalo, voltea las cartas, llená el álbum y probá suerte con un cupón | `/sobre` |
| Caja compartida (próximamente): 36 sobres de una caja, cada persona compra los suyos | `/caja-compartida` |
| Cédula de Coleccionista con stickers, descargable como imagen | `/cedula` |
| Cajas misteriosas (próximamente) con valor mínimo y lista adentro | `/cajas-misteriosas` |
| Apartado en tractos, sin intereses | En productos desde ₡30 000 |
| Vendenos tus cartas, con calculadora de oferta | `/vender` |
| Guía de Deke: 3 preguntas y te recomienda qué comprar | `/guia` |
| Lista de deseos que se manda por WhatsApp | `/favoritos` |
| Secreto: tocá a Deke 7 veces | Abajo a la derecha |

Los montos, porcentajes y plazos de estas funciones son propuestas de muestra.

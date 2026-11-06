# Demo de Pokedeke

Demo visual de la tienda en línea de Pokedeke, con el estilo Rótulo. Por ahora solo Pokémon; los demás TCG salen como "Próximamente". Sirve para mostrar cómo se vería y cómo se usaría la página.

**Es solo una demo:** los productos, precios y pedidos son de muestra. No se conecta a la hoja de Google, no cobra y no manda correos. El carrito y los pedidos se guardan únicamente en el navegador de quien la esté usando.

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
- El repositorio es público porque así lo pide el plan gratis de GitHub para usar Pages. No subás nunca llaves ni contraseñas.
- La página no sale en Google, pero cualquiera que tenga el enlace puede entrar.
- Cada persona ve su propio carrito y sus pedidos, guardados en su navegador. Los pedidos de muestra no le llegan a nadie.

Esto sirve solo para la demo. La tienda real necesita servidor, así que no puede vivir en GitHub Pages.

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
| Nombre de la tienda, SINPE, envíos y cupones | `lib/tienda.ts` |
| Nombre que sale al instalar la página | `app/manifest.webmanifest` |
| Productos y precios | `lib/productos.ts` |
| Categorías en pausa (hoy, figuras y peluches) | `lib/productos.ts` |
| Juegos de "Próximamente" | `components/Proximamente.tsx` |
| Historia y preguntas frecuentes | `app/nosotros/page.tsx` |
| Edificio Omni, lema y envíos | `lib/tienda.ts` |
| Fotos de los productos | `public/productos/` |
| Colores, botones y animaciones | `app/globals.css` |
| Aviso negro de "Demo" | `components/Estructura.tsx` |
| Inventario ampliado y precio del sobre de la caja compartida | `lib/inventario.ts` |
| Fecha y sobres apartados de la caja compartida | `lib/caja-compartida.ts` |
| Lo que trae cada caja misteriosa y su valor mínimo | `lib/cajas-misteriosas.ts` |
| Reglas del sobre del día | `lib/sobre.ts` |
| Stickers y rangos | `lib/logros.ts` |
| Diseño de la Cédula de Coleccionista | `lib/cedula.ts` |
| Porcentajes de "Vendenos tus cartas" | `components/Vender.tsx` |
| Tractos: plazos y monto mínimo | `components/Tractos.tsx` |
| Lo que dice Deke | `components/DekeCompa.tsx` |
| Monto del envío gratis | `lib/tienda.ts` |

## Conectar la hoja de Google (pendiente)

Todavía no está conectada. Para hacerlo hace falta una llave de Google que solo el dueño de la hoja puede crear:

1. Entrá a <https://console.cloud.google.com> con la cuenta dueña de la hoja y creá un proyecto llamado `Pokedeke`.
2. En **APIs y servicios > Biblioteca**, buscá **Google Sheets API** y activala.
3. En **IAM y administración > Cuentas de servicio**, creá una cuenta llamada `pokedeke-tienda`. No ocupa roles.
4. Entrá a esa cuenta y andá a **Claves > Agregar clave > Crear clave nueva > JSON**. Se descarga un archivo.
5. Mové ese archivo a la carpeta del proyecto y ponele de nombre `.env.google.json`. Ese nombre queda fuera de git.

Ese archivo es una contraseña: no lo pegués en un chat ni lo subás a ningún lado. Con eso se crea una copia de prueba de la hoja, se comparte con la cuenta y se conecta primero ahí, nunca directo a la hoja real.

## Lo que hace única a la tienda

| Función | Dónde verla |
|---|---|
| Sobre del día: rasgalo, voltea las cartas, llená el álbum y probá suerte con un cupón | `/sobre` |
| Caja compartida: 36 sobres de una caja, cada persona compra los suyos | `/caja-compartida` |
| Cédula de Coleccionista con stickers, descargable como imagen | `/cedula` |
| Cajas misteriosas con valor mínimo y lista adentro | `/cajas-misteriosas` |
| Apartado en tractos, sin intereses | En productos desde ₡30 000 |
| Vendenos tus cartas, con calculadora de oferta | `/vender` |
| Guía de Deke: 3 preguntas y te recomienda qué comprar | `/guia` |
| Lista de deseos que se manda por WhatsApp | `/favoritos` |
| Secreto: tocá a Deke 7 veces | Abajo a la derecha |

Los montos, porcentajes y plazos de estas funciones son propuestas de muestra.

# 🛠️ Sistema de Inventario y Ventas (POS) - Ferretería Hebert / Bodega Jeym

Sistema integral de punto de venta (POS), inventario multi-unidad y facturación bimonetaria adaptado al mercado venezolano con doble tasa de cambio (**Tasa Tienda / Reposición** vs. **Tasa Oficial BCV**).

Diseñado con interfaz moderna inspirada en WhatsApp Web / POS Cloud, barra de navegación completa con 11 módulos, búsqueda instantánea, soporte para decimales/fracciones y despliegue dual (Local Offline y Cloud Vercel).

---

## 🚀 Despliegue en Vercel (100% Compatible y Listo)

Este repositorio está pre-configurado para desplegarse en **Vercel** sin configuración adicional:
1. Sube este repositorio a tu cuenta de **GitHub**.
2. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New..."** -> **"Project"**.
4. Selecciona el repositorio de GitHub y haz clic en **"Deploy"**.
   - *Framework Preset:* Vite / Other
   - *Build Command:* `npm run build`
   - *Output Directory:* `client/dist`
5. ¡Listo! Vercel desplegará automáticamente la interfaz web y las APIs Serverless bajo el mismo dominio con SSL gratuito.

---

## 🖥️ Cómo Iniciar el Sistema Localmente (1 Clic)

Solo haz doble clic en el archivo:
```
iniciar_sistema.bat
```
Esto:
1. Compila automáticamente el frontend si es la primera vez.
2. Inicia el servidor local en Node.js con base de datos SQLite persistente (`ferreteria.db`).
3. Abre automáticamente el navegador en tu pantalla (`http://localhost:3000`).
4. Muestra la dirección IP para conectar la **2da PC** o el **teléfono celular** por la red WiFi local.

---

## 📱 Módulos del Sistema (Barra de Navegación)

1. **Nuevo Ticket / Factura:** Mostrador de ventas rápido, lector de códigos, selección de clientes con autocompletado y cobro multimoneda.
2. **Productos:** Catálogo completo en cuadrícula de tarjetas o vista de lista compacta, filtros por categoría y stock.
3. **Agregar Producto:** Carga ágil de nuevos productos con SKU, unidad (kg, metros, unidades), costo, precio y foto.
4. **Editar Producto:** Buscador rápido para modificar en 1 clic precios, costos, stock y fotos de cualquier artículo.
5. **Inventario:** Control de stock físico, alertas de inventario mínimo y ajustes rápidos.
6. **Entradas / Compras:** Registro de reabastecimiento de mercancía con actualización inmediata de stock y costo.
7. **Reportes:** Estadísticas de venta diaria, productos más vendidos, ventas por categoría y tendencias de los últimos 7 días.
8. **Finanzas:** Arqueo de caja, desglose por método de pago (Pago Móvil, Punto de Venta, Efectivo $, Efectivo Bs, Zelle, Mixto), ganancia bruta y reporte Cierre Z para impresora térmica.
9. **Clientes:** Directorio de clientes con cédula/RIF, teléfono, dirección, compras acumuladas y botón directo de venta.
10. **Usuarios:** Control de cajeros y administradores con código PIN de seguridad y cambio rápido de turno.
11. **Configuración:** Ajuste de Tasa Tienda, Tasa BCV Oficial, datos de la empresa (nombre, RIF, teléfono, dirección) y pie de ticket.

---

## 💰 Lógica Bimonetaria de Precios (Fórmula Venezolana)

* **Tasa Interna / Tienda:** Bs. 960,00 (o la que configure el comercio)
* **Tasa Oficial BCV:** Bs. 883,40 (o la oficial del día)
* **Ejemplo Llave ($40,00 base):**
  * **En Bolívares:** `40 × 960 = Bs. 38.400,00`
  * **Equivalente USD Tasa BCV:** `38.400 ÷ 883,40 = $43,47`

### Modalidad de Cobro Maestro con 1 Clic:
* **Cobrar en Bolívares:** (Pago Móvil, Punto de Venta, Efectivo Bs.)
* **Cobrar en Divisas ($ Tienda):** $40,00 (Efectivo $ o Zelle).
* **Cobrar en Divisas ($ BCV):** $43,47 (cuando el cliente exige tasa oficial).
* **Pago Mixto:** Si el cliente paga parte en efectivo ($20) y el resto por Pago Móvil, el sistema calcula de inmediato el restante exacto en Bolívares.

---

## 📏 Venta Fraccionada y Búsqueda Inteligente

* **Venta por Fracciones:**
  * Kilos con decimales: `0.5 kg`, `1.2 kg` (ej. Electrodos, Clavos).
  * Metros con decimales: `2.5 m`, `10 m` (ej. Mangueras, Cables).
  * Unidades enteras: `1`, `2`, `5` (ej. Llaves, Bombillos, Pegas).
* **Búsqueda por medidas y alias:**
  * Soporta escribir `1/2`, `3/4`, `4 1/2`, `teflon`, `tirro plomo`, `llave`, etc.

---

## 🖨️ Impresora Térmica de Tickets (58mm y 80mm)

* Compatible con impresoras térmicas de tickets USB / Bluetooth / Red.
* Impresión directa desde el navegador (ESC/POS compatible).
* Emisión de Tickets de Venta y Cierres Z de Caja con desglose por moneda.

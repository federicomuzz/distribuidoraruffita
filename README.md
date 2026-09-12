# Distribuidora — control de stock y facturación interna

App web para gestionar una distribuidora de cigarrillos: stock, ventas con comprobante
imprimible, compras a proveedores, clientes y cuenta corriente.

Los comprobantes son **internos** (no son factura electrónica AFIP/ARCA).

## Funciones

- **Panel**: ventas del día y del mes, valor del stock, productos bajo mínimo, más vendidos, deuda de clientes.
- **Ventas**: búsqueda rápida de productos, carga por líneas, precio editable, descuento automático de stock,
  medios de pago (efectivo / transferencia / cuenta corriente), comprobante imprimible y anulación con reposición de stock.
- **Stock**: ABM de productos, stock mínimo con alerta, ajustes manuales (rotura, recuento) y kardex de movimientos.
- **Compras**: ingreso de mercadería por remito, actualiza stock y costo.
- **Clientes**: ABM, saldo de cuenta corriente y registro de cobros.

## Stack

- Backend: FastAPI + SQLModel + SQLite (`backend/distri.db`)
- Frontend: React + TypeScript + Vite + Tailwind

## Demo en una sola computadora (lo más simple)

Con Docker instalado:

```bash
docker compose up --build     # http://localhost:8000
```

Levanta todo en un solo puerto (API + interfaz ya compilada) y guarda los datos en un volumen.
El botón "Reiniciar demo" del encabezado restaura los datos de ejemplo antes de mostrarle la app a un cliente.

## Demo sin servidor (sitio estático)

```bash
cd frontend
VITE_MODO_DEMO=1 npm run build   # dist/ se puede subir a cualquier hosting estático
```

Con `VITE_MODO_DEMO=1` la app no usa la API: guarda productos, ventas, compras y saldos en el
navegador (localStorage) con los mismos datos de ejemplo. Sirve para mostrarla sin backend.

## Cómo correrlo en desarrollo

```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python seed.py        # datos de ejemplo (opcional)
.venv/bin/uvicorn main:app --port 8000

# frontend (otra terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

El dev server de Vite proxea `/api` al backend en el puerto 8000.

## API

Documentación interactiva en `http://localhost:8000/docs`.

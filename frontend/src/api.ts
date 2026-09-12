export type Producto = {
  id: number
  codigo: string
  nombre: string
  marca: string
  presentacion: string
  unidades_por_bulto: number
  precio_compra: number
  precio_venta: number
  stock: number
  stock_minimo: number
  activo: boolean
}

export type Cliente = {
  id: number
  nombre: string
  cuit: string
  direccion: string
  localidad: string
  telefono: string
  saldo: number
  activo: boolean
}

export type Proveedor = {
  id: number
  nombre: string
  cuit: string
  telefono: string
  activo: boolean
}

export type Item = {
  producto_id: number
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Venta = {
  id: number
  numero: string
  fecha: string
  cliente_id: number | null
  cliente_nombre: string
  total: number
  pagado: number
  medio_pago: string
  anulada: boolean
  observaciones: string
  items: Item[]
}

export type Compra = {
  id: number
  fecha: string
  proveedor_id: number | null
  proveedor_nombre: string
  remito: string
  total: number
  items: Item[]
}

export type Movimiento = {
  id: number
  fecha: string
  producto_id: number
  tipo: string
  cantidad: number
  stock_resultante: number
  detalle: string
}

export type Dashboard = {
  ventas_hoy: number
  cantidad_ventas_hoy: number
  ventas_mes: number
  valor_stock: number
  productos_activos: number
  stock_bajo: { id: number; nombre: string; stock: number; minimo: number }[]
  deuda_total: number
  deudores: { id: number; nombre: string; saldo: number }[]
  mas_vendidos: { descripcion: string; cantidad: number }[]
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  reiniciarDemo: () => request<{ ok: boolean }>('/api/demo/reset', { method: 'POST' }),
  dashboard: () => request<Dashboard>('/api/dashboard'),

  productos: (q = '') => request<Producto[]>(`/api/productos?q=${encodeURIComponent(q)}`),
  crearProducto: (p: Partial<Producto>) =>
    request<Producto>('/api/productos', { method: 'POST', body: JSON.stringify(p) }),
  editarProducto: (id: number, p: Partial<Producto>) =>
    request<Producto>(`/api/productos/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  bajaProducto: (id: number) =>
    request<{ ok: boolean }>(`/api/productos/${id}`, { method: 'DELETE' }),
  ajustarStock: (id: number, cantidad: number, detalle: string) =>
    request<Producto>(`/api/productos/${id}/ajuste`, {
      method: 'POST',
      body: JSON.stringify({ cantidad, detalle }),
    }),
  movimientos: (id: number) => request<Movimiento[]>(`/api/productos/${id}/movimientos`),

  clientes: (q = '') => request<Cliente[]>(`/api/clientes?q=${encodeURIComponent(q)}`),
  crearCliente: (c: Partial<Cliente>) =>
    request<Cliente>('/api/clientes', { method: 'POST', body: JSON.stringify(c) }),
  editarCliente: (id: number, c: Partial<Cliente>) =>
    request<Cliente>(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
  registrarPago: (cliente_id: number, monto: number, medio: string, detalle: string) =>
    request<Cliente>('/api/pagos', {
      method: 'POST',
      body: JSON.stringify({ cliente_id, monto, medio, detalle }),
    }),

  proveedores: () => request<Proveedor[]>('/api/proveedores'),
  crearProveedor: (p: Partial<Proveedor>) =>
    request<Proveedor>('/api/proveedores', { method: 'POST', body: JSON.stringify(p) }),

  ventas: () => request<Venta[]>('/api/ventas'),
  crearVenta: (v: {
    cliente_id: number | null
    medio_pago: string
    observaciones: string
    items: { producto_id: number; cantidad: number; precio_unitario: number }[]
  }) => request<Venta>('/api/ventas', { method: 'POST', body: JSON.stringify(v) }),
  anularVenta: (id: number) =>
    request<Venta>(`/api/ventas/${id}/anular`, { method: 'POST' }),

  compras: () => request<Compra[]>('/api/compras'),
  crearCompra: (c: {
    proveedor_id: number | null
    remito: string
    items: { producto_id: number; cantidad: number; precio_unitario: number }[]
  }) => request<Compra>('/api/compras', { method: 'POST', body: JSON.stringify(c) }),
}

export const money = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })

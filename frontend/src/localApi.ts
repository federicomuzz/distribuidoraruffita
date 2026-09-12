// Modo demo: replica la lógica del backend usando localStorage, para publicar
// la app como sitio estático sin servidor.
import type { Cliente, Compra, Dashboard, Item, Movimiento, Producto, Proveedor, Venta } from './api'

type Base = {
  productos: Producto[]
  clientes: Cliente[]
  proveedores: Proveedor[]
  ventas: Venta[]
  compras: Compra[]
  movimientos: Movimiento[]
  secuencias: Record<string, number>
}

const CLAVE = 'distribuidora-demo'

const PRODUCTOS: [string, string, string, string, number, number, number, number][] = [
  ['MAL-BOX', 'Malboro Box', 'Philip Morris', 'atado x20', 2800, 3400, 240, 60],
  ['MAL-KS', 'Malboro KS', 'Philip Morris', 'atado x20', 2750, 3300, 180, 60],
  ['PHI-BOX', 'Philip Morris Box', 'Philip Morris', 'atado x20', 2500, 3050, 300, 80],
  ['LM-BLUE', 'L&M Blue', 'Philip Morris', 'atado x20', 2300, 2800, 150, 50],
  ['PAR-SUA', 'Parliament Suave', 'Philip Morris', 'atado x20', 3100, 3750, 90, 40],
  ['LUC-RED', 'Lucky Strike Red', 'BAT', 'atado x20', 2600, 3150, 120, 40],
  ['CAM-BLU', 'Camel Blue', 'BAT', 'atado x20', 2700, 3250, 60, 40],
  ['VIC-CLA', 'Viceroy Clásico', 'BAT', 'atado x20', 2100, 2600, 200, 50],
  ['JOK-SUA', 'Jockey Suave', 'Massalin', 'atado x20', 2200, 2700, 35, 40],
  ['CHE-100', 'Chesterfield 100', 'Massalin', 'atado x20', 2400, 2900, 110, 40],
]

const CLIENTES: [string, string, string, string, string][] = [
  ['Kiosco La Esquina', '30-12345678-9', 'Av. Mitre 1234', 'Avellaneda', '1155550001'],
  ['Maxikiosco 24hs', '30-23456789-0', 'San Martín 450', 'Lanús', '1155550002'],
  ['Almacén Don Pedro', '20-34567890-1', 'Belgrano 890', 'Quilmes', '1155550003'],
  ['Estación Shell Ruta 2', '30-45678901-2', 'Ruta 2 km 35', 'Berazategui', '1155550004'],
]

const PROVEEDORES: [string, string, string][] = [
  ['Massalin Particulares', '30-50001234-5', '0800-1111'],
  ['British American Tobacco', '30-50005678-9', '0800-2222'],
]

function baseInicial(): Base {
  return {
    productos: PRODUCTOS.map(([codigo, nombre, marca, presentacion, pc, pv, stock, minimo], i) => ({
      id: i + 1,
      codigo,
      nombre,
      marca,
      presentacion,
      unidades_por_bulto: 10,
      precio_compra: pc,
      precio_venta: pv,
      stock,
      stock_minimo: minimo,
      activo: true,
    })),
    clientes: CLIENTES.map(([nombre, cuit, direccion, localidad, telefono], i) => ({
      id: i + 1,
      nombre,
      cuit,
      direccion,
      localidad,
      telefono,
      saldo: 0,
      activo: true,
    })),
    proveedores: PROVEEDORES.map(([nombre, cuit, telefono], i) => ({
      id: i + 1,
      nombre,
      cuit,
      telefono,
      activo: true,
    })),
    ventas: [],
    compras: [],
    movimientos: [],
    secuencias: { producto: PRODUCTOS.length, cliente: CLIENTES.length, proveedor: PROVEEDORES.length },
  }
}

let base: Base = leer()

function leer(): Base {
  const guardado = localStorage.getItem(CLAVE)
  if (!guardado) return baseInicial()
  try {
    return JSON.parse(guardado) as Base
  } catch {
    return baseInicial()
  }
}

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(base))
}

function proximoId(clave: string) {
  base.secuencias[clave] = (base.secuencias[clave] ?? 0) + 1
  return base.secuencias[clave]
}

const redondear = (n: number) => Math.round(n * 100) / 100
const esperar = <T,>(valor: T) => Promise.resolve(JSON.parse(JSON.stringify(valor)) as T)
const fallar = (mensaje: string): never => {
  throw new Error(mensaje)
}

function registrarMovimiento(producto: Producto, tipo: string, cantidad: number, detalle: string) {
  producto.stock += cantidad
  base.movimientos.push({
    id: proximoId('movimiento'),
    fecha: new Date().toISOString(),
    producto_id: producto.id,
    tipo,
    cantidad,
    stock_resultante: producto.stock,
    detalle,
  })
}

function buscarProducto(id: number) {
  return base.productos.find((p) => p.id === id) ?? fallar(`Producto ${id} no encontrado`)
}

function armarItems(
  items: { producto_id: number; cantidad: number; precio_unitario: number }[],
  precioPorDefecto: (p: Producto) => number,
  validarStock: boolean,
): Item[] {
  return items.map((item) => {
    const producto = buscarProducto(item.producto_id)
    if (item.cantidad <= 0) fallar('Cantidad inválida')
    if (validarStock && producto.stock < item.cantidad)
      fallar(`Stock insuficiente de ${producto.nombre} (disponible ${producto.stock})`)
    const precio = item.precio_unitario ?? precioPorDefecto(producto)
    return {
      producto_id: producto.id,
      descripcion: `${producto.nombre} ${producto.presentacion}`.trim(),
      cantidad: item.cantidad,
      precio_unitario: precio,
      subtotal: redondear(precio * item.cantidad),
    }
  })
}

export const apiLocal = {
  reiniciarDemo: () => {
    base = baseInicial()
    guardar()
    return esperar({ ok: true })
  },

  dashboard: (): Promise<Dashboard> => {
    const ahora = new Date()
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const desdeSemana = new Date(ahora.getTime() - 6 * 24 * 3600 * 1000)

    const vigentes = base.ventas.filter((v) => !v.anulada)
    const hoy = vigentes.filter((v) => new Date(v.fecha) >= inicioDia)
    const mes = vigentes.filter((v) => new Date(v.fecha) >= inicioMes)
    const activos = base.productos.filter((p) => p.activo)
    const clientes = base.clientes.filter((c) => c.activo)

    const ranking = new Map<string, number>()
    for (const venta of vigentes.filter((v) => new Date(v.fecha) >= desdeSemana))
      for (const item of venta.items)
        ranking.set(item.descripcion, (ranking.get(item.descripcion) ?? 0) + item.cantidad)

    return esperar({
      ventas_hoy: redondear(hoy.reduce((t, v) => t + v.total, 0)),
      cantidad_ventas_hoy: hoy.length,
      ventas_mes: redondear(mes.reduce((t, v) => t + v.total, 0)),
      valor_stock: redondear(activos.reduce((t, p) => t + p.stock * p.precio_compra, 0)),
      productos_activos: activos.length,
      stock_bajo: activos
        .filter((p) => p.stock <= p.stock_minimo)
        .map((p) => ({ id: p.id, nombre: p.nombre, stock: p.stock, minimo: p.stock_minimo })),
      deuda_total: redondear(clientes.filter((c) => c.saldo > 0).reduce((t, c) => t + c.saldo, 0)),
      deudores: clientes
        .filter((c) => c.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5)
        .map((c) => ({ id: c.id, nombre: c.nombre, saldo: c.saldo })),
      mas_vendidos: [...ranking.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([descripcion, cantidad]) => ({ descripcion, cantidad })),
    })
  },

  productos: (q = '') => {
    const texto = q.toLowerCase()
    return esperar(
      base.productos
        .filter((p) => p.activo)
        .filter(
          (p) =>
            !texto ||
            p.nombre.toLowerCase().includes(texto) ||
            p.codigo.toLowerCase().includes(texto) ||
            p.marca.toLowerCase().includes(texto),
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    )
  },

  crearProducto: (datos: Partial<Producto>) => {
    if (base.productos.some((p) => p.codigo === datos.codigo))
      fallar('Ya existe un producto con ese código')
    const producto: Producto = {
      id: proximoId('producto'),
      codigo: datos.codigo ?? '',
      nombre: datos.nombre ?? '',
      marca: datos.marca ?? '',
      presentacion: datos.presentacion ?? '',
      unidades_por_bulto: datos.unidades_por_bulto ?? 1,
      precio_compra: datos.precio_compra ?? 0,
      precio_venta: datos.precio_venta ?? 0,
      stock: datos.stock ?? 0,
      stock_minimo: datos.stock_minimo ?? 0,
      activo: true,
    }
    base.productos.push(producto)
    guardar()
    return esperar(producto)
  },

  editarProducto: (id: number, datos: Partial<Producto>) => {
    const producto = buscarProducto(id)
    Object.assign(producto, { ...datos, id: producto.id, stock: producto.stock })
    guardar()
    return esperar(producto)
  },

  bajaProducto: (id: number) => {
    buscarProducto(id).activo = false
    guardar()
    return esperar({ ok: true })
  },

  ajustarStock: (id: number, cantidad: number, detalle: string) => {
    const producto = buscarProducto(id)
    if (producto.stock + cantidad < 0) fallar('El ajuste deja stock negativo')
    registrarMovimiento(producto, 'ajuste', cantidad, detalle || 'Ajuste manual')
    guardar()
    return esperar(producto)
  },

  movimientos: (id: number) =>
    esperar(base.movimientos.filter((m) => m.producto_id === id).sort((a, b) => b.id - a.id)),

  clientes: (q = '') => {
    const texto = q.toLowerCase()
    return esperar(
      base.clientes
        .filter((c) => c.activo && (!texto || c.nombre.toLowerCase().includes(texto)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    )
  },

  crearCliente: (datos: Partial<Cliente>) => {
    const cliente: Cliente = {
      id: proximoId('cliente'),
      nombre: datos.nombre ?? '',
      cuit: datos.cuit ?? '',
      direccion: datos.direccion ?? '',
      localidad: datos.localidad ?? '',
      telefono: datos.telefono ?? '',
      saldo: 0,
      activo: true,
    }
    base.clientes.push(cliente)
    guardar()
    return esperar(cliente)
  },

  editarCliente: (id: number, datos: Partial<Cliente>) => {
    const cliente = base.clientes.find((c) => c.id === id) ?? fallar('Cliente no encontrado')
    Object.assign(cliente, { ...datos, id: cliente.id, saldo: cliente.saldo })
    guardar()
    return esperar(cliente)
  },

  registrarPago: (cliente_id: number, monto: number, _medio: string, _detalle: string) => {
    const cliente = base.clientes.find((c) => c.id === cliente_id) ?? fallar('Cliente no encontrado')
    if (monto <= 0) fallar('Monto inválido')
    cliente.saldo = redondear(cliente.saldo - monto)
    guardar()
    return esperar(cliente)
  },

  proveedores: () => esperar(base.proveedores.filter((p) => p.activo)),

  crearProveedor: (datos: Partial<Proveedor>) => {
    const proveedor: Proveedor = {
      id: proximoId('proveedor'),
      nombre: datos.nombre ?? '',
      cuit: datos.cuit ?? '',
      telefono: datos.telefono ?? '',
      activo: true,
    }
    base.proveedores.push(proveedor)
    guardar()
    return esperar(proveedor)
  },

  ventas: () => esperar([...base.ventas].sort((a, b) => b.id - a.id)),

  crearVenta: (datos: {
    cliente_id: number | null
    medio_pago: string
    observaciones: string
    items: { producto_id: number; cantidad: number; precio_unitario: number }[]
  }) => {
    if (!datos.items.length) fallar('La venta no tiene items')
    const cliente = datos.cliente_id ? base.clientes.find((c) => c.id === datos.cliente_id) : null
    if (datos.medio_pago === 'cuenta_corriente' && !cliente)
      fallar('Cuenta corriente requiere un cliente')

    const items = armarItems(datos.items, (p) => p.precio_venta, true)
    const total = redondear(items.reduce((t, i) => t + i.subtotal, 0))
    const venta: Venta = {
      id: proximoId('venta'),
      numero: `0001-${String(base.ventas.length + 1).padStart(8, '0')}`,
      fecha: new Date().toISOString(),
      cliente_id: cliente?.id ?? null,
      cliente_nombre: cliente?.nombre ?? 'Consumidor final',
      total,
      pagado: datos.medio_pago === 'cuenta_corriente' ? 0 : total,
      medio_pago: datos.medio_pago,
      anulada: false,
      observaciones: datos.observaciones,
      items,
    }
    for (const item of items)
      registrarMovimiento(
        buscarProducto(item.producto_id),
        'venta',
        -item.cantidad,
        `Comprobante ${venta.numero}`,
      )
    if (cliente) cliente.saldo = redondear(cliente.saldo + (venta.total - venta.pagado))
    base.ventas.push(venta)
    guardar()
    return esperar(venta)
  },

  anularVenta: (id: number) => {
    const venta = base.ventas.find((v) => v.id === id) ?? fallar('Venta no encontrada')
    if (venta.anulada) fallar('La venta ya está anulada')
    for (const item of venta.items)
      registrarMovimiento(
        buscarProducto(item.producto_id),
        'anulacion',
        item.cantidad,
        `Anulación ${venta.numero}`,
      )
    if (venta.cliente_id) {
      const cliente = base.clientes.find((c) => c.id === venta.cliente_id)
      if (cliente) cliente.saldo = redondear(cliente.saldo - (venta.total - venta.pagado))
    }
    venta.anulada = true
    guardar()
    return esperar(venta)
  },

  compras: () => esperar([...base.compras].sort((a, b) => b.id - a.id)),

  crearCompra: (datos: {
    proveedor_id: number | null
    remito: string
    items: { producto_id: number; cantidad: number; precio_unitario: number }[]
  }) => {
    if (!datos.items.length) fallar('La compra no tiene items')
    const proveedor = datos.proveedor_id
      ? base.proveedores.find((p) => p.id === datos.proveedor_id)
      : null
    const items = armarItems(datos.items, (p) => p.precio_compra, false)
    const compra: Compra = {
      id: proximoId('compra'),
      fecha: new Date().toISOString(),
      proveedor_id: proveedor?.id ?? null,
      proveedor_nombre: proveedor?.nombre ?? 'Sin proveedor',
      remito: datos.remito,
      total: redondear(items.reduce((t, i) => t + i.subtotal, 0)),
      items,
    }
    for (const item of items) {
      const producto = buscarProducto(item.producto_id)
      producto.precio_compra = item.precio_unitario
      registrarMovimiento(producto, 'compra', item.cantidad, `Compra ${datos.remito || compra.id}`)
    }
    base.compras.push(compra)
    guardar()
    return esperar(compra)
  },
}

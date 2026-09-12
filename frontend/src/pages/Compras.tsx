import { useEffect, useMemo, useState } from 'react'
import { api, fecha, money, type Compra, type Producto, type Proveedor } from '../api'
import { Button, Card, Input, Select, Table } from '../ui'

type Linea = { producto: Producto; cantidad: number; precio: number }

export default function Compras() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [lineas, setLineas] = useState<Linea[]>([])
  const [proveedorId, setProveedorId] = useState<number | null>(null)
  const [remito, setRemito] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')

  const cargar = () => {
    api.productos().then(setProductos)
    api.proveedores().then(setProveedores)
    api.compras().then(setCompras)
  }

  useEffect(cargar, [])

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0),
    [lineas],
  )

  const sugerencias = busqueda
    ? productos
        .filter((p) => `${p.nombre} ${p.codigo}`.toLowerCase().includes(busqueda.toLowerCase()))
        .slice(0, 6)
    : []

  const agregar = (producto: Producto) => {
    setBusqueda('')
    setLineas((prev) =>
      prev.find((l) => l.producto.id === producto.id)
        ? prev.map((l) =>
            l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l,
          )
        : [...prev, { producto, cantidad: 1, precio: producto.precio_compra }],
    )
  }

  const confirmar = async () => {
    try {
      await api.crearCompra({
        proveedor_id: proveedorId,
        remito,
        items: lineas.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cantidad,
          precio_unitario: l.precio,
        })),
      })
      setLineas([])
      setRemito('')
      setError('')
      cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Ingreso de mercadería">
        <div className="grid gap-3 sm:grid-cols-3 mb-3">
          <Select
            label="Proveedor"
            value={proveedorId ?? ''}
            onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
          <Input label="Remito / factura" value={remito} onChange={(e) => setRemito(e.target.value)} />
          <div className="relative">
            <Input
              label="Buscar producto"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {sugerencias.length > 0 && (
              <ul className="absolute z-20 bg-white border border-slate-200 rounded-lg shadow mt-1 w-full">
                {sugerencias.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => agregar(p)}
                      className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sm"
                    >
                      {p.nombre} <span className="text-slate-400">stock {p.stock}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {lineas.length > 0 && (
          <Table headers={['Producto', 'Cantidad', 'Costo unit.', 'Subtotal', '']}>
            {lineas.map((l) => (
              <tr key={l.producto.id}>
                <td className="py-2 pr-3">{l.producto.nombre}</td>
                <td className="py-2 pr-3 w-24">
                  <Input
                    type="number"
                    min={1}
                    value={l.cantidad}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) =>
                          x.producto.id === l.producto.id
                            ? { ...x, cantidad: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </td>
                <td className="py-2 pr-3 w-28">
                  <Input
                    type="number"
                    value={l.precio}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) =>
                          x.producto.id === l.producto.id
                            ? { ...x, precio: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </td>
                <td className="py-2 pr-3 font-medium">{money(l.cantidad * l.precio)}</td>
                <td className="py-2 pr-3 text-right">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setLineas((prev) => prev.filter((x) => x.producto.id !== l.producto.id))
                    }
                  >
                    Quitar
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold">{money(total)}</span>
          <Button onClick={confirmar} disabled={lineas.length === 0}>
            Registrar compra
          </Button>
        </div>
      </Card>

      <Card title="Compras registradas">
        <Table headers={['Fecha', 'Proveedor', 'Remito', 'Items', 'Total']}>
          {compras.map((c) => (
            <tr key={c.id}>
              <td className="py-2 pr-3 whitespace-nowrap">{fecha(c.fecha)}</td>
              <td className="py-2 pr-3">{c.proveedor_nombre}</td>
              <td className="py-2 pr-3">{c.remito}</td>
              <td className="py-2 pr-3 text-slate-500">
                {c.items.map((i) => `${i.descripcion} x${i.cantidad}`).join(', ')}
              </td>
              <td className="py-2 pr-3 font-medium">{money(c.total)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}

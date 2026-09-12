import { useEffect, useState } from 'react'
import { api, fecha, money, type Movimiento, type Producto } from '../api'
import { Button, Card, Input, Modal, Table } from '../ui'

const vacio: Partial<Producto> = {
  codigo: '',
  nombre: '',
  marca: '',
  presentacion: 'atado x20',
  unidades_por_bulto: 10,
  precio_compra: 0,
  precio_venta: 0,
  stock: 0,
  stock_minimo: 0,
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Partial<Producto> | null>(null)
  const [ajustando, setAjustando] = useState<Producto | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null)
  const [error, setError] = useState('')

  const cargar = (q = busqueda) => api.productos(q).then(setProductos).catch(console.error)

  useEffect(() => {
    cargar('')
  }, [])

  const guardar = async () => {
    if (!editando) return
    try {
      if (editando.id) await api.editarProducto(editando.id, editando)
      else await api.crearProducto(editando)
      setEditando(null)
      setError('')
      cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Productos"
        action={<Button onClick={() => setEditando({ ...vacio })}>+ Nuevo producto</Button>}
      >
        <div className="mb-3 max-w-sm">
          <Input
            placeholder="Buscar por nombre, código o marca…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              cargar(e.target.value)
            }}
          />
        </div>
        <Table
          headers={['Código', 'Producto', 'Marca', 'Stock', 'Mínimo', 'Costo', 'Venta', '']}
        >
          {productos.map((p) => (
            <tr key={p.id} className={p.stock <= p.stock_minimo ? 'bg-rose-50' : ''}>
              <td className="py-2 pr-3 font-mono text-xs">{p.codigo}</td>
              <td className="py-2 pr-3">
                {p.nombre}
                <span className="text-slate-400 text-xs ml-1">{p.presentacion}</span>
              </td>
              <td className="py-2 pr-3 text-slate-500">{p.marca}</td>
              <td className={`py-2 pr-3 font-semibold ${p.stock <= p.stock_minimo ? 'text-rose-600' : ''}`}>
                {p.stock}
              </td>
              <td className="py-2 pr-3 text-slate-500">{p.stock_minimo}</td>
              <td className="py-2 pr-3">{money(p.precio_compra)}</td>
              <td className="py-2 pr-3 font-medium">{money(p.precio_venta)}</td>
              <td className="py-2 pr-3 text-right whitespace-nowrap space-x-1">
                <Button variant="ghost" onClick={() => setEditando({ ...p })}>
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => setAjustando(p)}>
                  Ajustar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => api.movimientos(p.id).then(setMovimientos)}
                >
                  Movimientos
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {editando && (
        <Modal
          title={editando.id ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setEditando(null)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Código"
              value={editando.codigo ?? ''}
              onChange={(e) => setEditando({ ...editando, codigo: e.target.value })}
            />
            <Input
              label="Nombre"
              value={editando.nombre ?? ''}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
            />
            <Input
              label="Marca"
              value={editando.marca ?? ''}
              onChange={(e) => setEditando({ ...editando, marca: e.target.value })}
            />
            <Input
              label="Presentación"
              value={editando.presentacion ?? ''}
              onChange={(e) => setEditando({ ...editando, presentacion: e.target.value })}
            />
            <Input
              label="Precio compra"
              type="number"
              value={editando.precio_compra ?? 0}
              onChange={(e) => setEditando({ ...editando, precio_compra: Number(e.target.value) })}
            />
            <Input
              label="Precio venta"
              type="number"
              value={editando.precio_venta ?? 0}
              onChange={(e) => setEditando({ ...editando, precio_venta: Number(e.target.value) })}
            />
            <Input
              label="Stock mínimo"
              type="number"
              value={editando.stock_minimo ?? 0}
              onChange={(e) => setEditando({ ...editando, stock_minimo: Number(e.target.value) })}
            />
            {!editando.id && (
              <Input
                label="Stock inicial"
                type="number"
                value={editando.stock ?? 0}
                onChange={(e) => setEditando({ ...editando, stock: Number(e.target.value) })}
              />
            )}
          </div>
          {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </div>
        </Modal>
      )}

      {ajustando && (
        <AjusteModal
          producto={ajustando}
          onClose={() => setAjustando(null)}
          onSaved={() => {
            setAjustando(null)
            cargar()
          }}
        />
      )}

      {movimientos && (
        <Modal title="Movimientos de stock" onClose={() => setMovimientos(null)}>
          <Table headers={['Fecha', 'Tipo', 'Cant.', 'Resultante', 'Detalle']}>
            {movimientos.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-3 whitespace-nowrap">{fecha(m.fecha)}</td>
                <td className="py-2 pr-3 capitalize">{m.tipo}</td>
                <td className={`py-2 pr-3 font-semibold ${m.cantidad < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </td>
                <td className="py-2 pr-3">{m.stock_resultante}</td>
                <td className="py-2 pr-3 text-slate-500">{m.detalle}</td>
              </tr>
            ))}
          </Table>
        </Modal>
      )}
    </div>
  )
}

function AjusteModal({
  producto,
  onClose,
  onSaved,
}: {
  producto: Producto
  onClose: () => void
  onSaved: () => void
}) {
  const [cantidad, setCantidad] = useState(0)
  const [detalle, setDetalle] = useState('')
  const [error, setError] = useState('')

  const guardar = async () => {
    try {
      await api.ajustarStock(producto.id, cantidad, detalle)
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Modal title={`Ajustar stock — ${producto.nombre}`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-3">
        Stock actual: <strong>{producto.stock}</strong>. Usá negativos para descontar (rotura, faltante).
      </p>
      <div className="grid gap-3">
        <Input
          label="Cantidad (+/-)"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
        />
        <Input
          label="Motivo"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Recuento, rotura, faltante…"
        />
      </div>
      {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar}>Aplicar</Button>
      </div>
    </Modal>
  )
}

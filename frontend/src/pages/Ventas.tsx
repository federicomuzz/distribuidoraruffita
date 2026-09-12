import { useEffect, useMemo, useState } from 'react'
import { api, fecha, money, type Cliente, type Producto, type Venta } from '../api'
import { Button, Card, Input, Modal, Select, Table } from '../ui'
import Comprobante from '../Comprobante'

type Linea = { producto: Producto; cantidad: number; precio: number }

export default function Ventas() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [lineas, setLineas] = useState<Linea[]>([])
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [medioPago, setMedioPago] = useState('efectivo')
  const [observaciones, setObservaciones] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [comprobante, setComprobante] = useState<Venta | null>(null)

  const cargar = () => {
    api.productos().then(setProductos)
    api.clientes().then(setClientes)
    api.ventas().then(setVentas)
  }

  useEffect(cargar, [])

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0),
    [lineas],
  )

  const sugerencias = busqueda
    ? productos
        .filter((p) =>
          `${p.nombre} ${p.codigo} ${p.marca}`.toLowerCase().includes(busqueda.toLowerCase()),
        )
        .slice(0, 6)
    : []

  const agregar = (producto: Producto) => {
    setBusqueda('')
    setLineas((prev) => {
      const existente = prev.find((l) => l.producto.id === producto.id)
      if (existente) {
        return prev.map((l) =>
          l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l,
        )
      }
      return [...prev, { producto, cantidad: 1, precio: producto.precio_venta }]
    })
  }

  const confirmar = async () => {
    try {
      const venta = await api.crearVenta({
        cliente_id: clienteId,
        medio_pago: medioPago,
        observaciones,
        items: lineas.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cantidad,
          precio_unitario: l.precio,
        })),
      })
      setLineas([])
      setObservaciones('')
      setError('')
      setComprobante(venta)
      cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Nueva venta">
            <div className="relative mb-3">
              <Input
                label="Buscar producto"
                placeholder="Escribí nombre o código y elegí de la lista…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {sugerencias.length > 0 && (
                <ul className="absolute z-20 bg-white border border-slate-200 rounded-lg shadow mt-1 w-full">
                  {sugerencias.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => agregar(p)}
                        className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sm flex justify-between"
                      >
                        <span>
                          {p.nombre} <span className="text-slate-400">{p.presentacion}</span>
                        </span>
                        <span className="text-slate-500">
                          {money(p.precio_venta)} · stock {p.stock}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lineas.length === 0 ? (
              <p className="text-sm text-slate-500">Agregá productos para armar el comprobante.</p>
            ) : (
              <Table headers={['Producto', 'Cantidad', 'Precio', 'Subtotal', '']}>
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
          </Card>
        </div>

        <Card title="Cierre">
          <div className="space-y-3">
            <Select
              label="Cliente"
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Consumidor final</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select label="Medio de pago" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cuenta_corriente">Cuenta corriente</option>
            </Select>
            <Input
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
            <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="text-3xl font-bold">{money(total)}</span>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button onClick={confirmar} disabled={lineas.length === 0}>
              Confirmar venta
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Últimas ventas">
        <Table headers={['Número', 'Fecha', 'Cliente', 'Pago', 'Total', 'Estado', '']}>
          {ventas.map((v) => (
            <tr key={v.id} className={v.anulada ? 'opacity-50 line-through' : ''}>
              <td className="py-2 pr-3 font-mono text-xs">{v.numero}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{fecha(v.fecha)}</td>
              <td className="py-2 pr-3">{v.cliente_nombre}</td>
              <td className="py-2 pr-3 capitalize">{v.medio_pago.replace('_', ' ')}</td>
              <td className="py-2 pr-3 font-medium">{money(v.total)}</td>
              <td className="py-2 pr-3">{v.anulada ? 'Anulada' : 'Emitida'}</td>
              <td className="py-2 pr-3 text-right space-x-1 whitespace-nowrap">
                <Button variant="ghost" onClick={() => setComprobante(v)}>
                  Ver
                </Button>
                {!v.anulada && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      api
                        .anularVenta(v.id)
                        .then(cargar)
                        .catch((e) => setError((e as Error).message))
                    }
                  >
                    Anular
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {comprobante && (
        <Modal title={`Comprobante ${comprobante.numero}`} onClose={() => setComprobante(null)}>
          <Comprobante venta={comprobante} />
          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button variant="ghost" onClick={() => setComprobante(null)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

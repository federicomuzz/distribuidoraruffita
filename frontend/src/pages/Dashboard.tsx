import { useEffect, useState } from 'react'
import { api, money, type Dashboard as DashboardData } from '../api'
import { Card, Stat, Table } from '../ui'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error)
  }, [])

  if (!data) return <p className="text-slate-500">Cargando…</p>

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Ventas de hoy"
          value={money(data.ventas_hoy)}
          hint={`${data.cantidad_ventas_hoy} comprobantes`}
          tone="green"
        />
        <Stat label="Ventas del mes" value={money(data.ventas_mes)} tone="blue" />
        <Stat
          label="Valor del stock"
          value={money(data.valor_stock)}
          hint={`${data.productos_activos} productos`}
        />
        <Stat label="Deuda de clientes" value={money(data.deuda_total)} tone="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Stock bajo">
          {data.stock_bajo.length === 0 ? (
            <p className="text-sm text-slate-500">Todo el stock está por encima del mínimo.</p>
          ) : (
            <Table headers={['Producto', 'Stock', 'Mínimo']}>
              {data.stock_bajo.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3">{p.nombre}</td>
                  <td className="py-2 pr-3 font-semibold text-rose-600">{p.stock}</td>
                  <td className="py-2 pr-3 text-slate-500">{p.minimo}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Más vendidos (7 días)">
          {data.mas_vendidos.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay ventas registradas.</p>
          ) : (
            <Table headers={['Producto', 'Unidades']}>
              {data.mas_vendidos.map((p) => (
                <tr key={p.descripcion}>
                  <td className="py-2 pr-3">{p.descripcion}</td>
                  <td className="py-2 pr-3 font-semibold">{p.cantidad}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Clientes con saldo">
          {data.deudores.length === 0 ? (
            <p className="text-sm text-slate-500">No hay cuentas pendientes.</p>
          ) : (
            <Table headers={['Cliente', 'Saldo']}>
              {data.deudores.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-3">{c.nombre}</td>
                  <td className="py-2 pr-3 font-semibold text-rose-600">{money(c.saldo)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

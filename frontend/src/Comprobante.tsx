import { fecha, money, type Venta } from './api'

export default function Comprobante({ venta }: { venta: Venta }) {
  return (
    <div className="text-sm">
      <div className="flex justify-between border-b border-slate-300 pb-2 mb-3">
        <div>
          <div className="font-bold text-base">Distribuidora</div>
          <div className="text-slate-500 text-xs">Comprobante interno — documento no válido como factura</div>
        </div>
        <div className="text-right">
          <div className="font-mono">{venta.numero}</div>
          <div className="text-slate-500 text-xs">{fecha(venta.fecha)}</div>
        </div>
      </div>

      <div className="mb-3">
        <div>
          <span className="text-slate-500">Cliente: </span>
          {venta.cliente_nombre}
        </div>
        <div className="capitalize">
          <span className="text-slate-500">Pago: </span>
          {venta.medio_pago.replace('_', ' ')}
        </div>
        {venta.observaciones && (
          <div>
            <span className="text-slate-500">Obs.: </span>
            {venta.observaciones}
          </div>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
            <th className="py-1">Descripción</th>
            <th className="py-1">Cant.</th>
            <th className="py-1">Precio</th>
            <th className="py-1 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {venta.items.map((i) => (
            <tr key={i.producto_id}>
              <td className="py-1">{i.descripcion}</td>
              <td className="py-1">{i.cantidad}</td>
              <td className="py-1">{money(i.precio_unitario)}</td>
              <td className="py-1 text-right">{money(i.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-300 mt-3 pt-2 text-right">
        <div className="text-xs text-slate-500">
          Pagado {money(venta.pagado)} · Saldo {money(venta.total - venta.pagado)}
        </div>
        <div className="text-xl font-bold">Total {money(venta.total)}</div>
      </div>
      {venta.anulada && (
        <div className="mt-2 text-center text-rose-600 font-bold">ANULADO</div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api, money, type Cliente } from '../api'
import { Button, Card, Input, Modal, Select, Table } from '../ui'

const vacio: Partial<Cliente> = {
  nombre: '',
  cuit: '',
  direccion: '',
  localidad: '',
  telefono: '',
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [editando, setEditando] = useState<Partial<Cliente> | null>(null)
  const [cobrando, setCobrando] = useState<Cliente | null>(null)
  const [error, setError] = useState('')

  const cargar = () => api.clientes().then(setClientes)

  useEffect(() => {
    cargar()
  }, [])

  const guardar = async () => {
    if (!editando) return
    try {
      if (editando.id) await api.editarCliente(editando.id, editando)
      else await api.crearCliente(editando)
      setEditando(null)
      cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Clientes" action={<Button onClick={() => setEditando({ ...vacio })}>+ Nuevo cliente</Button>}>
        <Table headers={['Nombre', 'CUIT', 'Dirección', 'Teléfono', 'Saldo', '']}>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td className="py-2 pr-3 font-medium">{c.nombre}</td>
              <td className="py-2 pr-3 text-slate-500">{c.cuit}</td>
              <td className="py-2 pr-3 text-slate-500">
                {c.direccion} {c.localidad && `— ${c.localidad}`}
              </td>
              <td className="py-2 pr-3 text-slate-500">{c.telefono}</td>
              <td className={`py-2 pr-3 font-semibold ${c.saldo > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {money(c.saldo)}
              </td>
              <td className="py-2 pr-3 text-right space-x-1 whitespace-nowrap">
                <Button variant="ghost" onClick={() => setEditando({ ...c })}>
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => setCobrando(c)}>
                  Cobrar
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {editando && (
        <Modal title={editando.id ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setEditando(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={editando.nombre ?? ''}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
            />
            <Input
              label="CUIT"
              value={editando.cuit ?? ''}
              onChange={(e) => setEditando({ ...editando, cuit: e.target.value })}
            />
            <Input
              label="Dirección"
              value={editando.direccion ?? ''}
              onChange={(e) => setEditando({ ...editando, direccion: e.target.value })}
            />
            <Input
              label="Localidad"
              value={editando.localidad ?? ''}
              onChange={(e) => setEditando({ ...editando, localidad: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={editando.telefono ?? ''}
              onChange={(e) => setEditando({ ...editando, telefono: e.target.value })}
            />
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

      {cobrando && (
        <CobroModal
          cliente={cobrando}
          onClose={() => setCobrando(null)}
          onSaved={() => {
            setCobrando(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function CobroModal({
  cliente,
  onClose,
  onSaved,
}: {
  cliente: Cliente
  onClose: () => void
  onSaved: () => void
}) {
  const [monto, setMonto] = useState(cliente.saldo)
  const [medio, setMedio] = useState('efectivo')
  const [detalle, setDetalle] = useState('')
  const [error, setError] = useState('')

  const guardar = async () => {
    try {
      await api.registrarPago(cliente.id, monto, medio, detalle)
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Modal title={`Cobro — ${cliente.nombre}`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-3">
        Saldo actual: <strong>{money(cliente.saldo)}</strong>
      </p>
      <div className="grid gap-3">
        <Input label="Monto" type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
        <Select label="Medio" value={medio} onChange={(e) => setMedio(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="cheque">Cheque</option>
        </Select>
        <Input label="Detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      </div>
      {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar}>Registrar cobro</Button>
      </div>
    </Modal>
  )
}

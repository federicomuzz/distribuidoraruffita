import { useState } from 'react'
import { api } from './api'
import Clientes from './pages/Clientes'
import Compras from './pages/Compras'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'

const SECCIONES = [
  { id: 'dashboard', label: 'Panel', componente: Dashboard },
  { id: 'ventas', label: 'Ventas', componente: Ventas },
  { id: 'productos', label: 'Stock', componente: Productos },
  { id: 'compras', label: 'Compras', componente: Compras },
  { id: 'clientes', label: 'Clientes', componente: Clientes },
] as const

export default function App() {
  const [seccion, setSeccion] = useState<string>('dashboard')
  const Actual = SECCIONES.find((s) => s.id === seccion)!.componente

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-bold">Distribuidora · Gestión</span>
          <nav className="flex gap-1 flex-1">
            {SECCIONES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeccion(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  seccion === s.id ? 'bg-white text-slate-900 font-medium' : 'hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              if (confirm('¿Restaurar los datos de demostración? Se borran ventas y compras cargadas.')) {
                api.reiniciarDemo().then(() => window.location.reload())
              }
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Reiniciar demo
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <Actual />
      </main>
    </div>
  )
}

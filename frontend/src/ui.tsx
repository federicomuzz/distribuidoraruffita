import type { ReactNode } from 'react'

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="font-semibold text-slate-700">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Stat({ label, value, hint, tone = 'slate' }: { label: string; value: string; hint?: string; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'text-slate-800',
    green: 'text-emerald-600',
    red: 'text-rose-600',
    blue: 'text-sky-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white',
    ghost: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className, ...rest } = props
  return (
    <label className="block">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <input
        {...rest}
        className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 ${className ?? ''}`}
      />
    </label>
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const { label, className, children, ...rest } = props
  return (
    <label className="block">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <select
        {...rest}
        className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${className ?? ''}`}
      >
        {children}
      </select>
    </label>
  )
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

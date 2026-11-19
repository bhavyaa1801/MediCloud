import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { Modal } from '../components/common/index.jsx'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
const colors = { success: 'text-success', error: 'text-danger', info: 'text-brand' }

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  useEffect(() => { // surfaces backend errors (e.g. SLOT_UNAVAILABLE) from any action that didn't handle them
    const h = (e) => { if (e.reason?.isApi) { toast(e.reason.message, 'error'); e.preventDefault() } }
    window.addEventListener('unhandledrejection', h)
    return () => window.removeEventListener('unhandledrejection', h)
  }, [toast])

  const confirm = useCallback((opts) => new Promise((res) => {
    resolver.current = res
    setDialog(typeof opts === 'string' ? { message: opts } : opts)
  }), [])
  const close = (v) => { setDialog(null); resolver.current?.(v) }

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type]
          return (
            <div key={t.id} className="card flex items-start gap-3 p-3 shadow-lg">
              <Icon size={18} className={`mt-0.5 shrink-0 ${colors[t.type]}`} />
              <p className="flex-1 text-sm">{t.message}</p>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-muted"><X size={14} /></button>
            </div>
          )
        })}
      </div>
      <Modal open={!!dialog} onClose={() => close(false)} title={dialog?.title || 'Please confirm'}>
        <p className="text-sm text-muted">{dialog?.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
          <button className={`btn ${dialog?.danger === false ? 'btn-primary' : 'btn-danger'}`} onClick={() => close(true)}>{dialog?.confirmText || 'Confirm'}</button>
        </div>
      </Modal>
    </Ctx.Provider>
  )
}

import { createContext, useContext, useEffect, useState } from 'react'
import * as auth from '../services/authService.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export const homeFor = (role) => `/${role}`

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Mock: restores the saved demo session. Live: Firebase auth state + custom claims (persists across refresh).
  useEffect(() => auth.init((s) => { setUser(s); setLoading(false) }), [])
  const run = (fn) => async (...a) => { const s = await fn(...a); setUser(s); return s }
  const value = {
    user, loading,
    login: run(auth.login), loginAs: run(auth.loginAs), register: run(auth.registerPatient),
    updateSession: (patch) => setUser((u) => { const s = { ...u, ...patch }; auth.saveSession(s); return s }),
    logout: () => { auth.logout(); setUser(null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

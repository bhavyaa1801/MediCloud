import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { watch } from '../services/realtime.js'

// Runs an async service call -> { data, loading, reload }.
// `watchKinds` (e.g. ['appointments']) subscribes to Firestore changes (live mode) and refetches quietly.
export function useData(fn, deps = [], initial = null, watchKinds = []) {
  const { user } = useAuth()
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const quiet = useRef(false)
  useEffect(() => {
    let live = true
    if (!quiet.current) setLoading(true)
    quiet.current = false
    fn().then((d) => { if (live) { setData(d); setLoading(false) } }).catch(() => { if (live) { setData(initial); setLoading(false) } })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const key = watchKinds.join(',')
  useEffect(() => {
    if (!user || !key) return undefined
    const offs = key.split(',').map((k) => watch(k, user, () => { quiet.current = true; setTick((t) => t + 1) }))
    return () => offs.forEach((o) => o())
  }, [user?.userId, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return { data, loading, reload }
}

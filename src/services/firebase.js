// Free-plan (Spark) setup: only Auth + Firestore are used. Public web config comes from Vite env vars (not secrets).
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const env = import.meta.env
export const IS_MOCK = env.VITE_DATA_MODE !== 'live'

let app = null, auth = null, db = null
if (!IS_MOCK) {
  app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
  })
  auth = getAuth(app); db = getFirestore(app) // no offline persistence: avoids caching patient data on shared computers
}
export { app, auth, db }

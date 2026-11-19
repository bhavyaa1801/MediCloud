// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/authService.js'
import * as live from './live/authService.js'
const s = IS_MOCK ? mock : live
export const init = s.init
export const login = s.login
export const loginAs = s.loginAs
export const registerPatient = s.registerPatient
export const logout = s.logout
export const sendReset = s.sendReset
export const saveSession = s.saveSession

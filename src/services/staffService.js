// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/staffService.js'
import * as live from './live/staffService.js'
const s = IS_MOCK ? mock : live
export const getStaff = s.getStaff
export const updateStaff = s.updateStaff
export const addStaff = s.addStaff

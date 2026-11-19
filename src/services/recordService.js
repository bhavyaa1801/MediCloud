// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/recordService.js'
import * as live from './live/recordService.js'
const s = IS_MOCK ? mock : live
export const getRecords = s.getRecords
export const getPrescriptions = s.getPrescriptions
export const addRecord = s.addRecord
export const addPrescription = s.addPrescription
export const downloadRecord = s.downloadRecord

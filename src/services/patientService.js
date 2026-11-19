// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/patientService.js'
import * as live from './live/patientService.js'
const s = IS_MOCK ? mock : live
export const getPatients = s.getPatients
export const getPatient = s.getPatient
export const getDoctorPatients = s.getDoctorPatients
export const addPatient = s.addPatient
export const updatePatient = s.updatePatient

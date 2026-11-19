// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/doctorService.js'
import * as live from './live/doctorService.js'
const s = IS_MOCK ? mock : live
export const getDoctors = s.getDoctors
export const getDoctor = s.getDoctor
export const getDepartments = s.getDepartments
export const addDoctor = s.addDoctor
export const updateDoctor = s.updateDoctor
export const addDepartment = s.addDepartment
export const updateDepartment = s.updateDepartment

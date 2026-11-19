// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/appointmentService.js'
import * as live from './live/appointmentService.js'
const s = IS_MOCK ? mock : live
export const getAppointments = s.getAppointments
export const getPatientAppointments = s.getPatientAppointments
export const getDoctorAppointments = s.getDoctorAppointments
export const getAppointment = s.getAppointment
export const getAvailableSlots = s.getAvailableSlots
export const bookAppointment = s.bookAppointment
export const cancelAppointment = s.cancelAppointment
export const updateAppointmentStatus = s.updateAppointmentStatus
export const saveConsultation = s.saveConsultation

// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/adminService.js'
import * as live from './live/adminService.js'
const s = IS_MOCK ? mock : live
export const getUsers = s.getUsers
export const updateUser = s.updateUser
export const getAuditLogs = s.getAuditLogs
export const getSettings = s.getSettings
export const saveSettings = s.saveSettings
export const exportData = s.exportData

// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/notificationService.js'
import * as live from './live/notificationService.js'
const s = IS_MOCK ? mock : live
export const getNotifications = s.getNotifications
export const markAsRead = s.markAsRead
export const markAllAsRead = s.markAllAsRead

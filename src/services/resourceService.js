// Switches between the local demo implementation and the Firebase-backed one (VITE_DATA_MODE).
import { IS_MOCK } from './firebase.js'
import * as mock from './mock/resourceService.js'
import * as live from './live/resourceService.js'
const s = IS_MOCK ? mock : live
export const getResources = s.getResources
export const addResource = s.addResource
export const updateResource = s.updateResource

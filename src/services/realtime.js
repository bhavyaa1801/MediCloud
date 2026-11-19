import { IS_MOCK } from './firebase.js'
import * as live from './live/realtime.js'
export const watch = IS_MOCK ? () => () => {} : live.watch

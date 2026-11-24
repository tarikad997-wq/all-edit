import { uid } from '../../core/types'
export interface Actor { id: string; name: string; birth: string; death: string; oldImg: string; newImg: string; duration: number }
export interface Project { actors: Actor[]; guessMode?: boolean; guessSecs?: number; font?: string; accent?: string; look?: 'classic' | 'bold' | 'neon'; preset?: string; trans?: string; overlay?: string }
export const newActor = (): Actor => ({ id: uid(), name: '', birth: '', death: '', oldImg: '', newImg: '', duration: 5 })

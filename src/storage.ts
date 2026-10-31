import { DEFAULT_APPEARANCE, type Appearance } from './types'

const APPEARANCE_KEY = 'photo-calendar:appearance'
const COVERS_KEY = 'photo-calendar:covers'

export function loadAppearance(): Appearance {
  try {
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? '{}') }
  } catch {
    return DEFAULT_APPEARANCE
  }
}

export function saveAppearance(value: Appearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(value))
}

export function loadCovers(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(COVERS_KEY) ?? '{}') } catch { return {} }
}

export function saveCovers(value: Record<string, string>) {
  localStorage.setItem(COVERS_KEY, JSON.stringify(value))
}

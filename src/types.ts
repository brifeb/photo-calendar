export type LayoutMode = 'single' | 'grid' | 'columns' | 'rows'
export type CoverMode = 'latest' | 'oldest' | 'random'

export type Photo = {
  id: string
  uri: string
  date: string
  name: string
  width: number
  height: number
  size: string
  camera: string
  location?: string
}

export type Appearance = {
  layout: LayoutMode
  cellHeight: number
  gap: number
  radius: number
  showBadge: boolean
  coverMode: CoverMode
}

export const DEFAULT_APPEARANCE: Appearance = {
  layout: 'single',
  cellHeight: 100,
  gap: 4,
  radius: 12,
  showBadge: true,
  coverMode: 'latest',
}

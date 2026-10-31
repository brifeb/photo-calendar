import { registerPlugin } from '@capacitor/core'
import type { Photo } from './types'

export interface PhotoLibraryPlugin {
  requestAccess(): Promise<{ granted: boolean; limited: boolean }>
  listPhotos(options: { startDate: string; endDate: string; offset?: number; limit?: number }): Promise<{ photos: Photo[]; hasMore: boolean }>
  getMetadata(options: { id: string }): Promise<Partial<Photo> & { takenAt?: string }>
}

export const PhotoLibrary = registerPlugin<PhotoLibraryPlugin>('PhotoLibrary')

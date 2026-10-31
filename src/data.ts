import type { Photo } from './types'

const images = [
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80',
  'https://images.unsplash.com/photo-1507521220615-8d29e0c3a6ca?w=800&q=80',
  'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
]

export const demoPhotos: Photo[] = Array.from({ length: 24 }, (_, index) => {
  const day = String((index % 19) + 1).padStart(2, '0')
  return {
    id: `demo-${index + 1}`,
    uri: images[index % images.length],
    date: `2026-10-${day}`,
    name: `IMG_${String(1024 + index)}.jpg`,
    width: 4032,
    height: 3024,
    size: `${(2.4 + index / 5).toFixed(1)} MB`,
    camera: index % 2 ? 'Pixel 9 Pro' : 'Sony α7 IV',
    location: index % 3 ? 'Jakarta, Indonesia' : 'Bandung, Indonesia',
  }
})

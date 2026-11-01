import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Image, LoaderCircle, RotateCcw, Settings, SlidersHorizontal, X } from 'lucide-react'
import { demoPhotos } from './data'
import { isNative, PhotoLibrary, toWebUri } from './native'
import { DEFAULT_APPEARANCE, type Appearance, type LayoutMode, type Photo } from './types'
import { loadAppearance, loadCovers, saveAppearance, saveCovers } from './storage'

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const weekdayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function isoDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` }
function dateKey(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
function gridDates(year: number, month: number) {
  const first = (new Date(year, month, 1).getDay() + 6) % 7
  return Array.from({ length: first + daysInMonth(year, month) }, (_, index) => index < first ? null : index - first + 1)
}

function App() {
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance)
  const [covers, setCovers] = useState(loadCovers)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ photos: Photo[]; index: number } | null>(null)
  const [photos, setPhotos] = useState<Photo[]>(isNative ? [] : demoPhotos)
  const [libraryState, setLibraryState] = useState<'loading' | 'ready' | 'denied' | 'error'>(isNative ? 'loading' : 'ready')

  useEffect(() => {
    if (!isNative) return
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 8, 0)
    PhotoLibrary.requestAccess()
      .then(access => access.granted ? PhotoLibrary.listPhotos({ startDate: isoDate(start), endDate: isoDate(end), limit: 500 }) : Promise.reject(new Error('permission-denied')))
      .then(result => { setPhotos(result.photos.map(photo => ({ ...photo, uri: toWebUri(photo.uri) }))); setLibraryState('ready') })
      .catch(error => setLibraryState(error instanceof Error && error.message === 'permission-denied' ? 'denied' : 'error'))
  }, [])

  const grouped = useMemo(() => photos.reduce<Record<string, Photo[]>>((result, photo) => {
    ;(result[photo.date] ??= []).push(photo)
    return result
  }, {}), [])

  function updateAppearance(patch: Partial<Appearance>) {
    const next = { ...appearance, ...patch }
    setAppearance(next); saveAppearance(next)
  }

  function setCover(date: string, photo: Photo) {
    const next = { ...covers, [date]: photo.id }
    setCovers(next); saveCovers(next); setSelectedDate(null)
  }

  const today = new Date()
  const months = Array.from({ length: 7 }, (_, offset) => { const d = new Date(today.getFullYear(), today.getMonth() + offset, 1); return { year: d.getFullYear(), month: d.getMonth() } })

  return <div className="min-h-screen bg-zinc-950 text-zinc-100">
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur md:px-8" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: '1rem' }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-amber-400 p-2 text-zinc-950"><CalendarDays size={20} /></div><div><h1 className="font-semibold tracking-tight">Photo Calendar</h1><p className="text-xs text-zinc-500">Offline photo memories</p></div></div>
        <button onClick={() => setSettingsOpen(true)} className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition hover:border-zinc-700 hover:text-white" aria-label="Buka pengaturan"><Settings size={19} /></button>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-5 md:px-8">
      <div className="mb-5 flex items-end justify-between"><div><p className="text-sm text-zinc-500">Timeline</p><h2 className="text-2xl font-semibold">Kalender foto</h2></div><div className="flex items-center gap-2 text-xs text-zinc-500"><Image size={14} /> {photos.length} foto</div></div>
      {libraryState === 'loading' && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400"><LoaderCircle size={16} className="animate-spin text-amber-400" /> Membaca galeri foto…</div>}
      {libraryState === 'denied' && <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Akses foto belum diberikan. Buka Settings Android → Apps → Photo Calendar → Permissions → Photos and videos, lalu pilih foto yang ingin ditampilkan.</div>}
      {libraryState === 'error' && <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">Galeri tidak dapat dibaca. Coba tutup dan buka kembali aplikasi.</div>}
      <div className="mb-3 grid grid-cols-7 gap-2 px-1 text-center text-[11px] font-medium uppercase tracking-wider text-zinc-600">{weekdayNames.map(day => <span key={day}>{day}</span>)}</div>
      <div className="space-y-10" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 2400px' }}>
        {months.map(({ year, month }) => <Month key={`${year}-${month}`} year={year} month={month} grouped={grouped} covers={covers} appearance={appearance} onSelectDate={setSelectedDate} onView={(photos, index) => setViewer({ photos, index })} />)}
      </div>
    </main>
    {selectedDate && <DateSheet date={selectedDate} photos={grouped[selectedDate] ?? []} coverId={covers[selectedDate]} onClose={() => setSelectedDate(null)} onSetCover={setCover} onView={(photos, index) => { setSelectedDate(null); setViewer({ photos, index }) }} />}
    {viewer && <Viewer state={viewer} onClose={() => setViewer(null)} onChange={index => setViewer({ ...viewer, index })} />}
    {settingsOpen && <SettingsSheet appearance={appearance} onChange={updateAppearance} onReset={() => { setAppearance(DEFAULT_APPEARANCE); saveAppearance(DEFAULT_APPEARANCE) }} onClose={() => setSettingsOpen(false)} />}
  </div>
}

function Month({ year, month, grouped, covers, appearance, onSelectDate, onView }: { year: number; month: number; grouped: Record<string, Photo[]>; covers: Record<string, string>; appearance: Appearance; onSelectDate: (date: string) => void; onView: (photos: Photo[], index: number) => void }) {
  const dates = gridDates(year, month)
  return <section style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-medium">{monthNames[month]} <span className="text-zinc-600">{year}</span></h3><span className="text-xs text-zinc-600">{dates.filter(Boolean).length} hari</span></div><div className="grid grid-cols-7 gap-2">
    {dates.map((day, index) => { if (!day) return <div key={`empty-${index}`} />; const key = dateKey(year, month, day); const photos = grouped[key] ?? []; return <DayCell key={key} day={day} photos={photos} coverId={covers[key]} appearance={appearance} onClick={() => photos.length && onSelectDate(key)} onView={onView} /> })}
  </div></section>
}

function DayCell({ day, photos, coverId, appearance, onClick, onView }: { day: number; photos: Photo[]; coverId?: string; appearance: Appearance; onClick: () => void; onView: (photos: Photo[], index: number) => void }) {
  const ordered = [...photos].sort((a, b) => a.id.localeCompare(b.id))
  if (coverId) { const i = ordered.findIndex(photo => photo.id === coverId); if (i > 0) ordered.unshift(...ordered.splice(i, 1)) }
  const visible = appearance.layout === 'single' ? ordered.slice(0, 1) : ordered.slice(0, 4)
  const layoutClass = appearance.layout === 'single' ? 'grid-cols-1' : appearance.layout === 'grid' ? 'grid-cols-2' : appearance.layout === 'columns' ? 'grid-cols-4' : 'grid-cols-1 grid-rows-4'
  return <button disabled={!photos.length} onClick={onClick} className={`group relative aspect-square overflow-hidden bg-zinc-900 text-left transition ${photos.length ? 'hover:ring-2 hover:ring-amber-400/70' : 'cursor-default opacity-45'}`} style={{ borderRadius: `${appearance.radius}%`, aspectRatio: `1 / ${appearance.cellHeight / 100}` }}>
    <div className={`grid h-full w-full ${layoutClass}`} style={{ gap: `${appearance.gap}px` }}>{visible.map((photo, index) => <img key={photo.id} src={photo.uri} alt={photo.name} loading="lazy" decoding="async" className="h-full w-full min-h-0 object-cover" onDoubleClick={() => onView(ordered, index)} />)}</div>
    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-medium backdrop-blur">{day}</span>
    {appearance.showBadge && photos.length > visible.length && <span className="absolute bottom-1.5 right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">+{photos.length - visible.length}</span>}
  </button>
}

function DateSheet({ date, photos, coverId, onClose, onSetCover, onView }: { date: string; photos: Photo[]; coverId?: string; onClose: () => void; onSetCover: (date: string, photo: Photo) => void; onView: (photos: Photo[], index: number) => void }) {
  return <Overlay onClose={onClose}><div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs uppercase tracking-wider text-amber-400">Detail tanggal</p><h2 className="mt-1 text-xl font-semibold">{new Date(`${date}T12:00:00`).toLocaleDateString('id-ID', { dateStyle: 'long' })}</h2><p className="mt-1 text-sm text-zinc-500">{photos.length} foto · ketuk untuk fullscreen</p></div><button onClick={onClose} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"><X size={18} /></button></div><div className="thin-scrollbar grid grid-cols-2 gap-3 overflow-y-auto pr-1">{photos.map((photo, index) => <button key={photo.id} onClick={() => onView(photos, index)} onContextMenu={e => { e.preventDefault(); onSetCover(date, photo) }} className="group relative overflow-hidden rounded-2xl border border-zinc-800 text-left"><img src={photo.uri} alt={photo.name} loading="lazy" decoding="async" className="aspect-square w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-3 pt-8 text-xs"><p className="truncate">{photo.name}</p><p className="mt-1 text-zinc-400">{coverId === photo.id ? 'Cover manual' : 'Tahan untuk jadikan cover'}</p></div>{coverId === photo.id && <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold text-zinc-950">COVER</span>}</button>)}</div></div></Overlay>
}

function Viewer({ state, onClose, onChange }: { state: { photos: Photo[]; index: number }; onClose: () => void; onChange: (index: number) => void }) { const photo = state.photos[state.index]; return <div className="fixed inset-0 z-50 flex flex-col bg-black/95"><div className="flex items-center justify-between p-4"><span className="text-sm text-zinc-400">{state.index + 1} / {state.photos.length}</span><button onClick={onClose} className="rounded-full bg-zinc-900 p-2 text-zinc-300"><X size={20} /></button></div><div className="flex min-h-0 flex-1 items-center justify-center px-5"><img src={photo.uri} alt={photo.name} className="max-h-full max-w-full rounded-xl object-contain" /></div><div className="flex items-center justify-between gap-4 p-4"><button disabled={state.index === 0} onClick={() => onChange(state.index - 1)} className="rounded-full bg-zinc-900 p-3 disabled:opacity-30"><ChevronLeft /></button><div className="min-w-0 flex-1"><p className="truncate text-center text-sm">{photo.name}</p><p className="mt-1 text-center text-xs text-zinc-500">{photo.camera} · {photo.width}×{photo.height} · {photo.size}</p></div><button disabled={state.index === state.photos.length - 1} onClick={() => onChange(state.index + 1)} className="rounded-full bg-zinc-900 p-3 disabled:opacity-30"><ChevronRight /></button></div></div> }

function SettingsSheet({ appearance, onChange, onReset, onClose }: { appearance: Appearance; onChange: (patch: Partial<Appearance>) => void; onReset: () => void; onClose: () => void }) { const options: [LayoutMode, string, string][] = [['single', 'Single', '1 foto'], ['grid', '2×2', 'Grid'], ['columns', '4 kolom', 'Horizontal'], ['rows', '4 baris', 'Vertikal']]; return <Overlay onClose={onClose}><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wider text-amber-400">Appearance</p><h2 className="mt-1 text-xl font-semibold">Tampilan kalender</h2><p className="mt-1 text-sm text-zinc-500">Perubahan langsung tersimpan di perangkat ini.</p></div><button onClick={onClose} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"><X size={18} /></button></div><div className="mt-5 rounded-2xl bg-zinc-900 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><SlidersHorizontal size={16} className="text-amber-400" /> Live preview</div><div className="grid grid-cols-7 gap-1">{Array.from({ length: 14 }, (_, i) => <div key={i} className="aspect-square rounded-sm bg-gradient-to-br from-zinc-700 to-zinc-800" style={{ borderRadius: `${appearance.radius}%` }} />)}</div></div><SettingLabel title="Layout thumbnail" value={options.find(x => x[0] === appearance.layout)?.[1] ?? ''}><div className="grid grid-cols-4 gap-2">{options.map(([value, label, sub]) => <button key={value} onClick={() => onChange({ layout: value })} className={`rounded-xl border p-3 text-left ${appearance.layout === value ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}><p className="text-sm font-medium">{label}</p><p className="mt-1 text-[10px] text-zinc-500">{sub}</p></button>)}</div></SettingLabel><Range title="Tinggi sel" value={appearance.cellHeight} min={60} max={200} step={5} suffix="%" onChange={cellHeight => onChange({ cellHeight })} /><Range title="Jarak antar hari" value={appearance.gap} min={0} max={16} step={1} suffix="px" onChange={gap => onChange({ gap })} /><Range title="Radius sudut" value={appearance.radius} min={0} max={100} step={5} suffix="%" onChange={radius => onChange({ radius })} /><SettingLabel title="Cover otomatis" value={appearance.coverMode === 'latest' ? 'Terbaru' : appearance.coverMode === 'oldest' ? 'Terlama' : 'Acak konsisten'}><select value={appearance.coverMode} onChange={e => onChange({ coverMode: e.target.value as Appearance['coverMode'] })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-zinc-200"><option value="latest">Foto terbaru</option><option value="oldest">Foto pertama</option><option value="random">Acak, tetap konsisten</option></select></SettingLabel><label className="mt-5 flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-3 text-sm"><span>Tampilkan badge +N</span><input type="checkbox" checked={appearance.showBadge} onChange={e => onChange({ showBadge: e.target.checked })} className="h-4 w-4 accent-amber-400" /></label><button onClick={onReset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-3 text-sm text-zinc-400 hover:border-zinc-700 hover:text-white"><RotateCcw size={15} /> Reset pengaturan tampilan</button><p className="mt-3 text-center text-xs text-zinc-600">Cover manual per tanggal tidak terhapus oleh reset ini.</p></div></Overlay> }
function SettingLabel({ title, value, children }: { title: string; value: string; children: React.ReactNode }) { return <div className="mt-5"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{title}</p><span className="text-xs text-zinc-500">{value}</span></div>{children}</div> }
function Range({ title, value, min, max, step, suffix, onChange }: { title: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) { return <div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span>{title}</span><span className="text-zinc-500">{value}{suffix}</span></div><input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="w-full accent-amber-400" /><div className="mt-1 flex justify-between text-[10px] text-zinc-600"><span>{min}{suffix}</span><span>{max}{suffix}</span></div></div> }
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm md:items-center" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>{children}</div> }

export default App

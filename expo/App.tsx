import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import * as MediaLibrary from 'expo-media-library/legacy'
import { Image } from 'expo-image'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

type Photo = MediaLibrary.Asset
type Month = { year: number; month: number; key: string }
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function monthDays(year: number, month: number) { const first = (new Date(year, month, 1).getDay() + 6) % 7; const total = new Date(year, month + 1, 0).getDate(); return Array.from({ length: first + total }, (_, i) => i < first ? null : i - first + 1) }

export default function App() {
  const today = new Date()
  const months = useMemo<Month[]>(() => Array.from({ length: 13 }, (_, i) => { const date = new Date(today.getFullYear(), today.getMonth() - 12 + i, 1); return { year: date.getFullYear(), month: date.getMonth(), key: `${date.getFullYear()}-${date.getMonth()}` } }), [today.getFullYear(), today.getMonth()])
  const [permission, requestPermission] = MediaLibrary.usePermissions()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    const response = await MediaLibrary.getAssetsAsync({ first: 1000, mediaType: MediaLibrary.MediaType.photo, sortBy: [MediaLibrary.SortBy.creationTime] })
    setPhotos(response.assets)
    setLoading(false)
  }, [])

  useEffect(() => { if (permission?.granted) void loadPhotos() }, [permission?.granted, loadPhotos])
  const grouped = useMemo(() => photos.reduce<Record<string, Photo[]>>((acc, photo) => { const timestamp = photo.creationTime > 1_000_000_000_000 ? photo.creationTime : photo.creationTime * 1000; const key = localDateKey(new Date(timestamp)); (acc[key] ??= []).push(photo); return acc }, {}), [photos])

  return <SafeAreaProvider><StatusBar style="light" /><SafeAreaView style={styles.safe} edges={['top']}><View style={styles.header}><View style={styles.logo}><Text style={styles.logoText}>▦</Text></View><View style={styles.titleWrap}><Text style={styles.title}>Photo Calendar</Text><Text style={styles.subtitle}>Native gallery timeline</Text></View><Pressable style={styles.settings}><Text style={styles.settingsText}>⚙</Text></Pressable></View>
    {!permission?.granted ? <View style={styles.permissionCard}><Text style={styles.cardTitle}>Akses foto diperlukan</Text><Text style={styles.cardBody}>Pilih semua foto atau hanya foto tertentu untuk ditampilkan di kalender.</Text><Pressable style={styles.primary} onPress={() => void requestPermission()}><Text style={styles.primaryText}>Izinkan akses foto</Text></Pressable></View> : <><View style={styles.summary}><View><Text style={styles.eyebrow}>Timeline</Text><Text style={styles.heading}>Kalender foto</Text></View><Text style={styles.count}>{loading ? 'Memuat…' : `${photos.length} foto`}</Text></View><View style={styles.weekdays}>{weekdays.map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}</View><FlashList data={months} keyExtractor={item => item.key} renderItem={({ item }) => <MonthRow month={item} grouped={grouped} />} initialScrollIndex={months.length - 1} drawDistance={700} removeClippedSubviews /> </>}
  </SafeAreaView></SafeAreaProvider>
}

function MonthRow({ month, grouped }: { month: Month; grouped: Record<string, Photo[]> }) { const days = monthDays(month.year, month.month); return <View style={styles.month}><View style={styles.monthHeader}><Text style={styles.monthTitle}>{monthNames[month.month]} <Text style={styles.year}>{month.year}</Text></Text><Text style={styles.daysCount}>{days.filter(Boolean).length} hari</Text></View><View style={styles.grid}>{days.map((day, index) => { if (!day) return <View key={`empty-${index}`} style={styles.cell} />; const key = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const dayPhotos = grouped[key] ?? []; return <DayCell key={key} day={day} photos={dayPhotos} /> })}</View></View> }
function DayCell({ day, photos }: { day: number; photos: Photo[] }) { const photo = photos[0]; return <View style={[styles.cell, photos.length ? styles.filled : undefined]}>{photo && <Image source={photo.uri} contentFit="cover" cachePolicy="memory-disk" recyclingKey={photo.id} style={StyleSheet.absoluteFill} /> }<Text style={styles.day}>{day}</Text>{photos.length > 1 && <Text style={styles.badge}>+{photos.length - 1}</Text>}</View> }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#09090b' }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#27272a' }, logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#09090b', fontSize: 32, fontWeight: '800' }, titleWrap: { flex: 1, marginLeft: 12 }, title: { color: '#fafafa', fontSize: 20, fontWeight: '700' }, subtitle: { color: '#71717a', fontSize: 13, marginTop: 3 }, settings: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: '#27272a', alignItems: 'center', justifyContent: 'center' }, settingsText: { color: '#a1a1aa', fontSize: 22 }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 }, eyebrow: { color: '#71717a', fontSize: 13 }, heading: { color: '#fafafa', fontSize: 24, fontWeight: '700', marginTop: 3 }, count: { color: '#71717a', fontSize: 12 }, weekdays: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8 }, weekday: { flex: 1, textAlign: 'center', color: '#52525b', fontSize: 10, fontWeight: '700' }, month: { paddingHorizontal: 16, paddingBottom: 28 }, monthHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }, monthTitle: { color: '#f4f4f5', fontSize: 18, fontWeight: '600' }, year: { color: '#52525b', fontWeight: '400' }, daysCount: { color: '#52525b', fontSize: 11 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, cell: { width: '13.45%', aspectRatio: 1, backgroundColor: '#18181b', borderRadius: 8, overflow: 'hidden', position: 'relative' }, filled: { backgroundColor: '#27272a' }, day: { position: 'absolute', top: 5, left: 5, color: '#f4f4f5', backgroundColor: 'rgba(9,9,11,.72)', overflow: 'hidden', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, fontSize: 11, fontWeight: '700' }, badge: { position: 'absolute', right: 5, bottom: 5, color: '#09090b', backgroundColor: '#fbbf24', overflow: 'hidden', borderRadius: 9, paddingHorizontal: 6, paddingVertical: 3, fontSize: 10, fontWeight: '800' }, permissionCard: { margin: 16, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#3f3f46', backgroundColor: '#18181b' }, cardTitle: { color: '#fafafa', fontSize: 17, fontWeight: '700' }, cardBody: { color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginTop: 8 }, primary: { marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: '#fbbf24' }, primaryText: { color: '#09090b', fontWeight: '800' } })

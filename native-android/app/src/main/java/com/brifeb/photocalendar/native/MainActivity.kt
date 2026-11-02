package com.brifeb.photocalendar.nativeapp

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class Photo(val id: Long, val uri: String, val date: String, val name: String)
data class Month(val year: Int, val month: Int)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { PhotoCalendarApp() }
    }
}

@Composable
private fun PhotoCalendarApp() {
    val context = LocalContext.current
    var photos by remember { mutableStateOf<List<Photo>>(emptyList()) }
    var hasPermission by remember { mutableStateOf(false) }
    var selectedPhoto by remember { mutableStateOf<Photo?>(null) }
    var settingsOpen by remember { mutableStateOf(false) }
    var showDateNumberOnPhoto by remember { mutableStateOf(context.getSharedPreferences("photo_calendar", Context.MODE_PRIVATE).getBoolean("show_date_number_on_photo", false)) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        hasPermission = result.values.any { it }
        if (hasPermission) photos = queryPhotos(context)
    }
    LaunchedEffect(Unit) {
        hasPermission = readPermissionGranted(context)
        if (hasPermission) photos = queryPhotos(context)
    }
    MaterialTheme(colorScheme = androidx.compose.material3.darkColorScheme(primary = Color(0xFFFBBF24), background = Color(0xFF09090B))) {
        Surface(modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing), color = Color(0xFF09090B)) {
            Column {
                Header(onSettings = { settingsOpen = true })
                if (!hasPermission) PermissionCard { permissionLauncher.launch(readPermissions()) }
                else CalendarContent(photos = photos, showDateNumberOnPhoto = showDateNumberOnPhoto, onPhotoClick = { selectedPhoto = it })
            }
        }
        selectedPhoto?.let { PhotoDialog(photo = it, onDismiss = { selectedPhoto = null }) }
        if (settingsOpen) SettingsDialog(showDateNumberOnPhoto = showDateNumberOnPhoto, onShowDateNumberChange = { enabled -> showDateNumberOnPhoto = enabled; context.getSharedPreferences("photo_calendar", Context.MODE_PRIVATE).edit().putBoolean("show_date_number_on_photo", enabled).apply() }, onDismiss = { settingsOpen = false })
    }
}

@Composable
private fun Header(onSettings: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFFFBBF24)), contentAlignment = Alignment.Center) { Text("▦", color = Color(0xFF09090B), fontSize = 28.sp) }
        Column(Modifier.padding(start = 12.dp).weight(1f)) { Text("Photo Calendar", color = Color.White, fontSize = 19.sp); Text("Native gallery timeline", color = Color(0xFF71717A), fontSize = 12.sp) }
        IconButton(onClick = onSettings) { Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color(0xFFA1A1AA)) }
    }
}

@Composable
private fun PermissionCard(onClick: () -> Unit) {
    Column(Modifier.padding(16.dp).clip(RoundedCornerShape(20.dp)).background(Color(0xFF18181B)).padding(18.dp)) {
        Text("Akses foto diperlukan", color = Color.White, fontSize = 17.sp)
        Text("Pilih semua foto atau hanya foto tertentu untuk kalender.", color = Color(0xFFA1A1AA), modifier = Modifier.padding(top = 8.dp))
        Button(onClick = onClick, modifier = Modifier.padding(top = 16.dp)) { Text("Izinkan akses foto") }
    }
}

@Composable
private fun CalendarContent(photos: List<Photo>, showDateNumberOnPhoto: Boolean, onPhotoClick: (Photo) -> Unit) {
    val grouped = photos.groupBy { it.date }
    val now = java.util.Calendar.getInstance()
    val months = (0..12).map { offset -> Month(now.get(java.util.Calendar.YEAR), now.get(java.util.Calendar.MONTH) - 12 + offset) }
    val listState = rememberLazyListState()
    LaunchedEffect(months.size) { listState.scrollToItem(months.lastIndex) }
    Column {
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) { Column { Text("Timeline", color = Color(0xFF71717A), fontSize = 13.sp); Text("Kalender foto", color = Color.White, fontSize = 24.sp) }; Text("${photos.size} foto", color = Color(0xFF71717A), fontSize = 12.sp) }
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.SpaceEvenly) { listOf("Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min").forEach { Text(it, color = Color(0xFF52525B), fontSize = 10.sp) } }
        LazyColumn(state = listState, modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) { items(items = months, key = { "${it.year}-${it.month}" }, contentType = { "month" }) { month -> MonthRow(month, grouped, showDateNumberOnPhoto, onPhotoClick) } }
    }
}

@Composable
private fun MonthRow(month: Month, grouped: Map<String, List<Photo>>, showDateNumberOnPhoto: Boolean, onPhotoClick: (Photo) -> Unit) {
    val calendar = java.util.Calendar.getInstance().apply { set(month.year, month.month, 1) }
    val days = calendar.getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
    val start = (calendar.get(java.util.Calendar.DAY_OF_WEEK) + 5) % 7
    val cells = List(start) { null } + (1..days).toList()
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) { Text("${monthName(month.month)} ${month.year}", color = Color.White, fontSize = 18.sp); Text("$days hari", color = Color(0xFF52525B), fontSize = 11.sp) }
        Spacer(Modifier.size(8.dp))
        cells.chunked(7).forEach { week ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                week.forEach { day ->
                    val date = day?.let { java.util.Calendar.getInstance().apply { set(month.year, month.month, it) }.time }?.let(formatter::format)
                    val photo = date?.let { grouped[it]?.firstOrNull() }
                    Box(Modifier.weight(1f).aspectRatio(1f).clip(RoundedCornerShape(8.dp)).background(Color(0xFF18181B)).then(if (photo != null) Modifier.clickable { onPhotoClick(photo) } else Modifier)) {
                        if (photo != null) AsyncImage(model = photo.uri, contentDescription = photo.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                        if (day != null && (photo == null || showDateNumberOnPhoto)) Text(day.toString(), color = Color.White, modifier = Modifier.padding(5.dp).background(Color(0xB809090B), RoundedCornerShape(7.dp)).padding(horizontal = 7.dp, vertical = 4.dp), fontSize = 11.sp)
                    }
                }
                repeat(7 - week.size) { Spacer(Modifier.weight(1f)) }
            }
            Spacer(Modifier.size(4.dp))
        }
    }
}

@Composable
private fun PhotoDialog(photo: Photo, onDismiss: () -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, title = { Text(photo.name) }, text = { Column { AsyncImage(model = photo.uri, contentDescription = photo.name, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxWidth().aspectRatio(1f)); Text(photo.date, modifier = Modifier.padding(top = 10.dp)) } }, confirmButton = { TextButton(onClick = onDismiss) { Text("Tutup") } })
}

@Composable
private fun SettingsDialog(showDateNumberOnPhoto: Boolean, onShowDateNumberChange: (Boolean) -> Unit, onDismiss: () -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Appearance Settings") }, text = { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Text("Tampilkan nomor tanggal pada foto", modifier = Modifier.weight(1f).padding(end = 12.dp)); Switch(checked = showDateNumberOnPhoto, onCheckedChange = onShowDateNumberChange) } }, confirmButton = { TextButton(onClick = onDismiss) { Text("Tutup") } })
}

private fun monthName(month: Int) = listOf("Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember")[(month + 12) % 12]
private fun readPermissions() = if (Build.VERSION.SDK_INT >= 34) arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) else if (Build.VERSION.SDK_INT >= 33) arrayOf(Manifest.permission.READ_MEDIA_IMAGES) else arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
private fun readPermissionGranted(context: Context) = readPermissions().any { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
private fun queryPhotos(context: Context): List<Photo> {
    val result = mutableListOf<Photo>()
    val projection = arrayOf(MediaStore.Images.Media._ID, MediaStore.Images.Media.DATE_TAKEN, MediaStore.Images.Media.DISPLAY_NAME)
    context.contentResolver.query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, projection, null, null, "${MediaStore.Images.Media.DATE_TAKEN} DESC")?.use { cursor ->
        while (cursor.moveToNext() && result.size < 1000) {
            val id = cursor.getLong(0)
            val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(cursor.getLong(1)))
            result += Photo(id, ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id).toString(), date, cursor.getString(2) ?: "Photo")
        }
    }
    return result
}

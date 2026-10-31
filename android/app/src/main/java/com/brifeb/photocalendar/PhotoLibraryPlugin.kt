package com.brifeb.photocalendar

import android.Manifest
import android.content.ContentUris
import android.content.pm.PackageManager
import android.database.Cursor
import android.os.Build
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@CapacitorPlugin(name = "PhotoLibrary", permissions = [
    Permission(alias = "images", strings = [Manifest.permission.READ_MEDIA_IMAGES]),
    Permission(alias = "selected", strings = [Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED]),
    Permission(alias = "legacy", strings = [Manifest.permission.READ_EXTERNAL_STORAGE])
])
class PhotoLibraryPlugin : Plugin() {
    @PluginMethod
    fun requestAccess(call: PluginCall) {
        val permissions = when {
            Build.VERSION.SDK_INT >= 34 -> arrayOf("images", "selected")
            Build.VERSION.SDK_INT >= 33 -> arrayOf("images")
            else -> arrayOf("legacy")
        }
        if (hasAnyReadPermission()) {
            resolveAccess(call)
            return
        }
        requestPermissionForAliases(permissions, call, "permissionResult")
    }

    @com.getcapacitor.annotation.PermissionCallback
    fun permissionResult(call: PluginCall) {
        resolveAccess(call)
    }

    private fun resolveAccess(call: PluginCall) {
        val result = JSObject()
        result.put("granted", hasAnyReadPermission())
        result.put("limited", Build.VERSION.SDK_INT >= 34 && hasPermission(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) && !hasPermission(Manifest.permission.READ_MEDIA_IMAGES))
        call.resolve(result)
    }

    @PluginMethod
    fun listPhotos(call: PluginCall) {
        if (!hasAnyReadPermission()) { call.reject("Photo permission is not granted"); return }
        val startDate = call.getString("startDate") ?: "1970-01-01"
        val endDate = call.getString("endDate") ?: "2100-01-01"
        val offset = call.getInt("offset") ?: 0
        val limit = call.getInt("limit") ?: 200
        val startMillis = parseDate(startDate)
        val endMillis = parseDate(endDate) + 86_399_999L
        val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
        val projection = arrayOf(MediaStore.Images.Media._ID, MediaStore.Images.Media.DISPLAY_NAME, MediaStore.Images.Media.DATE_TAKEN, MediaStore.Images.Media.WIDTH, MediaStore.Images.Media.HEIGHT, MediaStore.Images.Media.SIZE)
        val selection = "${MediaStore.Images.Media.DATE_TAKEN} >= ? AND ${MediaStore.Images.Media.DATE_TAKEN} <= ?"
        val args = arrayOf(startMillis.toString(), endMillis.toString())
        val photos = JSArray()
        var skipped = 0
        var count = 0
        context.contentResolver.query(collection, projection, selection, args, "${MediaStore.Images.Media.DATE_TAKEN} DESC")?.use { cursor ->
            while (cursor.moveToNext() && count < limit) {
                if (skipped++ < offset) continue
                photos.put(cursorToPhoto(cursor, collection))
                count++
            }
        }
        val result = JSObject().put("photos", photos).put("hasMore", count == limit)
        call.resolve(result)
    }

    @PluginMethod
    fun getMetadata(call: PluginCall) {
        val id = call.getString("id") ?: run { call.reject("Missing id"); return }
        val uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id.toLongOrNull() ?: run { call.reject("Invalid id"); return })
        val result = JSObject().put("id", id)
        context.contentResolver.openFileDescriptor(uri, "r")?.use { descriptor ->
            val exif = ExifInterface(descriptor.fileDescriptor)
            result.put("takenAt", exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL))
            result.put("camera", listOfNotNull(exif.getAttribute(ExifInterface.TAG_MAKE), exif.getAttribute(ExifInterface.TAG_MODEL)).joinToString(" ").ifBlank { null })
            result.put("location", exif.latLong?.let { "${it[0]}, ${it[1]}" })
        }
        call.resolve(result)
    }

    private fun cursorToPhoto(cursor: Cursor, collection: android.net.Uri): JSObject {
        val id = cursor.getLong(0)
        val takenAt = cursor.getLong(2)
        val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(takenAt))
        return JSObject().put("id", id.toString()).put("uri", ContentUris.withAppendedId(collection, id).toString()).put("name", cursor.getString(1)).put("date", date).put("width", cursor.getInt(3)).put("height", cursor.getInt(4)).put("size", "${cursor.getLong(5) / 1_000_000} MB")
    }

    private fun parseDate(value: String): Long = try { SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(value)?.time ?: 0L } catch (_: Exception) { 0L }
    private fun hasPermission(permission: String) = androidx.core.content.ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    private fun hasAnyReadPermission() = if (Build.VERSION.SDK_INT >= 33) hasPermission(Manifest.permission.READ_MEDIA_IMAGES) || (Build.VERSION.SDK_INT >= 34 && hasPermission(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED)) else hasPermission(Manifest.permission.READ_EXTERNAL_STORAGE)
}

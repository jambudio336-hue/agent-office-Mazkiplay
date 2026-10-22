package com.mazkiplay.agentoffice

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mazkiplay.agentoffice.ai.ModelGateway
import com.mazkiplay.agentoffice.ai.ModelOption
import com.mazkiplay.agentoffice.ai.Provider
import com.mazkiplay.agentoffice.security.KeyVault
import kotlinx.coroutines.launch

private val Ink = Color(0xFF0A0D14)
private val Panel = Color(0xFF141A25)
private val PanelRaised = Color(0xFF1B2331)
private val Gold = Color(0xFFE8BB68)
private val Muted = Color(0xFF9BA6B7)
private val Green = Color(0xFF63D8A5)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val vault = KeyVault(applicationContext)
        setContent {
            MaterialTheme(colorScheme = androidx.compose.material3.darkColorScheme(
                primary = Gold,
                onPrimary = Ink,
                secondary = Green,
                background = Ink,
                surface = Panel,
                onSurface = Color(0xFFF1F3F7),
                onSurfaceVariant = Muted,
                error = Color(0xFFFF8D8D),
            )) {
                Surface(modifier = Modifier.fillMaxSize(), color = Ink) { AgentOfficeScreen(vault) }
            }
        }
    }
}

@Composable
private fun AgentOfficeScreen(vault: KeyVault) {
    val scope = rememberCoroutineScope()
    var provider by remember { mutableStateOf(Provider.OPENROUTER) }
    var key by remember { mutableStateOf("") }
    var keySaved by remember { mutableStateOf(false) }
    var customBaseUrl by remember { mutableStateOf("") }
    var models by remember { mutableStateOf<List<ModelOption>>(emptyList()) }
    var selectedModel by remember { mutableStateOf(Provider.OPENROUTER.defaultModel) }
    var prompt by remember { mutableStateOf("") }
    var answer by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var freeOnly by remember { mutableStateOf(true) }
    var providerMenu by remember { mutableStateOf(false) }
    var modelMenu by remember { mutableStateOf(false) }

    fun safeError(message: String, secret: String = key): String =
        message.replace(secret, "••••••••").take(420)

    LaunchedEffect(provider) {
        key = vault.read(provider.id).orEmpty()
        keySaved = key.isNotBlank()
        selectedModel = provider.defaultModel
        models = emptyList()
        answer = ""
        error = ""
    }

    Box(modifier = Modifier.fillMaxSize().background(
        Brush.verticalGradient(listOf(Color(0xFF111824), Ink, Color(0xFF090B10))),
    )) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(42.dp).background(Gold, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.BusinessCenter, contentDescription = null, tint = Ink, modifier = Modifier.size(23.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("MAZKIPLAY", color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                        Text("Agent Office", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
                Surface(color = Color(0xFF17251F), shape = CircleShape) {
                    Row(Modifier.padding(horizontal = 11.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(7.dp).background(Green, CircleShape))
                        Spacer(Modifier.width(7.dp))
                        Text("ON-DEVICE", color = Green, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }

            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(24.dp)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("YOUR PRIVATE AI OFFICE", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.7.sp)
                    Text("Model calls from your phone.", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.SemiBold, lineHeight = 29.sp)
                    Text("Masukkan API key milikmu. Key dienkripsi di perangkat dan dikirim langsung ke provider pilihanmu—bukan ke server Mazkiplay.", color = Muted, fontSize = 14.sp, lineHeight = 20.sp)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Lock, contentDescription = null, tint = Gold, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(7.dp))
                        Text("Android Keystore · AES-GCM · HTTPS", color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            SectionHeading("01", "Pilih provider")
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box {
                        OutlinedButton(onClick = { providerMenu = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)) {
                            Text(provider.label, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Icon(Icons.Filled.ArrowDropDown, contentDescription = "Pilih provider")
                        }
                        DropdownMenu(expanded = providerMenu, onDismissRequest = { providerMenu = false }) {
                            Provider.entries.forEach { item ->
                                DropdownMenuItem(text = { Text(item.label) }, onClick = { provider = item; providerMenu = false })
                            }
                        }
                    }
                    if (provider == Provider.CUSTOM) {
                        OutlinedTextField(
                            value = customBaseUrl, onValueChange = { customBaseUrl = it },
                            label = { Text("Base URL (HTTPS)") }, placeholder = { Text("https://api.example.com/v1") },
                            modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp),
                        )
                    }
                    OutlinedTextField(
                        value = key,
                        onValueChange = { key = it; keySaved = false },
                        label = { Text("API key pribadi") },
                        placeholder = { Text("Tempel key untuk ${provider.label}") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Button(
                            onClick = {
                                if (key.isBlank()) { error = "Masukkan API key provider terlebih dahulu."; return@Button }
                                try {
                                    vault.save(provider.id, key)
                                    keySaved = true
                                    error = ""
                                } catch (e: Exception) { error = safeError(e.message ?: "Key tidak dapat disimpan.") }
                            },
                            shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink),
                        ) { Text(if (keySaved) "Key tersimpan" else "Simpan aman", fontWeight = FontWeight.Bold) }
                        if (keySaved) Text("Tersimpan di perangkat ini", color = Green, fontSize = 12.sp)
                    }
                }
            }

            SectionHeading("02", "Pilih model")
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text("Katalog dari provider", color = Muted, fontSize = 12.sp)
                        if (provider == Provider.OPENROUTER) {
                            TextButton(onClick = { freeOnly = !freeOnly; models = emptyList() }) {
                                Text(if (freeOnly) "Gratis saja ✓" else "Semua model", color = Gold, fontSize = 12.sp)
                            }
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(9.dp), verticalAlignment = Alignment.CenterVertically) {
                        Button(
                            enabled = keySaved && !loading,
                            onClick = {
                                loading = true; error = ""
                                scope.launch {
                                    try {
                                        models = ModelGateway.models(provider, key, customBaseUrl, freeOnly && provider == Provider.OPENROUTER)
                                        if (models.isEmpty()) error = if (provider == Provider.OPENROUTER && freeOnly) "Provider tidak mengembalikan model gratis. Coba Semua model atau periksa key." else "Provider tidak mengembalikan model yang tersedia."
                                        else if (models.none { it.id == selectedModel }) selectedModel = models.first().id
                                    } catch (e: Exception) { error = safeError(e.message ?: "Katalog model gagal dimuat.") }
                                    finally { loading = false }
                                }
                            },
                            shape = RoundedCornerShape(13.dp), colors = ButtonDefaults.buttonColors(containerColor = PanelRaised, contentColor = Gold),
                        ) {
                            if (loading) CircularProgressIndicator(Modifier.size(17.dp), strokeWidth = 2.dp, color = Gold)
                            else Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(7.dp)); Text(if (loading) "Memuat…" else "Muat model")
                        }
                        Text("${models.size} model", color = Muted, fontSize = 12.sp)
                    }
                    Box {
                        OutlinedButton(onClick = { modelMenu = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)) {
                            Text(selectedModel.ifBlank { "Pilih atau ketik model" }, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Icon(Icons.Filled.ArrowDropDown, contentDescription = "Daftar model")
                        }
                        DropdownMenu(expanded = modelMenu, onDismissRequest = { modelMenu = false }) {
                            models.take(150).forEach { item ->
                                DropdownMenuItem(
                                    text = { Text(if (item.free) "${item.id}  ·  FREE" else item.id, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                    onClick = { selectedModel = item.id; modelMenu = false },
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = selectedModel, onValueChange = { selectedModel = it },
                        label = { Text("Model ID (bisa diubah manual)") },
                        modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(14.dp),
                    )
                }
            }

            SectionHeading("03", "Coba percakapan")
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = prompt, onValueChange = { prompt = it },
                        label = { Text("Tulis prompt") }, placeholder = { Text("Tanya atau beri tugas ke model…") },
                        modifier = Modifier.fillMaxWidth(), minLines = 3, maxLines = 6, shape = RoundedCornerShape(14.dp),
                    )
                    Button(
                        enabled = keySaved && prompt.isNotBlank() && selectedModel.isNotBlank() && !loading,
                        onClick = {
                            loading = true; error = ""; answer = ""
                            scope.launch {
                                try { answer = ModelGateway.complete(provider, key, selectedModel.trim(), prompt.trim(), customBaseUrl) }
                                catch (e: Exception) { error = safeError(e.message ?: "Request gagal.") }
                                finally { loading = false }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(8.dp)); Text("Kirim langsung ke ${provider.label}", fontWeight = FontWeight.Bold)
                    }
                    if (answer.isNotBlank()) {
                        Surface(color = PanelRaised, shape = RoundedCornerShape(15.dp)) {
                            Text(answer, modifier = Modifier.fillMaxWidth().padding(15.dp), color = Color(0xFFE9EDF4), fontSize = 14.sp, lineHeight = 21.sp)
                        }
                    }
                    if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error, fontSize = 13.sp, lineHeight = 18.sp)
                }
            }

            Text("MVP native · inference memakai layanan provider pilihanmu melalui internet. API key dan prompt dikirim ke provider saat kamu menekan tombol.", color = Muted, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(horizontal = 3.dp))
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SectionHeading(number: String, title: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(number, color = Gold, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.width(9.dp))
        Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
    }
}

package com.mazkiplay.agentoffice

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material3.AlertDialog
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
import androidx.compose.ui.platform.LocalContext
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
import com.mazkiplay.agentoffice.agent.LocalAgent
import com.mazkiplay.agentoffice.security.KeyVault
import com.mazkiplay.agentoffice.workspace.LocalWorkspace
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch

private val Ink = Color(0xFF0A0D14)
private val Panel = Color(0xFF141A25)
private val PanelRaised = Color(0xFF1B2331)
private val Gold = Color(0xFFE8BB68)
private val Muted = Color(0xFF9BA6B7)
private val Green = Color(0xFF63D8A5)

private data class PendingFileWrite(
    val path: String,
    val content: String,
    val replacing: Boolean,
    val decision: CompletableDeferred<Boolean>,
)

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
                        Text("LOCAL WORKSPACE", color = Green, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = .5.sp)
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

            LocalAgentPanel(provider, key, keySaved, selectedModel, customBaseUrl)

            Text("Agent memakai workspace privat aplikasi di perangkat. Inferensi dikirim langsung ke provider pilihanmu; tidak ada backend Mazkiplay.", color = Muted, fontSize = 11.sp, lineHeight = 16.sp, modifier = Modifier.padding(horizontal = 3.dp))
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun LocalAgentPanel(provider: Provider, key: String, keySaved: Boolean, model: String, customBaseUrl: String) {
    val context = LocalContext.current
    val workspace = remember(context) { LocalWorkspace(context.applicationContext) }
    val agent = remember(workspace) { LocalAgent(workspace) }
    val scope = rememberCoroutineScope()
    var task by remember { mutableStateOf("") }
    var running by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("") }
    var result by remember { mutableStateOf("") }
    var exportStatus by remember { mutableStateOf("") }
    var files by remember { mutableStateOf(runCatching { workspace.list() }.getOrDefault(emptyList())) }
    var pending by remember { mutableStateOf<PendingFileWrite?>(null) }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/zip")) { uri ->
        if (uri != null) scope.launch {
            try {
                val count = withContext(Dispatchers.IO) {
                    val output = context.contentResolver.openOutputStream(uri) ?: error("Could not open the selected document.")
                    workspace.exportZip(output)
                }
                exportStatus = "Export berhasil · $count file"
            } catch (e: Exception) { exportStatus = "INCONCLUSIVE · ${e.message ?: "Export failed."}" }
        }
    }

    pending?.let { proposal ->
        AlertDialog(
            onDismissRequest = { proposal.decision.complete(false); pending = null },
            title = { Text(if (proposal.replacing) "Setujui perubahan file?" else "Buat file baru?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(proposal.path, color = Gold, fontWeight = FontWeight.Bold)
                    Text(proposal.content.take(1000) + if (proposal.content.length > 1000) "\n… (preview dipotong)" else "", color = Muted, fontSize = 12.sp, lineHeight = 17.sp)
                    Text("Agent hanya boleh menulis di workspace privat Mazkiplay. Persetujuan berlaku untuk file ini saja.", color = Muted, fontSize = 11.sp)
                }
            },
            confirmButton = { TextButton(onClick = { proposal.decision.complete(true); pending = null }) { Text("Setujui") } },
            dismissButton = { TextButton(onClick = { proposal.decision.complete(false); pending = null }) { Text("Tolak") } },
        )
    }

    SectionHeading("04", "Local project agent")
    Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Agent dapat menjelajah, mencari, membaca, dan mengusulkan perubahan file di workspace proyek privat aplikasi. Tidak ada shell/terminal atau akses otomatis ke folder lain.", color = Muted, fontSize = 13.sp, lineHeight = 19.sp)
            Text("WORKSPACE PRIVAT · ${files.size} item di root", color = Gold, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = .7.sp)
            if (files.isNotEmpty()) Text(files.take(12).joinToString("\n"), color = Muted, fontSize = 11.sp, lineHeight = 16.sp)
            else Text("Workspace masih kosong. Minta agent membuat file awal; setiap write perlu persetujuanmu.", color = Muted, fontSize = 12.sp)
            TextButton(onClick = { exportLauncher.launch("mazkiplay-workspace.zip") }, enabled = files.isNotEmpty() && !running) {
                Text("Ekspor workspace ZIP…", color = Gold)
            }
            if (exportStatus.isNotBlank()) Text(exportStatus, color = if (exportStatus.startsWith("Export berhasil")) Green else Gold, fontSize = 11.sp)
            OutlinedTextField(
                value = task, onValueChange = { task = it },
                label = { Text("Tugas untuk agent") },
                placeholder = { Text("Contoh: buat README.md untuk aplikasi catatan sederhana") },
                modifier = Modifier.fillMaxWidth(), minLines = 2, maxLines = 5, shape = RoundedCornerShape(14.dp),
            )
            Button(
                enabled = keySaved && task.isNotBlank() && model.isNotBlank() && !running,
                onClick = {
                    running = true; status = "Memulai agent…"; result = ""
                    scope.launch {
                        try {
                            result = agent.run(
                                provider = provider, apiKey = key, model = model.trim(), task = task.trim(), customBaseUrl = customBaseUrl,
                                approveWrite = { path, content, replacing ->
                                    val decision = CompletableDeferred<Boolean>()
                                    withContext(Dispatchers.Main) { pending = PendingFileWrite(path, content, replacing, decision) }
                                    decision.await()
                                },
                                onProgress = { message -> withContext(Dispatchers.Main) { status = message } },
                            )
                            status = "Selesai"
                            files = runCatching { workspace.list() }.getOrDefault(files)
                        } catch (e: Exception) {
                            result = e.message ?: "Agent gagal."
                            status = if (result.startsWith("NOT_SUPPORTED")) "NOT_SUPPORTED" else "INCONCLUSIVE"
                        } finally { running = false }
                    }
                },
                modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Gold, contentColor = Ink),
            ) {
                if (running) CircularProgressIndicator(Modifier.size(17.dp), strokeWidth = 2.dp, color = Ink)
                else Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(8.dp)); Text(if (running) status else "Jalankan agent · ${provider.label}", fontWeight = FontWeight.Bold)
            }
            if (result.isNotBlank()) {
                Surface(color = PanelRaised, shape = RoundedCornerShape(15.dp)) {
                    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(status, color = if (status == "Selesai") Green else Gold, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(result, color = Color(0xFFE9EDF4), fontSize = 13.sp, lineHeight = 19.sp)
                    }
                }
            }
            Text("Tool calling: provider OpenAI-compatible (OpenRouter, OpenAI, DeepSeek, Cerebras, custom). Claude/Gemini untuk agent: NOT_SUPPORTED; chat biasa tetap tersedia.", color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
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

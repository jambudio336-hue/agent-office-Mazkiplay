package id.mazkiplay.agentoffice

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

@CapacitorPlugin(name = "MazkiplayLocalLLM")
class MazkiplayLocalLLMPlugin : Plugin() {
    companion object {
        private const val MODEL_FILE = "qwen3_0.6b_nothink_q4_block32_ekv1280.litertlm"
        private const val MODEL_URL = "https://huggingface.co/litert-community/Qwen3-0.6B-int4/resolve/main/qwen3_0.6b_nothink_q4_block32_ekv1280.litertlm"
        private const val MIN_MODEL_BYTES = 320L * 1024L * 1024L
        private const val MAX_MODEL_BYTES = 370L * 1024L * 1024L
    }

    private val modelExecutor = Executors.newSingleThreadExecutor()
    private val downloadExecutor = Executors.newSingleThreadExecutor()
    private val downloading = AtomicBoolean(false)
    private var engine: Engine? = null
    private var conversation: Conversation? = null

    private fun modelFile(ctx: Context = context): File = File(ctx.filesDir, MODEL_FILE)

    @PluginMethod
    fun getStatus(call: PluginCall) {
        val file = modelFile()
        val ret = JSObject()
        ret.put("supported", true)
        ret.put("downloaded", file.isFile && file.length() in MIN_MODEL_BYTES..MAX_MODEL_BYTES)
        ret.put("sizeBytes", if (file.exists()) file.length() else 0L)
        ret.put("modelName", "Qwen3 0.6B INT4")
        ret.put("ready", engine != null && conversation != null)
        call.resolve(ret)
    }

    @PluginMethod
    fun downloadModel(call: PluginCall) {
        if (!downloading.compareAndSet(false, true)) {
            call.reject("Unduhan model sedang berlangsung.")
            return
        }
        downloadExecutor.execute {
            val target = modelFile()
            val partial = File(target.parentFile, target.name + ".part")
            var connection: HttpURLConnection? = null
            try {
                target.parentFile?.mkdirs()
                if (target.exists() && target.length() in MIN_MODEL_BYTES..MAX_MODEL_BYTES) {
                    val ready = JSObject()
                    ready.put("downloaded", true)
                    ready.put("sizeBytes", target.length())
                    call.resolve(ready)
                    return@execute
                }
                partial.delete()
                connection = (URL(MODEL_URL).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 20000
                    readTimeout = 60000
                    instanceFollowRedirects = true
                    setRequestProperty("User-Agent", "Mazkiplay-Agent-Office-Android")
                }
                connection.connect()
                val code = connection.responseCode
                if (code !in 200..299) throw IllegalStateException("Server model membalas HTTP $code.")
                val declaredLength = connection.contentLengthLong
                if (declaredLength > 0 && declaredLength !in MIN_MODEL_BYTES..MAX_MODEL_BYTES) {
                    throw IllegalStateException("Ukuran model dari server tidak sesuai perkiraan model INT4 (sekitar 329 MiB).")
                }
                val total = if (declaredLength > 0) declaredLength else 0L
                var downloaded = 0L
                BufferedInputStream(connection.inputStream).use { input ->
                    FileOutputStream(partial).use { output ->
                        val buffer = ByteArray(1024 * 128)
                        var count: Int
                        var lastUpdate = 0L
                        while (input.read(buffer).also { count = it } != -1) {
                            output.write(buffer, 0, count)
                            downloaded += count
                            val now = System.currentTimeMillis()
                            if (now - lastUpdate >= 250L) {
                                val progress = JSObject()
                                progress.put("downloadedBytes", downloaded)
                                progress.put("totalBytes", total)
                                progress.put("progress", if (total > 0) (downloaded * 100.0 / total).coerceIn(0.0, 100.0) else -1.0)
                                notifyListeners("modelDownloadProgress", progress)
                                lastUpdate = now
                            }
                        }
                        output.fd.sync()
                    }
                }
                if (downloaded !in MIN_MODEL_BYTES..MAX_MODEL_BYTES) {
                    throw IllegalStateException("Ukuran model tidak valid: ${downloaded} byte. Berkas sementara dihapus.")
                }
                if (declaredLength > 0 && downloaded != declaredLength) {
                    throw IllegalStateException("Unduhan terputus: ukuran berkas tidak cocok dengan server.")
                }
                if (!partial.renameTo(target)) {
                    partial.copyTo(target, overwrite = true)
                    partial.delete()
                }
                val done = JSObject()
                done.put("downloaded", true)
                done.put("sizeBytes", target.length())
                val progress = JSObject()
                progress.put("downloadedBytes", target.length())
                progress.put("totalBytes", target.length())
                progress.put("progress", 100)
                notifyListeners("modelDownloadProgress", progress)
                call.resolve(done)
            } catch (error: Exception) {
                partial.delete()
                call.reject(error.message ?: "Unduhan model gagal.")
            } finally {
                connection?.disconnect()
                downloading.set(false)
            }
        }
    }

    @PluginMethod
    fun prepareModel(call: PluginCall) {
        modelExecutor.execute {
            try {
                ensureEngine()
                val result = JSObject()
                result.put("ready", true)
                result.put("modelName", "Qwen3 0.6B INT4")
                call.resolve(result)
            } catch (error: Exception) {
                call.reject("Model gagal dimuat: ${error.message ?: "kesalahan tidak diketahui"}")
            }
        }
    }

    @PluginMethod
    fun generate(call: PluginCall) {
        val prompt = call.getString("prompt")?.trim().orEmpty()
        val role = call.getString("role")?.trim().orEmpty().ifBlank { "Asisten umum" }
        if (prompt.isBlank()) {
            call.reject("Tulis pertanyaan terlebih dahulu.")
            return
        }
        if (prompt.length > 4000) {
            call.reject("Pertanyaan terlalu panjang. Maksimal 4.000 karakter.")
            return
        }
        modelExecutor.execute {
            try {
                ensureEngine()
                val request = "Kamu Mazkiplay AI, asisten berbahasa Indonesia. Peranmu: $role. Jawab dengan jelas, relevan, jujur tentang batasan, dan berikan langkah yang bisa dilakukan. Jangan mengaku telah menjalankan kode atau mengubah file jika tidak benar-benar dilakukan.\n\nPertanyaan pengguna:\n$prompt"
                val answer = StringBuilder()
                runBlocking {
                    checkNotNull(conversation).sendMessageAsync(request).collect { chunk ->
                        answer.append(chunk.toString())
                    }
                }
                val result = JSObject()
                result.put("answer", answer.toString().trim())
                result.put("model", "Qwen3 0.6B INT4")
                result.put("offline", true)
                call.resolve(result)
            } catch (error: Exception) {
                call.reject("AI generatif lokal gagal: ${error.message ?: "kesalahan tidak diketahui"}")
            }
        }
    }

    @PluginMethod
    fun resetConversation(call: PluginCall) {
        modelExecutor.execute {
            try {
                conversation?.close()
                conversation = null
                val activeEngine = engine ?: throw IllegalStateException("Model belum dimuat.")
                conversation = activeEngine.createConversation(
                    ConversationConfig(
                        systemInstruction = Contents.of("Kamu Mazkiplay AI, asisten lokal yang membantu dalam Bahasa Indonesia."),
                        samplerConfig = SamplerConfig(temperature = 0.7, topK = 32, topP = 0.9)
                    )
                )
                call.resolve(JSObject().put("ready", true))
            } catch (error: Exception) {
                call.reject(error.message ?: "Gagal memulai percakapan baru.")
            }
        }
    }

    private fun ensureEngine() {
        if (engine != null && conversation != null) return
        val file = modelFile()
        if (!file.isFile || file.length() !in MIN_MODEL_BYTES..MAX_MODEL_BYTES) {
            throw IllegalStateException("Model belum diunduh. Tekan tombol Unduh model AI generatif terlebih dahulu.")
        }
        val newEngine = Engine(
            EngineConfig(
                modelPath = file.absolutePath,
                backend = Backend.CPU(),
                cacheDir = context.cacheDir.absolutePath
            )
        )
        try {
            newEngine.initialize()
        } catch (error: Exception) {
            // Do not close an engine whose initialization failed; LiteRT-LM forbids it.
            throw error
        }
        engine = newEngine
        conversation = newEngine.createConversation(
            ConversationConfig(
                systemInstruction = Contents.of("Kamu Mazkiplay AI, asisten lokal yang membantu dalam Bahasa Indonesia. Jawab dengan jelas, jujur, dan aman."),
                samplerConfig = SamplerConfig(temperature = 0.7, topK = 32, topP = 0.9)
            )
        )
    }

    override fun handleOnDestroy() {
        modelExecutor.execute {
            try {
                conversation?.close()
            } catch (_: Exception) {
            } finally {
                conversation = null
            }
            try {
                engine?.close()
            } catch (_: Exception) {
            } finally {
                engine = null
            }
        }
        modelExecutor.shutdown()
        downloadExecutor.shutdown()
        super.handleOnDestroy()
    }
}

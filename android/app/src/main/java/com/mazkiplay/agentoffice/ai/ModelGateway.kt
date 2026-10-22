package com.mazkiplay.agentoffice.ai

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Direct device-to-provider HTTP calls. API keys are never sent to an application backend. */
object ModelGateway {
    suspend fun models(provider: Provider, apiKey: String, customBaseUrl: String = "", freeOnly: Boolean = false): List<ModelOption> =
        withContext(Dispatchers.IO) {
            val base = baseUrl(provider, customBaseUrl)
            val (url, headers) = when (provider.protocol) {
                Protocol.OPENAI_COMPATIBLE -> {
                    val endpoint = if (provider == Provider.OPENROUTER) "$base/models" else "$base/models"
                    endpoint to bearerHeaders(provider, apiKey)
                }
                Protocol.ANTHROPIC -> "$base/v1/models?limit=1000" to mapOf("x-api-key" to apiKey, "anthropic-version" to "2023-06-01")
                Protocol.GEMINI -> "$base/v1beta/models" to mapOf("x-goog-api-key" to apiKey)
            }
            val root = JSONObject(request("GET", url, headers))
            val data = root.optJSONArray("data")
            val results = mutableListOf<ModelOption>()
            when (provider.protocol) {
                Protocol.OPENAI_COMPATIBLE -> if (data != null) {
                    for (i in 0 until data.length()) {
                        val item = data.optJSONObject(i) ?: continue
                        val id = item.optString("id").takeIf(String::isNotBlank) ?: continue
                        val isFree = hasZeroPricing(item.optJSONObject("pricing"))
                        if (!freeOnly || isFree) results += ModelOption(id, isFree)
                    }
                }
                Protocol.ANTHROPIC -> if (data != null) {
                    for (i in 0 until data.length()) {
                        val id = data.optJSONObject(i)?.optString("id").orEmpty()
                        if (id.isNotBlank()) results += ModelOption(id)
                    }
                }
                Protocol.GEMINI -> {
                    val models = root.optJSONArray("models") ?: JSONArray()
                    for (i in 0 until models.length()) {
                        val item = models.optJSONObject(i) ?: continue
                        val methods = item.optJSONArray("supportedGenerationMethods") ?: continue
                        if ((0 until methods.length()).none { methods.optString(it) == "generateContent" }) continue
                        val id = item.optString("name").removePrefix("models/")
                        if (id.isNotBlank()) results += ModelOption(id)
                    }
                }
            }
            results.sortedWith(compareByDescending<ModelOption> { it.free }.thenBy { it.id.lowercase() })
        }

    suspend fun complete(
        provider: Provider,
        apiKey: String,
        model: String,
        prompt: String,
        customBaseUrl: String = "",
    ): String = withContext(Dispatchers.IO) {
        require(prompt.isNotBlank()) { "Prompt tidak boleh kosong." }
        val base = baseUrl(provider, customBaseUrl)
        when (provider.protocol) {
            Protocol.OPENAI_COMPATIBLE -> {
                val body = JSONObject().put("model", model).put("messages", JSONArray().put(
                    JSONObject().put("role", "user").put("content", prompt),
                )).put("stream", false)
                val json = JSONObject(request("POST", "$base/chat/completions", bearerHeaders(provider, apiKey), body))
                json.optJSONArray("choices")?.optJSONObject(0)?.optJSONObject("message")?.optString("content")
                    ?.takeIf(String::isNotBlank) ?: error("Provider tidak mengembalikan teks jawaban.")
            }
            Protocol.ANTHROPIC -> {
                val body = JSONObject().put("model", model).put("max_tokens", 2048).put("messages", JSONArray().put(
                    JSONObject().put("role", "user").put("content", prompt),
                ))
                val json = JSONObject(request("POST", "$base/v1/messages", mapOf(
                    "x-api-key" to apiKey,
                    "anthropic-version" to "2023-06-01",
                ), body))
                val blocks = json.optJSONArray("content") ?: JSONArray()
                (0 until blocks.length()).mapNotNull { blocks.optJSONObject(it)?.optString("text") }
                    .filter(String::isNotBlank).joinToString("\n").ifBlank { error("Provider tidak mengembalikan teks jawaban.") }
            }
            Protocol.GEMINI -> {
                val safeModel = model.removePrefix("models/")
                val body = JSONObject().put("contents", JSONArray().put(JSONObject().put("role", "user").put(
                    "parts", JSONArray().put(JSONObject().put("text", prompt)),
                )))
                val json = JSONObject(request("POST", "$base/v1beta/models/$safeModel:generateContent", mapOf(
                    "x-goog-api-key" to apiKey,
                ), body))
                val candidates = json.optJSONArray("candidates") ?: JSONArray()
                val parts = candidates.optJSONObject(0)?.optJSONObject("content")?.optJSONArray("parts") ?: JSONArray()
                (0 until parts.length()).mapNotNull { parts.optJSONObject(it)?.optString("text") }
                    .filter(String::isNotBlank).joinToString("\n").ifBlank { error("Provider tidak mengembalikan teks jawaban.") }
            }
        }
    }

    internal fun hasZeroPricing(pricing: JSONObject?): Boolean {
        if (pricing == null) return false
        val prompt = pricing.optString("prompt").toDoubleOrNull() ?: return false
        val completion = pricing.optString("completion").toDoubleOrNull() ?: return false
        return prompt == 0.0 && completion == 0.0
    }

    private fun baseUrl(provider: Provider, customBaseUrl: String): String {
        val raw = if (provider == Provider.CUSTOM) customBaseUrl else provider.baseUrl
        val normalized = raw.trim().trimEnd('/')
        require(normalized.startsWith("https://")) { "Base URL wajib memakai HTTPS." }
        return normalized
    }

    private fun bearerHeaders(provider: Provider, apiKey: String): Map<String, String> = buildMap {
        put("Authorization", "Bearer $apiKey")
        if (provider == Provider.OPENROUTER) {
            put("HTTP-Referer", "https://github.com/jambudio336-hue/agent-office-Mazkiplay")
            put("X-OpenRouter-Title", "MazkiplayAgentOffice")
        }
    }

    private fun request(method: String, endpoint: String, headers: Map<String, String>, body: JSONObject? = null): String {
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 20_000
            readTimeout = 90_000
            instanceFollowRedirects = false
            headers.forEach { (name, value) -> setRequestProperty(name, value) }
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
            }
        }
        try {
            if (body != null) connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                val message = runCatching { JSONObject(text).optString("error").takeIf(String::isNotBlank) }.getOrNull()
                    ?: "HTTP $code"
                error("$message (HTTP $code)")
            }
            return text
        } finally {
            connection.disconnect()
        }
    }
}

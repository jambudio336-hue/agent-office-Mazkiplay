package com.mazkiplay.agentoffice.ai

enum class Provider(
    val id: String,
    val label: String,
    val baseUrl: String,
    val protocol: Protocol,
    val defaultModel: String,
) {
    OPENROUTER("openrouter", "OpenRouter", "https://openrouter.ai/api/v1", Protocol.OPENAI_COMPATIBLE, "openrouter/free"),
    OPENAI("openai", "OpenAI", "https://api.openai.com/v1", Protocol.OPENAI_COMPATIBLE, "gpt-4.1-mini"),
    ANTHROPIC("anthropic", "Claude (Anthropic)", "https://api.anthropic.com", Protocol.ANTHROPIC, "claude-3-5-haiku-latest"),
    DEEPSEEK("deepseek", "DeepSeek", "https://api.deepseek.com", Protocol.OPENAI_COMPATIBLE, "deepseek-chat"),
    GEMINI("gemini", "Google Gemini", "https://generativelanguage.googleapis.com", Protocol.GEMINI, "gemini-2.0-flash"),
    CEREBRAS("cerebras", "Cerebras", "https://api.cerebras.ai/v1", Protocol.OPENAI_COMPATIBLE, "llama-3.3-70b"),
    CUSTOM("custom", "OpenAI-compatible / custom", "", Protocol.OPENAI_COMPATIBLE, "");

    companion object {
        fun fromId(id: String?): Provider = entries.firstOrNull { it.id == id } ?: OPENROUTER
    }
}

enum class Protocol { OPENAI_COMPATIBLE, ANTHROPIC, GEMINI }

data class ModelOption(val id: String, val free: Boolean = false)

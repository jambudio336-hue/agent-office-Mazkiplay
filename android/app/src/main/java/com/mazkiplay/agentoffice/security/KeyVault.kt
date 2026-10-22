package com.mazkiplay.agentoffice.security

import android.content.Context
import android.util.Base64
import androidx.core.content.edit
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Encrypts each provider key before it is written to app-private preferences. */
class KeyVault(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences("provider-keys", Context.MODE_PRIVATE)
    private val keyAlias = "mazkiplay.provider-key.aes"

    fun save(providerId: String, apiKey: String) {
        require(providerId.matches(Regex("[a-z0-9_-]+"))) { "Invalid provider id" }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val encrypted = cipher.doFinal(apiKey.trim().toByteArray(Charsets.UTF_8))
        val packed = cipher.iv + encrypted
        preferences.edit(commit = true) {
            putString(providerId, Base64.encodeToString(packed, Base64.NO_WRAP))
        }
    }

    fun read(providerId: String): String? {
        val stored = preferences.getString(providerId, null) ?: return null
        return try {
            val packed = Base64.decode(stored, Base64.NO_WRAP)
            require(packed.size > IV_BYTES) { "Stored key data is incomplete" }
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(TAG_BITS, packed.copyOfRange(0, IV_BYTES)))
            String(cipher.doFinal(packed.copyOfRange(IV_BYTES, packed.size)), Charsets.UTF_8)
        } catch (_: Exception) {
            null
        }
    }

    fun has(providerId: String): Boolean = preferences.contains(providerId)

    fun delete(providerId: String) {
        preferences.edit { remove(providerId) }
    }

    private fun secretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getKey(keyAlias, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance("AES", "AndroidKeyStore").run {
            init(android.security.keystore.KeyGenParameterSpec.Builder(
                keyAlias,
                android.security.keystore.KeyProperties.PURPOSE_ENCRYPT or android.security.keystore.KeyProperties.PURPOSE_DECRYPT,
            ).setBlockModes(android.security.keystore.KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build())
            generateKey()
        }
    }

    private companion object {
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val IV_BYTES = 12
        const val TAG_BITS = 128
    }
}

package id.mazkiplay.agentoffice;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "MazkiplaySecureStorage")
public class MazkiplaySecureStoragePlugin extends Plugin {
    private static final String STORE = "mazkiplay_secure_store";
    private static final String KEY_ALIAS = "mazkiplay_agent_office_aes_gcm_v1";
    private static final int GCM_TAG_BITS = 128;

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        java.security.Key existing = keyStore.getKey(KEY_ALIAS, null);
        if (existing instanceof SecretKey) return (SecretKey) existing;

        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build());
        return generator.generateKey();
    }

    private String storageKey(String key) {
        return "v1_" + Base64.encodeToString(key.getBytes(StandardCharsets.UTF_8), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
        byte[] iv = cipher.getIV();
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
        buffer.put(iv);
        buffer.put(encrypted);
        return Base64.encodeToString(buffer.array(), Base64.NO_WRAP);
    }

    private String decrypt(String value) throws Exception {
        byte[] payload = Base64.decode(value, Base64.NO_WRAP);
        if (payload.length <= 12) throw new IllegalArgumentException("Invalid encrypted value");
        ByteBuffer buffer = ByteBuffer.wrap(payload);
        byte[] iv = new byte[12];
        buffer.get(iv);
        byte[] encrypted = new byte[buffer.remaining()];
        buffer.get(encrypted);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.isEmpty() || value == null) {
            call.reject("key dan value wajib diisi");
            return;
        }
        try {
            SharedPreferences prefs = getContext().getSharedPreferences(STORE, 0);
            prefs.edit().putString(storageKey(key), encrypt(value)).apply();
            call.resolve();
        } catch (Exception ex) {
            call.reject("Gagal menyimpan rahasia dengan Android Keystore", ex);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("key wajib diisi");
            return;
        }
        try {
            String stored = getContext().getSharedPreferences(STORE, 0).getString(storageKey(key), null);
            JSObject result = new JSObject();
            result.put("value", stored == null ? org.json.JSONObject.NULL : decrypt(stored));
            call.resolve(result);
        } catch (Exception ex) {
            call.reject("Gagal membaca rahasia dari Android Keystore", ex);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("key wajib diisi");
            return;
        }
        getContext().getSharedPreferences(STORE, 0).edit().remove(storageKey(key)).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getContext().getSharedPreferences(STORE, 0).edit().clear().apply();
        call.resolve();
    }
}

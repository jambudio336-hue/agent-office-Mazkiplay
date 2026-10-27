package com.mazkiplay.agentoffice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public final class TermuxResultReceiver extends BroadcastReceiver {
    public static final String ACTION_RESULT = "com.mazkiplay.agentoffice.TERMUX_RESULT";
    public static final String PREFS = "agent-office-mobile";
    public static final String KEY_PENDING_RESULT = "termux-result-pending";
    private static final String RESULT_BUNDLE_KEY = "com.termux.plugin_result_bundle";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle extras = intent == null ? null : intent.getExtras();
        Bundle result = extras == null ? null : extras.getBundle(RESULT_BUNDLE_KEY);
        if (result == null && extras != null) {
            // Defensive fallback for compatible Termux builds that use a namespaced bundle key.
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof Bundle && key.toLowerCase(java.util.Locale.ROOT).contains("plugin_result_bundle")) {
                    result = (Bundle) value;
                    break;
                }
            }
        }

        String stdout = "";
        String stderr = "";
        String error = "";
        int exitCode = -1;
        int internalErrorCode = 0;
        int stdoutOriginalLength = -1;
        int stderrOriginalLength = -1;
        if (result != null) {
            for (String key : result.keySet()) {
                Object value = result.get(key);
                String normalized = key.toLowerCase(java.util.Locale.ROOT);
                if (normalized.contains("stdout_original_length") && value instanceof Number) {
                    stdoutOriginalLength = ((Number) value).intValue();
                } else if (normalized.contains("stderr_original_length") && value instanceof Number) {
                    stderrOriginalLength = ((Number) value).intValue();
                } else if (normalized.contains("stdout") && value != null) {
                    stdout = String.valueOf(value);
                } else if (normalized.contains("stderr") && value != null) {
                    stderr = String.valueOf(value);
                } else if ((normalized.contains("exit_code") || normalized.contains("exitcode")) && value instanceof Number) {
                    exitCode = ((Number) value).intValue();
                } else if ((normalized.endsWith("errmsg") || normalized.contains("error_message")) && value != null) {
                    error = String.valueOf(value);
                } else if ((normalized.endsWith("_err") || normalized.equals("err")) && value instanceof Number) {
                    internalErrorCode = ((Number) value).intValue();
                }
            }
            if (stdoutOriginalLength > stdout.length() || stderrOriginalLength > stderr.length()) {
                error = append(error, "Output dipotong oleh Termux karena batas ukuran hasil.");
            }
            if (internalErrorCode != 0 && internalErrorCode != -1) {
                error = append(error, "Termux gagal memproses perintah (kode internal " + internalErrorCode + ").");
            }
        } else {
            error = "Termux tidak mengirim bundle hasil. Periksa Termux versi 0.109+, izin RUN_COMMAND, dan allow-external-apps.";
        }

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_PENDING_RESULT, true)
                .putString("termux-stdout", stdout)
                .putString("termux-stderr", stderr)
                .putInt("termux-exit-code", exitCode)
                .putString("termux-error", error)
                .putInt("termux-internal-error-code", internalErrorCode)
                .putBoolean("termux-output-truncated", stdoutOriginalLength > stdout.length() || stderrOriginalLength > stderr.length())
                .apply();

        Intent resultBroadcast = new Intent(ACTION_RESULT);
        resultBroadcast.setPackage(context.getPackageName());
        context.sendBroadcast(resultBroadcast);
    }

    private static String append(String existing, String next) {
        return existing == null || existing.isEmpty() ? next : existing + "\n" + next;
    }
}

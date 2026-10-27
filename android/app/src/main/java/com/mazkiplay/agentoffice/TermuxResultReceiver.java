package com.mazkiplay.agentoffice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public final class TermuxResultReceiver extends BroadcastReceiver {
    public static final String ACTION_RESULT = "com.mazkiplay.agentoffice.TERMUX_RESULT";
    public static final String PREFS = "agent-office-mobile";
    public static final String KEY_PENDING_RESULT = "termux-result-pending";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle result = null;
        Bundle extras = intent == null ? null : intent.getExtras();
        if (extras != null) {
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof Bundle) {
                    result = (Bundle) value;
                    break;
                }
            }
        }
        String stdout = "";
        String stderr = "";
        String error = "";
        int exitCode = -1;
        if (result != null) {
            for (String key : result.keySet()) {
                Object value = result.get(key);
                String normalized = key.toLowerCase(java.util.Locale.ROOT);
                if (normalized.contains("stdout") && value != null) stdout = String.valueOf(value);
                else if (normalized.contains("stderr") && value != null) stderr = String.valueOf(value);
                else if ((normalized.contains("exit_code") || normalized.contains("exitcode")) && value instanceof Number) exitCode = ((Number) value).intValue();
                else if ((normalized.endsWith("errmsg") || normalized.contains("error_message")) && value != null) error = String.valueOf(value);
            }
        } else {
            error = "Termux tidak mengirim bundle hasil. Periksa versi Termux (0.109+) dan izin RUN_COMMAND.";
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_PENDING_RESULT, true)
                .putString("termux-stdout", stdout)
                .putString("termux-stderr", stderr)
                .putInt("termux-exit-code", exitCode)
                .putString("termux-error", error)
                .apply();
        Intent resultBroadcast = new Intent(ACTION_RESULT);
        resultBroadcast.setPackage(context.getPackageName());
        context.sendBroadcast(resultBroadcast);
    }
}

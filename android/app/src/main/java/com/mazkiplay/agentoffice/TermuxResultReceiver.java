package com.mazkiplay.agentoffice;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

public final class TermuxResultReceiver extends BroadcastReceiver {
    public static final String ACTION_RESULT = "com.mazkiplay.agentoffice.TERMUX_RESULT";
    public static final String PREFS = "agent-office-mobile";
    public static final String KEY_PENDING_RESULT = "termux-result-pending";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        Bundle result = intent.getBundleExtra("com.termux plugin result bundle");
        if (result == null) {
            result = intent.getBundleExtra("com.termux.RUN_COMMAND_RESULT");
        }
        if (result == null) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean(KEY_PENDING_RESULT, true)
                    .putString("termux-stdout", "")
                    .putString("termux-stderr", "Termux tidak mengirim bundle hasil. Periksa versi Termux dan izin RUN_COMMAND.")
                    .putInt("termux-exit-code", -1)
                    .putString("termux-error", "Missing result bundle")
                    .apply();
        } else {
            String stdout = result.getString("com.termux.RUN_COMMAND_RESULT_STDOUT", "");
            String stderr = result.getString("com.termux.RUN_COMMAND_RESULT_STDERR", "");
            int exitCode = result.getInt("com.termux.RUN_COMMAND_RESULT_EXIT_CODE", -1);
            String error = result.getString("com.termux.RUN_COMMAND_RESULT_ERRMSG", "");
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean(KEY_PENDING_RESULT, true)
                    .putString("termux-stdout", stdout == null ? "" : stdout)
                    .putString("termux-stderr", stderr == null ? "" : stderr)
                    .putInt("termux-exit-code", exitCode)
                    .putString("termux-error", error == null ? "" : error)
                    .apply();
        }
        Intent resultBroadcast = new Intent(ACTION_RESULT);
        resultBroadcast.setPackage(context.getPackageName());
        context.sendBroadcast(resultBroadcast);
    }
}

package com.mazkiplay.agentoffice;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final String PREFS = "agent-office-mobile";
    private static final String KEY_SERVER_ORIGIN = "server-origin";
    private static final int NAVY = Color.rgb(17, 19, 47);
    private static final int CREAM = Color.rgb(255, 241, 222);
    private static final String TERMUX_RESULT_ACTION = "com.mazkiplay.agentoffice.TERMUX_RESULT";
    private BroadcastReceiver termuxResultReceiver;

    private String serverOrigin;
    private WebView webView;
    private TextView statusMessage;
    private Button officeTab;
    private Button godmodeTab;
    private Button licenseTab;
    private boolean godmodeMode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        createScreen();

        serverOrigin = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER_ORIGIN, null);
        if (TextUtils.isEmpty(serverOrigin)) {
            // First launch must never be blocked by a required server dialog.
            showOfflineHome();
        } else {
            loadOffice();
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createScreen() {
        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(NAVY);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(12), 0, dp(6), 0);
        toolbar.setBackgroundColor(NAVY);

        TextView title = new TextView(this);
        title.setText("Mazkiplay Pentester AI");
        title.setTextColor(CREAM);
        title.setTextSize(16);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setSingleLine(true);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(56), 1));

        Button serverButton = toolbarButton("Server");
        serverButton.setContentDescription("Ganti alamat server Agent Office");
        serverButton.setOnClickListener(view -> showServerDialog(false));
        toolbar.addView(serverButton, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48)));

        Button termuxButton = toolbarButton("Termux");
        termuxButton.setContentDescription("Hubungkan dengan Termux");
        termuxButton.setOnClickListener(view -> showTermuxBridgeDialog());
        toolbar.addView(termuxButton, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48)));

        Button refreshButton = toolbarButton("↻");
        refreshButton.setContentDescription("Muat ulang kantor");
        refreshButton.setOnClickListener(view -> {
            if (godmodeMode) {
                webView.reload();
            } else if (TextUtils.isEmpty(serverOrigin)) {
                showOfflineHome();
            } else {
                webView.reload();
            }
        });
        toolbar.addView(refreshButton, new LinearLayout.LayoutParams(dp(48), dp(48)));
        shell.addView(toolbar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56)));

        // Dedicated, equal-width navigation keeps labels visible on narrow Android screens.
        LinearLayout navigation = new LinearLayout(this);
        navigation.setOrientation(LinearLayout.HORIZONTAL);
        navigation.setGravity(Gravity.CENTER_VERTICAL);
        navigation.setPadding(dp(8), dp(4), dp(8), dp(4));
        navigation.setBackgroundColor(Color.rgb(8, 10, 14));

        officeTab = toolbarButton("OFFICE");
        officeTab.setContentDescription("Buka dashboard Mazkiplay Agent Office");
        officeTab.setOnClickListener(view -> loadOffice());
        navigation.addView(officeTab, new LinearLayout.LayoutParams(0, dp(40), 1));

        godmodeTab = toolbarButton("G0DM0D3");
        godmodeTab.setContentDescription("Buka antarmuka AI G0DM0D3 yang disertakan di aplikasi");
        godmodeTab.setOnClickListener(view -> loadGodmode());
        navigation.addView(godmodeTab, new LinearLayout.LayoutParams(0, dp(40), 1));

        licenseTab = toolbarButton("LICENSE");
        licenseTab.setContentDescription("Informasi lisensi dan source code pihak ketiga");
        licenseTab.setOnClickListener(view -> showLicenseDialog());
        navigation.addView(licenseTab, new LinearLayout.LayoutParams(0, dp(40), 1));

        shell.addView(navigation, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));
        updateNavigationTabs();

        FrameLayout content = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(5, 11, 16));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }
        webView.setWebViewClient(new OfficeWebViewClient());
        content.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        statusMessage = new TextView(this);
        statusMessage.setGravity(Gravity.CENTER);
        statusMessage.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        statusMessage.setTextColor(NAVY);
        statusMessage.setTextSize(16);
        statusMessage.setPadding(dp(28), dp(24), dp(28), dp(24));
        statusMessage.setBackgroundColor(CREAM);
        statusMessage.setVisibility(View.GONE);
        content.addView(statusMessage, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        shell.addView(content, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            shell.setOnApplyWindowInsetsListener((view, windowInsets) -> {
                android.graphics.Insets bars = windowInsets.getInsets(android.view.WindowInsets.Type.systemBars());
                android.graphics.Insets ime = windowInsets.getInsets(android.view.WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return windowInsets;
            });
        }

        setContentView(shell);

        android.webkit.CookieManager.getInstance().setAcceptCookie(true);
    }


    private void showTermuxBridgeDialog() {
        EditText commandInput = new EditText(this);
        commandInput.setSingleLine(false);
        commandInput.setMinLines(2);
        commandInput.setHint("Contoh: pwd && ls");
        commandInput.setText("pwd");
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(20), dp(4), dp(20), 0);
        TextView warning = new TextView(this);
        warning.setText("Perintah akan dijalankan di lingkungan Termux milik perangkat ini. Periksa perintah sebelum menjalankan. Jangan masukkan password, token, atau perintah yang tidak Anda pahami. Setiap eksekusi memerlukan konfirmasi.");
        warning.setTextColor(CREAM);
        warning.setPadding(0, 0, 0, dp(10));
        box.addView(warning);
        box.addView(commandInput, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        new AlertDialog.Builder(this)
                .setTitle("Termux • perintah lokal")
                .setView(box)
                .setNegativeButton("Batal", null)
                .setPositiveButton("Tinjau perintah", (dialog, which) -> {
                    String command = commandInput.getText().toString().trim();
                    if (command.isEmpty()) {
                        Toast.makeText(this, "Perintah tidak boleh kosong.", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    new AlertDialog.Builder(this)
                            .setTitle("Konfirmasi eksekusi")
                            .setMessage("Jalankan perintah berikut di Termux?\n\n" + command + "\n\nPerintah ini berjalan dengan hak akses akun Termux Anda.")
                            .setNegativeButton("Kembali", null)
                            .setPositiveButton("Jalankan", (d, w) -> runTermuxCommand(command))
                            .show();
                })
                .show();
    }

    private void runTermuxCommand(String command) {
        Intent intent = new Intent("com.termux.RUN_COMMAND");
        intent.setClassName("com.termux", "com.termux.app.RunCommandService");
        intent.putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/bash");
        intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", new String[]{"-lc", command});
        intent.putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home");
        intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", true);
        intent.putExtra("com.termux.RUN_COMMAND_LABEL", "Mazkiplay Pentester AI");
        intent.putExtra("com.termux.RUN_COMMAND_DESCRIPTION", "Perintah lokal yang dikonfirmasi pengguna.");
        int flags = PendingIntent.FLAG_ONE_SHOT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        Intent resultIntent = new Intent(this, TermuxResultReceiver.class);
        resultIntent.setAction(TERMUX_RESULT_ACTION);
        resultIntent.setPackage(getPackageName());
        PendingIntent resultPendingIntent = PendingIntent.getBroadcast(this, (int) (System.currentTimeMillis() & 0x7fffffff), resultIntent, flags);
        intent.putExtra("com.termux.RUN_COMMAND_PENDING_INTENT", resultPendingIntent);
        try {
            startService(intent);
            new AlertDialog.Builder(this)
                    .setTitle("Perintah dikirim")
                    .setMessage("Perintah dikirim ke Termux. Output dan exit code akan ditampilkan saat Termux mengembalikan hasil. Perlu Termux versi 0.109+ dan izin yang sesuai.")
                    .setPositiveButton("OK", null)
                    .show();
        } catch (SecurityException | IllegalStateException | ActivityNotFoundException error) {
            new AlertDialog.Builder(this)
                    .setTitle("Termux belum terhubung")
                    .setMessage("Gagal mengirim perintah. Periksa Termux, izin Run commands in Termux environment, dan opsi allow-external-apps. Detail: " + error.getClass().getSimpleName())
                    .setPositiveButton("Tutup", null)
                    .show();
        }
    }

    private Button toolbarButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextColor(CREAM);
        button.setTextSize(14);
        button.setMinWidth(dp(48));
        button.setMinimumHeight(dp(48));
        button.setBackgroundColor(Color.TRANSPARENT);
        return button;
    }

    private void showServerDialog(boolean firstSetup) {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setHint("https://agent-office.example.com");
        if (!TextUtils.isEmpty(serverOrigin)) {
            input.setText(serverOrigin);
            input.setSelection(input.getText().length());
        }

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(24), dp(4), dp(24), 0);
        box.addView(input, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        String explanation = "Masukkan alamat HTTPS kantor Anda. APK ini adalah klien ponsel; karyawan AI tetap berjalan di komputer/server Agent Office yang sudah disiapkan.";
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Hubungkan ke Agent Office")
                .setMessage(explanation)
                .setView(box)
                .setPositiveButton("Hubungkan", null)
                .setNegativeButton(firstSetup ? "Keluar" : "Batal", (d, which) -> {
                    if (firstSetup) finish();
                })
                .create();
        dialog.setCancelable(!firstSetup);
        dialog.setCanceledOnTouchOutside(!firstSetup);
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view -> {
            String normalized;
            try {
                normalized = normalizeServerOrigin(input.getText().toString());
            } catch (IllegalArgumentException error) {
                input.setError(error.getMessage());
                return;
            }
            serverOrigin = normalized;
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_SERVER_ORIGIN, normalized).apply();
            dialog.dismiss();
            loadOffice();
        }));
        dialog.show();
        input.requestFocus();
    }

    private String normalizeServerOrigin(String raw) {
        String candidate = raw == null ? "" : raw.trim();
        if (candidate.isEmpty()) {
            throw new IllegalArgumentException("Masukkan alamat server HTTPS.");
        }
        if (!candidate.contains("://")) {
            candidate = "https://" + candidate;
        }
        Uri uri = Uri.parse(candidate);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || TextUtils.isEmpty(uri.getHost())) {
            throw new IllegalArgumentException("Gunakan alamat HTTPS yang memiliki nama host valid.");
        }
        if (!TextUtils.isEmpty(uri.getUserInfo()) || !TextUtils.isEmpty(uri.getQuery()) || !TextUtils.isEmpty(uri.getFragment())) {
            throw new IllegalArgumentException("Alamat server tidak boleh berisi username, password, query, atau fragment.");
        }
        String path = uri.getPath();
        if (!TextUtils.isEmpty(path) && !"/".equals(path)) {
            throw new IllegalArgumentException("Masukkan alamat dasar server saja, tanpa path. Aplikasi akan membuka /chat.");
        }
        int port = uri.getPort();
        if (port == 0 || port > 65535) {
            throw new IllegalArgumentException("Nomor port server tidak valid.");
        }
        return new Uri.Builder()
                .scheme("https")
                .encodedAuthority(uri.getEncodedAuthority())
                .build()
                .toString();
    }

    private void showOfflineHome() {
        if (webView == null) return;
        godmodeMode = false;
        updateNavigationTabs();
        hideStatus();
        String html = "<!doctype html><html lang='id'><head><meta name='viewport' content='width=device-width, initial-scale=1'>" +
                "<meta charset='utf-8'><style>" +
                "body{margin:0;background:#080b14;color:#f4f2ff;font:16px system-ui,sans-serif}" +
                ".wrap{max-width:680px;margin:0 auto;padding:28px 20px}" +
                ".brand{color:#a99aff;font-size:12px;font-weight:800;letter-spacing:2px}" +
                "h1{font-size:30px;line-height:1.15;margin:14px 0}p{color:#bdc3d7;line-height:1.6}" +
                ".card{margin-top:24px;padding:20px;border:1px solid #2a3045;border-radius:18px;background:#111626}" +
                ".pill{display:inline-block;color:#f8c96b;background:#382d19;padding:6px 10px;border-radius:20px;font-size:12px}" +
                "button{width:100%;padding:15px;margin-top:12px;border:0;border-radius:12px;background:#8b7cff;color:#090916;font-weight:800;font-size:16px}" +
                ".secondary{background:#222a3e;color:#f4f2ff}.small{font-size:13px;color:#929bb4}" +
                "</style></head><body><main class='wrap'>" +
                "<div class='brand'>M4ZK1PLAY • AGENT OFFICE</div>" +
                "<h1>Kantor AI Anda,<br>siap saat Anda siap.</h1>" +
                "<p>Aplikasi berhasil dibuka. Hubungkan ke server Agent Office saat Anda ingin membuka dashboard dan menjalankan agen AI jarak jauh.</p>" +
                "<section class='card'><span class='pill'>BELUM TERHUBUNG</span>" +
                "<h2>Mulai gunakan Agent Office</h2>" +
                "<p>Alamat server tidak perlu diisi saat pertama kali membuka aplikasi. Pengaturan koneksi tersedia di sini atau lewat menu Server di atas.</p>" +
                "<button onclick=\"window.location.href='agentoffice://connect'\">Hubungkan ke server</button>" +
                "<p class='small'>Koneksi server membutuhkan alamat HTTPS yang aktif. Mode lokal ini adalah layar awal, bukan mesin AI offline.</p>" +
                "</section></main></body></html>";
        webView.loadDataWithBaseURL("https://offline.agent-office.invalid/", html, "text/html", "UTF-8", null);
    }

    private void loadOffice() {
        godmodeMode = false;
        updateNavigationTabs();
        if (webView == null || TextUtils.isEmpty(serverOrigin)) {
            showOfflineHome();
            return;
        }
        showStatus("Menghubungkan ke Mazkiplay AI…");
        webView.loadUrl(serverOrigin + "/chat.html");
    }

    private void loadGodmode() {
        if (webView == null) return;
        godmodeMode = true;
        updateNavigationTabs();
        showStatus("Memuat G0DM0D3 dari source code yang disertakan…");
        try (InputStream input = getAssets().open("g0dm0d3/index.html");
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }
            String html = output.toString(StandardCharsets.UTF_8.name());
            // A stable HTTPS base origin enables same-origin storage while keeping file access disabled.
            webView.loadDataWithBaseURL(
                    "https://appassets.androidplatform.net/assets/g0dm0d3/",
                    html,
                    "text/html",
                    "UTF-8",
                    null
            );
        } catch (IOException error) {
            showStatus("G0DM0D3 gagal dimuat. Periksa apakah asset disertakan dalam APK.");
        }
    }

    private void updateNavigationTabs() {
        if (officeTab == null || godmodeTab == null || licenseTab == null) return;
        int active = Color.rgb(0, 255, 65);
        int inactive = Color.rgb(25, 31, 39);
        officeTab.setBackgroundColor(godmodeMode ? inactive : active);
        officeTab.setTextColor(godmodeMode ? CREAM : Color.rgb(5, 10, 8));
        godmodeTab.setBackgroundColor(godmodeMode ? active : inactive);
        godmodeTab.setTextColor(godmodeMode ? Color.rgb(5, 10, 8) : CREAM);
        licenseTab.setBackgroundColor(inactive);
        licenseTab.setTextColor(CREAM);
    }

    private void showLicenseDialog() {
        String notice = "G0DM0D3 standalone frontend\n"
                + "Source: https://github.com/elder-plinius/G0DM0D3\n"
                + "License: GNU Affero General Public License v3.0 (AGPL-3.0)\n\n"
                + "This app includes a modified/combined copy of the upstream standalone HTML frontend. "
                + "The corresponding source and license notice are available in the Mazkiplay Agent Office repository under THIRD_PARTY_LICENSES and android/app/src/main/assets/g0dm0d3.\n\n"
                + "The software is provided AS IS, without warranty. AI provider usage and costs are governed by the provider you configure. Keep API keys private.";
        new AlertDialog.Builder(this)
                .setTitle("Third-party licenses")
                .setMessage(notice)
                .setNegativeButton("Tutup", null)
                .setPositiveButton("Buka source", (dialog, which) ->
                        openExternalPage(Uri.parse("https://github.com/elder-plinius/G0DM0D3")))
                .show();
    }

    private void showStatus(String message) {
        statusMessage.setText(message);
        statusMessage.setVisibility(View.VISIBLE);
    }

    private void hideStatus() {
        statusMessage.setVisibility(View.GONE);
    }

    private boolean isGodmodeOrigin(Uri uri) {
        return godmodeMode
                && uri != null
                && "https".equalsIgnoreCase(uri.getScheme())
                && "appassets.androidplatform.net".equalsIgnoreCase(uri.getHost());
    }

    private boolean isOfficeOrigin(Uri uri) {
        if (uri == null || TextUtils.isEmpty(serverOrigin) || !"https".equalsIgnoreCase(uri.getScheme())) {
            return false;
        }
        Uri office = Uri.parse(serverOrigin);
        int requestedPort = uri.getPort() < 0 ? 443 : uri.getPort();
        int officePort = office.getPort() < 0 ? 443 : office.getPort();
        return office.getHost() != null
                && office.getHost().equalsIgnoreCase(uri.getHost())
                && requestedPort == officePort;
    }

    private void openExternalPage(Uri uri) {
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            Toast.makeText(this, "Tautan ini diblokir demi keamanan.", Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Tidak ada browser untuk membuka tautan ini.", Toast.LENGTH_SHORT).show();
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (termuxResultReceiver == null) {
            termuxResultReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    showTermuxResultIfPending();
                }
            };
            IntentFilter filter = new IntentFilter(TERMUX_RESULT_ACTION);
            if (Build.VERSION.SDK_INT >= 33) {
                registerReceiver(termuxResultReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(termuxResultReceiver, filter);
            }
        }
        showTermuxResultIfPending();
    }

    @Override
    protected void onPause() {
        if (termuxResultReceiver != null) {
            try {
                unregisterReceiver(termuxResultReceiver);
            } catch (IllegalArgumentException ignored) {
                // Receiver was already unregistered by Android lifecycle changes.
            }
            termuxResultReceiver = null;
        }
        super.onPause();
    }

    private void showTermuxResultIfPending() {
        android.content.SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (!prefs.getBoolean(TermuxResultReceiver.KEY_PENDING_RESULT, false) || isFinishing()) return;
        prefs.edit().putBoolean(TermuxResultReceiver.KEY_PENDING_RESULT, false).apply();
        String stdout = prefs.getString("termux-stdout", "");
        String stderr = prefs.getString("termux-stderr", "");
        String error = prefs.getString("termux-error", "");
        int exitCode = prefs.getInt("termux-exit-code", -1);
        boolean truncated = prefs.getBoolean("termux-output-truncated", false);
        int internalErrorCode = prefs.getInt("termux-internal-error-code", 0);
        StringBuilder output = new StringBuilder();
        output.append("Exit code: ").append(exitCode).append("\n\n");
        output.append("STDOUT:\n").append(TextUtils.isEmpty(stdout) ? "(kosong)" : stdout);
        if (!TextUtils.isEmpty(stderr)) output.append("\n\nSTDERR:\n").append(stderr);
        if (!TextUtils.isEmpty(error)) output.append("\n\nStatus Termux: ").append(error);
        if (internalErrorCode != 0) output.append("\nKode error internal: ").append(internalErrorCode);
        if (truncated) output.append("\n\nPERINGATAN: Output terpotong. Jalankan ulang dengan output lebih kecil.");
        EditText outputView = new EditText(this);
        outputView.setText(output.toString());
        outputView.setTextIsSelectable(true);
        outputView.setFocusable(true);
        outputView.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        outputView.setMinLines(5);
        outputView.setMaxLines(14);
        new AlertDialog.Builder(this)
                .setTitle(exitCode == 0 ? "Output Termux • berhasil" : "Output Termux • periksa hasil")
                .setView(outputView)
                .setPositiveButton("Tutup", null)
                .show();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private final class OfficeWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isOfficeOrigin(uri) || isGodmodeOrigin(uri)) {
                return false;
            }
            if (request.isForMainFrame() && "agentoffice".equalsIgnoreCase(uri.getScheme())
                    && "connect".equalsIgnoreCase(uri.getHost())) {
                showServerDialog(false);
                return true;
            }
            if (request.isForMainFrame()) {
                openExternalPage(uri);
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            showStatus("Menghubungkan ke kantor…");
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            hideStatus();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                showStatus("Tidak dapat terhubung. Periksa koneksi internet dan alamat server, lalu tekan ↻ untuk mencoba lagi atau Server untuk mengganti alamat.");
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse response) {
            if (request.isForMainFrame() && response.getStatusCode() >= 400) {
                showStatus("Server membalas dengan error HTTP " + response.getStatusCode() + ". Periksa alamat dan status Agent Office.");
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            showStatus("Sertifikat HTTPS server tidak valid. Sambungan dibatalkan demi keamanan.");
        }
    }
}

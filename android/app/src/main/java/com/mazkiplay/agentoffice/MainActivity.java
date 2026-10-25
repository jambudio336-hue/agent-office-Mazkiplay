package com.mazkiplay.agentoffice;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
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

public final class MainActivity extends Activity {
    private static final String PREFS = "agent-office-mobile";
    private static final String KEY_SERVER_ORIGIN = "server-origin";
    private static final int NAVY = Color.rgb(17, 19, 47);
    private static final int CREAM = Color.rgb(255, 241, 222);

    private String serverOrigin;
    private WebView webView;
    private TextView statusMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        createScreen();

        serverOrigin = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER_ORIGIN, null);
        if (TextUtils.isEmpty(serverOrigin)) {
            showServerDialog(true);
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
        title.setText("M4zK1pL4Y Office");
        title.setTextColor(CREAM);
        title.setTextSize(16);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setSingleLine(true);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(56), 1));

        Button serverButton = toolbarButton("Server");
        serverButton.setContentDescription("Ganti alamat server Agent Office");
        serverButton.setOnClickListener(view -> showServerDialog(false));
        toolbar.addView(serverButton, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48)));

        Button refreshButton = toolbarButton("↻");
        refreshButton.setContentDescription("Muat ulang kantor");
        refreshButton.setOnClickListener(view -> {
            if (TextUtils.isEmpty(serverOrigin)) {
                showServerDialog(true);
            } else {
                webView.reload();
            }
        });
        toolbar.addView(refreshButton, new LinearLayout.LayoutParams(dp(48), dp(48)));
        shell.addView(toolbar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56)));

        FrameLayout content = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
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
            throw new IllegalArgumentException("Masukkan alamat dasar server saja, tanpa path. Aplikasi akan membuka /lite.");
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

    private void loadOffice() {
        if (webView == null || TextUtils.isEmpty(serverOrigin)) {
            return;
        }
        showStatus("Menghubungkan ke kantor…");
        webView.loadUrl(serverOrigin + "/lite");
    }

    private void showStatus(String message) {
        statusMessage.setText(message);
        statusMessage.setVisibility(View.VISIBLE);
    }

    private void hideStatus() {
        statusMessage.setVisibility(View.GONE);
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
            if (isOfficeOrigin(uri)) {
                return false;
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

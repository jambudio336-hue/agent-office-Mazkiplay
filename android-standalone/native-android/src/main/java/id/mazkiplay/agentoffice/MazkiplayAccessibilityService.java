package id.mazkiplay.agentoffice;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * User-enabled, on-demand screen summary for assistive navigation.
 * It does not click, type, submit forms, read password fields, or upload screen data.
 */
public class MazkiplayAccessibilityService extends AccessibilityService {
    private static volatile MazkiplayAccessibilityService activeInstance;

    public static MazkiplayAccessibilityService getActiveInstance() {
        return activeInstance;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        activeInstance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Intentionally do not collect or persist events. Read visible UI only on explicit request.
    }

    @Override
    public void onInterrupt() {
        // No ongoing gestures or actions to interrupt.
    }

    @Override
    public void onDestroy() {
        if (activeInstance == this) activeInstance = null;
        super.onDestroy();
    }

    public JSONObject readVisibleText() {
        JSONObject result = new JSONObject();
        JSONArray texts = new JSONArray();
        Set<String> seen = new HashSet<>();
        AccessibilityNodeInfo root = getRootInActiveWindow();
        try {
            result.put("packageName", root == null || root.getPackageName() == null
                ? "" : root.getPackageName().toString());
            if (root != null) collect(root, texts, seen, 0);
            result.put("text", texts);
            result.put("note", "Ringkasan lokal berdasarkan permintaan pengguna. Kolom sandi dikecualikan; data tidak disimpan atau dikirim.");
        } catch (Exception ignored) {
            try { result.put("error", "Tidak dapat membaca ringkasan layar saat ini."); } catch (Exception ignoredAgain) {}
        } finally {
            if (root != null) root.recycle();
        }
        return result;
    }

    private void collect(AccessibilityNodeInfo node, JSONArray output, Set<String> seen, int depth) {
        if (node == null || depth > 8 || output.length() >= 35) return;
        if (node.isPassword()) return;
        CharSequence text = node.getText();
        CharSequence description = node.getContentDescription();
        append(text, output, seen);
        append(description, output, seen);
        for (int i = 0; i < node.getChildCount() && output.length() < 35; i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                collect(child, output, seen, depth + 1);
                child.recycle();
            }
        }
    }

    private void append(CharSequence value, JSONArray output, Set<String> seen) {
        if (value == null) return;
        String text = value.toString().trim().replaceAll("\\s+", " ");
        if (text.isEmpty() || text.length() > 120 || !seen.add(text)) return;
        output.put(text);
    }
}

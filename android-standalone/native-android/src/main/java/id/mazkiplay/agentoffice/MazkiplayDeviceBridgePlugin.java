package id.mazkiplay.agentoffice;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "MazkiplayDeviceBridge")
public class MazkiplayDeviceBridgePlugin extends Plugin {
    @PluginMethod
    public void getAccessibilityStatus(PluginCall call) {
        AccessibilityManager manager = (AccessibilityManager) getContext().getSystemService(ACCESSIBILITY_SERVICE);
        boolean enabled = false;
        if (manager != null) {
            List<AccessibilityServiceInfo> services =
                manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
            for (AccessibilityServiceInfo info : services) {
                if (info.getResolveInfo() == null || info.getResolveInfo().serviceInfo == null) continue;
                ComponentName component = new ComponentName(
                    info.getResolveInfo().serviceInfo.packageName,
                    info.getResolveInfo().serviceInfo.name
                );
                if (getContext().getPackageName().equals(component.getPackageName())
                    && component.getClassName().endsWith("MazkiplayAccessibilityService")) {
                    enabled = true;
                    break;
                }
            }
        }
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("enabled", enabled);
        result.put("message", enabled
            ? "Layanan aksesibilitas aktif. Ringkasan layar hanya dibaca saat kamu menekan tombol."
            : "Layanan belum aktif. Aktifkan secara manual dari Pengaturan Android jika memang kamu menginginkannya.");
        call.resolve(result);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Tidak bisa membuka Pengaturan Aksesibilitas Android.", exception);
        }
    }

    @PluginMethod
    public void readScreenSummary(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", MazkiplayAccessibilityService.getActiveInstance() != null);
        if (MazkiplayAccessibilityService.getActiveInstance() == null) {
            result.put("message", "Aktifkan layanan Mazkiplay secara manual di Pengaturan Aksesibilitas terlebih dahulu.");
            call.resolve(result);
            return;
        }
        result.put("summary", MazkiplayAccessibilityService.getActiveInstance().readVisibleText());
        call.resolve(result);
    }
}

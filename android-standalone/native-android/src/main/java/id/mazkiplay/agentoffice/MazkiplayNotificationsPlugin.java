package id.mazkiplay.agentoffice;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "MazkiplayNotifications", permissions = {@Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})})
public class MazkiplayNotificationsPlugin extends Plugin {
    private static final String CHANNEL_ID = "mazkiplay_agent_updates";
    @Override public void load() {
        super.load();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "AI task updates", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Status tugas M4zk1pL4y.ap Agent Office");
            NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }
    @PluginMethod public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) { resolve(call, true); return; }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }
    @PermissionCallback private void notificationPermissionCallback(PluginCall call) {
        resolve(call, Build.VERSION.SDK_INT < 33 || getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
    }
    private void resolve(PluginCall call, boolean granted) { JSObject result = new JSObject(); result.put("granted", granted); call.resolve(result); }
    @PluginMethod public void notify(PluginCall call) {
        String title = call.getString("title", "M4zk1pL4y.ap");
        String body = call.getString("body", "Aktivitas AI diperbarui.");
        if (Build.VERSION.SDK_INT >= 33 && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) { call.reject("Izin notifikasi Android belum diberikan."); return; }
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(getContext().getApplicationInfo().icon).setContentTitle(title).setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body)).setPriority(NotificationCompat.PRIORITY_DEFAULT).setAutoCancel(true);
        try { NotificationManagerCompat.from(getContext()).notify((int)(System.currentTimeMillis() & 0x7fffffff), builder.build()); JSObject result = new JSObject(); result.put("sent", true); call.resolve(result); }
        catch (SecurityException exception) { call.reject("Android menolak izin notifikasi.", exception); }
    }
}

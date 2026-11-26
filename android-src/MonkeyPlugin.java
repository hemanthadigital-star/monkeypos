package lk.monkey.pos;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@SuppressLint("MissingPermission")
@CapacitorPlugin(name = "Monkey", permissions = {
    @Permission(strings = {"android.permission.BLUETOOTH_CONNECT"}, alias = "btConnect")
})
public class MonkeyPlugin extends Plugin {
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private SQLiteDatabase db;
    private BluetoothSocket sock;
    private String addr;
    private WebView pw;

    private synchronized SQLiteDatabase db() {
        if (db == null) db = getContext().openOrCreateDatabase("monkey.db", Context.MODE_PRIVATE, null);
        return db;
    }

    private Object[] bind(JSONArray p) throws JSONException {
        if (p == null) return new Object[0];
        Object[] a = new Object[p.length()];
        for (int i = 0; i < a.length; i++) {
            Object v = p.get(i);
            if (v == null || v == JSONObject.NULL) a[i] = null;
            else if (v instanceof Boolean) a[i] = ((Boolean) v) ? 1L : 0L;
            else if (v instanceof Integer) a[i] = ((Integer) v).longValue();
            else if (v instanceof Double || v instanceof Long || v instanceof String) a[i] = v;
            else a[i] = v.toString();
        }
        return a;
    }

    @PluginMethod
    public void sql(PluginCall call) {
        try {
            JSArray st = call.getArray("stmts");
            JSArray out = new JSArray();
            SQLiteDatabase d = db();
            d.beginTransaction();
            try {
                for (int i = 0; i < st.length(); i++) {
                    JSONObject s = st.getJSONObject(i);
                    String q = s.getString("q");
                    JSONArray p = s.optJSONArray("p");
                    JSArray rows = new JSArray();
                    if (q.trim().toLowerCase().startsWith("select")) {
                        String[] a = new String[p == null ? 0 : p.length()];
                        for (int j = 0; j < a.length; j++) a[j] = String.valueOf(p.get(j));
                        Cursor c = d.rawQuery(q, a);
                        try {
                            while (c.moveToNext()) {
                                JSObject o = new JSObject();
                                for (int k = 0; k < c.getColumnCount(); k++) {
                                    String n = c.getColumnName(k);
                                    switch (c.getType(k)) {
                                        case Cursor.FIELD_TYPE_NULL: o.put(n, JSONObject.NULL); break;
                                        case Cursor.FIELD_TYPE_INTEGER: o.put(n, c.getLong(k)); break;
                                        case Cursor.FIELD_TYPE_FLOAT: o.put(n, c.getDouble(k)); break;
                                        default: o.put(n, c.getString(k));
                                    }
                                }
                                rows.put(o);
                            }
                        } finally { c.close(); }
                    } else {
                        Object[] b = bind(p);
                        if (b.length == 0) d.execSQL(q); else d.execSQL(q, b);
                    }
                    out.put(rows);
                }
                d.setTransactionSuccessful();
            } finally { d.endTransaction(); }
            JSObject r = new JSObject();
            r.put("results", out);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    private boolean needBt() {
        return Build.VERSION.SDK_INT >= 31 && getPermissionState("btConnect") != PermissionState.GRANTED;
    }

    @PluginMethod
    public void btList(PluginCall call) {
        if (needBt()) { requestPermissionForAlias("btConnect", call, "btPerm"); return; }
        try {
            BluetoothAdapter ad = BluetoothAdapter.getDefaultAdapter();
            if (ad == null || !ad.isEnabled()) { call.reject("Turn Bluetooth on first"); return; }
            JSArray a = new JSArray();
            for (BluetoothDevice dv : ad.getBondedDevices()) {
                JSObject o = new JSObject();
                o.put("name", dv.getName());
                o.put("address", dv.getAddress());
                a.put(o);
            }
            JSObject r = new JSObject();
            r.put("devices", a);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void btPrint(PluginCall call) {
        if (needBt()) { requestPermissionForAlias("btConnect", call, "btPerm"); return; }
        try {
            byte[] b = Base64.decode(call.getString("data"), Base64.DEFAULT);
            send(call.getString("address"), b);
            call.resolve();
        } catch (Exception e) {
            call.reject("Cannot print: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void btPerm(PluginCall call) {
        if (getPermissionState("btConnect") == PermissionState.GRANTED) {
            if ("btList".equals(call.getMethodName())) btList(call); else btPrint(call);
        } else {
            call.reject("Bluetooth permission denied");
        }
    }

    private synchronized void send(String a, byte[] b) throws Exception {
        for (int t = 0; t < 2; t++) {
            try {
                if (sock == null || !sock.isConnected() || !a.equals(addr)) {
                    close();
                    BluetoothAdapter ad = BluetoothAdapter.getDefaultAdapter();
                    ad.cancelDiscovery();
                    sock = ad.getRemoteDevice(a).createRfcommSocketToServiceRecord(SPP);
                    sock.connect();
                    addr = a;
                }
                OutputStream os = sock.getOutputStream();
                for (int i = 0; i < b.length; i += 1024) {
                    os.write(b, i, Math.min(1024, b.length - i));
                    os.flush();
                    Thread.sleep(20);
                }
                return;
            } catch (IOException e) {
                close();
                if (t == 1) throw e;
            }
        }
    }

    private void close() {
        try { if (sock != null) sock.close(); } catch (Exception e) { }
        sock = null;
    }

    @PluginMethod
    public void printHtml(PluginCall call) {
        final String html = call.getString("html");
        final String name = call.getString("name", "document");
        getActivity().runOnUiThread(() -> {
            try {
                WebView w = new WebView(getContext());
                pw = w;
                w.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView v, String u) {
                        PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        pm.print(name, v.createPrintDocumentAdapter(name),
                            new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                    }
                });
                w.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
                call.resolve();
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        });
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        try {
            File f = new File(getContext().getCacheDir(), call.getString("name", "backup.json"));
            FileWriter w = new FileWriter(f);
            w.write(call.getString("text"));
            w.close();
            Uri u = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("application/json");
            i.putExtra(Intent.EXTRA_STREAM, u);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(i, "Save backup"));
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }
}

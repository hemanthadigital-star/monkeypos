package lk.monkey.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MonkeyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

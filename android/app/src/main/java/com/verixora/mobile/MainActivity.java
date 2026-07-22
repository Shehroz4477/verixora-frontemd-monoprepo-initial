package com.verixora.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // BridgeActivity creates the Capacitor bridge in super.onCreate().
        // Register custom plugins first so they are included in that bridge.
        registerPlugin(DeviceKeyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

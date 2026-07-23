package com.verixora.mobile;

import android.content.Context;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Requests the Android IME after a WebView input has received focus.
 * This is deliberately a small, Android-only bridge so login and registration
 * do not depend on a browser-only focus event to display the soft keyboard.
 */
@CapacitorPlugin(name = "VerixoraSoftKeyboard")
public class SoftKeyboardPlugin extends Plugin {
    @PluginMethod
    public void show(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            View target = getActivity().getCurrentFocus();
            if (target == null) {
                target = getBridge().getWebView();
            }

            final View focusedTarget = target;
            focusedTarget.requestFocus();
            focusedTarget.post(() -> {
                InputMethodManager keyboard = (InputMethodManager) getContext()
                        .getSystemService(Context.INPUT_METHOD_SERVICE);

                boolean requested = keyboard != null
                        && keyboard.showSoftInput(focusedTarget, InputMethodManager.SHOW_IMPLICIT);

                JSObject result = new JSObject();
                result.put("requested", requested);
                call.resolve(result);
            });
        });
    }
}

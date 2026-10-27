package com.plusopinion.app;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // 1. Maintain standard platform brightness — adhere strictly to system brightness
            // Never allow the window or WebView to dynamically override or shift screen brightness
            WindowManager.LayoutParams layoutParams = getWindow().getAttributes();
            layoutParams.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
            getWindow().setAttributes(layoutParams);

            // 2. Disable Android WebView force-dark / algorithmic dimming
            // Prevents WebView from automatically dimming/adjusting contrast when modals or pages open
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    settings.setForceDark(WebSettings.FORCE_DARK_OFF);
                }
            }
        } catch (Exception ignored) {}
    }
}

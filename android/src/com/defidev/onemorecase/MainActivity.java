package com.defidev.onemorecase;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.view.View;
import android.view.HapticFeedbackConstants;
import android.net.Uri;
import java.io.*;
import java.util.*;


/** Game shell with packaged web assets plus consent-gated rewarded hints. */
public final class MainActivity extends Activity {
    private WebView web;

    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final Set<String> FILES =
        new HashSet<>(Arrays.asList("index.html","engine.js","app.js","style.css","art.js"));

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(0xfff7f4eb);
        getWindow().setNavigationBarColor(0xfff7f4eb);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        web = new WebView(this);
        web.setBackgroundColor(0xfff7f4eb);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                String file = u.getPath() != null ? u.getPath().replaceFirst("^/assets/", "") : "";
                if ("https".equals(u.getScheme())
                    && "appassets.androidplatform.net".equals(u.getHost())
                    && u.getPort() == -1
                    && u.getQuery() == null
                    && FILES.contains(file)
                    && u.getPath().equals("/assets/" + file)) {
                    try {
                        String mime = file.endsWith(".css") ? "text/css"
                            : file.endsWith(".js") ? "text/javascript" : "text/html";
                        Map<String,String> headers = new HashMap<>();
                        headers.put("Content-Security-Policy",
                            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
                            "img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'");
                        headers.put("X-Content-Type-Options", "nosniff");
                        return new WebResourceResponse(
                            mime, "UTF-8", 200, "OK", headers, getAssets().open(file));
                    } catch (IOException ignored) { }
                }
                return new WebResourceResponse(
                    "text/plain", "UTF-8", 403, "Forbidden",
                    Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                return true;
            }

            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                notifyPrivacyOptionsState();
            }
        });

        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void exit() {
                runOnUiThread(() -> finish());
            }

            @JavascriptInterface public void haptic() {
                runOnUiThread(() -> web.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY));
            }

            @JavascriptInterface public void showRewardedHint() {
                runOnUiThread(() -> evaluateJs("window.rewardedHintEarned && window.rewardedHintEarned()"));
            }

            @JavascriptInterface public void showLevelInterstitial() {
                runOnUiThread(() -> evaluateJs("window.interstitialFinished && window.interstitialFinished()"));
            }

            @JavascriptInterface public boolean privacyOptionsRequired() {
                return false;
            }

            @JavascriptInterface public void showPrivacyOptions() { }
        }, "AndroidGame");

        web.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(
                insets.getSystemWindowInsetLeft(),
                insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(),
                insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });

        setContentView(web);
        web.loadUrl(ORIGIN + "/assets/index.html");
    }


    private void evaluateJs(String script) {
        if (web != null) web.evaluateJavascript(script, null);
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("window.gameBack && window.gameBack()", null);
    }

    @Override protected void onPause() {
        web.evaluateJavascript("window.saveProgress && window.saveProgress()", null);
        web.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}

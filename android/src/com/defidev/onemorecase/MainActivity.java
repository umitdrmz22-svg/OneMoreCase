package com.defidev.onemorecase;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.view.View;
import android.view.HapticFeedbackConstants;
import android.net.Uri;
import java.io.*;
import java.util.*;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/** Game shell with packaged web assets plus consent-gated rewarded hints. */
public final class MainActivity extends Activity {
    private WebView web;
    private RewardedAd rewardedAd;
    private boolean rewardedAdLoading;
    private boolean adsInitialized;
    private ConsentInformation consentInformation;

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
                runOnUiThread(() -> showRewardedHintAd());
            }

            @JavascriptInterface public boolean privacyOptionsRequired() {
                return isPrivacyOptionsRequired();
            }

            @JavascriptInterface public void showPrivacyOptions() {
                runOnUiThread(() -> showPrivacyOptionsForm());
            }
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
        requestConsentAndInitializeAds();
    }

    private void requestConsentAndInitializeAds() {
        consentInformation = UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();

        consentInformation.requestConsentInfoUpdate(
            this,
            params,
            () -> {
                notifyPrivacyOptionsState();
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                    this,
                    formError -> {
                        notifyPrivacyOptionsState();
                        initializeAdsIfAllowed();
                    });
            },
            requestConsentError -> {
                notifyPrivacyOptionsState();
                initializeAdsIfAllowed();
            });
    }

    private void initializeAdsIfAllowed() {
        if (consentInformation == null || !consentInformation.canRequestAds() || adsInitialized) return;
        adsInitialized = true;
        MobileAds.initialize(this, status -> runOnUiThread(this::loadRewardedAd));
    }

    private void loadRewardedAd() {
        if (!adsInitialized
            || consentInformation == null
            || !consentInformation.canRequestAds()
            || rewardedAd != null
            || rewardedAdLoading) return;

        rewardedAdLoading = true;
        RewardedAd.load(
            this,
            BuildConfig.ADMOB_REWARDED_ID,
            new AdRequest.Builder().build(),
            new RewardedAdLoadCallback() {
                @Override public void onAdLoaded(RewardedAd ad) {
                    rewardedAdLoading = false;
                    rewardedAd = ad;
                }

                @Override public void onAdFailedToLoad(LoadAdError error) {
                    rewardedAdLoading = false;
                    rewardedAd = null;
                }
            });
    }

    private void showRewardedHintAd() {
        if (consentInformation == null || !consentInformation.canRequestAds()) {
            evaluateJs("window.rewardedHintUnavailable && window.rewardedHintUnavailable()");
            initializeAdsIfAllowed();
            return;
        }

        if (rewardedAd == null) {
            loadRewardedAd();
            evaluateJs("window.rewardedHintUnavailable && window.rewardedHintUnavailable()");
            return;
        }

        RewardedAd ad = rewardedAd;
        rewardedAd = null;
        final boolean[] rewardEarned = { false };

        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdDismissedFullScreenContent() {
                if (!rewardEarned[0]) {
                    evaluateJs("window.rewardedHintClosed && window.rewardedHintClosed()");
                }
                loadRewardedAd();
            }

            @Override public void onAdFailedToShowFullScreenContent(AdError adError) {
                evaluateJs("window.rewardedHintUnavailable && window.rewardedHintUnavailable()");
                loadRewardedAd();
            }
        });

        ad.show(this, rewardItem -> {
            rewardEarned[0] = true;
            evaluateJs("window.rewardedHintEarned && window.rewardedHintEarned()");
        });
    }

    private boolean isPrivacyOptionsRequired() {
        return consentInformation != null
            && consentInformation.getPrivacyOptionsRequirementStatus()
                == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }

    private void notifyPrivacyOptionsState() {
        if (web == null) return;
        final boolean required = isPrivacyOptionsRequired();
        runOnUiThread(() ->
            evaluateJs("window.setPrivacyOptionsRequired && window.setPrivacyOptionsRequired(" +
                (required ? "true" : "false") + ")"));
    }

    private void showPrivacyOptionsForm() {
        UserMessagingPlatform.showPrivacyOptionsForm(
            this,
            formError -> {
                notifyPrivacyOptionsState();
                initializeAdsIfAllowed();
                loadRewardedAd();
            });
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
        rewardedAd = null;
        if (web != null) web.destroy();
        super.onDestroy();
    }
}

plugins {
    id("com.android.application")
}

val sampleAdmobAppId = "ca-app-pub-3940256099942544~3347511713"
val sampleAdmobRewardedId = "ca-app-pub-3940256099942544/5224354917"
val productionAdmobAppId = System.getenv("ADMOB_APP_ID").orEmpty().trim()
val productionAdmobRewardedId = System.getenv("ADMOB_REWARDED_ID").orEmpty().trim()
val releaseKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH").orEmpty().trim()
val releaseKeystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD").orEmpty()
val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS").orEmpty().trim()
val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD").orEmpty()
val releaseRequested = gradle.startParameter.taskNames.any { it.contains("release", ignoreCase = true) }

if (releaseRequested) {
    require(productionAdmobAppId.isNotBlank() && productionAdmobAppId != sampleAdmobAppId) {
        "OneMoreCase release builds require a real production AdMob app ID."
    }
    require(productionAdmobRewardedId.isNotBlank() && productionAdmobRewardedId != sampleAdmobRewardedId) {
        "OneMoreCase release builds require a real production rewarded AdMob unit ID."
    }
}

val releaseSigningReady = listOf(
    releaseKeystorePath,
    releaseKeystorePassword,
    releaseKeyAlias,
    releaseKeyPassword
).all { it.isNotBlank() }

android {
    namespace = "com.defidev.onemorecase"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.defidev.onemorecase"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "0.2.0"
        manifestPlaceholders["ADMOB_APP_ID"] = sampleAdmobAppId
        buildConfigField("String", "ADMOB_REWARDED_ID", "\"$sampleAdmobRewardedId\"")
    }

    sourceSets {
        getByName("main") {
            manifest.srcFile("../android/AndroidManifest.xml")
            java.srcDirs("../android/src")
            res.srcDirs("../android/res")
            assets.srcDirs("../web")
        }
    }

    if (releaseSigningReady) {
        signingConfigs {
            create("release") {
                storeFile = file(releaseKeystorePath)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            manifestPlaceholders["ADMOB_APP_ID"] = sampleAdmobAppId
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"$sampleAdmobRewardedId\"")
        }
        release {
            isMinifyEnabled = false
            manifestPlaceholders["ADMOB_APP_ID"] = productionAdmobAppId
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"$productionAdmobRewardedId\"")
            if (releaseSigningReady) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

dependencies {
    implementation("com.google.android.gms:play-services-ads:25.5.0")
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
}

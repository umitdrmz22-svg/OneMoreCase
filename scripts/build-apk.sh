#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_SDK_ROOT:?Set ANDROID_SDK_ROOT to your Android SDK directory}"
TOOLS="$ANDROID_SDK_ROOT/build-tools/35.0.0"
PLATFORM="$ANDROID_SDK_ROOT/platforms/android-35/android.jar"
mkdir -p build/classes build/dex dist
"$TOOLS/aapt2" compile --dir android/res -o build/resources.zip
"$TOOLS/aapt2" link -o build/base.apk -I "$PLATFORM" --manifest android/AndroidManifest.xml -A web build/resources.zip
if command -v javac >/dev/null; then
 javac -source 8 -target 8 -bootclasspath "$PLATFORM" -d build/classes android/src/com/defidev/onemorecase/MainActivity.java
else
 : "${ECJ_JAR:?Install a JDK or set ECJ_JAR to Eclipse compiler jar}"
 java -jar "$ECJ_JAR" -source 8 -target 8 -bootclasspath "$PLATFORM" -d build/classes android/src/com/defidev/onemorecase/MainActivity.java
fi
(cd build/classes && zip -q -r ../classes.jar .)
"$TOOLS/d8" --min-api 26 --lib "$PLATFORM" --output build/dex build/classes.jar
cp build/base.apk build/unsigned.apk
(cd build/dex && zip -q -u ../unsigned.apk classes.dex)
"$TOOLS/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
# The disposable test key never belongs in version control. Keep an existing key for update compatibility.
if [ ! -f build/test.keystore ]; then
 keytool -genkeypair -keystore build/test.keystore -alias test -keyalg RSA -keysize 2048 -validity 3650 -storepass android -keypass android -dname "CN=OneMoreCase Test,O=Development,C=DE" >/dev/null 2>&1
fi
"$TOOLS/apksigner" sign --ks build/test.keystore --ks-key-alias test --ks-pass pass:android --out dist/OneMoreCase-0.1.0-test.apk build/aligned.apk
"$TOOLS/apksigner" verify --verbose dist/OneMoreCase-0.1.0-test.apk

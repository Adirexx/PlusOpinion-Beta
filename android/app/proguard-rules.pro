# ═══════════════════════════════════════════════════════════
# PlusOpinion — ProGuard / R8 Rules
# Phase 8 Native Hardening
# ═══════════════════════════════════════════════════════════

# ── Capacitor WebView JS Bridge ─────────────────────────────
# Capacitor uses reflection to call into the WebView JS interface.
# These classes MUST NOT be obfuscated or R8 will break the bridge.
-keep class com.getcapacitor.** { *; }
-keep class com.plusopinion.app.** { *; }
-dontwarn com.getcapacitor.**

# ── AndroidX ────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Cordova Plugin Compatibility ────────────────────────────
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ── WebView JavaScript Interface ────────────────────────────
# Any class exposed to JS via @JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Keep source file and line number info for crash reports ─
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Remove logging in release builds ────────────────────────
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
}

# ── Prevent stripping of Parcelable ─────────────────────────
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# ── Prevent stripping of Serializable ───────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ── Keep enums intact ───────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

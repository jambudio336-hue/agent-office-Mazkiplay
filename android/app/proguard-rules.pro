# Keep Android Keystore-backed crypto and platform JSON classes intact.
-keep class javax.crypto.** { *; }
-keep class org.json.** { *; }

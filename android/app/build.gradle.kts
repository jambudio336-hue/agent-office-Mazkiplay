plugins {
    id("com.android.application")
}

android {
    namespace = "com.mazkiplay.agentoffice"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mazkiplay.agentoffice"
        minSdk = 23
        targetSdk = 36
        versionCode = 2
        versionName = "0.2.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        release {
            // Build the optimized release variant. Use the standard debug keystore
            // only for public test distribution when no private signing key is configured.
            // Production distribution should replace this with a private release key.
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
        }
    }
}

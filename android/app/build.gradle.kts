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
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

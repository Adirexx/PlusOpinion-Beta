#!/usr/bin/env node
/**
 * patch-google-auth.js
 *
 * Patches @codetrix-studio/capacitor-google-auth's android/build.gradle
 * to be compatible with the project's Gradle/AGP versions:
 *   - Removes the plugin's own buildscript block (AGP comes from root project)
 *   - Removes standalone repositories block (repos come from root allprojects)
 *   - Replaces deprecated lintOptions with lint
 *   - Pins play-services-auth to a stable version
 *   - Updates fallback SDK versions
 *
 * Run automatically via npm postinstall.
 */
const fs = require('fs');
const path = require('path');

const PLUGIN_GRADLE = path.join(
  __dirname, '..', 'node_modules', '@codetrix-studio',
  'capacitor-google-auth', 'android', 'build.gradle'
);

const PATCHED_CONTENT = `ext {
    junitVersion = project.hasProperty('junitVersion') ? rootProject.ext.junitVersion : '4.13.2'
    androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.7.1'
    androidxJunitVersion = project.hasProperty('androidxJunitVersion') ? rootProject.ext.androidxJunitVersion : '1.3.0'
    androidxEspressoCoreVersion = project.hasProperty('androidxEspressoCoreVersion') ? rootProject.ext.androidxEspressoCoreVersion : '3.7.0'
}

// NOTE: No buildscript block — AGP is provided by the root project.
// The original plugin shipped AGP 8.2.1 which conflicts with AGP 9.5.0.

apply plugin: 'com.android.library'

android {
    namespace "com.codetrixstudio.capacitor.GoogleAuth.capacitorgoogleauth"
    compileSdk project.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 36
    defaultConfig {
        minSdkVersion project.hasProperty('minSdkVersion') ? rootProject.ext.minSdkVersion : 24
        targetSdkVersion project.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 36
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    lint {
        abortOnError false
    }
    compileOptions {
        targetCompatibility JavaVersion.VERSION_17
        sourceCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation project(':capacitor-android')
    implementation "androidx.appcompat:appcompat:\$androidxAppCompatVersion"
    testImplementation "junit:junit:\$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:\$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:\$androidxEspressoCoreVersion"
    implementation 'com.google.android.gms:play-services-auth:21.3.0'
}
`;

try {
  if (!fs.existsSync(PLUGIN_GRADLE)) {
    console.log('[patch-google-auth] Plugin not found, skipping.');
    process.exit(0);
  }

  const current = fs.readFileSync(PLUGIN_GRADLE, 'utf8');
  if (current.includes('No buildscript block')) {
    console.log('[patch-google-auth] Already patched, skipping.');
    process.exit(0);
  }

  fs.writeFileSync(PLUGIN_GRADLE, PATCHED_CONTENT, 'utf8');
  console.log('[patch-google-auth] ✅ Patched capacitor-google-auth build.gradle');
} catch (err) {
  console.error('[patch-google-auth] Error:', err.message);
  process.exit(1);
}

Monkey POS v1.1.0 (Android) - Developer: Hemantha Digital

OPTION A - Android Studio (on your PC)
1. Install Node.js LTS and Android Studio (it includes the JDK and Android SDK).
2. In this folder:  npm install
3. Then:            npm run setup
4. Then:            npm run open      (Android Studio opens the project; wait for Gradle sync)
5. Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s) > "locate"
   File: android/app/build/outputs/apk/debug/app-debug.apk
6. Copy the APK to the phone and install it (allow "install unknown apps").

OPTION B - no installs (GitHub Actions)
1. Create a GitHub repository and upload everything in this folder (keep the .github folder).
2. Open the Actions tab > "Build APK" > Run workflow.
3. When it finishes, download "monkey-pos-apk" from the run page.

PRINTER: pair the Bluetooth printer in the phone settings first (Bluetooth Classic / SPP type).
Then open Settings > Bluetooth printer, choose it and press Test print.
First login: admin / admin123

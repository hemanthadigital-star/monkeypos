const {execSync}=require('child_process'),fs=require('fs');
const sh=c=>execSync(c,{stdio:'inherit',shell:true});
if(!fs.existsSync('android'))sh('npx cap add android');
const pk='android/app/src/main/java/lk/monkey/pos';fs.mkdirSync(pk,{recursive:true});
for(const f of ['MainActivity.java','MonkeyPlugin.java'])fs.copyFileSync('android-src/'+f,pk+'/'+f);
const mf='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(mf,'utf8');
if(!m.includes('BLUETOOTH_CONNECT')){m=m.replace('</manifest>','  <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30"/>\n  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30"/>\n  <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>\n  <uses-feature android:name="android.hardware.bluetooth" android:required="false"/>\n</manifest>');fs.writeFileSync(mf,m)}
const gf='android/app/build.gradle';let g=fs.readFileSync(gf,'utf8').replace(/versionName "[^"]*"/,'versionName "1.1.0"');
if(process.env.GITHUB_RUN_NUMBER)g=g.replace(/versionCode \d+/,'versionCode '+process.env.GITHUB_RUN_NUMBER);
if(process.env.KS_FILE&&fs.existsSync(process.env.KS_FILE)&&!g.includes('KS_FILE')){
  g=g.replace('android {','android {\n    signingConfigs {\n        debug {\n            storeFile file(System.getenv("KS_FILE"))\n            storePassword System.getenv("KS_PASS")\n            keyAlias System.getenv("KS_ALIAS")\n            keyPassword System.getenv("KS_PASS")\n        }\n    }');
  console.log('Using the fixed signing key');
}else console.log('No signing key found: using a temporary key');
fs.writeFileSync(gf,g);
sh('npx cap sync android');
try{sh('npx capacitor-assets generate --android')}catch(e){console.log('Icon generation skipped')}
console.log('\nSetup finished. Next: npx cap open android  (then Build > Build APK)');

const {execSync}=require('child_process'),fs=require('fs');
const sh=c=>execSync(c,{stdio:'inherit',shell:true});
if(!fs.existsSync('android'))sh('npx cap add android');
const pk='android/app/src/main/java/lk/monkey/pos';fs.mkdirSync(pk,{recursive:true});
for(const f of ['MainActivity.java','MonkeyPlugin.java'])fs.copyFileSync('android-src/'+f,pk+'/'+f);
const mf='android/app/src/main/AndroidManifest.xml';let m=fs.readFileSync(mf,'utf8');
if(!m.includes('BLUETOOTH_CONNECT')){m=m.replace('</manifest>','  <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30"/>\n  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30"/>\n  <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>\n  <uses-feature android:name="android.hardware.bluetooth" android:required="false"/>\n</manifest>');fs.writeFileSync(mf,m)}
const gf='android/app/build.gradle';fs.writeFileSync(gf,fs.readFileSync(gf,'utf8').replace(/versionName "[^"]*"/,'versionName "1.1.0"'));
sh('npx cap sync android');
try{sh('npx capacitor-assets generate --android')}catch(e){console.log('Icon generation skipped')}
console.log('\nSetup finished. Next: npx cap open android  (then Build > Build APK)');

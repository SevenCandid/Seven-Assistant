import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seven.assistant',
  appName: 'Seven AI Assistant',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // For development, uncomment below and set your local IP
    // url: 'http://192.168.1.x:5173',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set for release builds
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK' // or 'AAB' for Play Store
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Seven'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f', // Match Seven dark theme
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ff7b00', // Seven orange
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
};

export default config;



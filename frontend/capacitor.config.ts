import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.techchurras.app',
  appName: 'Tech Churras',
  // 'public' sempre existe no Next.js; satisfaz o cap sync sem precisar de next build.
  // O app em runtime ignora webDir e carrega via server.url abaixo.
  webDir: 'public',
  server: {
    url: 'https://www.techchurras.com.br',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0a0a',
    scrollEnabled: true,
  },
}

export default config

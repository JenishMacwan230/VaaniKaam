import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Unique reverse-domain app identifier used in the Android package name
  appId: 'com.vaanikaam.app',
  appName: 'VaaniKaam',

  // Must point to Next.js static export output directory
  webDir: 'out',

  // Run entirely from bundled files – no live-reload server
  server: {
    androidScheme: 'https',
  },

  android: {
    buildOptions: {
      keystorePath: 'app/release-keystore.jks',
      keystorePassword: 'VaaniKaam@123',
      keystoreAlias: 'vaanikaam-release',
      keystoreAliasPassword: 'VaaniKaam@123',
    },
  },

  plugins: {
    // Push Notifications (FCM)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#8B5CF6',
      sound: 'beep.wav',
    },

    // Speech Recognition (for Voice → Text)
    SpeechRecognition: {
      // No extra config required; permissions are declared in AndroidManifest
    },

    // Enable native HTTP to bypass CORS restrictions
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;

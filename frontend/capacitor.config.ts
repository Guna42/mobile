import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.emolit.app',
  appName: 'Emolit',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  // NOTE: CapacitorHttp is intentionally disabled because it intercepts
  // and corrupts binary FormData (audio blob) uploads. Native fetch handles
  // HTTPS calls to our server correctly without this plugin.
};

export default config;


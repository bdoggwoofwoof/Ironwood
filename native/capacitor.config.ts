import type { CapacitorConfig } from '@capacitor/cli';

// Ironwood native shell. The web app in www/ is the same build as the home-screen version
// (copied from ../dist by sync.sh). Change appId to a bundle ID you own before submitting.
const config: CapacitorConfig = {
  appId: 'com.newt.ironwood',
  appName: 'Ironwood',
  webDir: 'www',
  backgroundColor: '#111315',
  ios: {
    contentInset: 'never',
    backgroundColor: '#111315',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;

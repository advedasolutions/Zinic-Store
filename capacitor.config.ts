

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.advedasolutions.zinic',
  appName: 'Zinic',
  webDir: 'dist',
  // Fix: Removed deprecated bundledWebRuntime property
  server: {
    androidScheme: 'https'
  }
};

export default config;
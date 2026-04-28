import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yourname.audiotranscribe",
  appName: "AudioTranscribe",
  // In dev: point to local Next.js server
  // In prod: point to your Vercel deployment
  server: {
    url: process.env.NODE_ENV === "production"
      ? "https://your-app.vercel.app"
      : "http://localhost:3000",
    cleartext: true,
  },
};

export default config;

// Environment variable declarations for Convex
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ADMIN_PASSWORD: string;
    }
  }
}

export {}; 
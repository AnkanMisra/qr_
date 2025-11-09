#!/usr/bin/env node

/**
 * Migration Script to Remove qrCodeStorageId from Tickets
 * 
 * This script removes the qrCodeStorageId field from all tickets in the database
 * to fix schema validation errors.
 * 
 * SECURITY: Requires admin authentication via ADMIN_PASSWORD environment variable
 * 
 * Usage: ADMIN_PASSWORD=your_password node run-migration.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!CONVEX_URL) {
  console.error("❌ Error: VITE_CONVEX_URL not found in .env.local");
  console.error("Please ensure your .env.local file contains VITE_CONVEX_URL");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("❌ Error: ADMIN_PASSWORD not provided");
  console.error("Usage: ADMIN_PASSWORD=your_password node run-migration.mjs");
  process.exit(1);
}

console.log("🔧 Starting migration to remove qrCodeStorageId field...\n");
console.log(`📡 Connecting to: ${CONVEX_URL}\n`);

const client = new ConvexHttpClient(CONVEX_URL);

try {
  // Step 1: Authenticate as admin to get session token
  console.log("🔐 Authenticating as admin...");
  const authResult = await client.mutation("admin:authenticateAdmin", {
    password: ADMIN_PASSWORD,
  });

  if (!authResult.success || !authResult.sessionToken) {
    console.error("❌ Admin authentication failed:", authResult.message);
    process.exit(1);
  }

  console.log("✅ Admin authenticated successfully\n");

  // Step 2: Run the migration with the session token
  console.log("🔄 Running migration...");
  const result = await client.mutation("tickets:removeQrCodeStorageId", {
    sessionToken: authResult.sessionToken,
  });
  
  console.log("✅ Migration completed successfully!");
  console.log(`📊 ${result.message}\n`);

  // Step 3: Invalidate the session for security
  console.log("🔒 Invalidating admin session...");
  await client.mutation("admin:invalidateAdminSession", {
    sessionToken: authResult.sessionToken,
  });
  console.log("✅ Session invalidated\n");

} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}

console.log("🎉 Done! You can now deploy your Convex schema without errors.");

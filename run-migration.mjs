#!/usr/bin/env node

/**
 * Migration Script to Remove qrCodeStorageId from Tickets
 * 
 * This script removes the qrCodeStorageId field from all tickets in the database
 * to fix schema validation errors.
 * 
 * Usage: node run-migration.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: VITE_CONVEX_URL not found in .env.local");
  console.error("Please ensure your .env.local file contains VITE_CONVEX_URL");
  process.exit(1);
}

console.log("🔧 Starting migration to remove qrCodeStorageId field...\n");
console.log(`📡 Connecting to: ${CONVEX_URL}\n`);

const client = new ConvexHttpClient(CONVEX_URL);

try {
  const result = await client.mutation("tickets:removeQrCodeStorageId", {});
  console.log("✅ Migration completed successfully!");
  console.log(`📊 ${result.message}\n`);
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}

console.log("🎉 Done! You can now deploy your Convex schema without errors.");

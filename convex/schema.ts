import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  tickets: defineTable({
    teamName: v.string(),
    leaderName: v.string(),
    teamMemberCount: v.number(),
    roomNumber: v.optional(v.string()), // Optional for backward compatibility with existing tickets
    slotNumber: v.optional(v.string()), // Optional for backward compatibility with existing tickets
    uniqueId: v.string(),
    isCheckedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
    checkinCounter: v.optional(v.number()),
    lastScanTime: v.optional(v.number()),
    scannedBy: v.optional(v.string()),
  }).index("by_unique_id", ["uniqueId"]),

  adminSessions: defineTable({
    sessionToken: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  }).index("by_session_token", ["sessionToken"]),

  scanners: defineTable({
    scannerName: v.optional(v.string()), 
    scannerPassword: v.optional(v.string()),
    name: v.optional(v.string()), 
    password: v.optional(v.string()), // Old field name for migration
    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.optional(v.string()), // Admin who created it (optional for migration)
    lastLoginAt: v.optional(v.number()),
    lastLogin: v.optional(v.number()), // Old field name for migration
    role: v.optional(v.string()), // Old field for migration
  }).index("by_scanner_name", ["scannerName"]),
};

export default defineSchema({
  ...applicationTables,
});

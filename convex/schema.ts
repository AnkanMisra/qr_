import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  tickets: defineTable({
    teamName: v.string(),
    leaderName: v.string(),
    uniqueId: v.string(),
    isCheckedIn: v.boolean(),
    checkedInAt: v.optional(v.number()),
    checkinCounter: v.optional(v.number()),
    lastScanTime: v.optional(v.number()),
  }).index("by_unique_id", ["uniqueId"]),

  adminSessions: defineTable({
    sessionToken: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  }).index("by_session_token", ["sessionToken"]),
};

export default defineSchema({
  ...applicationTables,
});

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
};

export default defineSchema({
  ...applicationTables,
});

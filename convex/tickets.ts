import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a secure unique ID for tickets
function generateUniqueId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export const createTicket = mutation({
  args: {
    teamName: v.string(),
    leaderName: v.string(),
    teamMemberCount: v.number(),
  },
  returns: v.object({
    ticketId: v.id("tickets"),
    uniqueId: v.string(),
  }),
  handler: async (ctx, args) => {
    if (
      !Number.isInteger(args.teamMemberCount) ||
      args.teamMemberCount < 2 ||
      args.teamMemberCount > 4
    ) {
      throw new Error("Team member count must be between 2 and 4");
    }

    const uniqueId = generateUniqueId();

    const ticketId = await ctx.db.insert("tickets", {
      teamName: args.teamName,
      leaderName: args.leaderName,
      teamMemberCount: args.teamMemberCount,
      uniqueId,
      isCheckedIn: false,
      checkinCounter: 0,
      lastScanTime: 0,
    });

    return { ticketId, uniqueId };
  },
});

export const getAllTickets = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").order("desc").collect();
  },
});

export const scanTicket = mutation({
  args: {
    uniqueId: v.string(),
    timestamp: v.optional(v.number()), // Add timestamp to prevent duplicate rapid calls
    scannedBy: v.optional(v.string()), // Scanner name who performed the scan
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_unique_id", (q) => q.eq("uniqueId", args.uniqueId))
      .first();

    if (!ticket) {
      return {
        status: "error",
        message: "Ticket not found",
      };
    }

    const existingScannedBy = ticket.scannedBy ?? null;
    const requestedScannedBy = args.scannedBy ?? null;
    const scannerForResponse =
      existingScannedBy ?? requestedScannedBy ?? undefined;

    if (
      existingScannedBy &&
      requestedScannedBy &&
      existingScannedBy !== requestedScannedBy
    ) {
      return {
        status: "warning",
        message: `Ticket already scanned by ${existingScannedBy}`,
        ticket: {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          checkedInAt: ticket.checkedInAt || undefined,
          checkinCounter: ticket.checkinCounter || 0,
          scannedBy: existingScannedBy,
        },
      };
    }

    // Check if this is a very recent scan (within 3 seconds) to prevent rapid-fire
    const now = Date.now();
    const lastScanTime = ticket.lastScanTime || 0;
    if (
      ticket.checkinCounter &&
      ticket.checkinCounter > 0 &&
      now - lastScanTime < 3000
    ) {
      const isSameScanner =
        existingScannedBy !== null &&
        requestedScannedBy !== null &&
        existingScannedBy === requestedScannedBy;
      const noScannerRecorded =
        existingScannedBy === null && requestedScannedBy === null;

      if (
        ticket.checkinCounter === 1 &&
        (isSameScanner || noScannerRecorded)
      ) {
        return {
          status: "success",
          message: "Ticket successfully scanned - First check-in!",
          ticket: {
            teamName: ticket.teamName,
            leaderName: ticket.leaderName,
            teamMemberCount: ticket.teamMemberCount,
            checkedInAt: ticket.checkedInAt || now,
            checkinCounter: ticket.checkinCounter,
            scannedBy: scannerForResponse,
          },
        };
      }

      // Return current state without incrementing if scanned within 3 seconds
      return {
        status: "warning",
        message:
          ticket.checkinCounter === 1
            ? "Welcome! You are already checked in"
            : `Ticket scanned multiple times (${ticket.checkinCounter} attempts)`,
        ticket: {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          checkedInAt: ticket.checkedInAt,
          checkinCounter: ticket.checkinCounter,
          scannedBy: scannerForResponse,
        },
      };
    }

    // Always increment the counter for every legitimate scan
    const currentCounter = ticket.checkinCounter || 0;
    const newCounter = currentCounter + 1;

    const finalScannedBy = scannerForResponse;

    // Update the counter and timestamp for every scan
    const scanTime = Date.now();
    await ctx.db.patch(ticket._id, {
      isCheckedIn: true,
      checkedInAt: ticket.checkedInAt || scanTime, // Keep original check-in time for first scan
      checkinCounter: newCounter,
      lastScanTime: scanTime, // Always update last scan time
      scannedBy: finalScannedBy,
    });

    if (currentCounter === 0) {
      // First scan - success
      return {
        status: "success",
        message: "Ticket successfully scanned - First check-in!",
        ticket: {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          checkedInAt: scanTime,
          checkinCounter: newCounter,
          scannedBy: finalScannedBy,
        },
      };
    } else {
      // Subsequent scans - warning but still increment counter
      return {
        status: "warning",
        message:
          currentCounter === 1
            ? "Welcome! You are already checked in"
            : `Ticket scanned multiple times (${newCounter} attempts)`,
        ticket: {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          checkedInAt: ticket.checkedInAt,
          checkinCounter: newCounter,
          scannedBy: finalScannedBy,
        },
      };
    }
  },
});

export const migrateTicketsWithCounter = mutation({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    let updated = 0;

    for (const ticket of tickets) {
      if (ticket.checkinCounter === undefined) {
        // Set counter based on current check-in status
        const counter = ticket.isCheckedIn ? 1 : 0;
        await ctx.db.patch(ticket._id, {
          checkinCounter: counter,
        });
        updated++;
      }
    }

    return { message: `Updated ${updated} tickets with counter field` };
  },
});

export const resetAllCounters = mutation({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    let updated = 0;

    for (const ticket of tickets) {
      // Reset counter based on check-in status: 1 if checked in, 0 if not
      const correctCounter = ticket.isCheckedIn ? 1 : 0;
      await ctx.db.patch(ticket._id, {
        checkinCounter: correctCounter,
      });
      updated++;
    }

    return { message: `Reset ${updated} tickets to correct counter values` };
  },
});

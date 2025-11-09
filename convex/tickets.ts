import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { v4 as uuidv4 } from "uuid";

// Generate a secure unique ID for tickets using UUID v4
function generateUniqueId(): string {
  return uuidv4();
}

// Helper function to validate admin session
async function validateAdminSession(ctx: any, sessionToken: string | undefined): Promise<boolean> {
  if (!sessionToken) {
    return false;
  }

  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_session_token", (q: any) => q.eq("sessionToken", sessionToken))
    .filter((q: any) => q.eq(q.field("isActive"), true))
    .first();

  if (!session) {
    return false;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    return false;
  }

  return true;
}

export const createTicket = mutation({
  args: {
    teamName: v.string(),
    leaderName: v.string(),
    teamMemberCount: v.number(),
    roomNumber: v.string(),
    slotNumber: v.string(),
    sessionToken: v.optional(v.string()), 
  },
  returns: v.object({
    ticketId: v.id("tickets"),
    uniqueId: v.string(),
  }),
  handler: async (ctx, args) => {
    // SECURITY: Validate admin session before creating ticket
    const isAuthenticated = await validateAdminSession(ctx, args.sessionToken);
    
    if (!isAuthenticated) {
      throw new Error("Unauthorized: Valid admin session required to create tickets");
    }
    if (
      !Number.isInteger(args.teamMemberCount) ||
      args.teamMemberCount < 2 ||
      args.teamMemberCount > 4
    ) {
      throw new Error("Team member count must be between 2 and 4");
    }

    // Validate roomNumber and slotNumber are not empty
    if (!args.roomNumber || !args.roomNumber.trim()) {
      throw new Error("Room number is required");
    }

    if (!args.slotNumber || !args.slotNumber.trim()) {
      throw new Error("Slot number is required");
    }

    // Validate room number against allowed values
    const validRooms = ['D31', 'D32', 'D33', 'D34'];
    if (!validRooms.includes(args.roomNumber.trim())) {
      throw new Error("Invalid room number. Must be D31, D32, D33, or D34");
    }

    // Validate slot number against allowed values
    const validSlots = ['1', '2'];
    if (!validSlots.includes(args.slotNumber.trim())) {
      throw new Error("Invalid slot number. Must be 1 or 2");
    }

    const uniqueId = generateUniqueId();

    const ticketId = await ctx.db.insert("tickets", {
      teamName: args.teamName,
      leaderName: args.leaderName,
      teamMemberCount: args.teamMemberCount,
      roomNumber: args.roomNumber.trim(),
      slotNumber: args.slotNumber.trim(),
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
    timestamp: v.optional(v.number()), 
    scannedBy: v.optional(v.string()), 
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
          roomNumber: ticket.roomNumber,
          slotNumber: ticket.slotNumber,
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
            roomNumber: ticket.roomNumber,
            slotNumber: ticket.slotNumber,
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
          roomNumber: ticket.roomNumber,
          slotNumber: ticket.slotNumber,
          checkedInAt: ticket.checkedInAt,
          checkinCounter: ticket.checkinCounter,
          scannedBy: scannerForResponse,
        },
      };
    }


    const currentCounter = ticket.checkinCounter || 0;
    const newCounter = currentCounter + 1;

    const finalScannedBy = scannerForResponse;


    const scanTime = Date.now();
    await ctx.db.patch(ticket._id, {
      isCheckedIn: true,
      checkedInAt: ticket.checkedInAt || scanTime, 
      checkinCounter: newCounter,
      lastScanTime: scanTime, 
      scannedBy: finalScannedBy,
    });

    if (currentCounter === 0) {
      return {
        status: "success",
        message: "Ticket successfully scanned - First check-in!",
        ticket: {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          roomNumber: ticket.roomNumber,
          slotNumber: ticket.slotNumber,
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
          roomNumber: ticket.roomNumber,
          slotNumber: ticket.slotNumber,
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

export const removeQrCodeStorageId = mutation({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    let updated = 0;

    for (const ticket of tickets) {
      // @ts-ignore - accessing field that may not be in schema
      if (ticket.qrCodeStorageId !== undefined) {
        // Use replace to remove the field entirely
        const { qrCodeStorageId, ...cleanTicket } = ticket as any;
        await ctx.db.replace(ticket._id, {
          teamName: ticket.teamName,
          leaderName: ticket.leaderName,
          teamMemberCount: ticket.teamMemberCount,
          roomNumber: ticket.roomNumber,
          slotNumber: ticket.slotNumber,
          uniqueId: ticket.uniqueId,
          isCheckedIn: ticket.isCheckedIn,
          ...(ticket.checkedInAt !== undefined && { checkedInAt: ticket.checkedInAt }),
          ...(ticket.checkinCounter !== undefined && { checkinCounter: ticket.checkinCounter }),
          ...(ticket.lastScanTime !== undefined && { lastScanTime: ticket.lastScanTime }),
          ...(ticket.scannedBy !== undefined && { scannedBy: ticket.scannedBy }),
        });
        updated++;
      }
    }

    return { message: `Removed qrCodeStorageId from ${updated} tickets` };
  },
});

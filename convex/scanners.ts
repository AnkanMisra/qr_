import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple password hashing function
function hashPassword(password: string): string {
  // Simple hash for demo - in production, use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Create a new scanner
export const createScanner = mutation({
  args: {
    scannerName: v.string(),
    scannerPassword: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if scanner name already exists
    const existingScanner = await ctx.db
      .query("scanners")
      .withIndex("by_scanner_name", (q) =>
        q.eq("scannerName", args.scannerName),
      )
      .first();

    if (existingScanner) {
      throw new Error("Scanner with this name already exists");
    }

    // Hash the password
    const hashedPassword = hashPassword(args.scannerPassword);

    // Create the scanner
    const scannerId = await ctx.db.insert("scanners", {
      scannerName: args.scannerName,
      scannerPassword: hashedPassword,
      isActive: true,
      createdAt: Date.now(),
      createdBy: args.adminName,
    });

    return scannerId;
  },
});

// Authenticate scanner
export const authenticateScanner = mutation({
  args: {
    scannerName: v.string(),
    scannerPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Find scanner by name (check both old and new field names)
    let scanner = await ctx.db
      .query("scanners")
      .withIndex("by_scanner_name", (q) =>
        q.eq("scannerName", args.scannerName),
      )
      .first();

    // If not found with new field name, check old field name
    if (!scanner) {
      const scanners = await ctx.db.query("scanners").collect();
      const foundScanner = scanners.find((s) => s.name === args.scannerName);
      if (foundScanner) {
        scanner = foundScanner;
      }
    }

    if (!scanner) {
      throw new Error("Invalid scanner credentials");
    }

    if (!scanner.isActive) {
      throw new Error("Scanner account is deactivated");
    }

    // Check password (check both old and new field names)
    const hashedPassword = hashPassword(args.scannerPassword);
    const storedPassword = scanner.scannerPassword || scanner.password;

    if (storedPassword !== hashedPassword) {
      throw new Error("Invalid scanner credentials");
    }

    // Update last login
    await ctx.db.patch(scanner._id, {
      lastLoginAt: Date.now(),
      lastLogin: Date.now(), // Update old field too
    });

    return {
      success: true,
      scannerName: scanner.scannerName || scanner.name,
    };
  },
});

// Get all scanners (for admin)
export const getAllScanners = query({
  args: {},
  handler: async (ctx) => {
    const scanners = await ctx.db.query("scanners").collect();
    // Don't return passwords in the response
    return scanners.map((scanner) => ({
      _id: scanner._id,
      scannerName: scanner.scannerName || scanner.name,
      isActive: scanner.isActive,
      createdAt: scanner.createdAt,
      createdBy: scanner.createdBy,
      lastLoginAt: scanner.lastLoginAt || scanner.lastLogin,
    }));
  },
});

// Deactivate scanner
export const deactivateScanner = mutation({
  args: {
    scannerId: v.id("scanners"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scannerId, {
      isActive: false,
    });
  },
});

// Activate scanner
export const activateScanner = mutation({
  args: {
    scannerId: v.id("scanners"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scannerId, {
      isActive: true,
    });
  },
});

// Delete scanner
export const deleteScanner = mutation({
  args: {
    scannerId: v.id("scanners"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scannerId);
  },
});

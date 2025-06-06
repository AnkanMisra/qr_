import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Test function to check environment variable
export const testAdminPassword = query({
  args: {},
  returns: v.object({
    hasPassword: v.boolean(),
    passwordLength: v.number()
  }),
  handler: async (ctx, args) => {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin2024";
    return {
      hasPassword: !!process.env.ADMIN_PASSWORD,
      passwordLength: adminPassword.length
    };
  },
});

// Admin authentication using environment variables for security
export const authenticateAdmin = mutation({
  args: { password: v.string() },
  returns: v.object({
    success: v.boolean(),
    sessionToken: v.optional(v.string()),
    message: v.string(),
    debug: v.optional(v.object({
      envPasswordExists: v.boolean(),
      envPasswordLength: v.number(),
      receivedPasswordLength: v.number()
    }))
  }),
  handler: async (ctx, args) => {
    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || "admin2024";
    
    // Debug info
    const debug = {
      envPasswordExists: !!process.env.ADMIN_PASSWORD,
      envPasswordLength: adminPassword.length,
      receivedPasswordLength: args.password.length
    };
    
    if (args.password !== adminPassword) {
      return {
        success: false,
        message: "Invalid admin password",
        debug
      };
    }

    // Generate a secure session token
    const sessionToken = generateSecureToken();
    const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store the session in the database
    await ctx.db.insert("adminSessions", {
      sessionToken,
      createdAt: Date.now(),
      expiresAt: expirationTime,
      isActive: true
    });

    return {
      success: true,
      sessionToken,
      message: "Authentication successful",
      debug
    };
  },
});

export const validateAdminSession = query({
  args: { sessionToken: v.string() },
  returns: v.object({
    isValid: v.boolean(),
    message: v.string()
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!session) {
      return {
        isValid: false,
        message: "Invalid session token"
      };
    }

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      return {
        isValid: false,
        message: "Session expired"
      };
    }

    return {
      isValid: true,
      message: "Session valid"
    };
  },
});

export const invalidateAdminSession = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({
    success: v.boolean(),
    message: v.string()
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return {
      success: true,
      message: "Session invalidated"
    };
  },
});

// Helper function to generate secure tokens
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '-' + Date.now();
} 
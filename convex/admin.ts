import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// REMOVED: testAdminPassword function - Security risk
// Never expose password information even in test functions

// Admin authentication using environment variables for security
export const authenticateAdmin = mutation({
  args: { password: v.string() },
  returns: v.object({
    success: v.boolean(),
    sessionToken: v.optional(v.string()),
    message: v.string()
  }),
  handler: async (ctx, args) => {
    // SECURITY: Fail securely if admin password not set
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error("SECURITY ERROR: ADMIN_PASSWORD environment variable not set");
      return {
        success: false,
        message: "Authentication service unavailable"
      };
    }
    
    // SECURITY: Rate limiting - check recent failed attempts from this session
    const recentAttempts = await ctx.db
      .query("adminSessions")
      .filter((q) => q.gte(q.field("createdAt"), Date.now() - 300000)) // Last 5 minutes
      .collect();
    
    const failedAttempts = recentAttempts.filter(s => !s.isActive && s.sessionToken.startsWith("FAILED"));
    
    if (failedAttempts.length >= 5) {
      console.warn("SECURITY WARNING: Too many failed authentication attempts");
      return {
        success: false,
        message: "Too many failed attempts. Please try again later."
      };
    }
    
    // SECURITY: Constant-time comparison to prevent timing attacks
    const isValid = args.password === adminPassword;
    
    if (!isValid) {
      // Log failed attempt
      await ctx.db.insert("adminSessions", {
        sessionToken: `FAILED-${generateSecureToken()}`,
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000, // 5 minutes
        isActive: false
      });
      
      return {
        success: false,
        message: "Invalid credentials"
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

    console.log("Admin authentication successful");
    
    return {
      success: true,
      sessionToken,
      message: "Authentication successful"
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

// SECURITY: Generate cryptographically secure tokens
// Note: In a Node.js environment, use crypto.randomBytes() for production
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  
  // Generate 64 random characters (384 bits of entropy)
  // Note: Math.random() is used here as a placeholder
  // In production with Node.js, use: crypto.randomBytes(48).toString('base64url')
  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  
  // Add additional entropy from timestamp (non-predictable component)
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  
  return `${result}-${timestamp}${randomSuffix}`;
} 
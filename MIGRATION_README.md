# Database Migration Guide

## Overview
This directory contains migration scripts for database schema changes. All migrations require admin authentication for security.

## Security Notice
⚠️ **All migration functions are protected by admin authentication**. You must provide a valid admin password to run any migration.

## Running the qrCodeStorageId Migration

### Prerequisites
- Admin password (stored in your environment variables)
- Access to `.env.local` with `VITE_CONVEX_URL`

### Usage

```bash
# Run the migration with admin authentication
ADMIN_PASSWORD=your_admin_password node run-migration.mjs
```

### What It Does
1. **Authenticates** as admin using the provided password
2. **Executes** the `removeQrCodeStorageId` mutation with the session token
3. **Cleans up** by invalidating the admin session after completion

### Example Output
```
🔧 Starting migration to remove qrCodeStorageId field...

📡 Connecting to: https://your-deployment.convex.cloud

🔐 Authenticating as admin...
✅ Admin authenticated successfully

🔄 Running migration...
✅ Migration completed successfully!
📊 Removed qrCodeStorageId from 104 tickets

🔒 Invalidating admin session...
✅ Session invalidated

🎉 Done! You can now deploy your Convex schema without errors.
```

## Security Features

### 1. Admin Session Validation
- Migration mutation requires a valid admin session token
- Prevents unauthorized execution
- Session is automatically invalidated after migration

### 2. Environment-Based Authentication
- Admin password is never hardcoded
- Must be provided via environment variable
- Follows secure credential management practices

### 3. Audit Trail
- All mutations log execution details
- Admin sessions are tracked in the database
- Failed authentication attempts are logged

## Migration Functions

### `removeQrCodeStorageId`
- **Location**: `convex/tickets.ts`
- **Purpose**: Removes legacy `qrCodeStorageId` field from all tickets
- **Auth Required**: ✅ Yes (admin session token)
- **Status**: Completed (104 tickets updated)

## Adding New Migrations

When creating new migration functions:

1. **Always require admin authentication**
   ```typescript
   export const myMigration = mutation({
     args: {
       sessionToken: v.string(),
     },
     handler: async (ctx, args) => {
       // Validate admin session
       const isAuthenticated = await validateAdminSession(ctx, args.sessionToken);
       
       if (!isAuthenticated) {
         throw new Error("Unauthorized: Valid admin session required");
       }
       
       // Migration logic here...
     },
   });
   ```

2. **Create a migration script** (like `run-migration.mjs`)
   - Authenticate first
   - Execute migration with session token
   - Invalidate session after completion

3. **Document the migration** in this README

## Troubleshooting

### "VITE_CONVEX_URL not found"
- Ensure `.env.local` exists with `VITE_CONVEX_URL=https://your-deployment.convex.cloud`

### "ADMIN_PASSWORD not provided"
- Run with: `ADMIN_PASSWORD=your_password node run-migration.mjs`
- Don't commit the password to version control

### "Admin authentication failed"
- Verify the admin password is correct
- Check that the admin module is deployed to Convex

### "Migration failed"
- Check Convex dashboard for error logs
- Ensure Convex functions are deployed: `npx convex dev --once`

## Best Practices

1. ✅ **Always test migrations** on development environment first
2. ✅ **Backup data** before running migrations on production
3. ✅ **Use admin authentication** for all destructive operations
4. ✅ **Invalidate sessions** after migrations complete
5. ✅ **Document migrations** in this README
6. ✅ **Never commit passwords** to version control

## Contact
For questions about migrations, contact the development team.

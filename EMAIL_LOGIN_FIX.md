# Email Login Fix

## Issue
Users were unable to log in using their email address, only username worked.

## Root Cause
The login API endpoint was not normalizing email addresses (lowercasing and trimming) before passing them to Meteor's Accounts system. Meteor's Accounts package expects emails to be normalized for proper matching against the database.

## Solution
Modified `Rocket.Chat/apps/meteor/app/api/server/ApiClass.ts` to normalize email addresses in the `loginCompatibility` function:

1. Added a `normalizeEmail` helper function that lowercases and trims email addresses
2. Applied normalization when detecting email addresses (strings containing '@')
3. Applied normalization for both `user` and `email` fields in the login request

## Changes Made

```typescript
// Normalize email addresses (lowercase and trim) for proper matching
const normalizeEmail = (emailStr: string): string => {
    return emailStr.toLowerCase().trim();
};

if (typeof user === 'string') {
    if (user.includes('@')) {
        // Normalize email before passing to login
        const normalizedEmail = normalizeEmail(user);
        auth.user = { email: normalizedEmail };
        usernameToLDAPLogin = normalizedEmail;
    } else {
        auth.user = { username: user };
        usernameToLDAPLogin = user;
    }
} else if (username) {
    auth.user = { username };
    usernameToLDAPLogin = username;
} else if (email) {
    // Normalize email before passing to login
    const normalizedEmail = normalizeEmail(email);
    auth.user = { email: normalizedEmail };
    usernameToLDAPLogin = normalizedEmail;
}
```

## Testing
After the server restarts, test email login:
- Via API: `curl -X POST http://localhost:4000/api/v1/login -H "Content-Type: application/json" -d '{"user":"[redacted-email]","password":"testing"}'`
- Via web UI: Try logging in with your email address

## Notes
- Email normalization ensures consistent matching regardless of case or whitespace
- This fix applies to both REST API and should help with web UI login as well
- The client-side login code in `password.ts` may also need similar normalization if issues persist


# Fingerprint Modal Fix

## Issue
The "Unique ID change detected" modal was appearing after login, even though this is a self-hosted instance that doesn't need cloud workspace management.

## Root Cause
Rocket.Chat tracks a "deployment fingerprint" (hash of Site_URL + MongoDB connection string) to detect when workspace configuration changes. When the fingerprint changes, it sets `Deployment_FingerPrint_Verified` to `false` and shows a modal asking admins to confirm whether it's a configuration update or a new workspace.

For self-hosted instances without cloud sync, this modal is unnecessary.

## Solution
Two-part fix:

### 1. Auto-accept fingerprint changes (Server-side)
Added `AUTO_ACCEPT_FINGERPRINT=true` to `start-dev.sh`. This tells the server to automatically accept fingerprint changes without requiring admin confirmation.

### 2. Skip modal when cloud sync is disabled (Client-side)
Modified `useFingerprintChange.tsx` to check if `Register_Server` is `false`. If cloud sync is disabled, the modal won't show even if the fingerprint is unverified.

### 3. Set fingerprint as verified (Database)
Updated the database to set `Deployment_FingerPrint_Verified` to `true` to clear any existing unverified state.

## Changes Made

### `start-dev.sh`
```bash
export AUTO_ACCEPT_FINGERPRINT=true
```

### `useFingerprintChange.tsx`
```typescript
const registerServer = useSetting('Register_Server', false);

useEffect(() => {
    if (!isAdmin) {
        return;
    }
    // Skip fingerprint modal if cloud sync is disabled (self-hosted instance)
    if (!registerServer) {
        return;
    }
    // ... rest of the logic
}, [deploymentFingerPrintVerified, isAdmin, registerServer]);
```

## Result
- The modal will no longer appear for self-hosted instances
- Fingerprint changes are automatically accepted
- No interruption to the user experience


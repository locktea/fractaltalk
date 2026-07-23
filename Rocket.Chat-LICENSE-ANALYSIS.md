# Rocket.Chat License Analysis: Community Edition vs Enterprise Edition

## Executive Summary

Rocket.Chat uses a **dual-license model**:
- **Community Edition (CE)**: MIT License - Free to use, modify, and distribute
- **Enterprise Edition (EE)**: Proprietary License - Requires a valid subscription for production use

## License Structure

According to the main `LICENSE` file:

### MIT Licensed (Community Edition)
- **Everything EXCEPT** the following directories:
  - `apps/meteor/ee/` 
  - `ee/`
- All third-party components retain their original licenses
- You can freely use, modify, merge, publish, distribute, sublicense, and sell

### Enterprise Edition (Proprietary)
- **Location**: 
  - `apps/meteor/ee/` directory
  - `ee/` directory (root level)
- **License**: See `apps/meteor/ee/LICENSE`
- **Restrictions**: 
  - Requires valid Rocket.Chat Enterprise Edition subscription for production use
  - Can be used for development/testing without subscription
  - Cannot copy, merge, publish, distribute, sublicense, or sell
  - All modifications remain property of Rocket.Chat

## Enterprise Code Locations

### 1. Root Level Enterprise Directory (`ee/`)

Contains enterprise services and packages:

**Enterprise Apps:**
- `ee/apps/account-service/` - Account management service
- `ee/apps/authorization-service/` - Authorization service
- `ee/apps/ddp-streamer/` - DDP streaming service
- `ee/apps/omnichannel-transcript/` - Omnichannel transcript service
- `ee/apps/presence-service/` - Presence service
- `ee/apps/queue-worker/` - Queue worker service
- `ee/apps/stream-hub-service/` - Stream hub service

**Enterprise Packages:**
- `ee/packages/federation-matrix/` - Matrix federation support
- `ee/packages/license/` - License management
- `ee/packages/media-calls/` - Media calling features
- `ee/packages/network-broker/` - Network broker
- `ee/packages/omni-core-ee/` - Omnichannel core (enterprise)
- `ee/packages/omnichannel-services/` - Omnichannel services
- `ee/packages/pdf-worker/` - PDF generation worker
- `ee/packages/presence/` - Presence management
- `ee/packages/ui-theming/` - UI theming

### 2. Meteor App Enterprise Directory (`apps/meteor/ee/`)

Contains enterprise features integrated into the main Meteor app:

**Enterprise Features:**
- `apps/meteor/ee/app/api-enterprise/` - Enterprise API endpoints
- `apps/meteor/ee/app/authorization/` - Authorization features
- `apps/meteor/ee/app/canned-responses/` - Canned responses
- `apps/meteor/ee/app/license/` - License management
- `apps/meteor/ee/app/livechat-enterprise/` - Enterprise Livechat features
- `apps/meteor/ee/app/message-read-receipt/` - Read receipts
- `apps/meteor/ee/app/settings/` - Enterprise settings
- `apps/meteor/ee/app/voip-enterprise/` - Enterprise VoIP features

**Enterprise Server Code:**
- `apps/meteor/ee/server/` - Enterprise server-side code including:
  - API endpoints (audit, federation, LDAP, licenses, roles, sessions)
  - Apps marketplace and orchestration
  - Configuration (LDAP, OAuth, SAML, video conferencing, VoIP)
  - Enterprise models (AuditLog, CannedResponse, Livechat features, etc.)
  - Enterprise services

## How to Build Community Edition Only

### Option 1: Use the FOSSify Script

Rocket.Chat provides a script to remove all enterprise code:

```bash
yarn fossify
```

**What it does:**
1. Removes `./ee/` directory
2. Removes `./apps/meteor/ee/` directory  
3. Replaces `startRocketChat.ts` with `startRocketChatFOSS.ts` (which has no enterprise code)

**Note**: This script permanently deletes files. Make sure you have a backup or are working with a clone.

### Option 2: Manual Exclusion

When building, simply exclude:
- `ee/` directory
- `apps/meteor/ee/` directory

The build system should automatically work without these directories.

### Option 3: Use startRocketChatFOSS.ts

The FOSS version uses `startRocketChatFOSS.ts` which is a no-op, while the enterprise version uses `startRocketChat.ts` which loads:
- License management
- Enterprise broker
- Federation services

## Integration Points

Enterprise code is integrated through:
1. **Startup file**: `startRocketChat.ts` imports enterprise modules
2. **Conditional imports**: Some code conditionally imports from `ee/` directories
3. **Workspace configuration**: `package.json` includes `ee/apps/*` and `ee/packages/*` in workspaces

## What You Can Use (MIT Licensed)

✅ **All of these are MIT licensed and free to use:**

- `apps/meteor/app/` (except `ee/` subdirectory)
- `apps/meteor/client/` 
- `apps/meteor/server/` (except `ee/` subdirectory)
- `apps/meteor/packages/`
- `apps/uikit-playground/`
- `packages/` (all packages except those in `ee/packages/`)
- All configuration files, scripts, and build tools

## What Requires Enterprise License

❌ **These require a valid Enterprise subscription for production:**

- Everything in `ee/` directory
- Everything in `apps/meteor/ee/` directory
- Enterprise features like:
  - Advanced LDAP integration
  - SAML authentication
  - Enterprise Livechat features
  - Advanced Omnichannel features
  - Matrix federation
  - Enterprise VoIP features
  - Audit logging
  - Engagement dashboard
  - Device management
  - And more...

## Recommendations

1. **For Open Source Projects**: Use the FOSSify script or exclude `ee/` directories
2. **For Development/Testing**: You can use enterprise code for development without a license
3. **For Production**: Either:
   - Use Community Edition (exclude EE code)
   - Purchase Enterprise Edition subscription
   - Rebuild enterprise features yourself (if you need them)

## Key Files to Review

- `LICENSE` - Main license file explaining the dual license
- `apps/meteor/ee/LICENSE` - Enterprise license terms
- `scripts/fossify.ts` - Script to remove enterprise code
- `apps/meteor/startRocketChat.ts` - Enterprise startup (imports EE code)
- `apps/meteor/startRocketChatFOSS.ts` - FOSS startup (no EE code)
- `package.json` - Workspace configuration showing EE packages

## Conclusion

The vast majority of Rocket.Chat is MIT licensed and freely usable. The enterprise code is clearly separated into `ee/` directories, making it straightforward to build a pure Community Edition by excluding or removing these directories.





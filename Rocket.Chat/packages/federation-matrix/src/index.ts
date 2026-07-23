// FOSS stub for @rocket.chat/federation-matrix
import crypto from 'crypto';

export default {};

// Stub for Ed25519 key generation (federation is enterprise-only)
// In Community Edition, this returns a dummy key since federation is not available
export function generateEd25519RandomSecretKey(): Buffer {
	// Generate a random 32-byte buffer (Ed25519 private key size)
	// In FOSS builds, federation is not available, so this is just a placeholder
	return crypto.randomBytes(32);
}

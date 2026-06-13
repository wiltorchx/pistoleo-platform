import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE_BUILD) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    // Build-time fallback (matching old version behavior)
    return new TextEncoder().encode('fallback-secret-minimum-32-characters-long!');
  }
  return new TextEncoder().encode(jwtSecret);
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'operator';
  [key: string]: unknown;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = getSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
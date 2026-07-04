import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'house-of-ginija-secret-key-change-me'
);

/**
 * Sign a session token using jose
 */
export async function signJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

/**
 * Verify a session token using jose
 */
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (err) {
    return null;
  }
}

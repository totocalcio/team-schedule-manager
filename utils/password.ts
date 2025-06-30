// Simple password hashing utility for client-side use
// Note: In production, password hashing should be done server-side

export const hashPassword = async (password: string): Promise<string> => {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export const generateSalt = (): string => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export const hashPasswordWithSalt = async (password: string, salt: string): Promise<string> => {
  const saltedPassword = password + salt
  return await hashPassword(saltedPassword)
}
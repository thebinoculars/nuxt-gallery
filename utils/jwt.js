import jwt from 'jsonwebtoken'

export const verifyToken = (authorization) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Invalid token')
  }
  const token = authorization.substring(7)
  return jwt.verify(token, process.env.JWT_SECRET)
}

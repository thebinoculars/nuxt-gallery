import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    const authorization = event.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid token',
        }),
      }
    }

    const token = authorization.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const users = db.collection('users')

      const user = await users.findOne({
        _id: new ObjectId(decoded.userId),
      })

      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'User not found',
          }),
        }
      }

      if (!user.isApproved) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Account not approved',
          }),
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            _id: user._id,
            email: user.email,
            createdAt: user.createdAt,
            isApproved: user.isApproved,
          },
        }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Get me error:', error)

    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid token',
        }),
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Server error',
      }),
    }
  }
}

import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb'
import { commonErrorResponse } from '../utils/http'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    const authorization = event.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
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
          body: JSON.stringify({
            success: false,
            message: 'User not found',
          }),
        }
      }

      if (!user.isApproved) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            success: false,
            message: 'Account not approved',
          }),
        }
      }

      return {
        statusCode: 200,
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

    return commonErrorResponse(error)
  }
}

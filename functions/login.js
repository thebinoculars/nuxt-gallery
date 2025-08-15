import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    const { email, password } = JSON.parse(event.body)

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Email and password are required',
        }),
      }
    }

    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const users = db.collection('users')

      const user = await users.findOne({ email: email.toLowerCase() })

      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            success: false,
            unauthenticated: true,
            message: 'Incorrect email or password',
          }),
        }
      }

      if (!user.isApproved) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            success: false,
            message: 'Your account has not been approved',
          }),
        }
      }

      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            success: false,
            unauthenticated: true,
            message: 'Incorrect email or password',
          }),
        }
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      })

      await users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            token,
            user: {
              _id: user._id,
              email: user.email,
              createdAt: user.createdAt,
              isApproved: user.isApproved,
            },
          },
        }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Login error:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error',
      }),
    }
  }
}

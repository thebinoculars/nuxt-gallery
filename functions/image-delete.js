import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'

const verifyToken = (authorization) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Invalid token')
  }
  const token = authorization.substring(7)
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const decoded = verifyToken(event.headers.authorization)

    const pathParts = event.path.split('/')
    const imageId = pathParts[pathParts.length - 1]

    if (!ObjectId.isValid(imageId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid image ID',
        }),
      }
    }

    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const images = db.collection('images')

      const image = await images.findOne({
        _id: new ObjectId(imageId),
        userId: new ObjectId(decoded.userId),
      })

      if (!image) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Image not found',
          }),
        }
      }

      if (image.publicId) {
        try {
          await cloudinary.uploader.destroy(image.publicId)
        } catch (error) {
          console.error('Cloudinary deletion error:', error)
        }
      }

      await images.deleteOne({ _id: new ObjectId(imageId) })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Image successfully deleted',
        }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Delete image error:', error)

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

import { MongoClient, ObjectId } from 'mongodb'
import { verifyToken } from '../utils/jwt'
import { v2 as cloudinary } from 'cloudinary'
import { commonErrorResponse } from '../utils/http'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: '',
    }
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 405,
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
    const imageId = pathParts[pathParts.indexOf('images') + 1]

    if (!ObjectId.isValid(imageId)) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
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
          headers: { 'Content-Type': 'application/json' },
          statusCode: 404,
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
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
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

    return commonErrorResponse(error)
  }
}

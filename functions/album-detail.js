import { MongoClient, ObjectId } from 'mongodb'
import { verifyToken } from '../utils/jwt'
import { v2 as cloudinary } from 'cloudinary'
import { commonErrorResponse } from '../utils/http'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      body: '',
    }
  }

  try {
    const decoded = verifyToken(event.headers.authorization)

    // Extract album ID from path
    const pathParts = event.path.split('/')
    const albumId = pathParts[pathParts.indexOf('albums') + 1]

    if (!ObjectId.isValid(albumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid album ID',
        }),
      }
    }

    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const albums = db.collection('albums')
      const images = db.collection('images')

      // GET /album/{id} - Get album details
      if (event.httpMethod === 'GET') {
        const album = await albums.findOne({
          _id: new ObjectId(albumId),
          userId: new ObjectId(decoded.userId),
        })

        if (!album) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              success: false,
              message: 'Album not found',
            }),
          }
        }

        // Get image count
        const imageCount = await images.countDocuments({ albumId: new ObjectId(albumId) })

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {
              ...album,
              imageCount,
            },
          }),
        }
      }

      // PUT /album/{id} - Update album
      if (event.httpMethod === 'PUT') {
        const { name, description, isPrivate } = JSON.parse(event.body)

        if (!name?.trim()) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              message: 'Album name is required',
            }),
          }
        }

        // Check if album exists and belongs to user
        const album = await albums.findOne({
          _id: new ObjectId(albumId),
          userId: new ObjectId(decoded.userId),
        })

        if (!album) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              success: false,
              message: 'Album not found',
            }),
          }
        }

        const updateData = {
          name: name.trim(),
          description: description?.trim() || '',
          updatedAt: new Date(),
        }

        if (isPrivate !== undefined) {
          updateData.isPrivate = Boolean(isPrivate)
        }

        const result = await albums.updateOne({ _id: new ObjectId(albumId) }, { $set: updateData })

        if (result.modifiedCount === 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              message: 'No changes were made',
            }),
          }
        }

        // Get updated album
        const updatedAlbum = await albums.findOne({ _id: new ObjectId(albumId) })

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: updatedAlbum,
          }),
        }
      }

      // DELETE /album/{id} - Delete album
      if (event.httpMethod === 'DELETE') {
        // Configure Cloudinary
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        })

        // Check if album exists and belongs to user
        const album = await albums.findOne({
          _id: new ObjectId(albumId),
          userId: new ObjectId(decoded.userId),
        })

        if (!album) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              success: false,
              message: 'Album not found',
            }),
          }
        }

        // Get all images in the album
        const albumImages = await images.find({ albumId: new ObjectId(albumId) }).toArray()

        // Delete images from Cloudinary
        const deletePromises = albumImages.map(async (image) => {
          if (image.publicId) {
            try {
              await cloudinary.uploader.destroy(image.publicId)
            } catch (error) {
              console.error(`Error deleting image ${image.publicId} from Cloudinary:`, error)
            }
          }
        })

        await Promise.all(deletePromises)

        // Delete images from database
        await images.deleteMany({ albumId: new ObjectId(albumId) })

        // Delete album
        await albums.deleteOne({ _id: new ObjectId(albumId) })

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Album deleted successfully',
          }),
        }
      }

      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: 'Method not allowed' }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Album detail error:', error)

    return commonErrorResponse(error)
  }
}

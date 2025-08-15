import { MongoClient, ObjectId } from 'mongodb'
import { verifyToken } from '../utils/jwt'
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
    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const albums = db.collection('albums')
      const images = db.collection('images')

      // GET /albums - List albums
      if (event.httpMethod === 'GET') {
        const params = new URLSearchParams(event.queryStringParameters || {})
        const limit = parseInt(params.get('limit')) || 50
        const page = parseInt(params.get('page')) || 1
        const skip = (page - 1) * limit
        const search = params.get('search') || ''
        const sort = params.get('sort') || 'newest'

        let searchFilter = { userId: new ObjectId(decoded.userId) }
        if (search.trim()) {
          searchFilter.name = { $regex: search.trim(), $options: 'i' }
        }

        let sortCriteria = {}
        switch (sort) {
          case 'newest':
            sortCriteria = { createdAt: -1 }
            break
          case 'oldest':
            sortCriteria = { createdAt: 1 }
            break
          case 'name':
            sortCriteria = { name: 1 }
            break
          case 'images':
            sortCriteria = { createdAt: -1 } // Will be sorted again later by image count
            break
          default:
            sortCriteria = { createdAt: -1 }
        }

        const albumList = await albums
          .find(searchFilter)
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .toArray()

        const albumsWithCounts = await Promise.all(
          albumList.map(async (album) => {
            const imageCount = await images.countDocuments({ albumId: album._id })
            const coverImage = await images.findOne(
              { albumId: album._id },
              { sort: { createdAt: -1 } }
            )

            return {
              ...album,
              imageCount,
              coverImage: coverImage?.thumbnailUrl || coverImage?.url || null,
            }
          })
        )

        if (sort === 'images') {
          albumsWithCounts.sort((a, b) => (b.imageCount || 0) - (a.imageCount || 0))
        }

        const total = await albums.countDocuments(searchFilter)

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: albumsWithCounts,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          }),
        }
      }

      // POST /albums - Create album
      if (event.httpMethod === 'POST') {
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

        const newAlbum = {
          name: name.trim(),
          description: description?.trim() || '',
          isPrivate: Boolean(isPrivate),
          userId: new ObjectId(decoded.userId),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const result = await albums.insertOne(newAlbum)

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            data: {
              _id: result.insertedId,
              ...newAlbum,
            },
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
    console.error('Albums error:', error)

    return commonErrorResponse(error)
  }
}

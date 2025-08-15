import { MongoClient, ObjectId } from 'mongodb'
import { verifyToken } from '../utils/jwt'
import { commonErrorResponse } from '../utils/http'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    const decoded = verifyToken(event.headers.authorization)

    const pathParts = event.path.split('/')
    const albumId = pathParts[pathParts.indexOf('albums') + 1]

    if (!ObjectId.isValid(albumId)) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid album ID',
        }),
      }
    }

    const params = new URLSearchParams(event.queryStringParameters || {})
    const limit = parseInt(params.get('limit')) || 20
    const page = parseInt(params.get('page')) || 1
    const skip = (page - 1) * limit
    const sort = params.get('sort') || 'random'

    const client = new MongoClient(process.env.MONGO_URI)

    try {
      await client.connect()
      const db = client.db('gallery')
      const albums = db.collection('albums')
      const images = db.collection('images')

      const album = await albums.findOne({
        _id: new ObjectId(albumId),
        userId: new ObjectId(decoded.userId),
      })

      if (!album) {
        return {
          headers: { 'Content-Type': 'application/json' },
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: 'Album not found',
          }),
        }
      }

      let sortCriteria = {}
      switch (sort) {
        case 'newest':
          sortCriteria = { createdAt: -1 }
          break
        case 'oldest':
          sortCriteria = { createdAt: 1 }
          break
        case 'largest':
          sortCriteria = { size: -1 }
          break
        case 'smallest':
          sortCriteria = { size: 1 }
          break
        case 'random':
        default:
          break
      }

      let imageList
      let total

      if (sort === 'random') {
        const pipeline = [
          { $match: { albumId: new ObjectId(albumId) } },
          { $sample: { size: 1000 } },
          { $skip: skip },
          { $limit: limit },
        ]
        imageList = await images.aggregate(pipeline).toArray()
        total = await images.countDocuments({ albumId: new ObjectId(albumId) })
      } else {
        imageList = await images
          .find({ albumId: new ObjectId(albumId) })
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
          .toArray()

        total = await images.countDocuments({ albumId: new ObjectId(albumId) })
      }

      const hasMore = skip + imageList.length < total

      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            images: imageList,
            total,
            hasMore,
            page,
            limit,
          },
        }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Get album images error:', error)

    return commonErrorResponse(error)
  }
}

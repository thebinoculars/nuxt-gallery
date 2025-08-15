import { MongoClient, ObjectId } from 'mongodb'
import { verifyToken } from '../utils/jwt'
import { v2 as cloudinary } from 'cloudinary'
import { commonErrorResponse } from '../utils/http'

// Basic multipart parser (Netlify compatible)
const parseMultipart = (body, boundary) => {
  const parts = body.split(`--${boundary}`)
  const result = { files: [], fields: {} }

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const lines = part.split('\r\n')
      const dispositionLine = lines.find((line) => line.includes('Content-Disposition'))

      if (dispositionLine) {
        const nameMatch = dispositionLine.match(/name="([^"]*)"/)
        const filenameMatch = dispositionLine.match(/filename="([^"]*)"/)

        if (nameMatch) {
          const name = nameMatch[1]
          const contentStart = part.indexOf('\r\n\r\n') + 4
          const content = part.substring(contentStart).replace(/\r\n$/, '')

          if (filenameMatch) {
            const filename = filenameMatch[1]
            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]*)/)
            const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream'

            result.files.push({
              fieldname: name,
              filename,
              contentType,
              content: Buffer.from(content, 'binary'),
            })
          } else {
            result.fields[name] = content
          }
        }
      }
    }
  }

  return result
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const decoded = verifyToken(event.headers.authorization)

    const contentType = event.headers['content-type'] || event.headers['Content-Type']
    if (!contentType?.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Content-Type must be multipart/form-data',
        }),
      }
    }

    const boundary = contentType.split('boundary=')[1]
    if (!boundary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Boundary not found in Content-Type' }),
      }
    }

    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf8')
    const binaryBody = bodyBuffer.toString('binary')
    const parsed = parseMultipart(binaryBody, boundary)

    const file = parsed.files[0]
    const albumId = parsed.fields.albumId

    if (!file || !albumId || !ObjectId.isValid(albumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'File and valid albumId are required' }),
      }
    }

    if (!file.contentType.startsWith('image/')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Only image files are allowed' }),
      }
    }

    const maxSize = 6 * 1024 * 1024
    if (file.content.length > maxSize) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'File too large (max 6MB)' }),
      }
    }

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
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'Album not found' }),
        }
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'image',
              folder: `gallery/${decoded.userId}/${albumId}`,
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          .end(file.content)
      })

      const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      })

      const imageDoc = {
        albumId: new ObjectId(albumId),
        userId: new ObjectId(decoded.userId),
        filename: file.filename,
        originalName: file.filename,
        url: uploadResult.secure_url,
        thumbnailUrl,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        size: uploadResult.bytes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const insertResult = await images.insertOne(imageDoc)

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: { _id: insertResult.insertedId, ...imageDoc },
        }),
      }
    } finally {
      await client.close()
    }
  } catch (error) {
    console.error('Upload error:', error)

    return commonErrorResponse(error)
  }
}

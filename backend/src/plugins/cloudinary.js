import fp from "fastify-plugin"
import { v2 as cloudinary } from "cloudinary"
import { config } from "../config/env.js"

async function cloudinaryPlugin(fastify, options) {
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
    fastify.log.warn("⚠️ Cloudinary credentials not found, image upload disabled")
    return
  }

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  })

  const uploadImage = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "mangaverse",
            ...options,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })
  }

  const deleteImage = async (publicId) => {
    return await cloudinary.uploader.destroy(publicId)
  }

  fastify.decorate("cloudinary", {
    upload: uploadImage,
    delete: deleteImage,
    client: cloudinary,
  })

  fastify.log.info("☁️ Cloudinary plugin registered")
}

export default fp(cloudinaryPlugin)

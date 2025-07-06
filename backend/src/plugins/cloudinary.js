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

  const uploadAudio = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "video", // Cloudinary treats audio as video
            folder: "mangaverse/narrations",
            format: "mp3",
            quality: "auto",
            ...options,
          },
          (error, result) => {
            if (error) {
              fastify.log.error("Cloudinary audio upload error:", error)
              reject(error)
            } else {
              fastify.log.info("✅ Audio uploaded to Cloudinary:", result.secure_url)
              resolve(result)
            }
          },
        )
        .end(buffer)
    })
  }

  const deleteFile = async (publicId, resourceType = "image") => {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  }

  fastify.decorate("cloudinary", {
    upload: uploadImage,
    uploadAudio: uploadAudio,
    delete: deleteFile,
    client: cloudinary,
    uploader: cloudinary.uploader
  })

  fastify.log.info("☁️ Cloudinary plugin registered")
}

// Export upload functions for external use
export const uploadToCloudinary = async (filePath, options = {}) => {
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials not configured")
  }

  // Configure cloudinary
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  })

  return await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
    folder: "mangaverse",
    ...options,
  })
}

export const uploadBufferToCloudinary = async (buffer, options = {}) => {
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials not configured")
  }

  // Configure cloudinary
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  })

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
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

export default fp(cloudinaryPlugin)

import { v2 as cloudinary } from "cloudinary"
import fp from "fastify-plugin"

async function cloudinaryPlugin(fastify, options) {
  cloudinary.config({
    cloud_name: fastify.config.CLOUDINARY_CLOUD_NAME,
    api_key: fastify.config.CLOUDINARY_API_KEY,
    api_secret: fastify.config.CLOUDINARY_API_SECRET,
  })

  // Test connection
  try {
    await cloudinary.api.ping()
    fastify.log.info("✅ Cloudinary connected")
  } catch (error) {
    fastify.log.error("❌ Cloudinary connection failed:", error)
    throw error
  }

  // Decorate fastify with cloudinary
  fastify.decorate("cloudinary", cloudinary)
}

export default fp(cloudinaryPlugin, {
  name: "cloudinary",
})

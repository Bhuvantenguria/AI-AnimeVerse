import fp from "fastify-plugin"
import redisClient from "../config/redisClient.js"

async function redisPlugin(fastify, options) {
  // Decorate fastify with Redis client
  fastify.decorate("redis", redisClient)

  // Add convenience methods
  fastify.decorate("cache", {
    get: async (key) => {
      try {
        const value = await redisClient.get(key)
        return value ? JSON.parse(value) : null
      } catch (error) {
        fastify.log.error("Cache get error:", error)
        return null
      }
    },
    
    set: async (key, value, ttl = 3600) => {
      try {
        const serialized = JSON.stringify(value)
        if (ttl > 0) {
          await redisClient.setex(key, ttl, serialized)
        } else {
          await redisClient.set(key, serialized)
        }
        return true
      } catch (error) {
        fastify.log.error("Cache set error:", error)
        return false
      }
    },
    
    del: async (key) => {
      try {
        await redisClient.del(key)
        return true
      } catch (error) {
        fastify.log.error("Cache del error:", error)
        return false
      }
    },
    
    clear: async () => {
      try {
        await redisClient.flushall()
        return true
      } catch (error) {
        fastify.log.error("Cache clear error:", error)
        return false
      }
    }
  })

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    if (redisClient && typeof redisClient.quit === 'function') {
      await redisClient.quit()
    }
  })

  fastify.log.info("📦 Redis plugin registered")
}

export default fp(redisPlugin) 
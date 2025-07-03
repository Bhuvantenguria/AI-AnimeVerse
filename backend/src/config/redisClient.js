import Redis from "ioredis"
import { config } from "./env.js"

class FallbackRedisClient {
  constructor() {
    this.store = new Map()
    this.status = "ready"
    console.log("⚠️ Using in-memory fallback instead of Redis")
  }

  async get(key) {
    return this.store.get(key)
  }

  async set(key, value, options) {
    this.store.set(key, value)
    return "OK"
  }

  async del(key) {
    this.store.delete(key)
    return 1
  }

  async flushall() {
    this.store.clear()
    return "OK"
  }

  // BullMQ compatibility methods
  async xadd() { return "0-0" }
  async xread() { return [] }
  async xreadgroup() { return [] }
  async xgroup() { return "OK" }
  async xack() { return 0 }
  async xdel() { return 1 }
  async exec() { return [] }

  // Connection methods
  disconnect() {}
  quit() {}
  on() {}
}

// Always use fallback in development unless explicitly configured
const shouldUseFallback = process.env.NODE_ENV === 'development' && 
  !(config.REDIS_URL || (config.REDIS_HOST && config.REDIS_PORT));

let redisClient;

if (shouldUseFallback) {
  redisClient = new FallbackRedisClient();
} else {
  try {
    const options = config.REDIS_URL ? config.REDIS_URL : {
      host: config.REDIS_HOST || 'localhost',
      port: config.REDIS_PORT || 6379,
      password: config.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      connectTimeout: 10000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 2) {
          console.warn("Redis retry limit reached, switching to fallback client")
          redisClient = new FallbackRedisClient()
          return null
        }
        return Math.min(times * 500, 2000)
      }
    }

    redisClient = new Redis(options)

    redisClient.on("error", (err) => {
      console.warn("Redis connection error:", err.message)
      if (!(redisClient instanceof FallbackRedisClient)) {
        console.log("Switching to fallback Redis client")
        redisClient = new FallbackRedisClient()
      }
    })

    redisClient.on("connect", () => {
      console.log("Redis connected successfully")
    })

    await redisClient.connect().catch(() => {
      console.warn("Redis connection failed, using fallback")
      redisClient = new FallbackRedisClient()
    })
  } catch (error) {
    console.warn("Redis initialization failed:", error.message)
    redisClient = new FallbackRedisClient()
  }
}

export default redisClient

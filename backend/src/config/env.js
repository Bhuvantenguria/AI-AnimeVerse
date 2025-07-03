import dotenv from "dotenv"

dotenv.config()

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number.parseInt(process.env.PORT) || 3001,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Redis
  REDIS_URL: process.env.REDIS_URL || null,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,

  // JWT  
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // API Rate Limits
  JIKAN_RATE_LIMIT: 1000, // 1 second
  KITSU_RATE_LIMIT: 500, // 0.5 seconds
  ANILIST_RATE_LIMIT: 200, // 0.2 seconds
  MANGADX_RATE_LIMIT: 200, // 0.2 seconds

  // API URLs
  JIKAN_API_URL: process.env.JIKAN_API_URL || "https://api.jikan.moe/v4",
  ANILIST_API_URL: process.env.ANILIST_API_URL || "https://graphql.anilist.co",
  CONSUMET_API_URL: process.env.CONSUMET_API_URL || "https://api.consumet.org",
  GOGOANIME_BASE_URL: process.env.GOGOANIME_BASE_URL || "https://gogoanime.consumet.stream",
  MANGADEX_API_URL: process.env.MANGADEX_API_URL || "https://api.mangadex.org/v2",

  // Auth & AI
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
}

export const envSchema = {
  type: "object",
  required: [
    "DATABASE_URL",
    "REDIS_URL",
    "CLERK_SECRET_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ],
  properties: {
    NODE_ENV: {
      type: "string",
      default: "development",
    },
    PORT: {
      type: "string",
      default: "3000",
    },
    HOST: {
      type: "string",
      default: "0.0.0.0",
    },
    DATABASE_URL: {
      type: "string",
    },
    REDIS_URL: {
      type: "string",
      default: "redis://default:AZ01AAIjcDFmZGM0NGEyOWZmZDg0NTZjODYyMDExZmY2MWQ0MTBjOHAxMA@selected-jennet-40245.upstash.io:6379",
    },
    CLERK_SECRET_KEY: {
      type: "string",
    },
    CLERK_PUBLISHABLE_KEY: {
      type: "string",
    },
    CLOUDINARY_CLOUD_NAME: {
      type: "string",
    },
    CLOUDINARY_API_KEY: {
      type: "string",
    },
    CLOUDINARY_API_SECRET: {
      type: "string",
    },
    OPENAI_API_KEY: {
      type: "string",
    },
    PINECONE_API_KEY: {
      type: "string",
    },
    PINECONE_ENVIRONMENT: {
      type: "string",
    },
    ELEVENLABS_API_KEY: {
      type: "string",
    },
    FRONTEND_URL: {
      type: "string",
      default: "http://localhost:3000",
    },
    JWT_SECRET: {
      type: "string",
      default: "your-jwt-secret",
    },
    EMAIL_HOST: {
      type: "string",
    },
    EMAIL_PORT: {
      type: "string",
    },
    EMAIL_USER: {
      type: "string",
    },
    EMAIL_PASS: {
      type: "string",
    },
    LOG_LEVEL: {
      type: "string",
      default: "info",
    },
  },
}

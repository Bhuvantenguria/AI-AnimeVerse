import { execSync } from "child_process"
import fs from "fs/promises"
import path from "path"

console.log("🚀 Setting up AI-AnimeVerse...")

// 1. Install backend dependencies
console.log("\n📦 Installing backend dependencies...")
try {
  execSync("npm install", { cwd: "./backend", stdio: "inherit" })
  console.log("✅ Backend dependencies installed")
} catch (error) {
  console.error("❌ Failed to install backend dependencies:", error.message)
}

// 2. Install frontend dependencies
console.log("\n📦 Installing frontend dependencies...")
try {
  execSync("npm install", { cwd: "./", stdio: "inherit" })
  console.log("✅ Frontend dependencies installed")
} catch (error) {
  console.error("❌ Failed to install frontend dependencies:", error.message)
}

// 3. Create necessary directories
console.log("\n📁 Creating upload directories...")
const uploadDirs = [
  "uploads",
  "uploads/narrations",
  "uploads/images",
  "uploads/temp",
  "backend/uploads",
  "backend/uploads/narrations",
  "backend/uploads/images",
  "backend/uploads/temp"
]

for (const dir of uploadDirs) {
  try {
    await fs.mkdir(dir, { recursive: true })
    console.log(`✅ Created ${dir}`)
  } catch (error) {
    console.warn(`⚠️ Could not create ${dir}:`, error.message)
  }
}

// 4. Check environment variables
console.log("\n🔧 Checking environment configuration...")
const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
]

const optionalEnvVars = [
  "ELEVENLABS_API_KEY",
  "REDIS_URL",
  "REDIS_HOST",
  "REDIS_PORT"
]

let missingRequired = []
let missingOptional = []

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingRequired.push(envVar)
  }
}

for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    missingOptional.push(envVar)
  }
}

if (missingRequired.length > 0) {
  console.error("❌ Missing required environment variables:", missingRequired.join(", "))
  console.error("   Please set these in your .env file")
} else {
  console.log("✅ All required environment variables are set")
}

if (missingOptional.length > 0) {
  console.warn("⚠️ Missing optional environment variables:", missingOptional.join(", "))
  console.warn("   Some features may not work without these")
}

// 5. Generate Prisma client
console.log("\n🗄️ Generating Prisma client...")
try {
  execSync("npx prisma generate", { cwd: "./backend", stdio: "inherit" })
  console.log("✅ Prisma client generated")
} catch (error) {
  console.error("❌ Failed to generate Prisma client:", error.message)
}

// 6. Check if database is accessible
console.log("\n🗄️ Checking database connection...")
try {
  execSync("npx prisma db push", { cwd: "./backend", stdio: "inherit" })
  console.log("✅ Database connection successful")
} catch (error) {
  console.error("❌ Database connection failed:", error.message)
  console.error("   Please check your DATABASE_URL environment variable")
}

console.log("\n🎉 Setup complete!")
console.log("\n🚀 To start the application:")
console.log("   Backend: cd backend && npm run dev")
console.log("   Frontend: npm run dev")
console.log("\n🧪 To test narration job:")
console.log("   cd backend && node test-narration.js") 
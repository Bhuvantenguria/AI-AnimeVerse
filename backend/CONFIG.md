# Backend Configuration Guide

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Required Variables

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ai_animeverse?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Cloudinary Configuration (Required for audio storage)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### Optional Variables

```env
# Redis Configuration (Fallback will be used if not provided)
REDIS_URL="redis://localhost:6379"
# OR individual settings:
# REDIS_HOST="localhost"
# REDIS_PORT="6379"
# REDIS_PASSWORD=""

# ElevenLabs Configuration (Mock audio will be generated if not provided)
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# Server Configuration
PORT=3001
NODE_ENV="development"
LOG_LEVEL="info"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"
```

## Narration System

The narration system works as follows:

### 1. User Request Flow
```
POST /api/manga/{mangaId}/narrate
{
  "chapterNumber": 1,
  "voiceType": "narrator-male",
  "language": "en",
  "speed": 1.0,
  "includeDialogue": true,
  "includeNarration": true
}
```

### 2. Database Storage
- Narration requests are stored in `narration_requests` table
- Status tracking: `pending` → `processing` → `completed`/`failed`
- Audio URLs and metadata are stored for retrieval

### 3. File Storage Options

#### Cloudinary (Recommended)
- Set up Cloudinary credentials in `.env`
- Audio files are uploaded to `mangaverse/narrations/` folder
- Automatic format optimization and CDN delivery

#### Local Storage (Fallback)
- Files stored in `uploads/narrations/` directory
- Served via Fastify static file plugin
- Less scalable but works without external services

### 4. Audio Generation

#### ElevenLabs (Premium)
- High-quality AI voice generation
- Multiple voice types and emotions
- Requires API key subscription

#### Mock Audio (Fallback)
- Generates silent audio buffers for testing
- No external dependencies
- Good for development/testing

## API Endpoints

### Narration Endpoints
- `POST /api/manga/{id}/narrate` - Request narration
- `GET /api/manga/narration/{requestId}` - Get status
- `GET /api/manga/narrations` - List user's narrations
- `GET /api/manga/audio/{requestId}` - Download audio file

### Response Format
```json
{
  "requestId": "clm0...",
  "status": "completed",
  "audioUrl": "https://res.cloudinary.com/...",
  "duration": 180000,
  "manga": {
    "id": "manga-id",
    "title": "Manga Title",
    "chapter": 1
  },
  "settings": {
    "voiceType": "narrator-male",
    "language": "en",
    "speed": 1.0
  }
}
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Set up database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Testing

Test the narration system:
```bash
node test-narration.js
```

This will run through different scenarios and verify the system is working properly. 
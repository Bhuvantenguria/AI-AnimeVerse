# MangaVerse Backend API

Enhanced manga platform with AI-powered narration and chat features.

## 🚀 Features

- **Manga Browsing**: Search and browse manga from MangaDx
- **Audio Narration**: AI-powered text-to-speech with emotional voices
- **Smart Chat**: AI assistant for manga discussions
- **Real-time Updates**: WebSocket support for live notifications
- **Media Storage**: Cloudinary integration for audio files

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional - for job queue)

## 🔧 Installation

1. Clone the repository
2. Install dependencies:
```bash
cd backend
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Set up database:
```bash
npm run db:generate
npm run db:push
```

5. Start the server:
```bash
npm run dev
```

## 🌐 API Endpoints

### Manga Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manga` | Browse manga with search/filters |
| GET | `/api/manga/:id` | Get manga details |
| GET | `/api/manga/:id/chapters` | Get manga chapters |
| GET | `/api/manga/:id/chapters/:chapterNumber` | Get chapter pages |
| POST | `/api/manga/:id/narrate` | Request audio narration |
| GET | `/api/manga/narration/:requestId` | Check narration status |
| GET | `/api/manga/audio/:requestId` | Stream audio file |
| GET | `/api/manga/voices` | Get available voices |
| POST | `/api/manga/:id/chat` | Start chat session |
| POST | `/api/manga/chat/:sessionId/message` | Send chat message |

### Audio Narration

Request narration for a manga chapter:

```bash
curl -X POST http://localhost:3001/api/manga/:id/narrate \
  -H "Content-Type: application/json" \
  -d '{
    "chapterNumber": "1",
    "voiceType": "narrator-male",
    "language": "en",
    "speed": 1.0,
    "includeDialogue": true,
    "includeNarration": true
  }'
```

Response:
```json
{
  "requestId": "narration_1703123456789",
  "status": "processing",
  "manga": {
    "id": "manga-id",
    "title": "Manga Title",
    "chapter": "1",
    "chapterTitle": "Chapter 1"
  },
  "settings": {
    "voiceType": "narrator-male",
    "language": "en",
    "speed": 1.0,
    "includeDialogue": true,
    "includeNarration": true
  },
  "estimatedTime": "2-5 minutes",
  "message": "Narration generation started. You will be notified when ready."
}
```

Check narration status:
```bash
curl http://localhost:3001/api/manga/narration/:requestId
```

### Chat System

Start a chat session:
```bash
curl -X POST http://localhost:3001/api/manga/:id/chat \
  -H "Content-Type: application/json" \
  -d '{
    "chapterNumber": "1",
    "context": {
      "pageNumber": 1,
      "panelNumber": 2
    }
  }'
```

Send a message:
```bash
curl -X POST http://localhost:3001/api/manga/chat/:sessionId/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain what happens in this panel?",
    "panelNumber": 2,
    "pageNumber": 1
  }'
```

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mangaverse"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Optional Features

```env
# Text-to-Speech (for audio narration)
ELEVENLABS_API_KEY="your-elevenlabs-api-key-here"

# AI Chat (for enhanced discussions)
OPENAI_API_KEY="your-openai-api-key-here"

# Media Storage (for audio files)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Background Processing (for job queue)
REDIS_URL="redis://localhost:6379"
```

## 🎙️ Audio Features

The narration system supports:
- **Multiple Voices**: Narrator (male/female), Character voices
- **Emotional Range**: 8 different emotions with custom audio settings
- **Smart Processing**: Automatic character voice switching
- **High Quality**: 192kbps MP3 output with proper audio effects
- **Cloud Storage**: Automatic upload to Cloudinary with fallback

## 💬 AI Chat Features

The chat system provides:
- **Context-Aware Responses**: Understands current manga and chapter
- **Panel-Specific Help**: Detailed explanations for specific panels
- **Character Analysis**: Deep insights into character motivations
- **Story Discussion**: Plot analysis and theme exploration
- **Art Appreciation**: Artistic technique explanations

## 🔍 Troubleshooting

### Common Issues

1. **Narration endpoint slow**: 
   - Check if Redis is running (optional)
   - Verify ElevenLabs API key (optional)
   - Endpoint returns immediately, processing happens in background

2. **Audio not playing**:
   - Check if uploads directory exists
   - Verify file permissions
   - Check static file serving configuration

3. **Database connection errors**:
   - Verify DATABASE_URL in .env
   - Run `npm run db:generate` and `npm run db:push`

### Development Mode

For development without external services:
- Redis: Uses in-memory fallback
- ElevenLabs: Generates mock audio files
- Cloudinary: Saves files locally

## 📚 API Documentation

The API follows RESTful conventions with:
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format
- Proper HTTP status codes
- Error handling with descriptive messages

## 🛡️ Security Features

- JWT authentication
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention via Prisma

## 📈 Performance

- Efficient database queries with Prisma
- Background job processing
- Audio file caching
- CDN delivery via Cloudinary
- WebSocket real-time updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 
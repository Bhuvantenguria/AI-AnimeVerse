import axios from 'axios'
import { config } from '../config/env.js'

export class MangaService {
  constructor(fastify) {
    this.fastify = fastify
    this.mangadexBaseUrl = 'https://api.mangadex.org'
    this.jikanBaseUrl = 'https://api.jikan.moe/v4' // Fallback only
    
    // MangaDex API rate limiting
    this.requestQueue = []
    this.isProcessing = false
    this.lastRequestTime = 0
    this.minDelay = 200 // 5 requests per second max
  }

  // Rate limiting for MangaDex API
  async makeRequest(url, params = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, params, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return
    
    this.isProcessing = true
    
    while (this.requestQueue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      if (timeSinceLastRequest < this.minDelay) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest))
      }
      
      const { url, params, resolve, reject } = this.requestQueue.shift()
      
      try {
        const response = await axios.get(url, { params })
        this.lastRequestTime = Date.now()
        resolve(response)
      } catch (error) {
        reject(error)
      }
    }
    
    this.isProcessing = false
  }

  async searchManga(query, page = 1, limit = 20) {
    try {
      const params = {
        limit: Math.min(limit, 100), // MangaDex max limit
        offset: (page - 1) * limit,
        order: { followedCount: 'desc', rating: 'desc' },
        contentRating: ['safe', 'suggestive', 'erotica'], // Exclude pornographic
        includes: ['cover_art', 'author', 'artist'],
        hasAvailableChapters: true
      }

      // Add search query if provided
      if (query && query.trim()) {
        params.title = query.trim()
      }

      const response = await this.makeRequest(`${this.mangadexBaseUrl}/manga`, params)
      
      if (!response.data?.data) {
        throw new Error('Invalid response from MangaDex API')
      }

      const processedData = await this.processMangaDxResults(response.data.data)

      return {
        data: processedData,
        pagination: {
          current_page: page,
          has_next_page: response.data.offset + response.data.limit < response.data.total,
          items: {
            count: response.data.data.length,
            total: response.data.total,
            per_page: limit
          }
        }
      }
    } catch (error) {
      this.fastify.log.error('Failed to search manga:', error)
      // Fallback to Jikan API if MangaDex fails
      return this.searchMangaJikan(query, page, limit)
    }
  }

  async searchMangaJikan(query, page = 1, limit = 20) {
    try {
      const params = {
        page,
        limit,
        order_by: 'score',
        sort: 'desc'
      }

      if (query) {
        params.q = query
      }

      const endpoint = query ? `${this.jikanBaseUrl}/manga` : `${this.jikanBaseUrl}/top/manga`
      const response = await axios.get(endpoint, { params })

      const processedData = await this.processJikanResults(response.data.data)

      return {
        data: processedData,
        pagination: {
          current_page: response.data.pagination.current_page,
          has_next_page: response.data.pagination.has_next_page,
          items: {
            count: response.data.pagination.items.count,
            total: response.data.pagination.items.total,
            per_page: response.data.pagination.items.per_page
          }
        }
      }
    } catch (error) {
      this.fastify.log.error('Failed to search manga with Jikan:', error)
      throw new Error('Failed to search manga from all sources')
    }
  }

  async getMangaById(id) {
    try {
      let mangaData

      // Check if it's a MangaDex ID (UUID format)
      if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // MangaDex ID
        const response = await this.makeRequest(`${this.mangadexBaseUrl}/manga/${id}`, {
          includes: ['cover_art', 'author', 'artist']
        })
        mangaData = await this.processMangaDxResults([response.data.data])
        return mangaData[0]
      } else {
        // Jikan ID
        let malId = id
        if (id.startsWith('jikan-')) {
          malId = id.replace('jikan-', '')
        }

        const response = await axios.get(`${this.jikanBaseUrl}/manga/${malId}`)
        mangaData = await this.processJikanResults([response.data.data])
        return mangaData[0]
      }
    } catch (error) {
      this.fastify.log.error('Failed to get manga by ID:', error)
      throw new Error('Failed to get manga details')
    }
  }

  async getMangaChapters(mangaId, page = 1, limit = 50) {
    try {
      // Check if it's a MangaDex ID
      if (mangaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const response = await this.makeRequest(`${this.mangadexBaseUrl}/chapter`, {
          manga: mangaId,
          limit: Math.min(limit, 500),
          offset: (page - 1) * limit,
          order: { chapter: 'asc' },
          translatedLanguage: ['en']
        })

        return {
          data: response.data.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: response.data.total,
            hasNext: response.data.offset + response.data.limit < response.data.total,
          },
        }
      } else {
        // For Jikan/MAL IDs, create placeholder chapters
        const totalChapters = 100
        const chapters = Array.from({ length: Math.min(totalChapters, limit) }, (_, i) => ({
          id: `${mangaId}-chapter-${i + 1}`,
          attributes: {
            chapter: (i + 1).toString(),
            title: `Chapter ${i + 1}`,
            pages: Math.floor(Math.random() * 20) + 15,
            publishAt: new Date(Date.now() - (totalChapters - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        }))

        return {
          data: chapters,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: chapters.length,
            hasNext: chapters.length === parseInt(limit),
          },
        }
      }
    } catch (error) {
      this.fastify.log.error('Failed to get manga chapters:', error)
      throw error
    }
  }

  async getChapterContent(mangaId, chapterNumber) {
    try {
      // For MangaDex chapters, get actual content
      if (mangaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const chaptersResponse = await this.makeRequest(`${this.mangadexBaseUrl}/chapter`, {
          manga: mangaId,
          chapter: chapterNumber,
          limit: 1,
          translatedLanguage: ['en']
        })

        if (chaptersResponse.data.data.length === 0) {
          throw new Error('Chapter not found')
        }

        const chapterId = chaptersResponse.data.data[0].id
        
        // Get chapter pages from MangaDex@Home
        const pagesResponse = await axios.get(`${this.mangadexBaseUrl}/at-home/server/${chapterId}`)
        const baseUrl = pagesResponse.data.baseUrl
        const chapterHash = pagesResponse.data.chapter.hash
        const pages = pagesResponse.data.chapter.data

        const pageUrls = pages.map((page, index) => ({
          number: index + 1,
          url: `${baseUrl}/data/${chapterHash}/${page}`,
          filename: page
        }))

        return {
          chapter: chapterNumber,
          pages: pageUrls,
          total: pages.length
        }
      } else {
        // For non-MangaDx IDs, create placeholder pages
        const pageCount = Math.floor(Math.random() * 20) + 15
        const pages = Array.from({ length: pageCount }, (_, i) => ({
          number: i + 1,
          url: `https://via.placeholder.com/800x1200/333/fff?text=Page+${i + 1}`,
          filename: `page_${i + 1}.jpg`
        }))

        return {
          chapter: chapterNumber,
          pages,
          total: pageCount
        }
      }
    } catch (error) {
      this.fastify.log.error('Failed to get chapter content:', error)
      throw error
    }
  }

  async processMangaDxResults(mangaList) {
    return mangaList.map(manga => {
      const attributes = manga.attributes
      const relationships = manga.relationships || []
      
      // Get cover art
      const coverArt = relationships.find(rel => rel.type === 'cover_art')
      const coverUrl = coverArt ? 
        `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}` : 
        '/placeholder.jpg'

      // Get authors
      const authors = relationships
        .filter(rel => rel.type === 'author')
        .map(rel => ({
          id: rel.id,
          name: rel.attributes?.name || 'Unknown Author'
        }))

      // Get artists
      const artists = relationships
        .filter(rel => rel.type === 'artist')
        .map(rel => ({
          id: rel.id,
          name: rel.attributes?.name || 'Unknown Artist'
        }))

      // Get tags/genres
      const genres = attributes.tags?.map(tag => ({
        id: tag.id,
        name: tag.attributes.name.en || Object.values(tag.attributes.name)[0] || 'Unknown'
      })) || []

      return {
        malId: manga.id, // Use MangaDx ID as malId for consistency
        title: attributes.title?.en || 
               Object.values(attributes.title)[0] || 
               'Unknown Title',
        titleEnglish: attributes.title?.en,
        titleJapanese: attributes.title?.ja,
        coverImage: coverUrl,
        rating: attributes.rating || null,
        chapters: attributes.lastChapter ? parseInt(attributes.lastChapter) : null,
        volumes: attributes.lastVolume ? parseInt(attributes.lastVolume) : null,
        status: attributes.status || 'unknown',
        year: attributes.year || null,
        genres: genres,
        synopsis: attributes.description?.en || 
                 Object.values(attributes.description || {})[0] || 
                 'No description available',
        authors: authors.length > 0 ? authors : [{ id: 'unknown', name: 'Unknown Author' }],
        source: 'mangadx',
        isInReadingList: false,
        readingStatus: undefined
      }
    })
  }

  async processJikanResults(mangaList) {
    return mangaList.map(manga => ({
      malId: `jikan-${manga.mal_id}`,
      title: manga.title,
      titleEnglish: manga.title_english,
      titleJapanese: manga.title_japanese,
      coverImage: manga.images?.jpg?.large_image_url || '/placeholder.jpg',
      rating: manga.score,
      chapters: manga.chapters,
      volumes: manga.volumes,
      status: manga.status?.toLowerCase() || 'unknown',
      year: manga.year,
      genres: manga.genres?.map(genre => ({
        id: genre.mal_id,
        name: genre.name
      })) || [],
      synopsis: manga.synopsis || 'No description available',
      authors: manga.authors?.map(author => ({
        id: author.mal_id,
        name: author.name
      })) || [{ id: 'unknown', name: 'Unknown Author' }],
      source: 'jikan',
      isInReadingList: false,
      readingStatus: undefined
    }))
  }

  async uploadMangaCover(mangaData) {
    if (!mangaData.coverImage || mangaData.coverImage === '/placeholder.jpg') {
      return null
    }

    try {
      // Download the image
      const imageResponse = await axios.get(mangaData.coverImage, {
        responseType: 'arraybuffer'
      })

      // Upload to Cloudinary
      const uploadResult = await this.fastify.cloudinary.upload(
        Buffer.from(imageResponse.data),
        {
          folder: 'manga/covers',
          public_id: `manga_${mangaData.malId}`,
          overwrite: true,
          transformation: [
            { width: 800, height: 1200, crop: 'fill' },
            { quality: 'auto' }
          ]
        }
      )

      return uploadResult.secure_url
    } catch (error) {
      this.fastify.log.error('Failed to upload manga cover:', error)
      return mangaData.coverImage // Fallback to original URL
    }
  }
}

export default async function createMangaService(fastify) {
  return new MangaService(fastify)
} 
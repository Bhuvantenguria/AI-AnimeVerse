import axios from 'axios'
import { config } from '../config/env.js'

export class MangaService {
  constructor(fastify) {
    this.fastify = fastify
    this.jikanBaseUrl = 'https://api.jikan.moe/v4'
    this.mangadexBaseUrl = 'https://api.mangadex.org'
    this.kitsuBaseUrl = 'https://kitsu.io/api/edge'
  }

  async searchManga(query, page = 1, limit = 20) {
    try {
      let response
      const params = {
        page,
        limit,
        order_by: 'score',
        sort: 'desc'
      }

      if (query) {
        // Search using Jikan API
        response = await axios.get(`${this.jikanBaseUrl}/manga`, {
          params: {
            ...params,
            q: query
          }
        })
      } else {
        // Get top manga if no query
        response = await axios.get(`${this.jikanBaseUrl}/top/manga`, {
          params: {
            ...params,
            type: 'manga'
          }
        })
      }

      if (!response.data?.data) {
        throw new Error('Invalid response from Jikan API')
      }

      const processedData = await this.processMangaResults(response.data.data)

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
      this.fastify.log.error('Failed to search manga:', error)
      throw new Error(error.message || 'Failed to search manga')
    }
  }

  async getTopManga(page = 1, limit = 20) {
    try {
      const jikanResponse = await axios.get(`${this.jikanBaseUrl}/top/manga`, {
        params: { page, limit }
      })

      return this.processMangaResults(jikanResponse.data.data)
    } catch (error) {
      this.fastify.log.error('Failed to get top manga:', error)
      throw error
    }
  }

  async getMangaById(id) {
    try {
      let malId = id
      if (id.startsWith('jikan-')) {
        malId = id.replace('jikan-', '')
      }

      const response = await axios.get(`${this.jikanBaseUrl}/manga/${malId}`)
      const mangaData = response.data.data

      // Get additional data from MangaDex if available
      try {
        const mangadexSearch = await axios.get(`${this.mangadexBaseUrl}/manga`, {
          params: { title: mangaData.title }
        })
        if (mangadexSearch.data.data.length > 0) {
          mangaData.mangadexId = mangadexSearch.data.data[0].id
          const chaptersResponse = await axios.get(`${this.mangadexBaseUrl}/chapter`, {
            params: { manga: mangaData.mangadexId, limit: 1 }
          })
          mangaData.hasChapters = chaptersResponse.data.data.length > 0
        }
      } catch (error) {
        this.fastify.log.warn('Failed to get MangaDex data:', error)
      }

      const processedData = await this.processMangaResults([mangaData])
      return processedData[0]
    } catch (error) {
      this.fastify.log.error('Failed to get manga by ID:', error)
      throw new Error('Failed to get manga details')
    }
  }

  async uploadMangaCover(mangaData) {
    if (!mangaData.images?.jpg?.large_image_url) {
      return null
    }

    try {
      // Download the image
      const imageResponse = await axios.get(mangaData.images.jpg.large_image_url, {
        responseType: 'arraybuffer'
      })

      // Upload to Cloudinary
      const uploadResult = await this.fastify.cloudinary.upload(
        Buffer.from(imageResponse.data),
        {
          folder: 'manga/covers',
          public_id: `manga_${mangaData.mal_id}`,
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
      return mangaData.images.jpg.large_image_url // Fallback to original URL
    }
  }

  async getMangaChapters(mangaId, page = 1, limit = 50) {
    try {
      const manga = await this.getMangaById(mangaId)
      if (!manga.mangadexId) {
        // Create placeholder chapters if no MangaDex data
        const totalChapters = manga.chapters || 100
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
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
            total: chapters.length,
            hasNext: chapters.length === Number.parseInt(limit),
          },
        }
      }

      // Get chapters from MangaDex
      const response = await axios.get(`${this.mangadexBaseUrl}/chapter`, {
        params: {
          manga: manga.mangadexId,
          limit,
          offset: (page - 1) * limit,
          order: { chapter: 'asc' }
        }
      })

      return {
        data: response.data.data,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: response.data.total,
          hasNext: response.data.offset + response.data.limit < response.data.total,
        },
      }
    } catch (error) {
      this.fastify.log.error('Failed to get manga chapters:', error)
      throw error
    }
  }

  async getChapterContent(mangaId, chapterNumber) {
    try {
      const manga = await this.getMangaById(mangaId)
      if (!manga.mangadexId) {
        // Create placeholder pages if no MangaDex data
        const pageCount = Math.floor(Math.random() * 20) + 15
        const pages = Array.from({ length: pageCount }, (_, i) => ({
          page: i + 1,
          url: `/placeholder.svg?height=800&width=600&text=Page ${i + 1}`,
        }))

        return {
          mangaId,
          chapterNumber,
          pages,
          totalPages: pages.length,
        }
      }

      // Get chapter pages from MangaDex
      const chaptersResponse = await axios.get(`${this.mangadexBaseUrl}/chapter`, {
        params: {
          manga: manga.mangadexId,
          chapter: chapterNumber
        }
      })

      if (chaptersResponse.data.data.length === 0) {
        throw new Error('Chapter not found')
      }

      const chapterId = chaptersResponse.data.data[0].id
      const pagesResponse = await axios.get(`${this.mangadexBaseUrl}/at-home/server/${chapterId}`)

      const pages = pagesResponse.data.chapter.data.map((filename, index) => ({
        page: index + 1,
        url: `${pagesResponse.data.baseUrl}/data/${pagesResponse.data.chapter.hash}/${filename}`,
      }))

      return {
        mangaId,
        chapterNumber,
        pages,
        totalPages: pages.length,
      }
    } catch (error) {
      this.fastify.log.error('Failed to get chapter content:', error)
      throw error
    }
  }

  async processMangaResults(mangaList) {
    try {
      return Promise.all(mangaList.map(async (manga) => {
        // Upload cover image to Cloudinary
        let coverUrl = manga.images?.jpg?.large_image_url
        if (coverUrl) {
          try {
            const imageResponse = await axios.get(coverUrl, {
              responseType: 'arraybuffer'
            })

            const uploadResult = await this.fastify.cloudinary.upload(
              Buffer.from(imageResponse.data),
              {
                folder: 'manga/covers',
                public_id: `manga_${manga.mal_id}`,
                overwrite: true,
                transformation: [
                  { width: 800, height: 1200, crop: 'fill' },
                  { quality: 'auto' }
                ]
              }
            )
            coverUrl = uploadResult.secure_url
          } catch (error) {
            this.fastify.log.error('Failed to upload manga cover:', error)
            // Keep the original URL if upload fails
          }
        }

        return {
          malId: manga.mal_id?.toString(),
          title: manga.title,
          titleEnglish: manga.title_english,
          titleJapanese: manga.title_japanese,
          coverImage: coverUrl || '/placeholder.svg',
          rating: manga.score,
          chapters: manga.chapters,
          volumes: manga.volumes,
          status: manga.status?.toLowerCase(),
          year: manga.published?.prop?.from?.year || null,
          genres: manga.genres?.map(genre => ({
            id: genre.mal_id,
            name: genre.name
          })) || [],
          synopsis: manga.synopsis,
          authors: manga.authors?.map(author => ({
            id: author.mal_id,
            name: author.name
          })) || [],
          isInReadingList: false, // This will be updated by the frontend
          readingStatus: null // This will be updated by the frontend
        }
      }))
    } catch (error) {
      this.fastify.log.error('Failed to process manga results:', error)
      throw new Error('Failed to process manga data')
    }
  }
}

export default async function createMangaService(fastify) {
  return new MangaService(fastify)
} 
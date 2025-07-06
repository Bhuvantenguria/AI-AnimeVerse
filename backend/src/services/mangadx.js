import axios from 'axios'

const MANGADX_API_BASE = 'https://api.mangadx.org'

// 1️⃣ Fetch chapters, filter self-hosted only
export async function getSelfHostedChapters(mangaId) {
  try {
    const res = await axios.get(`${MANGADX_API_BASE}/chapter`, {
      params: {
        manga: mangaId,
        translatedLanguage: ['en'],
        limit: 100,
        order: { chapter: 'asc' }
      }
    })

    const all = res.data.data
    // Filter only self-hosted chapters (no external URLs)
    const selfHosted = all.filter(ch => ch.attributes.externalUrl === null)

    return selfHosted.map(ch => ({
      id: ch.id,
      chapter: ch.attributes.chapter,
      title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
      volume: ch.attributes.volume,
      publishAt: ch.attributes.publishAt,
      pages: ch.attributes.pages || 0,
      language: ch.attributes.translatedLanguage
    }))
  } catch (error) {
    console.error('❌ Error fetching self-hosted chapters:', error)
    throw new Error('Failed to fetch chapters')
  }
}

// 2️⃣ Get CDN panel image URLs from MangaDx at-home server
export async function getChapterPages(chapterId) {
  try {
    const res = await axios.get(`${MANGADX_API_BASE}/at-home/server/${chapterId}`)
    
    const { baseUrl, chapter } = res.data

    // Generate full CDN URLs for each page
    const pages = chapter.data.map((filename, index) => ({
      page: index + 1,
      url: `${baseUrl}/data/${chapter.hash}/${filename}`,
      filename: filename
    }))

    return {
      chapterId,
      totalPages: pages.length,
      pages,
      baseUrl,
      hash: chapter.hash
    }
  } catch (error) {
    console.error('❌ Error fetching chapter pages:', error)
    throw new Error('Failed to fetch chapter pages')
  }
}

// 3️⃣ Get manga details with self-hosted chapter count
export async function getMangaDetails(mangaId) {
  try {
    const res = await axios.get(`${MANGADX_API_BASE}/manga/${mangaId}`, {
      params: {
        includes: ['cover_art', 'author', 'artist']
      }
    })

    const manga = res.data.data
    const attributes = manga.attributes

    // Get cover art URL
    const coverArt = manga.relationships?.find(rel => rel.type === 'cover_art')
    const coverUrl = coverArt ? 
      `https://uploads.mangadx.org/covers/${manga.id}/${coverArt.attributes?.fileName}` : 
      null

    // Get authors
    const authors = manga.relationships?.filter(rel => rel.type === 'author')
      .map(rel => rel.attributes?.name || 'Unknown Author') || []

    // Get self-hosted chapters count
    const chapters = await getSelfHostedChapters(mangaId)

    return {
      id: manga.id,
      title: attributes.title?.en || Object.values(attributes.title || {})[0] || 'Unknown Title',
      titleEnglish: attributes.title?.en,
      titleJapanese: attributes.title?.ja,
      description: attributes.description?.en || 
                   Object.values(attributes.description || {})[0] || 
                   'No description available',
      coverImage: coverUrl,
      status: attributes.status,
      year: attributes.year,
      rating: attributes.rating,
      lastChapter: attributes.lastChapter,
      lastVolume: attributes.lastVolume,
      authors: authors,
      tags: attributes.tags?.map(tag => tag.attributes?.name?.en).filter(Boolean) || [],
      totalChapters: chapters.length,
      selfHostedOnly: true
    }
  } catch (error) {
    console.error('❌ Error fetching manga details:', error)
    throw new Error('Failed to fetch manga details')
  }
}

// 4️⃣ Search manga with self-hosted filter
export async function searchManga(query, options = {}) {
  try {
    const { page = 1, limit = 20, status, year } = options
    
    const params = {
      title: query,
      limit: Math.min(limit, 100),
      offset: (page - 1) * limit,
      order: { followedCount: 'desc', rating: 'desc' },
      contentRating: ['safe', 'suggestive'],
      includes: ['cover_art', 'author'],
      hasAvailableChapters: true
    }

    if (status && status !== 'any') {
      params.status = [status]
    }
    
    if (year && year !== 'any') {
      params.year = year
    }

    const res = await axios.get(`${MANGADX_API_BASE}/manga`, { params })
    
    const processedManga = await Promise.all(
      res.data.data.map(async (manga) => {
        // Check if manga has self-hosted chapters
        const chapters = await getSelfHostedChapters(manga.id)
        
        if (chapters.length === 0) {
          return null // Skip manga without self-hosted chapters
        }

        const attributes = manga.attributes
        const coverArt = manga.relationships?.find(rel => rel.type === 'cover_art')
        const coverUrl = coverArt ? 
          `https://uploads.mangadx.org/covers/${manga.id}/${coverArt.attributes?.fileName}` : 
          null

        return {
          id: manga.id,
          title: attributes.title?.en || Object.values(attributes.title || {})[0] || 'Unknown Title',
          coverImage: coverUrl,
          status: attributes.status,
          year: attributes.year,
          rating: attributes.rating,
          chaptersAvailable: chapters.length,
          selfHostedOnly: true
        }
      })
    )

    // Filter out null entries (manga without self-hosted chapters)
    const filteredManga = processedManga.filter(Boolean)

    return {
      data: filteredManga,
      pagination: {
        current_page: page,
        has_next_page: res.data.offset + res.data.limit < res.data.total,
        total: filteredManga.length,
        per_page: limit
      }
    }
  } catch (error) {
    console.error('❌ Error searching manga:', error)
    throw new Error('Failed to search manga')
  }
}

// 5️⃣ Get trending/popular manga (self-hosted only)
export async function getTrendingManga(options = {}) {
  try {
    const { page = 1, limit = 20 } = options
    
    const res = await axios.get(`${MANGADX_API_BASE}/manga`, {
      params: {
        limit: Math.min(limit, 100),
        offset: (page - 1) * limit,
        order: { followedCount: 'desc', rating: 'desc' },
        contentRating: ['safe', 'suggestive'],
        includes: ['cover_art', 'author'],
        hasAvailableChapters: true
      }
    })

    const processedManga = await Promise.all(
      res.data.data.map(async (manga) => {
        // Check if manga has self-hosted chapters
        const chapters = await getSelfHostedChapters(manga.id)
        
        if (chapters.length === 0) {
          return null // Skip manga without self-hosted chapters
        }

        const attributes = manga.attributes
        const coverArt = manga.relationships?.find(rel => rel.type === 'cover_art')
        const coverUrl = coverArt ? 
          `https://uploads.mangadx.org/covers/${manga.id}/${coverArt.attributes?.fileName}` : 
          null

        return {
          id: manga.id,
          title: attributes.title?.en || Object.values(attributes.title || {})[0] || 'Unknown Title',
          coverImage: coverUrl,
          status: attributes.status,
          year: attributes.year,
          rating: attributes.rating,
          chaptersAvailable: chapters.length,
          selfHostedOnly: true
        }
      })
    )

    // Filter out null entries
    const filteredManga = processedManga.filter(Boolean)

    return {
      data: filteredManga,
      pagination: {
        current_page: page,
        has_next_page: res.data.offset + res.data.limit < res.data.total,
        total: filteredManga.length,
        per_page: limit
      }
    }
  } catch (error) {
    console.error('❌ Error fetching trending manga:', error)
    throw new Error('Failed to fetch trending manga')
  }
} 
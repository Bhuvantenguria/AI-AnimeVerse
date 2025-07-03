import axios from "axios"
import { HiAnime } from "aniwatch"

const hianime = new HiAnime.Scraper()

export class StreamingService {
  constructor(fastify) {
    this.fastify = fastify
    this.consumetBaseUrl = "https://api.consumet.org"
    this.anifyBaseUrl = "https://api.anify.tv"
    this.providers = ['gogoanime', 'zoro', 'animepahe']
  }

  // Search anime using Consumet
  async searchAnime(query) {
    try {
      this.fastify.log.info(`Searching anime: ${query}`)
      const response = await axios.get(`${this.consumetBaseUrl}/anime/gogoanime/${encodeURIComponent(query)}`, {
        timeout: 10000,
        validateStatus: status => status < 500
      })
      
      if (response.data?.results?.length > 0) {
        this.fastify.log.info(`Found ${response.data.results.length} results for "${query}"`)
        return response.data.results
      }
      
      throw new Error("No results found")
    } catch (error) {
      this.fastify.log.error(`Search failed for "${query}":`, error.message)
      throw error
    }
  }

  // Get anime info and episodes
  async getAnimeInfo(animeId) {
    try {
      this.fastify.log.info(`Getting anime info for: ${animeId}`)
      const response = await axios.get(`${this.consumetBaseUrl}/anime/gogoanime/info/${animeId}`, {
        timeout: 10000,
        validateStatus: status => status < 500
      })
      
      if (response.data?.episodes?.length > 0) {
        this.fastify.log.info(`Found ${response.data.episodes.length} episodes for ${animeId}`)
        return response.data
      }
      
      throw new Error("No episodes found")
    } catch (error) {
      this.fastify.log.error(`Failed to get anime info for ${animeId}:`, error.message)
      throw error
    }
  }

  // Get streaming sources with multiple fallbacks
  async getStreamingSources(episodeId, animeTitle = null) {
    this.fastify.log.info(`Getting streaming sources for episode: ${episodeId}`)
    
    // Method 1: Try Consumet first
    try {
      const consumetResult = await this.getConsumetStreaming(episodeId)
      if (consumetResult && consumetResult.sources && consumetResult.sources.length > 0) {
        this.fastify.log.info(`✅ Consumet success: ${consumetResult.sources.length} sources`)
        return {
          type: "stream",
          sources: consumetResult.sources,
          headers: consumetResult.headers,
          subtitles: consumetResult.subtitles || [],
          provider: "consumet"
        }
      }
    } catch (error) {
      this.fastify.log.warn("Consumet failed:", error.message)
    }

    // Method 2: Try Anify API
    try {
      const anifyResult = await this.getAnifyStreaming(episodeId)
      if (anifyResult && anifyResult.sources && anifyResult.sources.length > 0) {
        this.fastify.log.info(`✅ Anify success: ${anifyResult.sources.length} sources`)
        return {
          type: "stream",
          sources: anifyResult.sources,
          headers: anifyResult.headers,
          subtitles: anifyResult.subtitles || [],
          provider: "anify"
        }
      }
    } catch (error) {
      this.fastify.log.warn("Anify failed:", error.message)
    }

    // Method 3: Try Puppeteer scraping (if available)
    if (animeTitle) {
      try {
        const puppeteerResult = await this.getPuppeteerStreaming(animeTitle, episodeId)
        if (puppeteerResult) {
          this.fastify.log.info("✅ Puppeteer success: embed link found")
          return {
            type: "embed",
            url: puppeteerResult,
            provider: "puppeteer"
          }
        }
      } catch (error) {
        this.fastify.log.warn("Puppeteer failed:", error.message)
      }
    }

    // Method 4: Try HiAnime
    try {
      const hianimeResult = await this.getHiAnimeSources(episodeId)
      if (hianimeResult && hianimeResult.sources && hianimeResult.sources.length > 0) {
        this.fastify.log.info("✅ HiAnime success: sources found")
        return hianimeResult
      }
    } catch (error) {
      this.fastify.log.warn("HiAnime failed:", error.message)
    }

    // Method 5: Return fallback links
    const fallbackLinks = this.getFallbackLinks(episodeId, animeTitle)
    this.fastify.log.info("❌ All methods failed, returning fallback links")
    return {
      type: "fallback",
      links: fallbackLinks,
      provider: "fallback"
    }
  }

  // Consumet streaming
  async getConsumetStreaming(episodeId) {
    for (const provider of this.providers) {
      try {
        const response = await axios.get(`${this.consumetBaseUrl}/anime/${provider}/watch/${episodeId}`, {
          timeout: 15000,
          validateStatus: status => status < 500
        })
        
        if (response.data?.sources?.length > 0) {
          const sources = response.data.sources
            .filter(source => source.url && source.quality)
            .map(source => ({
              url: source.url,
              quality: source.quality,
              isM3U8: source.url.includes('.m3u8'),
              size: source.size || null
            }))
            .sort((a, b) => {
              const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
              const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
              return qualityB - qualityA
            })

          if (sources.length > 0) {
            return {
              sources,
              headers: response.data.headers || {},
              subtitles: response.data.subtitles || []
            }
          }
        }
      } catch (error) {
        this.fastify.log.warn(`Consumet provider ${provider} failed:`, error.message)
        continue
      }
    }
    throw new Error("All Consumet providers failed")
  }

  // Anify streaming
  async getAnifyStreaming(episodeId) {
    try {
      const response = await axios.get(`${this.anifyBaseUrl}/watch/${episodeId}?provider=gogoanime`, {
        timeout: 15000,
        validateStatus: status => status < 500
      })
      
      if (response.data?.sources?.length > 0) {
        const sources = response.data.sources
          .filter(source => source.url && source.quality)
          .map(source => ({
            url: source.url,
            quality: source.quality,
            isM3U8: source.url.includes('.m3u8'),
            size: source.size || null
          }))
          .sort((a, b) => {
            const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
            const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
            return qualityB - qualityA
          })

        if (sources.length > 0) {
          return {
            sources,
            headers: response.data.headers || {},
            subtitles: response.data.subtitles || []
          }
        }
      }
      throw new Error("No valid sources from Anify")
    } catch (error) {
      this.fastify.log.warn("Anify streaming failed:", error.message)
      throw error
    }
  }

  // Puppeteer scraping (placeholder - requires puppeteer package)
  async getPuppeteerStreaming(animeTitle, episodeId) {
    try {
      // This is a placeholder - you'll need to install puppeteer
      // npm install puppeteer
      this.fastify.log.info(`Puppeteer scraping for: ${animeTitle} - ${episodeId}`)
      
      // Example scraping logic (you'll need to implement this)
      // const puppeteer = require('puppeteer');
      // const browser = await puppeteer.launch({ headless: true });
      // const page = await browser.newPage();
      // await page.goto(`https://gogoanime.fi/${animeTitle}-episode-${episodeNumber}`);
      // const embedLink = await page.evaluate(() => {
      //   return document.querySelector('iframe')?.src || null;
      // });
      // await browser.close();
      // return embedLink;
      
      return null; // Placeholder
    } catch (error) {
      this.fastify.log.warn("Puppeteer scraping failed:", error.message)
      return null
    }
  }

  // HiAnime streaming
  async getHiAnimeSources(episodeId, category = "sub") {
    try {
      const data = await hianime.getEpisodeSources(decodeURIComponent(episodeId), undefined, category)
      if (data && data.sources && data.sources.length > 0) {
        return {
          type: "stream",
          sources: data.sources.map(src => ({
            url: src.url,
            quality: src.quality,
            isM3U8: src.url.includes('.m3u8'),
            size: src.size || null
          })),
          provider: "hianime"
        }
      }
      return null
    } catch (err) {
      console.warn("HiAnime fallback failed:", err.message)
      return null
    }
  }

  // Fallback links
  getFallbackLinks(episodeId, animeTitle) {
    const links = []
    
    if (animeTitle) {
      // Gogoanime fallback
      links.push({
        name: "Gogoanime",
        url: `https://gogoanime.fi/${animeTitle.toLowerCase().replace(/\s+/g, '-')}-episode-1`,
        type: "site"
      })
      
      // Zoro fallback
      links.push({
        name: "Zoro",
        url: `https://zoro.to/watch/${animeTitle.toLowerCase().replace(/\s+/g, '-')}-episode-1`,
        type: "site"
      })
      
      // 9anime fallback
      links.push({
        name: "9anime",
        url: `https://9anime.to/watch/${animeTitle.toLowerCase().replace(/\s+/g, '-')}.episode-1`,
        type: "site"
      })
    }
    
    return links
  }
} 
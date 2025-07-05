export async function processSyncJob(data, fastify) {
  const { type, externalId, source } = data

  try {
    if (type === "anime") {
      await syncAnimeData(externalId, source, fastify)
    } else if (type === "manga") {
      await syncMangaData(externalId, source, fastify)
    }

    return { success: true }
  } catch (error) {
    fastify.log.error("Sync job error:", error)
    throw error
  }
}

async function syncAnimeData(externalId, source, fastify) {
  try {
    let animeData
    let characters = []

    // Fetch data from appropriate API
    switch (source) {
      case "jikan":
        const jikanData = await fastify.apiServices.jikan.getAnimeById(externalId)
        animeData = transformJikanAnime(jikanData.anime)
        characters = transformJikanCharacters(jikanData.characters)
        break

      case "kitsu":
        const kitsuData = await fastify.apiServices.kitsu.getAnimeById(externalId)
        animeData = transformKitsuAnime(kitsuData.data)
        break

      case "anilist":
        const anilistData = await fastify.apiServices.aniList.getAnimeById(externalId)
        animeData = transformAniListAnime(anilistData.data.Media)
        characters = transformAniListCharacters(anilistData.data.Media.characters?.nodes || [])
        break

      default:
        throw new Error(`Unknown source: ${source}`)
    }

    // Check if anime already exists
    const existingAnime = await fastify.prisma.anime.findFirst({
      where: {
        OR: [{ malId: animeData.malId }, { title: animeData.title }],
      },
    })

    let anime
    if (existingAnime) {
      // Update existing anime
      anime = await fastify.prisma.anime.update({
        where: { id: existingAnime.id },
        data: animeData,
      })
    } else {
      // Create new anime
      anime = await fastify.prisma.anime.create({
        data: animeData,
      })
    }

    // Sync characters
    for (const characterData of characters) {
      await fastify.prisma.character.upsert({
        where: {
          animeId_name: {
            animeId: anime.id,
            name: characterData.name,
          },
        },
        update: characterData,
        create: {
          ...characterData,
          animeId: anime.id,
        },
      })
    }

    // Create knowledge base entries for AI chat
    await createKnowledgeBaseEntry(anime, characters, "anime", fastify)

    fastify.log.info(`Synced anime: ${anime.title}`)
    return anime
  } catch (error) {
    fastify.log.error("Error syncing anime data:", error)
    throw error
  }
}

async function syncMangaData(externalId, source, fastify) {
  try {
    let mangaData
    let characters = []

    // Fetch data from appropriate API
    switch (source) {
      case "jikan":
        const jikanData = await fastify.apiServices.jikan.getMangaById(externalId)
        mangaData = transformJikanManga(jikanData.manga)
        characters = transformJikanCharacters(jikanData.characters)
        break

      case "mangadex":
        const mangadexData = await fastify.apiServices.mangaDex.getMangaById(externalId)
        mangaData = transformMangaDexManga(mangadexData.data)
        break

      default:
        throw new Error(`Unknown source: ${source}`)
    }

    // Check if manga already exists
    const existingManga = await fastify.prisma.manga.findFirst({
      where: {
        OR: [{ malId: mangaData.malId }, { title: mangaData.title }],
      },
    })

    let manga
    if (existingManga) {
      // Update existing manga
      manga = await fastify.prisma.manga.update({
        where: { id: existingManga.id },
        data: mangaData,
      })
    } else {
      // Create new manga
      manga = await fastify.prisma.manga.create({
        data: mangaData,
      })
    }

    // Sync characters
    for (const characterData of characters) {
      await fastify.prisma.character.upsert({
        where: {
          mangaId_name: {
            mangaId: manga.id,
            name: characterData.name,
          },
        },
        update: characterData,
        create: {
          ...characterData,
          mangaId: manga.id,
        },
      })
    }

    // Sync chapters if from MangaDex
    if (source === "mangadex") {
      const chaptersData = await fastify.apiServices.mangaDex.getMangaChapters(externalId)
      for (const chapterData of chaptersData.data) {
        const chapter = transformMangaDexChapter(chapterData)
        await fastify.prisma.chapter.upsert({
          where: {
            mangaId_number: {
              mangaId: manga.id,
              number: chapter.number,
            },
          },
          update: chapter,
          create: {
            ...chapter,
            mangaId: manga.id,
          },
        })
      }
    }

    // Create knowledge base entries for AI chat
    await createKnowledgeBaseEntry(manga, characters, "manga", fastify)

    fastify.log.info(`Synced manga: ${manga.title}`)
    return manga
  } catch (error) {
    fastify.log.error("Error syncing manga data:", error)
    throw error
  }
}

// Transform functions for different API formats
function transformJikanAnime(anime) {
  return {
    title: anime.title || anime.title_english || "Unknown Title",
    titleJp: anime.title_japanese,
    synopsis: anime.synopsis || "",
    episodes: anime.episodes || 0,
    status: anime.status?.toLowerCase() || "unknown",
    rating: anime.score || null,
    year: anime.year || new Date(anime.aired?.from).getFullYear() || null,
    season: anime.season,
    genres: anime.genres?.map((g) => g.name) || [],
    studios: anime.studios?.map((s) => s.name) || [],
    coverImage: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
    bannerImage: anime.images?.jpg?.large_image_url,
    trailer: anime.trailer?.youtube_id ? `https://www.youtube.com/watch?v=${anime.trailer.youtube_id}` : null,
    malId: anime.mal_id,
  }
}

function transformJikanManga(manga) {
  return {
    title: manga.title || manga.title_english || "Unknown Title",
    titleJp: manga.title_japanese,
    synopsis: manga.synopsis || "",
    chapters: manga.chapters || 0,
    volumes: manga.volumes || null,
    status: manga.status?.toLowerCase() || "unknown",
    rating: manga.score || null,
    year: manga.year || new Date(manga.published?.from).getFullYear() || null,
    genres: manga.genres?.map((g) => g.name) || [],
    authors: manga.authors?.map((a) => a.name) || [],
    coverImage: manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url,
    bannerImage: manga.images?.jpg?.large_image_url,
    malId: manga.mal_id,
  }
}

function transformJikanCharacters(characters) {
  return characters.slice(0, 10).map((char) => ({
    name: char.character?.name || "Unknown",
    nameJp: char.character?.name_kanji,
    description: char.character?.about?.slice(0, 500) || "",
    avatar: char.character?.images?.jpg?.image_url,
    personality: [],
    voiceActor: char.voice_actors?.[0]?.person?.name,
  }))
}

function transformKitsuAnime(anime) {
  const attributes = anime.attributes
  return {
    title: attributes.canonicalTitle || attributes.titles?.en || "Unknown Title",
    titleJp: attributes.titles?.ja_jp,
    synopsis: attributes.synopsis || "",
    episodes: attributes.episodeCount || 0,
    status: attributes.status?.toLowerCase() || "unknown",
    rating: attributes.averageRating ? Number.parseFloat(attributes.averageRating) / 10 : null,
    year: attributes.startDate ? new Date(attributes.startDate).getFullYear() : null,
    season: null,
    genres: [],
    studios: [],
    coverImage: attributes.posterImage?.large || attributes.posterImage?.medium,
    bannerImage: attributes.coverImage?.large || attributes.posterImage?.large,
    trailer: null,
    malId: null,
  }
}

function transformAniListAnime(anime) {
  return {
    title: anime.title?.english || anime.title?.romaji || "Unknown Title",
    titleJp: anime.title?.native,
    synopsis: anime.description?.replace(/<[^>]*>/g, "") || "",
    episodes: anime.episodes || 0,
    status: anime.status?.toLowerCase() || "unknown",
    rating: anime.averageScore ? anime.averageScore / 10 : null,
    year: anime.seasonYear,
    season: anime.season?.toLowerCase(),
    genres: anime.genres || [],
    studios: anime.studios?.nodes?.map((s) => s.name) || [],
    coverImage: anime.coverImage?.large || anime.coverImage?.medium,
    bannerImage: anime.bannerImage,
    trailer: anime.trailer?.id ? `https://www.youtube.com/watch?v=${anime.trailer.id}` : null,
    malId: null,
  }
}

function transformAniListCharacters(characters) {
  return characters.slice(0, 10).map((char) => ({
    name: char.name?.full || "Unknown",
    nameJp: char.name?.native,
    description: char.description?.replace(/<[^>]*>/g, "").slice(0, 500) || "",
    avatar: char.image?.large || char.image?.medium,
    personality: [],
    voiceActor: null,
  }))
}

function transformMangaDexManga(manga) {
  const attributes = manga.attributes
  return {
    title: attributes.title?.en || Object.values(attributes.title)[0] || "Unknown Title",
    titleJp: attributes.title?.ja,
    synopsis: attributes.description?.en || Object.values(attributes.description)[0] || "",
    chapters: 0, // Will be updated when chapters are synced
    volumes: 0,
    status: attributes.status?.toLowerCase() || "unknown",
    rating: null,
    year: attributes.year || null,
    genres:
      attributes.tags?.filter((tag) => tag.attributes.group === "genre").map((tag) => tag.attributes.name.en) || [],
    authors: [],
    coverImage: null, // Will be set from cover_art relationship
    bannerImage: null,
    malId: null,
  }
}

function transformMangaDexChapter(chapter) {
  const attributes = chapter.attributes
  return {
    number: Number.parseFloat(attributes.chapter) || 0,
    title: attributes.title,
    pages: attributes.pages || 0,
    releaseDate: attributes.publishAt ? new Date(attributes.publishAt) : null,
  }
}

async function createKnowledgeBaseEntry(content, characters, type, fastify) {
  try {
    // Create knowledge base entry for the main content
    const knowledgeText = `
      Title: ${content.title}
      ${content.titleJp ? `Japanese Title: ${content.titleJp}` : ""}
      Synopsis: ${content.synopsis}
      Genres: ${content.genres?.join(", ") || ""}
      ${type === "anime" ? `Episodes: ${content.episodes}` : `Chapters: ${content.chapters}`}
      Status: ${content.status}
      Year: ${content.year}
      
      Characters:
      ${characters.map((char) => `- ${char.name}: ${char.description}`).join("\n")}
    `

    await fastify.prisma.knowledgeBase.create({
      data: {
        [type === "anime" ? "animeId" : "mangaId"]: content.id,
        content: knowledgeText,
        metadata: {
          type,
          title: content.title,
          genres: content.genres,
          characters: characters.map((c) => c.name),
        },
      },
    })

    // Create individual character knowledge entries
    for (const character of characters) {
      const characterKnowledge = `
        Character: ${character.name}
        ${character.nameJp ? `Japanese Name: ${character.nameJp}` : ""}
        From: ${content.title}
        Description: ${character.description}
        ${character.voiceActor ? `Voice Actor: ${character.voiceActor}` : ""}
        
        Context: This character appears in ${content.title}, which is ${content.synopsis}
      `

      await fastify.prisma.knowledgeBase.create({
        data: {
          [type === "anime" ? "animeId" : "mangaId"]: content.id,
          characterId: character.id,
          content: characterKnowledge,
          metadata: {
            type: "character",
            characterName: character.name,
            source: content.title,
          },
        },
      })
    }
  } catch (error) {
    fastify.log.error("Error creating knowledge base entry:", error)
  }
}

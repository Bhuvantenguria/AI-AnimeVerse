import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create achievements
  const achievements = [
    {
      name: "first_anime_completed",
      description: "Complete your first anime",
      icon: "🎉",
      category: "watching",
      condition: { type: "anime_completed", count: 1 },
      points: 100,
      rarity: "common",
    },
    {
      name: "anime_completed_10",
      description: "Complete 10 anime",
      icon: "🏆",
      category: "watching",
      condition: { type: "anime_completed", count: 10 },
      points: 500,
      rarity: "rare",
    },
    {
      name: "perfect_quiz",
      description: "Get a perfect score on a quiz",
      icon: "🎯",
      category: "quiz",
      condition: { type: "quiz_perfect", percentage: 100 },
      points: 200,
      rarity: "rare",
    },
    {
      name: "quiz_master",
      description: "Score 90% or higher on a quiz",
      icon: "🧠",
      category: "quiz",
      condition: { type: "quiz_score", percentage: 90 },
      points: 150,
      rarity: "common",
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    })
  }

  // Create sample anime
  const animeData = [
    {
      title: "One Piece",
      titleJp: "ワンピース",
      synopsis:
        "Follow Monkey D. Luffy's epic journey to become the Pirate King in this legendary adventure spanning over 25 years.",
      episodes: 1000,
      status: "ongoing",
      rating: 9.3,
      year: 1999,
      season: "fall",
      genres: ["Adventure", "Comedy", "Drama", "Shounen"],
      studios: ["Toei Animation"],
      coverImage: "/placeholder.svg?height=600&width=400",
      bannerImage: "/placeholder.svg?height=300&width=800",
    },
    {
      title: "Attack on Titan",
      titleJp: "進撃の巨人",
      synopsis:
        "The epic conclusion to humanity's fight against the Titans reaches its climactic finale with unprecedented revelations.",
      episodes: 87,
      status: "completed",
      rating: 9.2,
      year: 2013,
      season: "spring",
      genres: ["Action", "Drama", "Fantasy"],
      studios: ["Mappa", "Studio Pierrot"],
      coverImage: "/placeholder.svg?height=600&width=400",
      bannerImage: "/placeholder.svg?height=300&width=800",
    },
  ]

  for (const anime of animeData) {
    const createdAnime = await prisma.anime.upsert({
      where: { title: anime.title },
      update: anime,
      create: anime,
    })

    // Create characters for each anime
    if (anime.title === "One Piece") {
      await prisma.character.upsert({
        where: { name: "Monkey D. Luffy" },
        update: {},
        create: {
          name: "Monkey D. Luffy",
          nameJp: "モンキー・D・ルフィ",
          description: "The captain of the Straw Hat Pirates and main protagonist. Dreams of becoming the Pirate King.",
          avatar: "/placeholder.svg?height=60&width=60",
          personality: ["Cheerful", "Brave", "Loyal", "Hungry"],
          voiceActor: "Mayumi Tanaka",
          animeId: createdAnime.id,
        },
      })
    }
  }

  // Create sample manga
  const mangaData = [
    {
      title: "One Piece",
      titleJp: "ワンピース",
      synopsis:
        "Follow Monkey D. Luffy's epic journey to become the Pirate King in this legendary adventure spanning over 25 years.",
      chapters: 1100,
      volumes: 107,
      status: "ongoing",
      rating: 9.3,
      year: 1997,
      genres: ["Adventure", "Comedy", "Drama", "Shounen"],
      authors: ["Eiichiro Oda"],
      coverImage: "/placeholder.svg?height=600&width=400",
      bannerImage: "/placeholder.svg?height=300&width=800",
    },
  ]

  for (const manga of mangaData) {
    const createdManga = await prisma.manga.upsert({
      where: { title: manga.title },
      update: manga,
      create: manga,
    })

    // Create sample chapters
    for (let i = 1; i <= 5; i++) {
      await prisma.chapter.upsert({
        where: {
          mangaId_number: {
            mangaId: createdManga.id,
            number: i,
          },
        },
        update: {},
        create: {
          number: i,
          title: `Chapter ${i}: Adventure Begins`,
          pages: 20,
          releaseDate: new Date(2024, 0, i),
          mangaId: createdManga.id,
        },
      })
    }
  }

  // Create sample quizzes
  const quizData = [
    {
      title: "One Piece Knowledge Test",
      description: "Test your knowledge about the Straw Hat Pirates!",
      difficulty: "medium",
      timeLimit: 300, // 5 minutes
      isActive: true,
    },
  ]

  for (const quiz of quizData) {
    const createdQuiz = await prisma.quiz.upsert({
      where: { title: quiz.title },
      update: quiz,
      create: quiz,
    })

    // Create sample questions
    const questions = [
      {
        question: "Who is the captain of the Straw Hat Pirates?",
        options: ["Monkey D. Luffy", "Roronoa Zoro", "Nami", "Sanji"],
        correctAnswer: 0,
        explanation: "Monkey D. Luffy is the captain and founder of the Straw Hat Pirates.",
        points: 10,
        order: 1,
      },
      {
        question: "What is Luffy's dream?",
        options: ["To become the strongest", "To find treasure", "To become the Pirate King", "To sail the world"],
        correctAnswer: 2,
        explanation: "Luffy's ultimate goal is to become the Pirate King by finding the One Piece.",
        points: 10,
        order: 2,
      },
    ]

    for (const question of questions) {
      await prisma.quizQuestion.upsert({
        where: {
          quizId: createdQuiz.id,
          order: question.order,
        },
        update: question,
        create: {
          ...question,
          quizId: createdQuiz.id,
        },
      })
    }
  }

  console.log("✅ Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

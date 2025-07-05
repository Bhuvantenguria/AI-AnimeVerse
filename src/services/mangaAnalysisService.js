import OpenAI from 'openai'

class MangaAnalysisService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }) : null
  }

  async analyzeMangaContent(mangaId, chapterNumber, mangaTitle, fastify) {
    try {
      // In a real implementation, this would:
      // 1. Fetch actual manga pages
      // 2. Use computer vision to analyze panels
      // 3. Extract visual elements, character positions, art style
      // 4. Build a knowledge base about the manga
      
      fastify.log.info(`🔍 Analyzing manga content for ${mangaTitle} Chapter ${chapterNumber}`)
      
      // For demo purposes, return sample analysis
      return {
        mangaId,
        chapterNumber,
        title: mangaTitle,
        analysis: {
          artStyle: 'Traditional manga with detailed backgrounds and expressive character designs',
          themes: ['Adventure', 'Friendship', 'Coming of Age', 'Fantasy'],
          characters: [
            {
              name: 'Protagonist',
              role: 'Main character',
              appearance: 'Young person with determined expression',
              personality: 'Brave, curious, determined'
            },
            {
              name: 'Mysterious Figure',
              role: 'Supporting character',
              appearance: 'Shadowy figure with distinctive clothing',
              personality: 'Enigmatic, knowledgeable'
            }
          ],
          panels: [
            {
              pageNumber: 1,
              panelNumber: 1,
              composition: 'Wide establishing shot of cityscape',
              mood: 'Peaceful, morning atmosphere',
              techniques: ['Detailed background work', 'Atmospheric perspective']
            },
            {
              pageNumber: 1,
              panelNumber: 2,
              composition: 'Close-up of protagonist',
              mood: 'Determined, hopeful',
              techniques: ['Character focus', 'Emotional expression']
            }
          ],
          symbolism: [
            {
              element: 'Rising sun',
              meaning: 'New beginnings, hope'
            },
            {
              element: 'Empty streets',
              meaning: 'Isolation, potential for change'
            }
          ]
        }
      }
    } catch (error) {
      fastify.log.error('Manga analysis error:', error)
      throw error
    }
  }

  async generateChatResponse(message, context, fastify) {
    try {
      const { mangaId, mangaTitle, chapterNumber, panelNumber, pageNumber } = context
      
      // Get manga analysis
      const analysis = await this.analyzeMangaContent(mangaId, chapterNumber, mangaTitle, fastify)
      
      // Use OpenAI to generate contextual response
      if (this.openai) {
        const response = await this.generateAIResponse(message, analysis, context)
        return response
      } else {
        // Fallback to rule-based responses
        return this.generateRuleBasedResponse(message, analysis, context)
      }
    } catch (error) {
      fastify.log.error('Chat response generation error:', error)
      return "I apologize, but I'm having trouble analyzing this manga right now. Please try asking your question again."
    }
  }

  async generateAIResponse(message, analysis, context) {
    const systemPrompt = `You are an expert manga analyst and enthusiast. You're helping someone understand "${analysis.title}" Chapter ${analysis.chapterNumber}.

MANGA ANALYSIS:
Art Style: ${analysis.analysis.artStyle}
Themes: ${analysis.analysis.themes.join(', ')}
Characters: ${analysis.analysis.characters.map(c => `${c.name} (${c.role}): ${c.personality}`).join(', ')}

CURRENT CONTEXT:
${context.pageNumber ? `Currently on page ${context.pageNumber}` : 'General discussion'}
${context.panelNumber ? `Looking at panel ${context.panelNumber}` : ''}

INSTRUCTIONS:
- Provide detailed, insightful analysis
- Reference specific visual elements when possible
- Explain artistic techniques and storytelling methods
- Discuss character development and themes
- Be enthusiastic and knowledgeable
- Use examples from the manga
- Keep responses engaging and educational

Respond as a passionate manga expert who loves discussing every aspect of the story, art, and characters.`

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      return completion.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  generateRuleBasedResponse(message, analysis, context) {
    const lowerMessage = message.toLowerCase()
    
    // Character-focused responses
    if (lowerMessage.includes('character')) {
      const characters = analysis.analysis.characters
      if (characters.length > 0) {
        const charList = characters.map(c => 
          `**${c.name}**: ${c.personality} - ${c.appearance}`
        ).join('\n')
        return `Great question about the characters! In this chapter, we see:\n\n${charList}\n\nEach character plays a unique role in driving the narrative forward. What specifically would you like to know about their development or relationships?`
      }
    }
    
    // Art and visual analysis
    if (lowerMessage.includes('art') || lowerMessage.includes('draw') || lowerMessage.includes('visual')) {
      return `The artwork in this chapter showcases ${analysis.analysis.artStyle}. The artist uses several impressive techniques:\n\n• **Panel Composition**: Each panel is carefully framed to guide your eye through the story\n• **Character Design**: Expressive faces and body language that convey emotion\n• **Background Work**: Detailed environments that enhance the mood\n• **Visual Flow**: Smooth transitions between panels\n\nThe art style perfectly complements the ${analysis.analysis.themes.join(', ')} themes of the story. What aspect of the artwork caught your attention most?`
    }
    
    // Panel-specific analysis
    if (lowerMessage.includes('panel')) {
      const panelInfo = analysis.analysis.panels.find(p => 
        p.pageNumber === context.pageNumber || 
        p.panelNumber === context.panelNumber
      )
      
      if (panelInfo) {
        return `Looking at this panel, I can see the artist used ${panelInfo.composition} to create a ${panelInfo.mood} atmosphere. The techniques include:\n\n• ${panelInfo.techniques.join('\n• ')}\n\nThis panel serves an important narrative purpose in building the story's momentum. What do you think about the emotional impact of this scene?`
      } else {
        return `Panel analysis is fascinating! Each panel in manga serves multiple purposes - advancing plot, developing characters, and creating atmosphere. The artist carefully considers composition, pacing, and visual flow. Which panel would you like me to analyze in detail?`
      }
    }
    
    // Theme and story analysis
    if (lowerMessage.includes('story') || lowerMessage.includes('plot') || lowerMessage.includes('theme')) {
      const themes = analysis.analysis.themes
      return `This chapter beautifully explores the themes of ${themes.join(', ')}. The story builds through:\n\n• **Character Development**: We see growth and change in the protagonists\n• **World Building**: The setting is carefully established\n• **Conflict Introduction**: Tension is created to drive the narrative\n• **Symbolic Elements**: Visual metaphors enhance the deeper meaning\n\nThe themes of ${themes[0]} and ${themes[1]} are particularly strong here. How do you think these themes relate to the characters' journeys?`
    }
    
    // Symbolism and meaning
    if (lowerMessage.includes('symbol') || lowerMessage.includes('meaning') || lowerMessage.includes('represent')) {
      const symbols = analysis.analysis.symbolism
      if (symbols.length > 0) {
        const symbolList = symbols.map(s => 
          `• **${s.element}**: ${s.meaning}`
        ).join('\n')
        return `Excellent question about symbolism! This chapter contains several meaningful visual elements:\n\n${symbolList}\n\nThese symbols add layers of meaning to the story, creating depth beyond the surface narrative. Manga artists are masters at weaving symbolic elements into their visual storytelling. What other symbolic elements did you notice?`
      }
    }
    
    // General enthusiastic response
    return `That's a fascinating question about ${analysis.title}! This chapter is rich with storytelling elements that make it special:\n\n• **Artistic Excellence**: ${analysis.analysis.artStyle}\n• **Compelling Themes**: ${analysis.analysis.themes.join(', ')}\n• **Character Depth**: Complex, relatable characters\n• **Visual Storytelling**: Expert use of manga techniques\n\nI love discussing every aspect of this story! Could you be more specific about what you'd like to explore - the characters, artwork, themes, or specific scenes? 📚✨`
  }

  async analyzePanel(mangaId, chapterNumber, pageNumber, panelNumber, fastify) {
    try {
      // In a real implementation, this would:
      // 1. Get the specific panel image
      // 2. Use computer vision to analyze visual elements
      // 3. Identify characters, objects, composition
      // 4. Analyze artistic techniques
      
      fastify.log.info(`🎨 Analyzing panel ${panelNumber} on page ${pageNumber}`)
      
      return {
        pageNumber,
        panelNumber,
        composition: 'Dynamic action shot with diagonal composition',
        characters: ['Protagonist', 'Mysterious Figure'],
        mood: 'Tense, dramatic',
        techniques: [
          'Motion lines for movement',
          'Close-up framing for intensity',
          'Dramatic lighting and shadows'
        ],
        symbolism: [
          {
            element: 'Diagonal composition',
            meaning: 'Creates dynamic tension and movement'
          }
        ],
        storyFunction: 'Builds suspense and advances the plot',
        artisticNotes: 'Excellent use of contrast and space to create visual impact'
      }
    } catch (error) {
      fastify.log.error('Panel analysis error:', error)
      throw error
    }
  }
}

export default new MangaAnalysisService() 
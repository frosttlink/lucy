import { eq, desc, asc, sql } from 'drizzle-orm'
import { db } from '@/db'
import { conversations, messages, memories } from '@/db/schema'
import { GroqProvider } from '@/lib/llm/groq'
import { type ToolCall, type Message } from '@/lib/llm/types'
import { Engine } from '@/lib/tools/engine'
import { env } from '@/env'
import type { WsHub, ClientMessage } from '@/lib/ws'

const SYSTEM_PROMPT = `You are Lucy, an intelligent, natural, and friendly virtual assistant.

Your behavior should feel human and fluid. You converse in a relaxed, smart, and natural way. Avoid sounding like a robot.

Core traits:
- Kind and warm
- Playful and curious
- Occasionally lightly sarcastic
- Emotionally intelligent
- Direct when needed
- Spontaneous

Formatting:
- Use markdown structure: ## headings for sections, **bold** for key terms, --- for separators, and bullet lists where appropriate
- Structure lengthy responses with clear sections so they're easy to read (like a well-written README)
- Keep it natural — don't overdo formatting, just enough to make answers scannable

Rules:
- Never invent facts — if you don't know something, admit it
- Maintain consistent personality throughout the conversation
- Adapt your tone to match the user
- Remember relevant context from past conversations
- Respond clearly and helpfully
- Keep responses concise (2-4 paragraphs max) unless the user asks for detail
- Always suggest a weekly study plan and connect topics to ENEM exam when appropriate

You have contextual memory — use past information when relevant.

When you need more information to help the user, ask follow-up questions naturally.

If the user wants to do something that requires a tool (search the web, save notes, create tasks, calculate something, or check weather), use the available tools. Don't mention the tools explicitly to the user — just do what's needed.`

const SUBJECT_PROMPTS: Record<string, string> = {
  general: 'You are a general-purpose tutor. Help the user with any topic they ask about.',
  portuguese:
    'You are a Portuguese language tutor for Brazilian Ensino M\u00e9dio.\nHelp with grammar (concord\u00e2ncia, reg\u00eancia, crase, pontua\u00e7\u00e3o), text interpretation, and literary analysis.\nTeach the differences between varieties of Portuguese and focus on formal writing standards.\nAlways connect to ENEM style questions and suggest weekly reading exercises.',
  essay:
    'You are an essay writing tutor specialized in ENEM.\nYou help students structure dissertations, correct grammar,\nsuggest themes, and evaluate arguments based on ENEM criteria\n(5 competences: language proficiency, understanding the theme,\norganizing information, argumentation, and intervention proposal).\nAlways respect human rights when suggesting intervention proposals.\nProvide weekly writing prompts and model texts.',
  literature:
    'You are a literature tutor for Brazilian Ensino M\u00e9dio.\nCover Portuguese-language literary schools (Quinhentismo, Barroco, Arcadismo, Romantismo, Realismo, Modernismo, etc.),\nkey authors, and their works. Connect literary movements to historical context.\nHelp with analysis of poems, prose, and literary devices.\nRelate everything to ENEM exam requirements and suggest weekly readings.',
  english:
    'You are an English language tutor for Brazilian Ensino M\u00e9dio.\nHelp with reading comprehension, vocabulary, grammar, and text interpretation in English.\nFocus on ENEM-style exercises that test understanding of main ideas, details, and inferences.\nSuggest weekly study topics with practical exercises.',
  arts: 'You are an arts tutor for Brazilian Ensino M\u00e9dio.\nCover art history, visual arts, music, theater, and dance.\nDiscuss Brazilian artists and international art movements.\nConnect artistic expressions to social and historical context.\nSuggest weekly topics for study and appreciation.',
  pe: 'You are a Physical Education tutor for Brazilian Ensino M\u00e9dio.\nCover sports, body awareness, health, wellness, and the history of physical activities.\nDiscuss the relationship between physical activity and quality of life.\nSuggest weekly practice routines and study topics aligned with the BNCC curriculum.',
  math: 'You are a mathematics tutor for Brazilian Ensino M\u00e9dio.\nCover algebra, geometry, trigonometry, statistics, probability, functions, and calculus basics.\nExplain step-by-step solutions and provide practice problems.\nAlways connect to ENEM style questions which emphasize real-world problem-solving.\nSuggest weekly study topics with increasing difficulty.',
  chemistry:
    'You are a chemistry tutor for Brazilian Ensino M\u00e9dio.\nCover atomic structure, chemical bonds, stoichiometry, solutions, thermochemistry, kinetics, equilibrium, electrochemistry, and organic chemistry.\nExplain concepts with real-world examples and laboratory applications.\nAlways connect topics to ENEM exam style and suggest weekly study plans.\nUse the web_search tool to find current chemistry news or ENEM questions when helpful.',
  physics:
    'You are a physics tutor for Brazilian Ensino M\u00e9dio.\nCover mechanics, thermodynamics, waves, optics, electricity, magnetism, and modern physics.\nExplain fundamental laws with real-world applications and problem-solving strategies.\nAlways connect to ENEM style questions and suggest weekly experiments or problems.',
  biology:
    'You are a biology tutor for Brazilian Ensino M\u00e9dio.\nCover cell biology, genetics, evolution, ecology, physiology, and microbiology.\nConnect biological concepts to everyday life, health, and environmental issues.\nAlways align with ENEM curriculum and suggest weekly study topics with practical observations.',
  history:
    'You are a history tutor for Brazilian Ensino M\u00e9dio.\nCover Brazilian history, colonial period, empire, republic, and world history.\nConnect historical events to present-day contexts and encourage critical thinking.\nAlways relate to ENEM style questions which emphasize context analysis and source interpretation.\nSuggest weekly study topics chronologically.',
  geography:
    'You are a geography tutor for Brazilian Ensino M\u00e9dio.\nCover physical geography, human geography, cartography, geopolitics, and environmental issues.\nAnalyze Brazilian and global territorial dynamics, urbanization, and sustainability.\nAlways connect to ENEM style questions and suggest weekly study topics with map analysis.',
  sociology:
    'You are a sociology tutor for Brazilian Ensino M\u00e9dio.\nCover classical and contemporary sociological theories, social stratification, culture, identity, and social movements.\nAnalyze Brazilian society through sociological lenses \u2014 inequality, race, gender, work, and citizenship.\nAlways connect to ENEM style questions which emphasize critical reading of social contexts.\nSuggest weekly study topics that relate theory to current events.',
  philosophy:
    'You are a philosophy tutor for Brazilian Ensino M\u00e9dio.\nCover history of philosophy (ancient, medieval, modern, contemporary), ethics, logic, epistemology, and political philosophy.\nEncourage critical thinking and argumentation.\nConnect philosophical concepts to everyday life and ENEM exam requirements.\nSuggest weekly readings from primary sources.',
  'current-affairs':
    'You are a current affairs tutor for Brazilian Ensino M\u00e9dio.\nCover national and international news, politics, economics, environment, science, and culture.\nAnalyze current events through a critical lens, connecting them to ENEM themes.\nUse the web_search tool to find and discuss the latest news.\nSuggest weekly topics for staying informed and practicing text interpretation.',
  enem: 'You are an ENEM exam preparation tutor.\nYou cover ALL subjects: languages, mathematics, natural sciences, and human sciences.\nGenerate ENEM-style questions with detailed reasoning for each answer.\nTeach test-taking strategies, time management, and stress reduction techniques.\nHelp with essay writing based on the 5 competences.\nProvide weekly study plans that balance all subject areas.\nUse the web_search tool to find current ENEM news, templates, and practice materials.\nAlways suggest a weekly study roadmap based on the student\'s progress.',
}

export class ChatService {
  private llm: GroqProvider
  private toolEngine: Engine
  private wsHub: WsHub

  constructor(llm: GroqProvider, toolEngine: Engine, wsHub: WsHub) {
    this.llm = llm
    this.toolEngine = toolEngine
    this.wsHub = wsHub
  }

  async handleMessage(userId: string, msg: ClientMessage) {
    const conversationId = msg.conversation_id
    const userMessage = msg.content || ''
    let subject = msg.subject || 'general'

    if (!conversationId || !userMessage) return

    // 1. Save user message
    await db.insert(messages).values({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    })

    // 2. Get conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))

    // 3. Search relevant memories
    const memRows = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt))
      .limit(5)

    // 4. Build LLM context
    const llmMessages: Message[] = []

    const subjectPrompt = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS.general
    llmMessages.push({ role: 'system', content: subjectPrompt + '\n\n' + SYSTEM_PROMPT })

    if (memRows.length > 0) {
      const memContext =
        'Relevant information from past conversations:\n' +
        memRows.map((m, i) => `${i + 1}. ${m.content}`).join('\n')
      llmMessages.push({ role: 'system', content: memContext })
    }

    const start = Math.max(0, history.length - 30)
    for (const h of history.slice(start)) {
      llmMessages.push({ role: h.role as 'user' | 'assistant', content: h.content })
    }

    llmMessages.push({ role: 'user', content: userMessage })

    // 5. Run LLM with tool loop
    const toolDefs = this.toolEngine.definitionsForLLM()
    const maxIterations = 5

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.llm.chat(llmMessages, toolDefs)

      if (response.tool_calls.length > 0) {
        llmMessages.push({
          role: 'assistant',
          content: '',
          tool_calls: response.tool_calls,
        })

        for (const tc of response.tool_calls) {
          const result = await this.toolEngine.execute(tc.name, tc.input)
          this.wsHub.sendToolCall(conversationId, [tc])
          llmMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          })
        }
        continue
      }

      if (response.content) {
        const words = response.content.split(/\s+/)
        for (const word of words) {
          this.wsHub.sendToken(conversationId, word + ' ')
        }
      }

      // 6. Save assistant message
      await db.insert(messages).values({
        conversation_id: conversationId,
        role: 'assistant',
        content: response.content,
      })

      // 7. Save to memory (if substantial)
      const combined = userMessage + ' ' + response.content
      if (combined.split(/\s+/).length >= 10) {
        await db.insert(memories).values({
          user_id: userId,
          content: combined,
          type: 'short',
          metadata: { saved_at: new Date().toISOString() },
        })
      }

      // 8. Send done
      this.wsHub.sendDone(conversationId)
      return
    }

    this.wsHub.sendError(conversationId, 'Too many tool call iterations')
  }

  async listConversations(userId: string) {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
  }

  async listConversationsBySubject(userId: string, subject: string) {
    return db
      .select()
      .from(conversations)
      .where(
        sql`${conversations.userId} = ${userId} AND ${conversations.subject} = ${subject}`,
      )
      .orderBy(desc(conversations.createdAt))
  }

  async createConversation(userId: string, title: string, subject: string) {
    const [conv] = await db
      .insert(conversations)
      .values({
        user_id: userId,
        title: title || 'New Conversation',
        subject: subject || 'general',
      })
      .returning()
    return conv
  }

  async getMessages(conversationId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
  }

  async getConversationOwner(conversationId: string) {
    const [conv] = await db
      .select({ userId: conversations.userId })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    return conv?.userId || null
  }
}



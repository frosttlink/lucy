import * as cheerio from 'cheerio'
import type { Tool, ToolParams } from './engine'

export class WebSearchTool implements Tool {
  name() {
    return 'web_search'
  }

  description() {
    return 'Search the internet for current information. Use this when you need to look up facts, news, or any information that might be beyond your knowledge cutoff.'
  }

  parameters() {
    return {
      query: { type: 'string', description: 'The search query' },
    }
  }

  async execute(params: ToolParams): Promise<string> {
    const query = params.query as string | undefined
    if (!query?.trim()) throw new Error('query is required')

    const results = await this.searchDuckDuckGo(query)
    return JSON.stringify(results, null, 2)
  }

  private async searchDuckDuckGo(query: string) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LucyBot/1.0)' },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    const results: Array<{ title: string; snippet: string; url: string }> = []
    $('.result').each((i, el) => {
      if (i >= 5) return
      const title = $(el).find('.result__title').text().trim()
      const snippet = $(el).find('.result__snippet').text().trim()
      let link = $(el).find('.result__url').attr('href') || ''
      link = this.cleanURL(link)
      if (title) results.push({ title, snippet, url: link })
    })

    if (results.length === 0) throw new Error('no results found')
    return results
  }

  private cleanURL(raw: string): string {
    if (raw.includes('uddg=')) {
      for (const part of raw.split('&')) {
        if (part.startsWith('uddg=')) {
          return decodeURIComponent(part.slice(5))
        }
      }
    }
    return raw
  }
}

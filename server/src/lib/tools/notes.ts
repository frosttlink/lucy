import type { Tool, ToolParams } from './engine'

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

let notes: Note[] = []

let idCounter = 0
function generateId() {
  return `note_${Date.now()}_${++idCounter}`
}

export class NotesTool implements Tool {
  name() {
    return 'notes'
  }

  description() {
    return 'Create, read, list, and delete notes. Use this to save information the user wants to remember.'
  }

  parameters() {
    return {
      action: {
        type: 'string',
        description: "Action to perform: 'create', 'read', 'list', 'delete'",
      },
      id: {
        type: 'string',
        description: 'Note ID (required for read, delete)',
      },
      title: {
        type: 'string',
        description: 'Note title (required for create)',
      },
      content: {
        type: 'string',
        description: 'Note content (required for create)',
      },
    }
  }

  async execute(params: ToolParams): Promise<string> {
    const action = (params.action as string)?.toLowerCase()

    switch (action) {
      case 'create': {
        const title = params.title as string
        const content = params.content as string
        if (!title || !content) throw new Error('title and content are required')

        const note: Note = {
          id: generateId(),
          title,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        notes.push(note)
        return `Note created: ${JSON.stringify(note)}`
      }

      case 'read': {
        const id = params.id as string
        if (!id) throw new Error('id is required')
        const note = notes.find((n) => n.id === id)
        if (!note) throw new Error('note not found')
        return JSON.stringify(note)
      }

      case 'list': {
        return JSON.stringify(notes)
      }

      case 'delete': {
        const id = params.id as string
        if (!id) throw new Error('id is required')
        notes = notes.filter((n) => n.id !== id)
        return 'Note deleted successfully'
      }

      default:
        throw new Error(`unknown action: ${action}`)
    }
  }
}

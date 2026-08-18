import type { Tool, ToolParams } from './engine'

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

let tasks: Task[] = []

let idCounter = 0
function generateId() {
  return `task_${Date.now()}_${++idCounter}`
}

export class TasksTool implements Tool {
  name() {
    return 'tasks'
  }

  description() {
    return 'Create, list, update, and delete tasks. Use this to manage the user to-do list.'
  }

  parameters() {
    return {
      action: {
        type: 'string',
        description: "Action: 'create', 'list', 'complete', 'delete'",
      },
      id: {
        type: 'string',
        description: 'Task ID (required for complete, delete)',
      },
      title: {
        type: 'string',
        description: 'Task title (required for create)',
      },
    }
  }

  required() {
    return ['action']
  }

  async execute(params: ToolParams): Promise<string> {
    const action = (params.action as string)?.toLowerCase()

    switch (action) {
      case 'create': {
        const title = params.title as string
        if (!title) throw new Error('title is required')

        const task: Task = {
          id: generateId(),
          title,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        tasks.push(task)
        return `Task created: ${JSON.stringify(task)}`
      }

      case 'list': {
        return JSON.stringify(tasks)
      }

      case 'complete': {
        const id = params.id as string
        if (!id) throw new Error('id is required')
        const task = tasks.find((t) => t.id === id)
        if (!task) throw new Error('task not found')
        task.completed = true
        task.updatedAt = new Date().toISOString()
        return `Task completed: ${JSON.stringify(task)}`
      }

      case 'delete': {
        const id = params.id as string
        if (!id) throw new Error('id is required')
        tasks = tasks.filter((t) => t.id !== id)
        return 'Task deleted'
      }

      default:
        throw new Error(`unknown action: ${action}`)
    }
  }
}

import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '@/store/chat-store'

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      activeSubject: 'portuguese',
      activeConversationId: null,
      conversations: [],
      isStreaming: false,
    })
  })

  it('has default state', () => {
    const state = useChatStore.getState()
    expect(state.activeSubject).toBe('portuguese')
    expect(state.activeConversationId).toBeNull()
    expect(state.conversations).toEqual([])
    expect(state.isStreaming).toBe(false)
  })

  it('sets active subject', () => {
    useChatStore.getState().setActiveSubject('math')
    expect(useChatStore.getState().activeSubject).toBe('math')
  })

  it('sets active conversation', () => {
    useChatStore.getState().setActiveConversation('conv-1')
    expect(useChatStore.getState().activeConversationId).toBe('conv-1')
  })

  it('adds conversation', () => {
    const conv = {
      id: 'conv-1',
      userId: 'user-1',
      title: 'Test',
      subject: 'math',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    useChatStore.getState().addConversation(conv)
    expect(useChatStore.getState().conversations).toHaveLength(1)
  })

  it('removes conversation', () => {
    const conv = {
      id: 'conv-1',
      userId: 'user-1',
      title: 'Test',
      subject: 'math',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    useChatStore.getState().addConversation(conv)
    useChatStore.getState().removeConversation('conv-1')
    expect(useChatStore.getState().conversations).toHaveLength(0)
  })

  it('clears active conversation when removed', () => {
    const conv = {
      id: 'conv-1',
      userId: 'user-1',
      title: 'Test',
      subject: 'math',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    useChatStore.getState().addConversation(conv)
    useChatStore.getState().setActiveConversation('conv-1')
    useChatStore.getState().removeConversation('conv-1')
    expect(useChatStore.getState().activeConversationId).toBeNull()
  })

  it('returns subject label', () => {
    expect(useChatStore.getState().titleForCurrentSubject()).toBe('Português')
    useChatStore.getState().setActiveSubject('math')
    expect(useChatStore.getState().titleForCurrentSubject()).toBe('Matemática')
  })
})

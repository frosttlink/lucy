import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '@/store/chat-store'

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      activeSubject: 'portuguese',
      conversationId: null,
      isStreaming: false,
      isInitialized: false,
    })
  })

  it('has default state', () => {
    const state = useChatStore.getState()
    expect(state.activeSubject).toBe('portuguese')
    expect(state.conversationId).toBeNull()
    expect(state.isStreaming).toBe(false)
    expect(state.isInitialized).toBe(false)
  })

  it('sets active subject', () => {
    useChatStore.getState().setActiveSubject('math')
    expect(useChatStore.getState().activeSubject).toBe('math')
  })

  it('sets conversation id', () => {
    useChatStore.getState().setConversationId('conv-1')
    expect(useChatStore.getState().conversationId).toBe('conv-1')
  })

  it('sets initialized', () => {
    useChatStore.getState().setInitialized(true)
    expect(useChatStore.getState().isInitialized).toBe(true)
  })

  it('returns subject label', () => {
    expect(useChatStore.getState().titleForCurrentSubject()).toBe('Português')
    useChatStore.getState().setActiveSubject('math')
    expect(useChatStore.getState().titleForCurrentSubject()).toBe('Matemática')
  })
})

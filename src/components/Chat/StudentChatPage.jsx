import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Loader, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { chatService } from '../../services/chatService'

const StudentChatPage = () => {
  const { currentUser, userData } = useAuth()
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())

  const studentUser = {
    id: currentUser?.uid,
    name: userData?.name || userData?.displayName || currentUser?.displayName || 'Student',
    email: currentUser?.email || 'student@example.com'
  }

  useEffect(() => {
    if (studentUser.id) {
      initializeChat()
    }
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        console.log('🧹 Cleaned up student subscription')
      }
    }
  }, [studentUser.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const initializeChat = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('🎯 Initializing chat for student:', studentUser.id, studentUser.name)
      
      const conv = await chatService.getOrCreateConversation(
        studentUser.id, 
        studentUser.name, 
        studentUser.email
      )
      setConversation(conv)
      console.log('✅ Conversation ready:', conv.id)

      const { data: existingMessages, error: messagesError } = await chatService.getMessages(conv.id)
      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        setError('Failed to load messages')
      } else {
        setMessages(existingMessages || [])
        console.log('📨 Loaded', existingMessages?.length || 0, 'messages')
      }

      setupRealtimeSubscription(conv.id)
      setLoading(false)

    } catch (error) {
      console.error('💥 Failed to initialize chat:', error)
      setError('Failed to initialize chat. Please refresh the page.')
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (conversationId) => {
    try {
      console.log('🔔 Setting up real-time subscription for:', conversationId)
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      subscriptionRef.current = chatService.subscribeToMessages(conversationId, (newMessage) => {
        console.log('🆕 Real-time message received in student:', newMessage)
        setIsOnline(true)
        
        // Create message signature for our own sent messages
        const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
        
        // Only skip if this is OUR message that we just sent
        if (newMessage.sender_id === studentUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
          console.log('🚫 Ignoring real-time update for our own message')
          return
        }
        
        setMessages(prev => {
          // Check if message already exists by ID (most reliable check)
          const messageExists = prev.some(msg => msg.id === newMessage.id)
          if (messageExists) {
            console.log('📝 Message already exists by ID, skipping...')
            return prev
          }
          
          console.log('➕ Adding new message to student chat')
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      })

    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error)
      setIsOnline(false)
    }
  }

  const sendMessage = async (e) => {
    if (e) e.preventDefault()
    
    if (!message.trim() || !conversation || sending) {
      console.log('Cannot send:', { message: message.trim(), conversation: !!conversation, sending })
      return
    }

    const text = message.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const now = new Date()
    console.log('🚀 Student sending message:', text, 'from:', studentUser.name)
    
    const messageKey = `${studentUser.id}-${text}-${Math.floor(now.getTime() / 1000)}`
    sentMessageTimestampsRef.current.add(messageKey)
    
    setTimeout(() => {
      sentMessageTimestampsRef.current.delete(messageKey)
    }, 3000)
    
    const tempMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: studentUser.id,
      sender_name: studentUser.name,
      sender_role: 'student',
      message: text,
      created_at: now.toISOString(),
      isTemp: true
    }
    
    setMessages(prev => [...prev, tempMessage])
    setMessage('')
    setSending(true)
    setError('')

    try {
      const result = await chatService.sendMessage(
        conversation.id,
        studentUser.id,
        text,
        studentUser.name,
        'student'
      )

      if (result.error) {
        throw result.error
      }

      console.log('✅ Student message sent successfully:', result.data)
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
      console.error('❌ Failed to send student message:', error)
      setError('Failed to send message. Please check your connection and try again.')
      sentMessageTimestampsRef.current.delete(messageKey)
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessage(text)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const retryConnection = () => {
    setError('')
    if (conversation) {
      setupRealtimeSubscription(conversation.id)
    } else {
      initializeChat()
    }
  }

  const checkForNewMessages = async () => {
    if (!conversation) return
    
    try {
      console.log('🔄 Manually checking for new messages...')
      const { data: newMessages, error } = await chatService.getMessages(conversation.id)
      if (!error && newMessages) {
        setMessages(newMessages)
        console.log('✅ Manual refresh loaded', newMessages.length, 'messages')
      }
    } catch (error) {
      console.error('❌ Error manually refreshing messages:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading chat...</p>
        <p className="text-sm text-gray-500 mt-2">Setting up your conversation</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Admin Support</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isOnline ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <p className={`text-sm ${
                  isOnline ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {isOnline ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkForNewMessages}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh messages"
            >
              Refresh
            </button>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {studentUser.name}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex justify-between items-center">
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={retryConnection}
            className="text-red-700 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">No messages yet</p>
              <p className="text-gray-500">Start a conversation with the admin!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender_id === studentUser.id
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className="flex flex-col max-w-xs lg:max-w-md">
                    {!isCurrentUser && (
                      <span className="text-xs font-medium text-gray-600 mb-1 ml-3">
                        {msg.sender_name || 'Admin Support'}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 transform transition-all duration-200 ${
                        isCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none shadow-lg' + (msg.isTemp ? ' opacity-70' : '')
                          : 'bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.isTemp ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending || !conversation}
            className="flex-1 rounded-full py-3 px-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 border border-transparent focus:border-blue-300"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending || !conversation}
            className={`p-3 rounded-full transition-all duration-200 ${
              message.trim() && !sending && conversation
                ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-110 shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default StudentChatPage
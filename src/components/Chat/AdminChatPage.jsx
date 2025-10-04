import React, { useState, useEffect, useRef } from 'react'
import { Search, MessageCircle, Send, Loader, User } from 'lucide-react'
import { chatService } from '../../services/chatService'

const AdminChatPage = () => {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())

  useEffect(() => {
    initializeAdminChat()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        console.log('🧹 Cleaned up admin subscriptions')
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const initializeAdminChat = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('🎯 Initializing admin chat...')
      
      const { data: convs, error: convError } = await chatService.getAdminConversations()
      if (convError) {
        console.error('Error loading conversations:', convError)
        setError('Failed to load conversations')
      } else {
        setConversations(convs || [])
        console.log('✅ Loaded', convs?.length || 0, 'conversations')
      }

      setLoading(false)

    } catch (error) {
      console.error('💥 Error initializing admin chat:', error)
      setError('Failed to initialize admin chat. Please refresh the page.')
      setLoading(false)
    }
  }

  const selectConversation = async (conversation) => {
    try {
      console.log('💬 Selecting conversation:', conversation.id)
      setSelectedConversation(conversation)
      setMessages([])
      setError('')
      sentMessageTimestampsRef.current.clear()
      
      const { data: convMessages, error: messagesError } = await chatService.getMessages(conversation.id)
      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        setError('Failed to load messages')
      } else {
        setMessages(convMessages || [])
        console.log('📨 Loaded', convMessages?.length || 0, 'messages for conversation')
      }

      setupRealtimeSubscription(conversation.id)

    } catch (error) {
      console.error('❌ Error selecting conversation:', error)
      setError('Failed to load conversation')
    }
  }

  const setupRealtimeSubscription = (conversationId) => {
    try {
      console.log('🔔 Setting up real-time subscription for:', conversationId)
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      subscriptionRef.current = chatService.subscribeToMessages(conversationId, (newMessage) => {
        console.log('🆕 Real-time message received in admin:', newMessage)
        
        // Create message signature for our own sent messages
        const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
        
        // Only skip if this is OUR message that we just sent (admin_1)
        if (newMessage.sender_id === 'admin_1' && sentMessageTimestampsRef.current.has(messageKey)) {
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
          
          console.log('➕ Adding new message to admin chat')
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      })

    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error)
    }
  }

  const sendMessage = async (e) => {
    if (e) e.preventDefault()
    
    if (!message.trim() || !selectedConversation || sending) {
      console.log('Cannot send:', { message: message.trim(), selectedConversation: !!selectedConversation, sending })
      return
    }

    const text = message.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const now = new Date()
    console.log('🚀 Admin sending message:', text)
    
    const messageKey = `admin_1-${text}-${Math.floor(now.getTime() / 1000)}`
    sentMessageTimestampsRef.current.add(messageKey)
    
    setTimeout(() => {
      sentMessageTimestampsRef.current.delete(messageKey)
    }, 3000)
    
    const tempMessage = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_id: 'admin_1',
      sender_name: 'Admin Support',
      sender_role: 'admin',
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
        selectedConversation.id,
        'admin_1',
        text,
        'Admin Support',
        'admin'
      )

      if (result.error) {
        throw result.error
      }

      console.log('✅ Admin message sent successfully:', result.data)
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
      console.error('❌ Failed to send admin message:', error)
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

  const filteredConversations = conversations.filter(conv =>
    conv.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getMessageDisplayName = (msg) => {
    if (msg.sender_role === 'admin') {
      return msg.sender_name || 'Admin Support'
    }
    return msg.sender_name || selectedConversation?.student_name || 'Student'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin chat...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up conversations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Student Conversations</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {conversation.student_name?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {conversation.student_name || 'Student'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {selectedConversation.student_name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedConversation.student_name || 'Student'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.student_email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'admin' || msg.sender_id === 'admin_1'
                    const displayName = getMessageDisplayName(msg)
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex flex-col max-w-xs lg:max-w-md">
                          {!isAdmin && (
                            <span className="text-xs font-medium text-gray-600 mb-1 ml-3">
                              {displayName}
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 transform transition-all duration-200 hover:scale-105 ${
                              isAdmin
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                            } ${msg.isTemp ? 'opacity-70' : ''}`}
                          >
                            <p className="text-sm break-words">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                              isAdmin ? 'text-blue-100' : 'text-gray-500'
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
              {error && (
                <div className="max-w-3xl mx-auto mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-3xl mx-auto">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 rounded-full py-3 px-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    message.trim() && !sending
                      ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p>Choose a student from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminChatPage
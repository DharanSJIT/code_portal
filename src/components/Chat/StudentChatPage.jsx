import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Loader, MessageCircle, User, RefreshCw, Clock, CheckCircle, XCircle, ChevronDown, Shield } from 'lucide-react'
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
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
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

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    
    const handleScroll = () => {
      if (!messagesContainer) return
      
      // Show scroll button when user scrolls up more than 300px from bottom
      const isScrolledUp = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight > 300
      setShowScrollButton(isScrolledUp)
    }
    
    messagesContainer?.addEventListener('scroll', handleScroll)
    
    return () => {
      messagesContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior })
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

  // Group messages by date
  const getMessageGroups = () => {
    const groups = [];
    let currentDate = '';
    let currentGroup = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }
    
    return groups;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white py-20">
        <div className="w-16 h-16 relative mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <Loader className="w-4 h-4 animate-spin text-blue-500" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Setting up your chat</h3>
        <p className="text-sm text-gray-500 mb-6">Connecting to support...</p>
        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress" style={{width: '70%'}}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Connection Status Bar - minimal version */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <div className={`flex items-center ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} mr-2 animate-pulse`}></span>
            <span className="font-medium">{isOnline ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={checkForNewMessages}
            className="text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors flex items-center text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-down">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button 
            onClick={retryConnection}
            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-100 ml-3 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No messages yet</h3>
              <p className="text-gray-500 text-sm mb-6">Start a conversation with the admin team!</p>
              <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm">
                <Shield className="w-4 h-4 mr-2" />
                <span>Support team is available</span>
              </div>
            </div>
          ) : (
            getMessageGroups().map((group, groupIndex) => (
              <div key={`group-${groupIndex}`} className="space-y-4">
                <div className="flex justify-center">
                  <div className="inline-block bg-white px-3 py-1 text-xs font-medium text-gray-500 rounded-full shadow-sm border border-gray-100">
                    {formatDate(group.date)}
                  </div>
                </div>
                
                {group.messages.map((msg, msgIndex) => {
                  const isCurrentUser = msg.sender_id === studentUser.id;
                  const showSender = !isCurrentUser && (
                    msgIndex === 0 || 
                    group.messages[msgIndex - 1]?.sender_id !== msg.sender_id
                  );
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex ${!isCurrentUser && 'items-end'} max-w-xs lg:max-w-md ${showSender ? 'mt-4' : 'mt-1'}`}>
                        {/* Admin Avatar (only show on first message in a sequence) */}
                        {!isCurrentUser && showSender && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Message Content with Spacing */}
                        <div className={`flex flex-col ${!isCurrentUser && !showSender ? 'ml-10' : ''}`}>
                          {/* Sender Name (only for admin and only on first message in sequence) */}
                          {showSender && !isCurrentUser && (
                            <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                              {msg.sender_name || 'Admin Support'}
                            </span>
                          )}
                          
                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                            } ${msg.isTemp ? 'opacity-70' : ''}`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-snug">{msg.message}</p>
                            <div className={`flex items-center text-xs mt-1 ${
                              isCurrentUser ? 'text-blue-100 justify-end' : 'text-gray-400'
                            }`}>
                              {msg.isTemp ? (
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                <>
                                  {new Date(msg.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', minute: '2-digit' 
                                  })}
                                  {isCurrentUser && (
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="fixed bottom-20 right-6 bg-white shadow-lg rounded-full p-2.5 z-10 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border border-gray-200"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending || !conversation}
              className="w-full rounded-full py-3 px-4 pl-5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 focus:border-transparent shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || sending || !conversation}
            className={`p-3 rounded-full transition-all duration-200 ${
              message.trim() && !sending && conversation
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 transform hover:scale-105' 
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

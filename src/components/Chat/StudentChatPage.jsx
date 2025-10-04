import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, Paperclip, Smile, Loader, MessageCircle, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, X, Trash, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { chatService } from '../../services/chatService'

const scrollbarStyles = `
  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c5c5c5;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }

  .animate-progress {
    animation: progress 2s ease-in-out infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-slide-down {
    animation: slideDown 0.3s ease-in-out;
  }
  
  .message-deleted {
    animation: fadeOut 0.5s ease forwards;
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; transform: translateY(10px); height: 0; margin: 0; padding: 0; }
  }

  /* Fixed layout to prevent whole page scrolling */
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: calc(100% - 10vh);
    position: absolute;
    top: 10vh;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
  }

  .chat-header {
    flex-shrink: 0;
    background: rgba(128, 128, 128, 0.125);

    border-bottom: 1px solid #e5e7eb;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .chat-messages {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 1.5rem;
  }

  .chat-input {
    flex-shrink: 0;
    background: rgba(128, 128, 128, 0.1);

    border-top: 1px solid #e5e7eb;
    padding: 0.5rem;
    width: 100%;
  }
`;

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
  const [deletingMessageIds, setDeletingMessageIds] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState([])
  const [showOptions, setShowOptions] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)

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

  useEffect(() => {
    // Close options menu when clicking outside
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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

      subscriptionRef.current = chatService.subscribeToMessages(conversationId, (payload) => {
        console.log('🔄 Real-time message event:', payload)
        setIsOnline(true)
        
        if (typeof payload === 'object' && payload !== null && 'type' in payload) {
          // New format with type and data
          if (payload.type === 'INSERT') {
            handleNewMessage(payload.data)
          } else if (payload.type === 'DELETE') {
            handleDeletedMessage(payload.data)
          }
        } else {
          // Legacy format - direct message object
          handleNewMessage(payload)
        }
      })

    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error)
      setIsOnline(false)
    }
  }
  
  const handleNewMessage = (newMessage) => {
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
  }
  
  const handleDeletedMessage = (deletedMessage) => {
    console.log('🗑️ Handling deleted message in student chat:', deletedMessage)
    
    // First mark the message as being deleted (for animation)
    setDeletingMessageIds(prev => [...prev, deletedMessage.id])
    
    // Then remove it after animation completes
    setTimeout(() => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== deletedMessage.id)
      )
      // Clean up the deleting IDs array
      setDeletingMessageIds(prev => 
        prev.filter(id => id !== deletedMessage.id)
      )
    }, 500) // Match this with your animation duration
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

  const enterSelectionMode = () => {
    setIsSelectionMode(true)
    setSelectedMessages([])
    setShowOptions(false)
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedMessages([])
  }

  const toggleMessageSelection = (messageId, studentOnly = true) => {
    if (!isSelectionMode) return

    // If studentOnly is true, only allow selection of student's own messages
    if (studentOnly) {
      const msg = messages.find(m => m.id === messageId)
      if (msg && msg.sender_id !== studentUser.id) {
        return
      }
    }
    
    setSelectedMessages(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId)
      } else {
        return [...prev, messageId]
      }
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return
    
    setActionInProgress(true)
    try {
      console.log('🗑️ Deleting selected messages:', selectedMessages)
      
      // First mark the messages as being deleted (for animation)
      setDeletingMessageIds(prev => [...prev, ...selectedMessages])
      
      const { error } = await chatService.deleteMessages(
        conversation.id, 
        selectedMessages
      )
      
      if (error) {
        throw new Error(error)
      }
      
      // Remove the messages from the state after animation
      setTimeout(() => {
        setMessages(prev => 
          prev.filter(msg => !selectedMessages.includes(msg.id))
        )
        // Clean up the deleting IDs array
        setDeletingMessageIds(prev => 
          prev.filter(id => !selectedMessages.includes(id))
        )
      }, 500)
      
      setShowConfirmDelete(false)
      setIsSelectionMode(false)
      setSelectedMessages([])
      
    } catch (error) {
      console.error('Failed to delete messages:', error)
      setError('Failed to delete selected messages. Please try again.')
      // Remove the deleting animation state if there was an error
      setDeletingMessageIds(prev => 
        prev.filter(id => !selectedMessages.includes(id))
      )
    } finally {
      setActionInProgress(false)
    }
  }

  const handleClearChat = async () => {
    if (!conversation) return
    
    setActionInProgress(true)
    try {
      console.log('🧹 Clearing all messages from conversation:', conversation.id)
      
      const { error } = await chatService.clearConversation(conversation.id)
      
      if (error) {
        throw new Error(error)
      }
      
      setMessages([])
      setShowConfirmClear(false)
      
    } catch (error) {
      console.error('Failed to clear chat:', error)
      setError('Failed to clear conversation. Please try again.')
    } finally {
      setActionInProgress(false)
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
    
    let dayLabel;
    
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayLabel = 'Yesterday';
    } else {
      // Get day of week
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayLabel = weekday;
    }
    
    // Format date as MM/DD/YY
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      year: '2-digit'
    });
    
    return `${dayLabel}, ${formattedDate}`;
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  if (loading) {
    return (
      <div className="absolute top-10vh left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-white py-20">
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
    <>
      <style>{scrollbarStyles}</style>
      <div className="chat-layout">
        {/* Chat Header - Below existing 10vh main header */}
        <div className="chat-header">
          <div className="max-w-3xl mx-auto w-full px-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className="mr-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-sm mr-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <h2 className="font-semibold text-gray-800 ">Welcome to Support Chat</h2>
                  <div className={`flex items-center text-xs ${isOnline ? 'text-green-600' : 'text-yellow-500'}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} mr-1 animate-pulse`}></span>
                    <span>{isOnline ? 'Online' : 'Connecting...'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              {isSelectionMode ? (
                <div className="flex items-center text-gray-700">
                  <button
                    onClick={exitSelectionMode}
                    className="p-1.5 rounded-full hover:bg-gray-200 mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="font-medium">{selectedMessages.length} selected</span>
                  
                  {selectedMessages.length > 0 && (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="ml-3 text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-colors"
                      disabled={actionInProgress}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex">
                  <button
                    onClick={checkForNewMessages}
                    className="mr-2 text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                    title="Refresh messages"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  
                  <div className="relative" ref={optionsMenuRef}>
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showOptions && (
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={enterSelectionMode}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <span>Select messages</span>
                          </button>
                          <button
                            onClick={() => setShowConfirmClear(true)}
                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            <span>Clear chat</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-down">
            <div className="flex items-center max-w-2xl mx-auto w-full">
              <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button 
                onClick={retryConnection}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-100 ml-3 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Messages Container - with scrollbar */}
        <div 
          ref={messagesContainerRef}
          className="chat-messages custom-scrollbar bg-gray-50"
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
                    const isBeingDeleted = deletingMessageIds.includes(msg.id);
                    const isSelected = selectedMessages.includes(msg.id);
                    const isSelectable = !isSelectionMode || isCurrentUser;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'message-deleted' : ''}`}
                        onClick={() => toggleMessageSelection(msg.id, true)}
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
                                  ? `bg-blue-600 text-white rounded-br-none shadow-sm ${isSelectionMode ? 'cursor-pointer' : ''}`
                                  : `bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100 ${isSelectionMode ? 'opacity-70' : ''}`
                              } ${msg.isTemp ? 'opacity-70' : ''} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
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
              className="fixed bottom-24 right-6 bg-white shadow-lg rounded-full p-2.5 z-10 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 border border-gray-200"
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Fixed Message Input at Bottom */}
        <div className="chat-input shadow-md z-20">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sending || !conversation || isSelectionMode}
                  className="w-full rounded-full py-3 px-4 pl-5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 focus:border-transparent shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim() || sending || !conversation || isSelectionMode}
                className={`p-3 rounded-full transition-all duration-200 ${
                  message.trim() && !sending && conversation && !isSelectionMode
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

        {/* Clear Chat Confirmation Modal */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Clear entire chat?</h3>
              <p className="text-gray-500 mb-5">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium flex items-center"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Chat
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Messages Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full animate-fade-in">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete {selectedMessages.length} {selectedMessages.length === 1 ? 'message' : 'messages'}?
              </h3>
              <p className="text-gray-500 mb-5">
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 font-medium flex items-center"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default StudentChatPage

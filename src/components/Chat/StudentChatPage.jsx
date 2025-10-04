import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, Paperclip, Smile, Loader, MessageCircle, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, X, Trash, ArrowLeft,
  Reply, Forward, Star, Info, Archive, Phone, Video
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { chatService } from '../../services/chatService'

const scrollbarStyles = `
  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cccccc;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #aaaaaa;
  }

  /* Basic animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slide-in {
    animation: slideIn 0.2s ease-out;
  }

  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }

  /* Message deleted animation */
  .message-deleted {
    animation: fadeOut 0.5s ease forwards;
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; transform: translateY(10px); height: 0; margin: 0; padding: 0; }
  }

  /* Selection styles */
  .message-selected {
    background-color: rgba(59, 130, 246, 0.1) !important;
    border-radius: 8px;
  }

  /* Typing indicator */
  .typing-dot {
    animation: typingAnimation 1.4s infinite ease-in-out;
  }

  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }

  @keyframes typingAnimation {
    0%, 80%, 100% { 
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Textarea auto-resize */
  .auto-resize {
    resize: none;
    min-height: 40px;
    max-height: 120px;
  }

  /* Message hover actions */
  .message-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .message-wrapper:hover .message-actions {
    opacity: 1;
  }

  /* WhatsApp-style reply preview styles */
  .reply-preview-student {
    border-left: 4px solid #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  .reply-preview-admin {
    border-left: 4px solid #10b981;
    background: rgba(16, 185, 129, 0.08);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  /* Fixed layout */
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 10vh);
    position: fixed;
    top: 10vh;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
    background: #f9fafb;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .chat-layout {
      height: 100vh;
      top: 0;
    }
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
  const [deletingMessageIds, setDeletingMessageIds] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState([])
  const [showOptions, setShowOptions] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const inputRef = useRef(null)

  const studentUser = {
    id: currentUser?.uid,
    name: userData?.name || userData?.displayName || currentUser?.displayName || 'Student',
    email: currentUser?.email || 'student@example.com'
  }

  // Enhanced emoji list
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

  useEffect(() => {
    if (studentUser.id) {
      initializeChat()
    }
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [studentUser.id])

  useEffect(() => {
    // Scroll to bottom without animation
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
    }
  }, [messages, isTyping])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptions(false)
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const initializeChat = async () => {
    try {
      setLoading(true)
      setError('')
      
      const conv = await chatService.getOrCreateConversation(
        studentUser.id, 
        studentUser.name, 
        studentUser.email
      )
      setConversation(conv)

      const { data: existingMessages, error: messagesError } = await chatService.getMessages(conv.id)
      if (messagesError) {
        setError('Failed to load messages')
      } else {
        setMessages(existingMessages || [])
      }

      setupRealtimeSubscription(conv.id)
      setLoading(false)

    } catch (error) {
      setError('Failed to initialize chat. Please refresh the page.')
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (conversationId) => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      subscriptionRef.current = chatService.subscribeToMessages(conversationId, (payload) => {
        setIsOnline(true)
        
        if (typeof payload === 'object' && payload !== null && 'type' in payload) {
          if (payload.type === 'INSERT') {
            handleNewMessage(payload.data)
          } else if (payload.type === 'DELETE') {
            handleDeletedMessage(payload.data)
          }
        } else {
          handleNewMessage(payload)
        }
      })

    } catch (error) {
      setIsOnline(false)
    }
  }
  
  const handleNewMessage = (newMessage) => {
    const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
    
    if (newMessage.sender_id === studentUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
      return
    }
    
    setMessages(prev => {
      const messageExists = prev.some(msg => msg.id === newMessage.id)
      if (messageExists) return prev
      
      return [...prev, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
  }
  
  const handleDeletedMessage = (deletedMessage) => {
    setDeletingMessageIds(prev => [...prev, deletedMessage.id])
    
    setTimeout(() => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== deletedMessage.id)
      )
      setDeletingMessageIds(prev => 
        prev.filter(id => id !== deletedMessage.id)
      )
    }, 500)
  }

  const sendMessage = async (e) => {
    if (e) e.preventDefault()
    
    if (!message.trim() || !conversation || sending) return

    const text = message.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const now = new Date()
    
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
      isTemp: true,
      reply_to: replyingTo?.id
    }
    
    setMessages(prev => [...prev, tempMessage])
    setMessage('')
    setSending(true)
    setError('')
    setReplyingTo(null)

    try {
      const result = await chatService.sendMessage(
        conversation.id,
        studentUser.id,
        text,
        studentUser.name,
        'student',
        replyingTo?.id
      )

      if (result.error) throw result.error
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
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
      const { data: newMessages, error } = await chatService.getMessages(conversation.id)
      if (!error && newMessages) {
        setMessages(newMessages)
      }
    } catch (error) {
      console.error('Error manually refreshing messages:', error)
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

    if (studentOnly) {
      const msg = messages.find(m => m.id === messageId)
      if (msg && msg.sender_id !== studentUser.id) return
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
      setDeletingMessageIds(prev => [...prev, ...selectedMessages])
      
      const { error } = await chatService.deleteMessages(
        conversation.id, 
        selectedMessages
      )
      
      if (error) throw new Error(error)
      
      setTimeout(() => {
        setMessages(prev => 
          prev.filter(msg => !selectedMessages.includes(msg.id))
        )
        setDeletingMessageIds(prev => 
          prev.filter(id => !selectedMessages.includes(id))
        )
      }, 500)
      
      setShowConfirmDelete(false)
      setIsSelectionMode(false)
      setSelectedMessages([])
      
    } catch (error) {
      setError('Failed to delete selected messages. Please try again.')
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
      const { error } = await chatService.clearConversation(conversation.id)
      
      if (error) throw new Error(error)
      
      setMessages([])
      setShowConfirmClear(false)
      
    } catch (error) {
      setError('Failed to clear conversation. Please try again.')
    } finally {
      setActionInProgress(false)
    }
  }

  const handleReply = (message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const findMessageById = (messageId) => {
    return messages.find(msg => msg.id === messageId)
  }

  const getMessageGroups = () => {
    const groups = []
    let currentDate = ''
    let currentGroup = []
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at).toLocaleDateString()
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })
    
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      })
    }
    
    return groups
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let dayLabel
    
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayLabel = 'Yesterday'
    } else {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
      dayLabel = weekday
    }
    
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      year: '2-digit'
    })
    
    return `${dayLabel}, ${formattedDate}`
  }

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'Just now'
    }
  }

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/dashboard'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Setting up your chat...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to support</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="chat-layout">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center space-x-3">
              <button
                onClick={goBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800 text-sm">Support Team</h2>
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Connecting...'} • Always here to help
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Phone className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Video className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => setShowContactInfo(!showContactInfo)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Info className="w-5 h-5 text-gray-600" />
              </button>
              
              {isSelectionMode ? (
                <div className="flex items-center text-gray-700 ml-2">
                  <button
                    onClick={exitSelectionMode}
                    className="p-1.5 rounded-full hover:bg-gray-200 mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-sm">{selectedMessages.length} selected</span>
                  
                  {selectedMessages.length > 0 && (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="ml-3 text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-colors flex items-center text-xs"
                      disabled={actionInProgress}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative" ref={optionsMenuRef}>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 animate-fade-in">
                      <div className="py-1">
                        <button
                          onClick={enterSelectionMode}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <span>Select messages</span>
                        </button>
                        <button
                          onClick={checkForNewMessages}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          <span>Refresh messages</span>
                        </button>
                        <button
                          onClick={() => setShowConfirmClear(true)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>Clear chat</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-in">
            <div className="flex items-center max-w-3xl mx-auto w-full">
              <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
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

        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 animate-slide-in">
            <div className="flex items-start justify-between max-w-3xl mx-auto">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-1 h-12 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Reply className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-medium text-blue-600">
                      Replying to {replyingTo.sender_name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {replyingTo.message}
                  </p>
                </div>
              </div>
              <button 
                onClick={cancelReply}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto space-y-1">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Welcome to Support Chat</h3>
                <p className="text-gray-500 text-sm mb-6">Our team is here to help you with any questions!</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💬 Ask any question you have</p>
                  <p>⚡ Get instant responses</p>
                  <p>🔒 Your conversations are secure</p>
                  <p>📞 Professional support team</p>
                </div>
              </div>
            ) : (
              getMessageGroups().map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className="space-y-1">
                  <div className="flex justify-center">
                    <div className="inline-block bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 rounded-full">
                      {formatDate(group.date)}
                    </div>
                  </div>
                  
                  {group.messages.map((msg, msgIndex) => {
                    const isCurrentUser = msg.sender_id === studentUser.id
                    const showSender = !isCurrentUser && (
                      msgIndex === 0 || 
                      group.messages[msgIndex - 1]?.sender_id !== msg.sender_id
                    )
                    const isBeingDeleted = deletingMessageIds.includes(msg.id)
                    const isSelected = selectedMessages.includes(msg.id)
                    const repliedMessage = msg.reply_to ? findMessageById(msg.reply_to) : null
                    
                    return (
                      <div
                        key={msg.id}
                        className={`message-wrapper flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'message-deleted' : ''} ${isSelected ? 'message-selected' : ''}`}
                      >
                        <div className={`flex ${!isCurrentUser && 'items-end'} max-w-xs lg:max-w-md ${showSender ? 'mt-2' : 'mt-1'} px-2 py-1 rounded-lg`}>
                          {/* Admin Avatar */}
                          {!isCurrentUser && showSender && (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0">
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className={`flex flex-col ${!isCurrentUser && !showSender ? 'ml-10' : ''}`}>
                            {/* Sender Name */}
                            {showSender && !isCurrentUser && (
                              <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                {msg.sender_name || 'Support Team'}
                              </span>
                            )}
                            
                            {/* Message Bubble */}
                            <div
                              className={`rounded-2xl px-3 py-2 ${
                                isCurrentUser
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200'
                              } ${msg.isTemp ? 'opacity-70' : ''} ${isSelectionMode && isCurrentUser ? 'cursor-pointer' : ''}`}
                              onClick={() => isSelectionMode && toggleMessageSelection(msg.id, true)}
                            >
                              {/* WhatsApp-Style Reply Preview inside message */}
                              {repliedMessage && (
                                <div className={`${isCurrentUser ? 'reply-preview-student' : 'reply-preview-admin'}`}>
                                  <div className="flex items-center space-x-1 mb-1">
                                    <span className={`text-xs font-semibold ${
                                      repliedMessage.sender_id === studentUser.id
                                        ? (isCurrentUser ? 'text-blue-200' : 'text-blue-600')
                                        : (isCurrentUser ? 'text-green-200' : 'text-green-600')
                                    }`}>
                                      {repliedMessage.sender_id === studentUser.id ? 'You' : repliedMessage.sender_name}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${
                                    isCurrentUser 
                                      ? 'text-blue-100' 
                                      : 'text-gray-600'
                                  } truncate leading-tight`}>
                                    {repliedMessage.message}
                                  </p>
                                </div>
                              )}
                              
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
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
                                    {formatTime(msg.created_at)}
                                    {isCurrentUser && (
                                      <CheckCircle className="w-3 h-3 ml-1" />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Message Actions - Show on hover for admin messages */}
                            {!isSelectionMode && !msg.isTemp && !isCurrentUser && (
                              <div className="message-actions flex items-center justify-end space-x-1 mt-1">
                                <button 
                                  onClick={() => handleReply(msg)}
                                  className="p-1 rounded-full hover:bg-gray-200 transition-colors group"
                                  title="Reply to this message"
                                >
                                  <Reply className="w-3 h-3 text-gray-500 group-hover:text-blue-500" />
                                </button>
                                <button 
                                  onClick={() => {}}
                                  className="p-1 rounded-full hover:bg-gray-200 transition-colors group"
                                  title="Forward message"
                                >
                                  <Forward className="w-3 h-3 text-gray-500 group-hover:text-blue-500" />
                                </button>
                                <button 
                                  onClick={() => {}}
                                  className="p-1 rounded-full hover:bg-gray-200 transition-colors group"
                                  title="Star message"
                                >
                                  <Star className="w-3 h-3 text-gray-500 group-hover:text-yellow-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-end max-w-xs lg:max-w-md mt-1 px-2 py-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 flex-shrink-0">
          <form onSubmit={sendMessage} className="flex items-end space-x-2 max-w-3xl mx-auto">
            {/* Attachment Button */}
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              disabled={isSelectionMode}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Emoji Picker */}
                        <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                disabled={isSelectionMode}
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 w-64 h-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-y-auto custom-scrollbar animate-fade-in">
                  <div className="p-3 grid grid-cols-8 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  replyingTo 
                    ? `Replying to ${replyingTo.sender_name}...` 
                    : isSelectionMode 
                      ? 'Exit selection mode to type...'
                      : 'Type a message...'
                }
                disabled={sending || !conversation || isSelectionMode}
                rows="1"
                className="w-full rounded-2xl py-3 px-4 bg-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 auto-resize custom-scrollbar"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || sending || !conversation || isSelectionMode}
              className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                message.trim() && !sending && conversation && !isSelectionMode
                  ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600 transform hover:scale-105' 
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

        {/* Contact Info Sidebar */}
        {showContactInfo && (
          <div className="absolute inset-0 bg-white z-30 animate-slide-in">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Support Info</h2>
                <button 
                  onClick={() => setShowContactInfo(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Support Team</h3>
                <p className="text-gray-500 text-sm mb-6">Always here to help</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-blue-500 text-sm font-medium">Under 5 minutes</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Availability</span>
                    <span className="text-green-500 text-sm font-medium">24/7</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Languages</span>
                    <span className="text-gray-500 text-sm">English, Spanish, French</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <button className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Request Call Back
                  </button>
                  <button className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                    <Archive className="w-4 h-4 inline mr-2" />
                    View FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clear Chat Confirmation Modal */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Clear entire chat?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-colors flex items-center justify-center"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    'Clear Chat'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Messages Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Delete {selectedMessages.length} {selectedMessages.length === 1 ? 'message' : 'messages'}?
              </h3>
              <p className="text-gray-500 text-sm text-center mb-6">
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-colors flex items-center justify-center"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
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

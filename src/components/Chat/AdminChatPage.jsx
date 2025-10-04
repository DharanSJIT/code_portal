import React, { useState, useEffect, useRef } from 'react'
import { Search, MessageCircle, Send, Loader, User, RefreshCw, Clock, CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, X, Trash } from 'lucide-react'
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
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
  }

  .chat-header {
    flex-shrink: 0;
  }

  .chat-messages {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 1.5rem;
  }

  .chat-input {
    flex-shrink: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    padding: 1rem;
  }
`;

const AdminChatPage = () => {
  const { currentUser, userData } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
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
  const [searchQuery, setSearchQuery] = useState('')
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)

  const adminUser = {
    id: 'admin_1',
    name: 'Admin Support',
    role: 'admin'
  }

  useEffect(() => {
    initializeAdminChat()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        console.log('🧹 Cleaned up admin message subscription')
      }
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe()
        console.log('🧹 Cleaned up admin conversation subscription')
      }
    }
  }, [])

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
        
        // Set up subscription for new conversations
        setupConversationSubscription()
      }

      setLoading(false)

    } catch (error) {
      console.error('💥 Error initializing admin chat:', error)
      setError('Failed to initialize admin chat. Please refresh the page.')
      setLoading(false)
    }
  }

  const setupConversationSubscription = () => {
    try {
      console.log('🔔 Setting up real-time subscription for conversations')
      
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe()
      }

      conversationSubscriptionRef.current = chatService.subscribeToConversations((payload) => {
        console.log('🔄 Real-time conversation event:', payload)
        
        if (payload.eventType === 'INSERT') {
          // New conversation
          handleNewConversation(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          // Updated conversation
          handleUpdatedConversation(payload.new)
        } else if (payload.eventType === 'DELETE') {
          // Deleted conversation
          handleDeletedConversation(payload.old)
        }
      })

    } catch (error) {
      console.error('❌ Error setting up conversation subscription:', error)
    }
  }
  
  const handleNewConversation = (newConversation) => {
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.some(conv => conv.id === newConversation.id)
      if (exists) return prev
      
      return [newConversation, ...prev].sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )
    })
  }
  
  const handleUpdatedConversation = (updatedConversation) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      ).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )
    )
    
    // If this is the selected conversation, update last_message property
    if (selectedConversation && selectedConversation.id === updatedConversation.id) {
      setSelectedConversation(updatedConversation)
    }
  }
  
  const handleDeletedConversation = (deletedConversation) => {
    setConversations(prev => 
      prev.filter(conv => conv.id !== deletedConversation.id)
    )
    
    // If this was the selected conversation, deselect it
    if (selectedConversation && selectedConversation.id === deletedConversation.id) {
      setSelectedConversation(null)
      setMessages([])
    }
  }

  const selectConversation = async (conversation) => {
    try {
      // Exit selection mode if active when switching conversations
      if (isSelectionMode) {
        exitSelectionMode()
      }
      
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
        // Ensure all messages have valid dates - fix for Invalid Date issue
        const processedMessages = convMessages.map(msg => ({
          ...msg,
          // Ensure created_at is a valid date string
          created_at: ensureValidDate(msg.created_at)
        }));
        
        setMessages(processedMessages || [])
        console.log('📨 Loaded', convMessages?.length || 0, 'messages for conversation')
      }

      setupRealtimeSubscription(conversation.id)

    } catch (error) {
      console.error('❌ Error selecting conversation:', error)
      setError('Failed to load conversation')
    }
  }

  // Helper function to ensure valid date
  const ensureValidDate = (dateStr) => {
    try {
      // Test if it's a valid date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // If invalid, return current time
        return new Date().toISOString();
      }
      return dateStr;
    } catch (e) {
      // If any error occurs, return current time
      return new Date().toISOString();
    }
  }
  
  // Format time safely
  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Just now'; // Fallback for invalid dates
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just now';
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
          } else if (payload.type === 'UPDATE') {
            handleUpdatedMessage(payload.data)
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
    // Fix the date if it's invalid
    newMessage.created_at = ensureValidDate(newMessage.created_at);
    
    // Create message signature for our own sent messages
    const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
    
    // Only skip if this is OUR message that we just sent
    if (newMessage.sender_id === adminUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
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
    
    // Update conversation last message if needed
    if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
      updateConversationInList(selectedConversation.id, newMessage.message, newMessage.created_at)
    }
  }
  
  const handleUpdatedMessage = (updatedMessage) => {
    // Fix the date if it's invalid
    updatedMessage.created_at = ensureValidDate(updatedMessage.created_at);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    )
  }
  
  const handleDeletedMessage = (deletedMessage) => {
    console.log('🗑️ Handling deleted message in admin chat:', deletedMessage)
    
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
  
  const updateConversationInList = (conversationId, lastMessage, lastMessageAt) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            last_message: lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage,
            last_message_at: lastMessageAt
          }
        }
        return conv
      }).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )
    })
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
    
    const messageKey = `${adminUser.id}-${text}-${Math.floor(now.getTime() / 1000)}`
    sentMessageTimestampsRef.current.add(messageKey)
    
    setTimeout(() => {
      sentMessageTimestampsRef.current.delete(messageKey)
    }, 3000)
    
    const tempMessage = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_id: adminUser.id,
      sender_name: adminUser.name,
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
        adminUser.id,
        text,
        adminUser.name,
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
      
      // Update conversation last message
      updateConversationInList(selectedConversation.id, text, now.toISOString())
      
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

  const retryConnection = () => {
    setError('')
    if (selectedConversation) {
      setupRealtimeSubscription(selectedConversation.id)
    } else {
      initializeAdminChat()
    }
  }

  const checkForNewMessages = async () => {
    if (!selectedConversation) return
    
    try {
      console.log('🔄 Manually checking for new messages...')
      const { data: newMessages, error } = await chatService.getMessages(selectedConversation.id)
      if (!error && newMessages) {
        // Process dates to ensure they're valid
        const processedMessages = newMessages.map(msg => ({
          ...msg,
          created_at: ensureValidDate(msg.created_at)
        }));
        setMessages(processedMessages)
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

  const toggleMessageSelection = (messageId) => {
    if (!isSelectionMode) return
    
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
      
      // First mark messages as being deleted (for animation)
      setDeletingMessageIds(prev => [...prev, ...selectedMessages])
      
      const { error } = await chatService.deleteMessages(
        selectedConversation.id, 
        selectedMessages
      )
      
      if (error) {
        throw new Error(error)
      }
      
      // Remove messages from state after animation
      setTimeout(() => {
        setMessages(prev => 
          prev.filter(msg => !selectedMessages.includes(msg.id))
        )
        // Clean up deleting IDs array
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
    if (!selectedConversation) return
    
    setActionInProgress(true)
    try {
      console.log('🧹 Clearing all messages from conversation:', selectedConversation.id)
      
      const { error } = await chatService.clearConversation(selectedConversation.id)
      
      if (error) {
        throw new Error(error)
      }
      
      setMessages([])
      
      // Update conversation in list
      updateConversationInList(
        selectedConversation.id, 
        'Chat cleared',
        new Date().toISOString()
      )
      
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
      try {
        // Use a safer date parsing approach
        const messageDate = new Date(ensureValidDate(message.created_at)).toLocaleDateString();
        
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
      } catch (e) {
        console.error("Error processing message date:", e);
        // Add to current group anyway to ensure message is displayed
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Today"; // Fallback for invalid dates
      }
      
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
    } catch (e) {
      return "Today"; // Fallback for any errors
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    const studentName = (conv.student_name || '').toLowerCase();
    const studentEmail = (conv.student_email || '').toLowerCase();
    const lastMessage = (conv.last_message || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return studentName.includes(query) || 
           studentEmail.includes(query) ||
           lastMessage.includes(query);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin chat...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up conversations</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
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

          <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                      {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
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
              <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
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
                            className="ml-4 text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-colors flex items-center text-xs"
                            disabled={actionInProgress}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    ) : (
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
                              <button
                                onClick={checkForNewMessages}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                <span>Refresh messages</span>
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
                <div className="bg-red-50 border-y border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-down">
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
                className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 custom-scrollbar"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 mb-2">No messages yet</p>
                      <p className="text-gray-500">Start a conversation with the student!</p>
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
                          const isAdmin = msg.sender_role === 'admin' || msg.sender_id === adminUser.id;
                          const showSender = !isAdmin && (
                            msgIndex === 0 || 
                            group.messages[msgIndex - 1]?.sender_id !== msg.sender_id
                          );
                          const isBeingDeleted = deletingMessageIds.includes(msg.id);
                          const isSelected = selectedMessages.includes(msg.id);
                          
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'message-deleted' : ''}`}
                              onClick={() => isSelectionMode && toggleMessageSelection(msg.id)}
                            >
                              <div className={`flex ${!isAdmin && 'items-end'} max-w-xs lg:max-w-md ${showSender ? 'mt-4' : 'mt-1'}`}>
                                {/* Student Avatar */}
                                {!isAdmin && showSender && (
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0">
                                    <span className="text-white font-semibold text-xs">
                                      {msg.sender_name?.charAt(0).toUpperCase() || 'S'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Message Content */}
                                <div className={`flex flex-col ${!isAdmin && !showSender ? 'ml-10' : ''}`}>
                                  {/* Sender Name */}
                                  {showSender && !isAdmin && (
                                    <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                      {msg.sender_name || selectedConversation.student_name || 'Student'}
                                    </span>
                                  )}
                                  
                                  {/* Message Bubble */}
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 ${
                                      isAdmin
                                        ? 'bg-blue-500 text-white rounded-br-none shadow-sm'
                                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                                    } ${msg.isTemp ? 'opacity-70' : ''} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                                    ${isSelectionMode ? 'cursor-pointer hover:opacity-90' : ''}`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words leading-snug">{msg.message}</p>
                                    <div className={`flex items-center text-xs mt-1 ${
                                      isAdmin ? 'text-blue-100 justify-end' : 'text-gray-400'
                                    }`}>
                                      {msg.isTemp ? (
                                        <div className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          <span>Sending...</span>
                                        </div>
                                      ) : (
                                        <>
                                          {/* Use the safe time formatting function */}
                                          {formatTime(msg.created_at)}
                                          {isAdmin && (
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

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
                <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-3xl mx-auto">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={sending || isSelectionMode}
                      className="w-full rounded-full py-3 px-4 pl-5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 border border-gray-200 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!message.trim() || sending || isSelectionMode}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      message.trim() && !sending && !isSelectionMode
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 max-w-md p-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p>Choose a student from the sidebar to start chatting</p>
              </div>
            </div>
          )}

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
      </div>
    </>
  )
}

export default AdminChatPage

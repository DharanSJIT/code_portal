import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, MessageCircle, Send, Loader, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, 
  X, Trash, Paperclip, Smile, Mic, Video, Phone, Info, Archive, 
  Reply, Forward, Star, Download, Image as ImageIcon, File, Ban 
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

  /* Animations */
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

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
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

  .animate-bounce-slow {
    animation: bounce 1.5s ease-in-out infinite;
  }

  /* Message animations */
  @keyframes messageSlideIn {
    from { 
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .message-enter {
    animation: messageSlideIn 0.2s ease-out;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .chat-container {
      height: 100vh;
      height: 100dvh;
    }
    
    .sidebar-mobile {
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
    }
    
    .sidebar-mobile.open {
      transform: translateX(0);
    }
    
    .chat-area-mobile {
      transform: translateX(0);
      transition: transform 0.3s ease-in-out;
    }
    
    .chat-area-mobile.hidden {
      transform: translateX(100%);
    }
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
`

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
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [forwardMessage, setForwardMessage] = useState(null)
  const [attachments, setAttachments] = useState([])
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const inputRef = useRef(null)

  const adminUser = {
    id: 'admin_1',
    name: 'Admin Support',
    role: 'admin',
    avatar: 'A'
  }

  // Enhanced emoji list
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

  useEffect(() => {
    initializeAdminChat()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom('auto') // Use 'auto' for instant scroll when messages load
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

  useEffect(() => {
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(!selectedConversation)
      } else {
        setShowSidebar(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedConversation])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      })
    }, 100)
  }

  // Force scroll to bottom when conversation is selected
  const forceScrollToBottom = () => {
    setTimeout(() => {
      const messagesContainer = messagesContainerRef.current
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }, 150)
  }

  const initializeAdminChat = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: convs, error: convError } = await chatService.getAdminConversations()
      if (convError) {
        setError('Failed to load conversations')
      } else {
        setConversations(convs || [])
        setupConversationSubscription()
      }

      setLoading(false)
    } catch (error) {
      setError('Failed to initialize admin chat')
      setLoading(false)
    }
  }

  const setupConversationSubscription = () => {
    try {
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe()
      }

      conversationSubscriptionRef.current = chatService.subscribeToConversations((payload) => {
        if (payload.eventType === 'INSERT') {
          handleNewConversation(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          handleUpdatedConversation(payload.new)
        } else if (payload.eventType === 'DELETE') {
          handleDeletedConversation(payload.old)
        }
      })
    } catch (error) {
      console.error('Error setting up conversation subscription:', error)
    }
  }

  const handleNewConversation = (newConversation) => {
    setConversations(prev => {
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
    
    if (selectedConversation && selectedConversation.id === updatedConversation.id) {
      setSelectedConversation(updatedConversation)
    }
  }

  const handleDeletedConversation = (deletedConversation) => {
    setConversations(prev => 
      prev.filter(conv => conv.id !== deletedConversation.id)
    )
    
    if (selectedConversation && selectedConversation.id === deletedConversation.id) {
      setSelectedConversation(null)
      setMessages([])
    }
  }

  const selectConversation = async (conversation) => {
    try {
      if (isSelectionMode) exitSelectionMode()
      if (replyingTo) setReplyingTo(null)
      
      setSelectedConversation(conversation)
      setMessages([])
      setError('')
      sentMessageTimestampsRef.current.clear()
      
      // Hide sidebar on mobile when conversation is selected
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }

      const { data: convMessages, error: messagesError } = await chatService.getMessages(conversation.id)
      if (messagesError) {
        setError('Failed to load messages')
      } else {
        const processedMessages = convMessages.map(msg => ({
          ...msg,
          created_at: ensureValidDate(msg.created_at)
        }));
        setMessages(processedMessages || [])
        
        // Force scroll to bottom after messages are loaded
        setTimeout(() => {
          forceScrollToBottom()
        }, 200)
      }

      setupRealtimeSubscription(conversation.id)
    } catch (error) {
      setError('Failed to load conversation')
    }
  }

  const ensureValidDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? new Date().toISOString() : dateStr;
    } catch (e) {
      return new Date().toISOString();
    }
  }

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just now';
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
          } else if (payload.type === 'UPDATE') {
            handleUpdatedMessage(payload.data)
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
    newMessage.created_at = ensureValidDate(newMessage.created_at);
    
    const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
    
    if (newMessage.sender_id === adminUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
      return
    }
    
    setMessages(prev => {
      const messageExists = prev.some(msg => msg.id === newMessage.id)
      if (messageExists) return prev
      
      return [...prev, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })
    
    if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
      updateConversationInList(selectedConversation.id, newMessage.message, newMessage.created_at)
    }
  }

  const handleUpdatedMessage = (updatedMessage) => {
    updatedMessage.created_at = ensureValidDate(updatedMessage.created_at);
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    )
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
    
    if (!message.trim() || !selectedConversation || sending) return

    const text = message.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const now = new Date()
    
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
      isTemp: true,
      reply_to: replyingTo
    }
    
    setMessages(prev => [...prev, tempMessage])
    setMessage('')
    setSending(true)
    setError('')
    setReplyingTo(null)

    try {
      const result = await chatService.sendMessage(
        selectedConversation.id,
        adminUser.id,
        text,
        adminUser.name,
        'admin',
        replyingTo?.id
      )

      if (result.error) throw result.error
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
      updateConversationInList(selectedConversation.id, text, now.toISOString())
      
    } catch (error) {
      setError('Failed to send message')
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
      const { data: newMessages, error } = await chatService.getMessages(selectedConversation.id)
      if (!error && newMessages) {
        const processedMessages = newMessages.map(msg => ({
          ...msg,
          created_at: ensureValidDate(msg.created_at)
        }));
        setMessages(processedMessages)
        
        // Scroll to bottom after refreshing messages
        setTimeout(() => {
          forceScrollToBottom()
        }, 100)
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
      setDeletingMessageIds(prev => [...prev, ...selectedMessages])
      
      const { error } = await chatService.deleteMessages(
        selectedConversation.id, 
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
      setError('Failed to delete selected messages')
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
      const { error } = await chatService.clearConversation(selectedConversation.id)
      
      if (error) throw new Error(error)
      
      setMessages([])
      updateConversationInList(
        selectedConversation.id, 
        'Chat cleared',
        new Date().toISOString()
      )
      
      setShowConfirmClear(false)
      
    } catch (error) {
      setError('Failed to clear conversation')
    } finally {
      setActionInProgress(false)
    }
  }

  const getMessageGroups = () => {
    const groups = [];
    let currentDate = '';
    let currentGroup = [];
    
    messages.forEach(message => {
      try {
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Today";
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dayLabel;
      
      if (date.toDateString() === today.toDateString()) {
        dayLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Yesterday';
      } else {
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        dayLabel = weekday;
      }
      
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric',
        year: '2-digit'
      });
      
      return `${dayLabel}, ${formattedDate}`;
    } catch (e) {
      return "Today";
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const studentName = (conv.student_name || '').toLowerCase();
    const studentEmail = (conv.student_email || '').toLowerCase();
    const lastMessage = (conv.last_message || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return studentName.includes(query) || 
           studentEmail.includes(query) ||
           lastMessage.includes(query);
  });

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    setAttachments(prev => [...prev, ...files])
    // Here you would typically upload files to your storage service
  }

  const findMessageById = (messageId) => {
    return messages.find(msg => msg.id === messageId)
  }

  const handleReply = (message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const handleForward = (message) => {
    setForwardMessage(message)
  }

  const cancelForward = () => {
    setForwardMessage(null)
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  const goBackToConversations = () => {
    setSelectedConversation(null)
    if (window.innerWidth < 768) {
      setShowSidebar(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading admin chat...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up conversations</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex h-screen bg-gray-50 chat-container">
        {/* Conversations Sidebar */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col absolute md:relative z-20 h-full sidebar-mobile ${showSidebar ? 'open' : ''}`}>
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-800">Chats</h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={initializeAdminChat}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No conversations</p>
                <p className="text-sm">When students message you, they'll appear here.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 group ${
                    selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {conversation.student_name?.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                      {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div> */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">
                          {conversation.student_name || 'Student'}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white chat-area-mobile ${!showSidebar ? 'flex' : 'hidden md:flex'} ${selectedConversation ? '' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={goBackToConversations}
                      className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 text-gray-600 transform -rotate-90" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {selectedConversation.student_name?.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-800 text-sm">
                        {selectedConversation.student_name || 'Student'}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isOnline ? 'Online' : 'Offline'} • {selectedConversation.student_email || 'No email'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* Contact Info Button */}
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
                <div className="bg-red-50 border-y border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-in">
                  <div className="flex items-center">
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
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-8 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Replying to {replyingTo.sender_name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{replyingTo.message}</p>
                    </div>
                  </div>
                  <button 
                    onClick={cancelReply}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 custom-scrollbar"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <div className="flex-1 min-h-0">
                  <div className="max-w-3xl mx-auto space-y-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-600 mb-2">No messages yet</p>
                        <p className="text-gray-500 text-sm">Start a conversation with the student!</p>
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
                            const isAdmin = msg.sender_role === 'admin' || msg.sender_id === adminUser.id;
                            const showSender = !isAdmin && (
                              msgIndex === 0 || 
                              group.messages[msgIndex - 1]?.sender_id !== msg.sender_id
                            );
                            const isBeingDeleted = deletingMessageIds.includes(msg.id);
                            const isSelected = selectedMessages.includes(msg.id);
                            const repliedMessage = msg.reply_to ? findMessageById(msg.reply_to) : null;
                            
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'message-deleted' : 'message-enter'} ${isSelected ? 'message-selected' : ''}`}
                                onClick={() => isSelectionMode && toggleMessageSelection(msg.id)}
                              >
                                <div className={`flex ${!isAdmin && 'items-end'} max-w-xs lg:max-w-md ${showSender ? 'mt-2' : 'mt-1'} px-2 py-1 rounded-lg ${isSelectionMode ? 'cursor-pointer' : ''}`}>
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
                                    
                                    {/* Reply Preview */}
                                    {repliedMessage && (
                                      <div className="bg-black bg-opacity-10 rounded-lg p-2 mb-1 border-l-2 border-green-500">
                                        <p className="text-xs font-medium text-gray-600">
                                          {repliedMessage.sender_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {repliedMessage.message}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Message Bubble */}
                                    <div
                                      className={`rounded-2xl px-3 py-2 ${
                                        isAdmin
                                          ? 'bg-green-500 text-white rounded-br-md'
                                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200'
                                      } ${msg.isTemp ? 'opacity-70' : ''}`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                                      <div className={`flex items-center text-xs mt-1 ${
                                        isAdmin ? 'text-green-100 justify-end' : 'text-gray-400'
                                      }`}>
                                        {msg.isTemp ? (
                                          <div className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            <span>Sending...</span>
                                          </div>
                                        ) : (
                                          <>
                                            {formatTime(msg.created_at)}
                                            {isAdmin && (
                                              <CheckCircle className="w-3 h-3 ml-1" />
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Message Actions */}
                                    {!isSelectionMode && (
                                      <div className="flex items-center justify-end space-x-2 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => handleReply(msg)}
                                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                          title="Reply"
                                        >
                                          <Reply className="w-3 h-3 text-gray-500" />
                                        </button>
                                        <button 
                                          onClick={() => handleForward(msg)}
                                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                          title="Forward"
                                        >
                                          <Forward className="w-3 h-3 text-gray-500" />
                                        </button>
                                        <button 
                                          onClick={() => toggleMessageSelection(msg.id)}
                                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                          title="Select"
                                        >
                                          <Star className="w-3 h-3 text-gray-500" />
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
                      <div className="flex justify-start">
                        <div className="flex items-end max-w-xs lg:max-w-md mt-1 px-2 py-1">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {selectedConversation.student_name?.charAt(0).toUpperCase() || 'S'}
                            </span>
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

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="fixed bottom-20 right-4 bg-green-500 text-white shadow-lg rounded-full p-3 z-10 hover:bg-green-600 transition-all duration-200 transform hover:scale-105 animate-bounce-slow"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0">
                <form onSubmit={sendMessage} className="flex items-end space-x-2 max-w-3xl mx-auto">
                  {/* Attachment Button */}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />

                  {/* Emoji Picker */}
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 w-64 h-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-y-auto custom-scrollbar">
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
                      placeholder="Type a message..."
                      disabled={sending || isSelectionMode}
                      rows="1"
                      className="w-full rounded-2xl py-3 px-4 bg-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 text-gray-700 disabled:opacity-50 transition-all duration-200 auto-resize custom-scrollbar"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!message.trim() || sending || isSelectionMode}
                    className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                      message.trim() && !sending && !isSelectionMode
                        ? 'bg-green-500 text-white shadow-sm hover:bg-green-600 transform hover:scale-105' 
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
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500 max-w-md p-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">Welcome to Admin Chat</h3>
                <p className="text-gray-600 mb-6">Select a conversation from the sidebar to start chatting with students.</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💬 Reply to specific messages</p>
                  <p>📎 Share files and documents</p>
                  <p>😊 Use emojis to express yourself</p>
                  <p>🔍 Search through conversations</p>
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
      </div>
    </>
  )
}

export default AdminChatPage
import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, MessageCircle, Send, Loader, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, 
  X, Trash, Paperclip, Smile, Mic, Video, Phone, Info, Archive, 
  Reply, Forward, Star, Download, Image as ImageIcon, File, Ban, UserX 
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { chatService } from '../../services/chatService'
import { collection, query, where, getDocs, doc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

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

  /* Student removal animation */
  @keyframes slideOut {
    from { 
      opacity: 1;
      transform: translateX(0);
      max-height: 100px;
    }
    to { 
      opacity: 0;
      transform: translateX(-100%);
      max-height: 0;
    }
  }

  .student-removing {
    animation: slideOut 0.3s ease-in-out forwards;
  }

  /* New conversation highlight */
  @keyframes highlightNew {
    from { 
      background-color: rgba(34, 197, 94, 0.2);
      transform: scale(1.02);
    }
    to { 
      background-color: transparent;
      transform: scale(1);
    }
  }

  .new-conversation {
    animation: highlightNew 2s ease-out;
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
  const [showConfirmDeleteStudent, setShowConfirmDeleteStudent] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [forwardMessage, setForwardMessage] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [studentProfiles, setStudentProfiles] = useState({})
  const [removingStudents, setRemovingStudents] = useState([])
  const [newConversationIds, setNewConversationIds] = useState([])
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  const allMessagesSubscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const inputRef = useRef(null)
  const processedConversationIds = useRef(new Set())

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
      if (allMessagesSubscriptionRef.current) {
        allMessagesSubscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom('auto')
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  // Clear new conversation highlight after 3 seconds
  useEffect(() => {
    if (newConversationIds.length > 0) {
      const timer = setTimeout(() => {
        setNewConversationIds([])
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [newConversationIds])

  // Function to check if a conversation has real messages
  const hasRealMessages = async (conversationId) => {
    try {
      const { data: msgs, error } = await chatService.getMessages(conversationId)
      if (error || !msgs || msgs.length === 0) {
        return false
      }
      
      // Check if there are any real messages (not system messages)
      const realMessages = msgs.filter(msg => 
        msg.message && 
        msg.message.trim() !== '' &&
        msg.message !== 'Conversation created' &&
        msg.message !== 'Chat cleared' &&
        msg.sender_role !== 'system' &&
        !msg.message.includes('joined the chat') &&
        !msg.message.includes('created account')
      )
      
      return realMessages.length > 0
    } catch (error) {
      console.error('Error checking messages:', error)
      return false
    }
  }

  // Function to determine if a conversation should be shown
  const shouldShowConversation = (conversation) => {
    if (!conversation) return false
    
    // Must have a student_id
    if (!conversation.student_id) return false
    
    // Must have a meaningful last message
    if (!conversation.last_message || 
        conversation.last_message.trim() === '' ||
        conversation.last_message === 'Conversation created' ||
        conversation.last_message === 'Chat cleared' ||
        conversation.last_message === 'Welcome message' ||
        conversation.last_message.includes('joined the chat') ||
        conversation.last_message.includes('created account')) {
      return false
    }
    
    // Check if last_message_at exists and is different from created_at
    if (conversation.created_at && conversation.last_message_at) {
      const createdTime = new Date(conversation.created_at).getTime()
      const lastMessageTime = new Date(conversation.last_message_at).getTime()
      
      // If they're the same or very close (within 1 second), it's likely auto-created
      if (Math.abs(lastMessageTime - createdTime) < 1000) {
        return false
      }
    }
    
    return true
  }

  // Fetch student profile by ID
  const fetchStudentProfile = async (studentId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', studentId))
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          id: studentId,
          name: data.name || data.displayName || data.firstName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email?.split('@')[0] || 'Student',
          email: data.email || '',
          avatar: data.photoURL || data.avatar || null,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen || null
        }
      }
    } catch (error) {
      console.warn(`Could not fetch profile for student ${studentId}:`, error)
    }
    return null
  }

  // Only fetch student profiles for conversations with real messages
  const fetchStudentProfiles = async (conversations) => {
    try {
      const profiles = {}
      
      // Filter conversations more strictly
      const validConversations = []
      
      for (const conv of conversations) {
        if (shouldShowConversation(conv)) {
          // Double-check by looking at actual messages
          const hasReal = await hasRealMessages(conv.id)
          if (hasReal) {
            validConversations.push(conv)
          }
        }
      }
      
      console.log('Valid conversations after filtering:', validConversations.length)
      
      const studentIds = validConversations.map(conv => conv.student_id).filter(id => id)
      
      if (studentIds.length > 0) {
        for (const studentId of studentIds) {
          const profile = await fetchStudentProfile(studentId)
          if (profile) {
            profiles[studentId] = profile
          }
        }
      }
      
      setStudentProfiles(profiles)
    } catch (error) {
      console.error('Error fetching student profiles:', error)
    }
  }

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      })
    }, 100)
  }

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
      
      console.log('Initializing admin chat...')
      
      // Get existing conversations first
      const { data: convs, error: convError } = await chatService.getAdminConversations()
      if (convError) {
        setError('Failed to load conversations')
        console.error('Conversation error:', convError)
      } else {
        console.log('Raw conversations from database:', convs?.length || 0)
        
        // Apply strict filtering
        const validConversations = []
        
        if (convs && convs.length > 0) {
          for (const conv of convs) {
            if (shouldShowConversation(conv)) {
              // Double-check with actual messages
              const hasReal = await hasRealMessages(conv.id)
              if (hasReal) {
                validConversations.push(conv)
                processedConversationIds.current.add(conv.id)
              } else {
                console.log('Filtered out conversation with no real messages:', conv.id)
              }
            } else {
              console.log('Filtered out conversation:', conv.id, conv.last_message)
            }
          }
        }
        
        console.log('Valid conversations after filtering:', validConversations.length)
        setConversations(validConversations)
        
        // Fetch student profiles only for valid conversations
        if (validConversations.length > 0) {
          await fetchStudentProfiles(validConversations)
        }
        
        setupConversationSubscription()
        setupGlobalMessageSubscription()
      }

      setLoading(false)
    } catch (error) {
      console.error('Error initializing admin chat:', error)
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
        console.log('Conversation subscription event:', payload.eventType, payload)
        
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

  // Setup global message subscription to catch new student messages
  const setupGlobalMessageSubscription = () => {
    try {
      if (allMessagesSubscriptionRef.current) {
        allMessagesSubscriptionRef.current.unsubscribe()
      }

      // Subscribe to all messages to catch new student first messages
      allMessagesSubscriptionRef.current = chatService.subscribeToAllMessages(async (payload) => {
        console.log('Global message event:', payload.eventType, payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          const newMessage = payload.new
          
          // Check if this is a student's message (not admin)
          if (newMessage.sender_role === 'student' && newMessage.sender_id !== adminUser.id) {
            console.log('New student message detected:', newMessage)
            
            // Check if we already have this conversation
            const existsInList = conversations.some(conv => conv.id === newMessage.conversation_id)
            
            if (!existsInList && !processedConversationIds.current.has(newMessage.conversation_id)) {
              console.log('New conversation needed for message:', newMessage.conversation_id)
              
              // Get the full conversation data
              try {
                const { data: conversation, error } = await chatService.getConversation(newMessage.conversation_id)
                if (!error && conversation) {
                  console.log('Retrieved conversation data:', conversation)
                  await handleNewConversationFromMessage(conversation, newMessage)
                }
              } catch (error) {
                console.error('Error getting conversation for new message:', error)
              }
            } else {
              console.log('Conversation already exists or processed:', newMessage.conversation_id)
            }
          }
        }
      })
    } catch (error) {
      console.error('Error setting up global message subscription:', error)
    }
  }

  // Handle new conversation created from a student message
  const handleNewConversationFromMessage = async (conversation, firstMessage) => {
    console.log('Processing new conversation from message:', conversation.id)
    
    // Validate the conversation
    if (!shouldShowConversation(conversation)) {
      console.log('New conversation failed validation:', conversation.id)
      return
    }

    // Double-check it has real messages
    const hasReal = await hasRealMessages(conversation.id)
    if (!hasReal) {
      console.log('New conversation has no real messages:', conversation.id)
      return
    }

    console.log('Adding new conversation to list:', conversation.id)
    
    // Mark as processed
    processedConversationIds.current.add(conversation.id)
    
    // Add to new conversation list for highlighting
    setNewConversationIds(prev => [...prev, conversation.id])
    
    // Add to conversations list
    setConversations(prev => {
      const exists = prev.some(conv => conv.id === conversation.id)
      if (exists) return prev
      
      const updated = [conversation, ...prev].sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )
      
      console.log('Updated conversations list, new count:', updated.length)
      return updated
    })

    // Fetch student profile if we don't have it
    if (conversation.student_id && !studentProfiles[conversation.student_id]) {
      console.log('Fetching profile for new student:', conversation.student_id)
      const profile = await fetchStudentProfile(conversation.student_id)
      if (profile) {
        setStudentProfiles(prev => ({
          ...prev,
          [conversation.student_id]: profile
        }))
      }
    }
  }

  const handleNewConversation = async (newConversation) => {
    console.log('New conversation received via subscription:', newConversation)
    
    // Skip if already processed
    if (processedConversationIds.current.has(newConversation.id)) {
      console.log('Conversation already processed:', newConversation.id)
      return
    }
    
    // Strict filtering for new conversations
    if (!shouldShowConversation(newConversation)) {
      console.log('Rejected new conversation - failed shouldShowConversation')
      return
    }
    
    // Check if it has real messages
    const hasReal = await hasRealMessages(newConversation.id)
    if (!hasReal) {
      console.log('Rejected new conversation - no real messages')
      return
    }

    console.log('Accepting new conversation:', newConversation.id)
    
    // Mark as processed
    processedConversationIds.current.add(newConversation.id)
    
    // Add to new conversation list for highlighting
    setNewConversationIds(prev => [...prev, newConversation.id])

    setConversations(prev => {
      const exists = prev.some(conv => conv.id === newConversation.id)
      if (exists) return prev
      
      return [newConversation, ...prev].sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )
    })

    // Fetch profile for the new student
    if (newConversation.student_id && !studentProfiles[newConversation.student_id]) {
      const profile = await fetchStudentProfile(newConversation.student_id)
      if (profile) {
        setStudentProfiles(prev => ({
          ...prev,
          [newConversation.student_id]: profile
        }))
      }
    }
  }

  const handleUpdatedConversation = async (updatedConversation) => {
    console.log('Updated conversation received:', updatedConversation)
    
    // Check if the updated conversation should still be shown
    if (!shouldShowConversation(updatedConversation)) {
      console.log('Removing updated conversation - failed shouldShowConversation')
      // Remove from conversations if it no longer qualifies
      setConversations(prev => 
        prev.filter(conv => conv.id !== updatedConversation.id)
      )
      processedConversationIds.current.delete(updatedConversation.id)
      return
    }
    
    // Double-check with messages
    const hasReal = await hasRealMessages(updatedConversation.id)
    if (!hasReal) {
      console.log('Removing updated conversation - no real messages')
      setConversations(prev => 
        prev.filter(conv => conv.id !== updatedConversation.id)
      )
      processedConversationIds.current.delete(updatedConversation.id)
      return
    }

    // Check if this is a new conversation being updated (first real message)
    const existsInList = conversations.some(conv => conv.id === updatedConversation.id)
    
    if (!existsInList && !processedConversationIds.current.has(updatedConversation.id)) {
      console.log('Updated conversation is actually new, adding to list')
      processedConversationIds.current.add(updatedConversation.id)
      setNewConversationIds(prev => [...prev, updatedConversation.id])
      
      setConversations(prev => 
        [updatedConversation, ...prev].sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      )
      
      // Fetch student profile if needed
      if (updatedConversation.student_id && !studentProfiles[updatedConversation.student_id]) {
        const profile = await fetchStudentProfile(updatedConversation.student_id)
        if (profile) {
          setStudentProfiles(prev => ({
            ...prev,
            [updatedConversation.student_id]: profile
          }))
        }
      }
    } else {
      // Regular update
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        ).sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      )
    }
    
    if (selectedConversation && selectedConversation.id === updatedConversation.id) {
      setSelectedConversation(updatedConversation)
    }
  }

  const handleDeletedConversation = (deletedConversation) => {
    console.log('Deleted conversation:', deletedConversation)
    setConversations(prev => 
      prev.filter(conv => conv.id !== deletedConversation.id)
    )
    
    processedConversationIds.current.delete(deletedConversation.id)
    
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

  // Delete chat and remove student profile from messenger only (keep Firebase account)
  const handleDeleteStudentFromChat = async () => {
    if (!selectedConversation) return
    
    setActionInProgress(true)
    try {
      const studentId = selectedConversation.student_id
      
      // Add student to removing list for animation
      setRemovingStudents(prev => [...prev, studentId])
      
      // Delete all messages in the conversation
      const { error: messagesError } = await chatService.clearConversation(selectedConversation.id)
      if (messagesError) throw new Error('Failed to delete messages')
      
      // Delete the conversation from chat system
      const { error: convError } = await chatService.deleteConversation(selectedConversation.id)
      if (convError) throw new Error('Failed to delete conversation')
      
      // Remove from processed conversations
      processedConversationIds.current.delete(selectedConversation.id)
      
      // Remove from local state (this removes them from the messenger interface)
      setTimeout(() => {
        setConversations(prev => 
          prev.filter(conv => conv.student_id !== studentId)
        )
        setStudentProfiles(prev => {
          const updated = { ...prev }
          delete updated[studentId]
          return updated
        })
        setRemovingStudents(prev => prev.filter(id => id !== studentId))
        
        // Clear selected conversation if it was the deleted one
        if (selectedConversation.student_id === studentId) {
          setSelectedConversation(null)
          setMessages([])
          if (window.innerWidth < 768) {
            setShowSidebar(true)
          }
        }
      }, 300)
      
      setShowConfirmDeleteStudent(false)
      
    } catch (error) {
      setError('Failed to remove student from chat: ' + error.message)
      setRemovingStudents(prev => prev.filter(id => id !== selectedConversation?.student_id))
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

  // Apply final filtering to conversations shown in UI
  const filteredConversations = conversations.filter(conv => {
    // Double-check filtering at render time
    if (!shouldShowConversation(conv)) {
      return false
    }

    // Apply search filter
    const studentProfile = studentProfiles[conv.student_id]
    const studentName = studentProfile?.name || conv.student_name || 'Student'
    const studentEmail = studentProfile?.email || conv.student_email || ''
    const lastMessage = (conv.last_message || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    
    return studentName.toLowerCase().includes(query) || 
           studentEmail.toLowerCase().includes(query) ||
           lastMessage.includes(query)
  })

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    setAttachments(prev => [...prev, ...files])
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

  // Get display name for student - prioritize Firebase profile data
  const getStudentDisplayName = (conversation) => {
    const studentProfile = studentProfiles[conversation.student_id]
    return studentProfile?.name || conversation.student_name || 'Student'
  }

  // Get student email
  const getStudentEmail = (conversation) => {
    const studentProfile = studentProfiles[conversation.student_id]
    return studentProfile?.email || conversation.student_email || 'No email'
  }

  // Get student avatar initial
  const getStudentAvatarInitial = (conversation) => {
    const studentProfile = studentProfiles[conversation.student_id]
    const name = studentProfile?.name || conversation.student_name || 'Student'
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading admin chat...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up real-time filtering</p>
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
              <h1 className="text-xl font-bold text-gray-800">Live Student Chats</h1>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 ml-1">Live</span>
                </div>
                <button 
                  onClick={initializeAdminChat}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Refresh and filter conversations"
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
                placeholder="Search real-time conversations..."
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
                <p className="text-lg font-medium mb-2">No active conversations</p>
                <p className="text-sm mb-4">Students appear instantly when they send messages.</p>
                <div className="mt-6 text-xs text-gray-400 space-y-2 px-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-medium text-green-800 mb-2">🔥 Real-time Features:</p>
                    <ul className="text-green-700 space-y-1 text-left">
                      <li>• Instant new student detection</li>
                      <li>• Live message monitoring</li>
                      <li>• Auto-conversation creation</li>
                      <li>• Smart filtering system</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-800 mb-2">📊 Status:</p>
                    <p className="text-blue-700">Conversations loaded: {conversations.length}</p>
                    <p className="text-blue-700">After filtering: {filteredConversations.length}</p>
                    <p className="text-blue-700 mt-2 text-xs">System is monitoring for new messages</p>
                  </div>
                </div>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const isRemoving = removingStudents.includes(conversation.student_id)
                const isNewConversation = newConversationIds.includes(conversation.id)
                return (
                  <div
                    key={conversation.id}
                    onClick={() => !isRemoving && selectConversation(conversation)}
                    className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 group ${
                      selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                    } ${isRemoving ? 'student-removing pointer-events-none' : ''} ${
                      isNewConversation ? 'new-conversation bg-green-100' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {getStudentAvatarInitial(conversation)}
                          </span>
                        </div>
                        {/* Online status indicator */}
                        {studentProfiles[conversation.student_id]?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                        {/* New conversation indicator */}
                        {isNewConversation && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 truncate text-sm">
                            {getStudentDisplayName(conversation)}
                            {isNewConversation && (
                              <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                            )}
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
                )
              })
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
                          {getStudentAvatarInitial(selectedConversation)}
                        </span>
                      </div>
                      {studentProfiles[selectedConversation.student_id]?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-800 text-sm">
                        {getStudentDisplayName(selectedConversation)}
                        {newConversationIds.includes(selectedConversation.id) && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">NEW CHAT</span>
                        )}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {studentProfiles[selectedConversation.student_id]?.isOnline ? 'Online' : 'Offline'} • {getStudentEmail(selectedConversation)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
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
                                className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span>Clear chat</span>
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => setShowConfirmDeleteStudent(true)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                <span>Remove from chat</span>
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
                        <p className="text-gray-500 text-sm">Start a conversation with {getStudentDisplayName(selectedConversation)}!</p>
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
                                        {getStudentAvatarInitial(selectedConversation)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Message Content */}
                                  <div className={`flex flex-col ${!isAdmin && !showSender ? 'ml-10' : ''}`}>
                                    {/* Sender Name */}
                                    {showSender && !isAdmin && (
                                      <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                        {getStudentDisplayName(selectedConversation)}
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
                              {getStudentAvatarInitial(selectedConversation)}
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
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <MessageCircle className="w-12 h-12 text-green-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">Real-time Student Chat</h3>
                <p className="text-gray-600 mb-6">Students appear instantly when they send messages. No refresh needed - everything happens in real-time!</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💬 Instant message notifications</p>
                  <p>📎 Real-time file sharing</p>
                  <p>😊 Live emoji reactions</p>
                  <p>🔍 Smart conversation filtering</p>
                  <p>🎯 Auto-detects new students</p>
                  <p>⚡ No page refresh required</p>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">🔥 Live System Status</p>
                  <p className="text-green-700 text-xs mt-1">Real-time monitoring active • Instant updates enabled</p>
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-green-600 text-xs">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Chat Confirmation Modal */}
          {showConfirmClear && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-orange-500" />
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
                    className="flex-1 px-4 py-2.5 rounded-lg text-white bg-orange-500 hover:bg-orange-600 font-medium transition-colors flex items-center justify-center"
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

          {/* Remove Student from Chat Confirmation Modal */}
          {showConfirmDeleteStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Remove {getStudentDisplayName(selectedConversation)} from chat?
                </h3>
                <p className="text-gray-500 text-sm text-center mb-6">
                  This will remove the student from your chat interface and delete all conversation history. The student's account will remain active and they can start a new conversation if needed.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-xs font-medium">ℹ️ Note: This action will:</p>
                  <ul className="text-blue-700 text-xs mt-1 space-y-1">
                    <li>• Remove student from your active chat list</li>
                    <li>• Delete all chat messages permanently</li>
                    <li>• Keep student's account active in the system</li>
                    <li>• Allow student to start a new conversation later</li>
                    <li>• Maintain real-time monitoring for future messages</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmDeleteStudent(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                    disabled={actionInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudentFromChat}
                    className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-colors flex items-center justify-center"
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove from Chat'
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

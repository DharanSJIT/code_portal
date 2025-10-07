import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, MessageCircle, Send, Loader, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, 
  X, Trash, Paperclip, Smile, Mic, Video, Phone, Info, Archive, 
  Reply, Forward, Star, Download, Image as ImageIcon, File, Ban, UserX,
  Users, UserPlus, Hash, Lock, Globe
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

  /* Unread badge animations */
  @keyframes badgePop {
    from { 
      opacity: 0;
      transform: scale(0.5);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }

  .unread-badge {
    animation: badgePop 0.3s ease-out;
  }

  @keyframes badgePulse {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
    }
  }

  .unread-badge.pulse {
    animation: badgePulse 2s ease-in-out infinite;
  }

  /* Group chat specific styles */
  .group-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .domain-badge-fullstack { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  .domain-badge-aml { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  .domain-badge-aws { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
  .domain-badge-other { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; }

  .chat-type-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .chat-type-individual { background: #10b981; }
  .chat-type-group { background: #3b82f6; }

  /* Tab styles */
  .tab-active {
    background: white;
    color: #111827;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }

  .tab-inactive {
    color: #6b7280;
    background: transparent;
  }

  /* Group message styles */
  .group-message-admin {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
  }

  .group-message-student {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 18px 18px 18px 4px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  /* Domain gradient backgrounds */
  .bg-domain-fullstack { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  .bg-domain-aml { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  .bg-domain-aws { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
  .bg-domain-other { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
`

const AdminChatPage = () => {
  const { currentUser, userData } = useAuth()
  const [conversations, setConversations] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
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
  const [showConfirmDeleteGroup, setShowConfirmDeleteGroup] = useState(false)
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
  const [groupMembers, setGroupMembers] = useState({})
  const [removingStudents, setRemovingStudents] = useState([])
  const [newConversationIds, setNewConversationIds] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [activeTab, setActiveTab] = useState('individual') // 'individual' or 'group'
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    domain: 'fullstack'
  })
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const conversationSubscriptionRef = useRef(null)
  const allMessagesSubscriptionRef = useRef(null)
  const groupSubscriptionRef = useRef(null)
  const groupMessagesSubscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const inputRef = useRef(null)
  const processedConversationIds = useRef(new Set())
  const lastSeenMessages = useRef({})

  const adminUser = {
    id: 'admin_1',
    name: 'Admin Support',
    role: 'admin',
    avatar: 'A'
  }

  // Domain configurations
  const domains = {
    fullstack: { name: 'Full Stack', color: 'from-purple-400 to-pink-600', badge: 'domain-badge-fullstack', bg: 'bg-domain-fullstack' },
    aml: { name: 'AML', color: 'from-blue-400 to-cyan-500', badge: 'domain-badge-aml', bg: 'bg-domain-aml' },
    aws: { name: 'AWS', color: 'from-green-400 to-teal-500', badge: 'domain-badge-aws', bg: 'bg-domain-aws' },
    other: { name: 'Other', color: 'from-orange-200 to-orange-400', badge: 'domain-badge-other', bg: 'bg-domain-other' }
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
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe()
      }
      if (groupMessagesSubscriptionRef.current) {
        groupMessagesSubscriptionRef.current.unsubscribe()
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
        setShowSidebar(!selectedConversation && !selectedGroup)
      } else {
        setShowSidebar(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedConversation, selectedGroup])

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

  // ================================
  // EXISTING ONE-ON-ONE CHAT FUNCTIONS
  // ================================

  // Function to calculate unread messages count for a conversation
  const calculateUnreadCount = async (conversationId) => {
    try {
      const { data: msgs, error } = await chatService.getMessages(conversationId)
      if (error || !msgs || msgs.length === 0) {
        return 0
      }
      
      const lastSeenTimestamp = lastSeenMessages.current[conversationId] || 0
      
      // Count messages from students (not admin) that are newer than last seen
      const unreadCount = msgs.filter(msg => 
        msg.sender_role === 'student' && 
        msg.sender_id !== adminUser.id &&
        new Date(msg.created_at).getTime() > lastSeenTimestamp
      ).length
      
      return unreadCount
    } catch (error) {
      console.error('Error calculating unread count:', error)
      return 0
    }
  }

  // Update unread counts for all conversations
  const updateUnreadCounts = async (conversations) => {
    const counts = {}
    
    for (const conv of conversations) {
      const count = await calculateUnreadCount(conv.id)
      if (count > 0) {
        counts[conv.id] = count
      }
    }
    
    setUnreadCounts(counts)
  }

  // Mark conversation as read when selected
  const markConversationAsRead = (conversationId) => {
    lastSeenMessages.current[conversationId] = Date.now()
    setUnreadCounts(prev => {
      const updated = { ...prev }
      delete updated[conversationId]
      return updated
    })
    
    // Store in localStorage for persistence
    localStorage.setItem('adminChatLastSeen', JSON.stringify(lastSeenMessages.current))
  }

  // Load last seen timestamps from localStorage
  const loadLastSeenFromStorage = () => {
    try {
      const stored = localStorage.getItem('adminChatLastSeen')
      if (stored) {
        lastSeenMessages.current = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading last seen data:', error)
    }
  }

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
      
      // Update unread counts after fetching profiles
      await updateUnreadCounts(validConversations)
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
      
      // Load last seen timestamps from storage
      loadLastSeenFromStorage()
      
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

      // Load groups
      await loadGroups()

      setLoading(false)
    } catch (error) {
      console.error('Error initializing admin chat:', error)
      setError('Failed to initialize admin chat')
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const { data: groupsData, error } = await chatService.getAdminGroups()
      if (!error && groupsData) {
        setGroups(groupsData)
        setupGroupSubscription()
      }
    } catch (error) {
      console.error('Error loading groups:', error)
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
            
            // Update unread count for this conversation
            await updateSingleConversationUnreadCount(newMessage.conversation_id)
            
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

  // Update unread count for a single conversation
  const updateSingleConversationUnreadCount = async (conversationId) => {
    // Don't count unread for currently selected conversation
    if (selectedConversation?.id === conversationId) {
      return
    }
    
    const count = await calculateUnreadCount(conversationId)
    setUnreadCounts(prev => {
      const updated = { ...prev }
      if (count > 0) {
        updated[conversationId] = count
      } else {
        delete updated[conversationId]
      }
      return updated
    })
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

    // Update unread count for the new conversation
    await updateSingleConversationUnreadCount(conversation.id)
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

    // Update unread count for the new conversation
    await updateSingleConversationUnreadCount(newConversation.id)
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

    // Update unread count
    await updateSingleConversationUnreadCount(updatedConversation.id)
    
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
    
    // Remove unread count for deleted conversation
    setUnreadCounts(prev => {
      const updated = { ...prev }
      delete updated[deletedConversation.id]
      return updated
    })
    
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
      setSelectedGroup(null)
      setMessages([])
      setError('')
      sentMessageTimestampsRef.current.clear()
      
      // Mark conversation as read
      markConversationAsRead(conversation.id)
      
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
      
      // If it's a student message and the conversation is currently selected, mark as read immediately
      if (newMessage.sender_role === 'student' && newMessage.sender_id !== adminUser.id) {
        markConversationAsRead(selectedConversation.id)
      }
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

  const sendIndividualMessage = async (e) => {
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
    } else if (selectedGroup) {
      setupGroupRealtimeSubscription(selectedGroup.id)
    } else {
      initializeAdminChat()
    }
  }

  const checkForNewMessages = async () => {
    if (selectedConversation) {
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
    } else if (selectedGroup) {
      try {
        const { data: newMessages, error } = await chatService.getGroupMessages(selectedGroup.id)
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
        console.error('Error manually refreshing group messages:', error)
      }
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
      
      let error
      if (selectedConversation) {
        const result = await chatService.deleteMessages(selectedConversation.id, selectedMessages)
        error = result.error
      } else if (selectedGroup) {
        // For groups, we need to implement deleteGroupMessages in chatService
        // For now, we'll use the same method
        const result = await chatService.deleteMessages(selectedGroup.id, selectedMessages)
        error = result.error
      }
      
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
    if (!selectedConversation && !selectedGroup) return
    
    setActionInProgress(true)
    try {
      let error
      
      if (selectedConversation) {
        const result = await chatService.clearConversation(selectedConversation.id)
        error = result.error
        if (!error) {
          setMessages([])
          updateConversationInList(
            selectedConversation.id, 
            'Chat cleared',
            new Date().toISOString()
          )
        }
      } else if (selectedGroup) {
        const result = await chatService.clearGroupMessages(selectedGroup.id)
        error = result.error
        if (!error) {
          setMessages([])
        }
      }
      
      if (error) throw new Error(error)
      
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
        setUnreadCounts(prev => {
          const updated = { ...prev }
          delete updated[selectedConversation.id]
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

  // Apply filtering to groups
  const filteredGroups = groups.filter(group => {
    const groupName = group.name || ''
    const groupDescription = group.description || ''
    const query = searchQuery.toLowerCase()
    
    return groupName.toLowerCase().includes(query) || 
           groupDescription.toLowerCase().includes(query) ||
           group.domain.toLowerCase().includes(query)
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
    setSelectedGroup(null)
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

  // Get unread count for a conversation
  const getUnreadCount = (conversationId) => {
    return unreadCounts[conversationId] || 0
  }

  // Get total unread count
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0)
  }

  // ================================
  // NEW GROUP CHAT FUNCTIONS
  // ================================

  const setupGroupSubscription = () => {
    try {
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe()
      }

      groupSubscriptionRef.current = chatService.subscribeToGroups((payload) => {
        console.log('Group subscription event:', payload.eventType, payload)
        
        if (payload.eventType === 'INSERT') {
          handleNewGroup(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          handleUpdatedGroup(payload.new)
        } else if (payload.eventType === 'DELETE') {
          handleDeletedGroup(payload.old)
        }
      })
    } catch (error) {
      console.error('Error setting up group subscription:', error)
    }
  }

  const handleNewGroup = (newGroup) => {
    setGroups(prev => {
      const exists = prev.some(group => group.id === newGroup.id)
      if (exists) return prev
      return [newGroup, ...prev]
    })
  }

  const handleUpdatedGroup = (updatedGroup) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === updatedGroup.id ? updatedGroup : group
      )
    )
    
    if (selectedGroup && selectedGroup.id === updatedGroup.id) {
      setSelectedGroup(updatedGroup)
    }
  }

  const handleDeletedGroup = (deletedGroup) => {
    setGroups(prev => prev.filter(group => group.id !== deletedGroup.id))
    
    if (selectedGroup && selectedGroup.id === deletedGroup.id) {
      setSelectedGroup(null)
      setMessages([])
    }
  }

  const createNewGroup = async () => {
    try {
      setActionInProgress(true)
      
      const groupData = {
        ...newGroupData,
        createdBy: adminUser.id
      }
      
      const { data, error } = await chatService.createGroup(groupData)
      
      if (error) throw error
      
      setShowCreateGroup(false)
      setNewGroupData({ name: '', description: '', domain: 'fullstack' })
      setActiveTab('group')
      
    } catch (error) {
      setError('Failed to create group: ' + error.message)
    } finally {
      setActionInProgress(false)
    }
  }

  const selectGroup = async (group) => {
    try {
      if (isSelectionMode) exitSelectionMode()
      if (replyingTo) setReplyingTo(null)
      
      setSelectedGroup(group)
      setSelectedConversation(null)
      setMessages([])
      setError('')
      sentMessageTimestampsRef.current.clear()
      
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }

      const { data: groupMessages, error: messagesError } = await chatService.getGroupMessages(group.id)
      if (messagesError) {
        setError('Failed to load group messages')
      } else {
        const processedMessages = groupMessages.map(msg => ({
          ...msg,
          created_at: ensureValidDate(msg.created_at)
        }));
        setMessages(processedMessages || [])
        
        setTimeout(() => {
          forceScrollToBottom()
        }, 200)
      }

      // Fetch group members
      const { data: members, error: membersError } = await chatService.getGroupMembers(group.id)
      if (!membersError && members) {
        setGroupMembers(prev => ({
          ...prev,
          [group.id]: members
        }))
      }

      // Load available students for adding
      await loadAvailableStudents(group.id)

      setupGroupRealtimeSubscription(group.id)
    } catch (error) {
      setError('Failed to load group')
    }
  }

  const loadAvailableStudents = async (groupId) => {
    try {
      setLoadingStudents(true)
      
      // Get all students from Firebase
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'))
      const usersSnapshot = await getDocs(usersQuery)
      const allStudents = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().displayName || doc.data().email?.split('@')[0] || 'Student',
        email: doc.data().email || ''
      }))
      
      // Get current group members
      const { data: currentMembers } = await chatService.getGroupMembers(groupId)
      
      if (currentMembers) {
        const memberIds = currentMembers.map(m => m.user_id)
        const available = allStudents.filter(s => !memberIds.includes(s.id))
        setAvailableStudents(available)
      } else {
        setAvailableStudents(allStudents)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const setupGroupRealtimeSubscription = (groupId) => {
    try {
      if (groupMessagesSubscriptionRef.current) {
        groupMessagesSubscriptionRef.current.unsubscribe()
      }

      groupMessagesSubscriptionRef.current = chatService.subscribeToGroupMessages(groupId, (payload) => {
        setIsOnline(true)
        
        if (payload.eventType === 'INSERT') {
          handleNewGroupMessage(payload.new)
        }
      })
    } catch (error) {
      setIsOnline(false)
    }
  }

  const handleNewGroupMessage = (newMessage) => {
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
  }

  const sendGroupMessage = async (e) => {
    if (e) e.preventDefault()
    
    if (!message.trim() || !selectedGroup || sending) return

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
      group_id: selectedGroup.id,
      sender_id: adminUser.id,
      sender_name: adminUser.name,
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
      const result = await chatService.sendGroupMessage(
        selectedGroup.id,
        adminUser.id,
        text,
        adminUser.name,
        replyingTo?.id
      )

      if (result.error) throw result.error
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
      setError('Failed to send message')
      sentMessageTimestampsRef.current.delete(messageKey)
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessage(text)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    
    setActionInProgress(true)
    try {
      const { error } = await chatService.deleteGroup(selectedGroup.id)
      
      if (error) throw new Error(error)
      
      setShowConfirmDeleteGroup(false)
      
      // Clear selected group if it was the deleted one
      if (selectedGroup) {
        setSelectedGroup(null)
        setMessages([])
        if (window.innerWidth < 768) {
          setShowSidebar(true)
        }
      }
      
    } catch (error) {
      setError('Failed to delete group: ' + error.message)
    } finally {
      setActionInProgress(false)
    }
  }

  const sendMessage = async (e) => {
    if (selectedConversation) {
      await sendIndividualMessage(e)
    } else if (selectedGroup) {
      await sendGroupMessage(e)
    }
  }

  const getCurrentChatInfo = () => {
    if (selectedConversation) {
      return {
        type: 'individual',
        id: selectedConversation.id,
        name: getStudentDisplayName(selectedConversation),
        avatar: getStudentAvatarInitial(selectedConversation),
        status: studentProfiles[selectedConversation.student_id]?.isOnline ? 'Online' : 'Offline',
        subtitle: getStudentEmail(selectedConversation)
      }
    } else if (selectedGroup) {
      const domainConfig = domains[selectedGroup.domain] || domains.other
      return {
        type: 'group',
        id: selectedGroup.id,
        name: selectedGroup.name,
        avatar: selectedGroup.name.charAt(0).toUpperCase(),
        status: `${groupMembers[selectedGroup.id]?.length || 0} members`,
        subtitle: selectedGroup.description,
        domain: selectedGroup.domain,
        domainConfig: domainConfig
      }
    }
    return null
  }

  const getDomainBadge = (domain) => {
    const config = domains[domain] || domains.other
    return (
      <span className={`group-badge ${config.badge} text-xs font-medium px-2 py-1 rounded-full`}>
        {config.name}
      </span>
    )
  }

  const chatInfo = getCurrentChatInfo()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading admin chat...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up real-time notifications</p>
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
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-800">Hope Portal Chat</h1>
                {/* Total unread count */}
                {getTotalUnreadCount() > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {getTotalUnreadCount()}
                  </div>
                )}
              </div>
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

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'individual' ? 'tab-active' : 'tab-inactive'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'group' ? 'tab-active' : 'tab-inactive'
                }`}
              >
                Group Chats
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'individual' ? 'conversations' : 'groups'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 transition-all duration-200"
              />
            </div>

            {/* Create Group Button */}
            {activeTab === 'group' && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New Group</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            {activeTab === 'individual' ? (
              // Individual chats list
              filteredConversations.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No active conversations</p>
                  <p className="text-sm mb-4">Students appear instantly when they send messages.</p>
                  <div className="mt-6 text-xs text-gray-400 space-y-2 px-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-medium text-green-800 mb-2">🔥 Real-time Features:</p>
                      <ul className="text-green-700 space-y-1 text-left">
                        <li>• Instant new student detection</li>
                        <li>• Live unread message counters</li>
                        <li>• Auto-conversation creation</li>
                        <li>• Smart filtering system</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-2">📊 Status:</p>
                      <p className="text-blue-700">Conversations loaded: {conversations.length}</p>
                      <p className="text-blue-700">After filtering: {filteredConversations.length}</p>
                      <p className="text-blue-700">Total unread: {getTotalUnreadCount()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isRemoving = removingStudents.includes(conversation.student_id)
                  const isNewConversation = newConversationIds.includes(conversation.id)
                  const unreadCount = getUnreadCount(conversation.id)
                  const hasUnread = unreadCount > 0
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => !isRemoving && selectConversation(conversation)}
                      className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 group relative ${
                        selectedConversation?.id === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      } ${isRemoving ? 'student-removing pointer-events-none' : ''} ${
                        isNewConversation ? 'new-conversation bg-green-100' : ''
                      } ${hasUnread ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
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
                          {/* Chat type indicator */}
                          <div className="chat-type-indicator chat-type-individual"></div>
                          {/* New conversation indicator */}
                          {isNewConversation && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                          {/* Unread messages badge */}
                          {hasUnread && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1 unread-badge pulse shadow-lg">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-semibold truncate text-sm ${hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                              {getStudentDisplayName(conversation)}
                              {isNewConversation && (
                                <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                              <span className={`text-xs ${hasUnread ? 'text-gray-600' : 'text-gray-400'}`}>
                                {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
                              </span>
                            </div>
                          </div>
                          <p className={`text-xs truncate mt-1 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                            {conversation.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )
            ) : (
              // Group chats list
              filteredGroups.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No groups yet</p>
                  <p className="text-sm mb-4">Create your first group to start domain-specific discussions.</p>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Group
                  </button>
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const domainConfig = domains[group.domain] || domains.other
                  const isSelected = selectedGroup?.id === group.id
                  
                  return (
                    <div
                      key={group.id}
                      onClick={() => selectGroup(group)}
                      className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 group relative ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className={`w-12 h-12 bg-gradient-to-r ${domainConfig.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-white font-semibold text-sm">
                              {group.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="chat-type-indicator chat-type-group"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate text-sm text-gray-800">
                              {group.name}
                            </h3>
                            <span className="text-xs text-gray-400">
                              {group.last_activity ? formatTime(group.last_activity) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {group.description || 'Group chat'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getDomainBadge(group.domain)}
                            <span className="text-xs text-gray-400 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {group.member_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white chat-area-mobile ${!showSidebar ? 'flex' : 'hidden md:flex'} ${(selectedConversation || selectedGroup) ? '' : 'hidden md:flex'}`}>
          {chatInfo ? (
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
                      <div className={`w-10 h-10 ${
                        chatInfo.type === 'group' 
                          ? `bg-gradient-to-r ${chatInfo.domainConfig.color}`
                          : 'bg-green-500'
                      } rounded-full flex items-center justify-center shadow-sm`}>
                        <span className="text-white font-semibold text-sm">
                          {chatInfo.avatar}
                        </span>
                      </div>
                      {chatInfo.type === 'individual' && studentProfiles[selectedConversation.student_id]?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h2 className="font-semibold text-gray-800 text-sm">
                          {chatInfo.name}
                        </h2>
                        {chatInfo.type === 'group' && getDomainBadge(chatInfo.domain)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {chatInfo.status} • {chatInfo.subtitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {chatInfo.type === 'group' && !isSelectionMode && (
                      <button
                        onClick={() => setShowAddMembers(true)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Add Members"
                      >
                        <UserPlus className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
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
                              {chatInfo.type === 'individual' && (
                                <>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => setShowConfirmDeleteStudent(true)}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    <span>Remove from chat</span>
                                  </button>
                                </>
                              )}
                              {chatInfo.type === 'group' && (
                                <>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => setShowConfirmDeleteGroup(true)}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    <span>Delete Group</span>
                                  </button>
                                </>
                              )}
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
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          {chatInfo.type === 'group' ? 'No messages in group yet' : 'No messages yet'}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {chatInfo.type === 'group' 
                            ? 'Start a conversation with the group!'
                            : `Start a conversation with ${chatInfo.name}!`
                          }
                        </p>
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
                                  {/* Student/User Avatar */}
                                  {!isAdmin && showSender && (
                                    <div className={`w-8 h-8 ${
                                      chatInfo.type === 'group' 
                                        ? `bg-gradient-to-r ${chatInfo.domainConfig.color}`
                                        : 'bg-green-500'
                                    } rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0`}>
                                      <span className="text-white font-semibold text-xs">
                                        {chatInfo.type === 'group' ? msg.sender_name?.charAt(0).toUpperCase() : getStudentAvatarInitial(selectedConversation)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Message Content */}
                                  <div className={`flex flex-col ${!isAdmin && !showSender ? 'ml-10' : ''}`}>
                                    {/* Sender Name */}
                                    {showSender && !isAdmin && (
                                      <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                        {chatInfo.type === 'group' ? msg.sender_name : getStudentDisplayName(selectedConversation)}
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
                                      className={`px-3 py-2 ${
                                        isAdmin
                                          ? chatInfo.type === 'group' ? 'group-message-admin' : 'bg-green-500 text-white rounded-br-md rounded-2xl'
                                          : chatInfo.type === 'group' ? 'group-message-student' : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200 rounded-2xl'
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
                          <div className={`w-8 h-8 ${
                            chatInfo.type === 'group' 
                              ? `bg-gradient-to-r ${chatInfo.domainConfig.color}`
                              : 'bg-green-500'
                          } rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0`}>
                            <span className="text-white font-semibold text-xs">
                              {chatInfo.type === 'group' ? 'S' : getStudentAvatarInitial(selectedConversation)}
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
                <h3 className="text-2xl font-semibold mb-3 text-gray-700">Hope Portal Messenger</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'individual' 
                    ? 'Connect with students individually or engage in domain-specific group discussions.'
                    : 'Create and manage group chats for different domains and student cohorts.'
                  }
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💬 Individual student support</p>
                  <p>👥 Domain-specific group chats</p>
                  <p>🚀 Real-time messaging</p>
                  <p>🎯 Full Stack, AML & AWS domains</p>
                  <p>⚡ Instant notifications</p>
                  <p>🔒 Secure communications</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Members Modal */}
          {showAddMembers && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fade-in max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Members to {selectedGroup?.name}</h3>
                  <button
                    onClick={() => {
                      setShowAddMembers(false)
                      setSelectedStudentsToAdd([])
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
                      {availableStudents.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No students available to add</p>
                      ) : (
                        <div className="space-y-2">
                          {availableStudents.map(student => (
                            <label
                              key={student.id}
                              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentsToAdd.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsToAdd(prev => [...prev, student.id])
                                  } else {
                                    setSelectedStudentsToAdd(prev => prev.filter(id => id !== student.id))
                                  }
                                }}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShowAddMembers(false)
                          setSelectedStudentsToAdd([])
                        }}
                        className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (selectedStudentsToAdd.length === 0) return
                          
                          setActionInProgress(true)
                          try {
                            for (const studentId of selectedStudentsToAdd) {
                              await chatService.addGroupMember(selectedGroup.id, studentId, 'member')
                            }
                            setShowAddMembers(false)
                            setSelectedStudentsToAdd([])
                            
                            // Refresh group members
                            const { data: members } = await chatService.getGroupMembers(selectedGroup.id)
                            if (members) {
                              setGroupMembers(prev => ({
                                ...prev,
                                [selectedGroup.id]: members
                              }))
                            }
                          } catch (error) {
                            setError('Failed to add members: ' + error.message)
                          } finally {
                            setActionInProgress(false)
                          }
                        }}
                        disabled={selectedStudentsToAdd.length === 0 || actionInProgress}
                        className="flex-1 px-4 py-2.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600 font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionInProgress ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          `Add ${selectedStudentsToAdd.length} Member${selectedStudentsToAdd.length !== 1 ? 's' : ''}`
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Create Group Modal */}
          {showCreateGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData(prev => ({...prev, description: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group description"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain
                    </label>
                    <select
                      value={newGroupData.domain}
                      onChange={(e) => setNewGroupData(prev => ({...prev, domain: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fullstack">Full Stack Development</option>
                      <option value="aml">AML (Anti-Money Laundering)</option>
                      <option value="aws">AWS Cloud</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewGroup}
                    disabled={!newGroupData.name.trim() || actionInProgress}
                    className="flex-1 px-4 py-2.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600 font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionInProgress ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </button>
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
                  This will permanently delete all messages in this {selectedConversation ? 'conversation' : 'group'}. This action cannot be undone.
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

          {/* Delete Group Confirmation Modal */}
          {showConfirmDeleteGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Delete {selectedGroup?.name} group?
                </h3>
                <p className="text-gray-500 text-sm text-center mb-6">
                  This will permanently delete the group and all its messages. This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-xs font-medium">⚠️ Warning: This action will:</p>
                  <ul className="text-red-700 text-xs mt-1 space-y-1">
                    <li>• Permanently delete the group</li>
                    <li>• Delete all group messages</li>
                    <li>• Remove all group members</li>
                    <li>• Cannot be recovered</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmDeleteGroup(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
                    disabled={actionInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-colors flex items-center justify-center"
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Group'
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
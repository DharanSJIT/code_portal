import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, Paperclip, Smile, Loader, MessageCircle, User, RefreshCw, Clock, 
  CheckCircle, XCircle, ChevronDown, Shield, Trash2, MoreVertical, X, Trash, ArrowRight,
  Reply, Forward, Star, Info, Archive, Phone, Video, Users, Hash, Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { chatService } from '../../services/chatService'
import { supabase } from '../../config/supabase'

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

  /* Enhanced animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInFromBottom {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInFromTop {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes messageAppear {
    from { 
      opacity: 0; 
      transform: translateY(15px) scale(0.98);
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1);
    }
  }

  @keyframes chatOpen {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes headerSlide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes inputSlide {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes messagesStagger {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes avatarBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }

  .animate-slide-in-bottom {
    animation: slideInFromBottom 0.4s ease-out;
  }

  .animate-slide-in-top {
    animation: slideInFromTop 0.3s ease-out;
  }

  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }

  .animate-scale-in {
    animation: scaleIn 0.2s ease-out;
  }

  .animate-message-appear {
    animation: messageAppear 0.3s ease-out;
  }

  .animate-chat-open {
    animation: chatOpen 0.5s ease-out;
  }

  .animate-header-slide {
    animation: headerSlide 0.4s ease-out;
  }

  .animate-input-slide {
    animation: inputSlide 0.4s ease-out 0.2s both;
  }

  .animate-messages-stagger {
    animation: messagesStagger 0.4s ease-out;
  }

  .animate-avatar-bounce {
    animation: avatarBounce 2s ease-in-out infinite;
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

  /* Message hover effects */
  .message-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .message-wrapper:hover .message-actions {
    opacity: 1;
  }

  .message-wrapper {
    transition: transform 0.1s ease;
  }

  .message-wrapper:hover {
    transform: translateY(-1px);
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

  /* Enhanced button hover effects */
  .btn-hover {
    transition: all 0.2s ease;
  }

  .btn-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  /* Enhanced input focus effects */
  .input-enhanced {
    transition: all 0.3s ease;
  }

  .input-enhanced:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  /* Fixed layout */
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 10vh);
    position: fixed;
    top: 9vh;
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

  /* Stagger animation for initial message load */
  .message-stagger-1 { animation-delay: 0.1s; }
  .message-stagger-2 { animation-delay: 0.2s; }
  .message-stagger-3 { animation-delay: 0.3s; }
  .message-stagger-4 { animation-delay: 0.4s; }
  .message-stagger-5 { animation-delay: 0.5s; }

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
  // .domain-badge-other { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; }

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
  .group-message-student {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
  }

  .group-message-other {
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 18px 18px 18px 4px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .group-message-admin {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
  }

  /* Domain gradient backgrounds */
  .bg-domain-fullstack { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  .bg-domain-aml { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  .bg-domain-aws { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
  // .bg-domain-other { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }

  /* Group list styles */
  .group-item {
    transition: all 0.2s ease;
    border-left: 4px solid transparent;
  }

  .group-item:hover {
    background-color: #f8fafc;
    transform: translateX(2px);
  }

  .group-item.selected {
    background-color: #dbeafe;
    border-left-color: #3b82f6;
  }
`

const StudentChatPage = () => {
  const { currentUser, userData, userGroups } = useAuth()
  const [messages, setMessages] = useState([])
  const [supportMessages, setSupportMessages] = useState([])
  const [groupMessages, setGroupMessages] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
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
  const [chatLoaded, setChatLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('support') // 'support' or 'groups'
  const [groups, setGroups] = useState([])
  const [groupMembers, setGroupMembers] = useState({})

  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const subscriptionRef = useRef(null)
  const groupSubscriptionRef = useRef(null)
  const groupMessagesSubscriptionRef = useRef(null)
  const sentMessageTimestampsRef = useRef(new Set())
  const optionsMenuRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const inputRef = useRef(null)

  const studentUser = {
    id: currentUser?.uid,
    name: userData?.name || userData?.displayName || currentUser?.displayName || 'Student',
    email: currentUser?.email || 'student@example.com',
    // domain: userData?.domain || 'other'
  }

  // Domain configurations - using consistent blue theme
  const domains = {
    fullstack: { name: 'Full Stack', color: 'from-blue-400 to-blue-600', badge: 'bg-blue-500', bg: 'bg-blue-500' },
    aml: { name: 'AML', color: 'from-blue-400 to-blue-600', badge: 'bg-blue-500', bg: 'bg-blue-500' },
    aws: { name: 'AWS', color: 'from-blue-400 to-blue-600', badge: 'bg-blue-500', bg: 'bg-blue-500' },
    other: { name: 'Other', color: 'from-blue-400 to-blue-600', badge: 'bg-blue-500', bg: 'bg-blue-500' }
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
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe()
      }
      if (groupMessagesSubscriptionRef.current) {
        groupMessagesSubscriptionRef.current.unsubscribe()
      }
    }
  }, [studentUser.id])

  useEffect(() => {
    // Scroll to bottom without animation, but add a small delay for better UX
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
      }, 100)
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

  // Load groups from Supabase based on student's membership
  useEffect(() => {
    const loadStudentGroups = async () => {
      if (!studentUser.id) return
      
      try {
        // console.log('Loading groups for student:', studentUser.id)
        
        // Get all group members
        const { data: memberData, error: memberError } = await chatService.getGroupMembers()
        
        if (memberError) {
          console.error('Error loading group members:', memberError)
          return
        }
        
        // console.log('All group members:', memberData)
        
        // Filter to get groups where current student is a member
        const studentMemberships = memberData?.filter(m => m.user_id === studentUser.id) || []
        // console.log('Student memberships:', studentMemberships)
        
        const groupIds = studentMemberships.map(m => m.group_id)
        // console.log('Group IDs:', groupIds)
        
        if (groupIds.length > 0) {
          // Get all groups
          const { data: allGroups, error: groupsError } = await chatService.getAdminGroups()
          
          if (!groupsError && allGroups) {
            // console.log('All groups:', allGroups)
            // Filter to only groups where student is a member
            const studentGroups = allGroups.filter(g => groupIds.includes(g.id))
            // console.log('Student groups:', studentGroups)
            setGroups(studentGroups)
          }
        } else {
          console.log('No group memberships found for student')
          setGroups([])
        }
      } catch (error) {
        console.error('Error loading student groups:', error)
      }
    }
    
    loadStudentGroups()
    
    // Set up real-time subscriptions
    const groupSub = chatService.subscribeToGroups((payload) => {
      console.log('Group update received:', payload)
      loadStudentGroups()
    })
    
    // Subscribe to group member changes
    const memberSub = supabase
      .channel('group-members-student')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${studentUser.id}`
        },
        (payload) => {
          console.log('Group membership changed:', payload)
          loadStudentGroups()
        }
      )
      .subscribe()
    
    return () => {
      if (groupSub) groupSub.unsubscribe()
      if (memberSub) memberSub.unsubscribe()
    }
  }, [studentUser.id])

  // ================================
  // EXISTING SUPPORT CHAT FUNCTIONS
  // ================================

  const initializeChat = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Initialize support chat
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
        setSupportMessages(existingMessages || [])
        setMessages(existingMessages || [])
      }

      setupRealtimeSubscription(conv.id)
      
      // Setup group subscriptions if user has groups
      if (userGroups && userGroups.length > 0) {
        setupGroupSubscriptions()
      }
      
      setLoading(false)
      
      // Trigger chat loaded animation
      setTimeout(() => {
        setChatLoaded(true)
      }, 100)

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

  const setupGroupSubscriptions = () => {
    try {
      if (groupSubscriptionRef.current) {
        groupSubscriptionRef.current.unsubscribe()
      }

      // Subscribe to group updates
      groupSubscriptionRef.current = chatService.subscribeToGroups((payload) => {
        console.log('Group subscription event:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          handleNewGroup(payload.new)
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          handleUpdatedGroup(payload.new)
        }
      })
    } catch (error) {
      console.error('Error setting up group subscriptions:', error)
    }
  }

  const setupGroupRealtimeSubscription = (groupId) => {
    try {
      if (groupMessagesSubscriptionRef.current) {
        groupMessagesSubscriptionRef.current.unsubscribe()
      }

      // console.log('🔔 Setting up group message subscription for:', groupId)

      groupMessagesSubscriptionRef.current = chatService.subscribeToGroupMessages(groupId, (payload) => {
        setIsOnline(true)
        console.log('📨 Group message event:', payload)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // console.log('✅ New group message:', payload.new)
          handleNewGroupMessage(payload.new)
        } else if (payload.eventType === 'DELETE' && payload.old) {
          handleDeletedGroupMessage(payload.old)
        }
      })

      // console.log('✅ Group subscription active')
    } catch (error) {
      console.error('❌ Group subscription error:', error)
      setIsOnline(false)
    }
  }
  
  const handleNewMessage = (newMessage) => {
    const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
    
    if (newMessage.sender_id === studentUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
      return
    }
    
    setSupportMessages(prev => {
      const messageExists = prev.some(msg => msg.id === newMessage.id)
      if (messageExists) return prev
      
      return [...prev, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    // If we're on the support tab, update the current messages
    if (activeTab === 'support') {
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === newMessage.id)
        if (messageExists) return prev
        
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }
  }

  const handleNewGroupMessage = (newMessage) => {
    const messageKey = `${newMessage.sender_id}-${newMessage.message}-${Math.floor(new Date(newMessage.created_at).getTime() / 1000)}`
    
    if (newMessage.sender_id === studentUser.id && sentMessageTimestampsRef.current.has(messageKey)) {
      return
    }
    
    setGroupMessages(prev => {
      const groupId = newMessage.group_id
      const currentGroupMessages = prev[groupId] || []
      
      const messageExists = currentGroupMessages.some(msg => msg.id === newMessage.id)
      if (messageExists) return prev
      
      const updatedGroupMessages = [...currentGroupMessages, newMessage].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      return {
        ...prev,
        [groupId]: updatedGroupMessages
      }
    })

    // If we're currently viewing this group, update the current messages
    if (activeTab === 'groups' && activeGroup && activeGroup.id === newMessage.group_id) {
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === newMessage.id)
        if (messageExists) return prev
        
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }
  }
  
  const handleDeletedMessage = (deletedMessage) => {
    setDeletingMessageIds(prev => [...prev, deletedMessage.id])
    
    setTimeout(() => {
      setSupportMessages(prev => 
        prev.filter(msg => msg.id !== deletedMessage.id)
      )
      if (activeTab === 'support') {
        setMessages(prev => 
          prev.filter(msg => msg.id !== deletedMessage.id)
        )
      }
      setDeletingMessageIds(prev => 
        prev.filter(id => id !== deletedMessage.id)
      )
    }, 500)
  }

  const handleDeletedGroupMessage = (deletedMessage) => {
    setDeletingMessageIds(prev => [...prev, deletedMessage.id])
    
    setTimeout(() => {
      setGroupMessages(prev => ({
        ...prev,
        [deletedMessage.group_id]: (prev[deletedMessage.group_id] || []).filter(msg => msg.id !== deletedMessage.id)
      }))
      if (activeTab === 'groups' && activeGroup?.id === deletedMessage.group_id) {
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
      }
      setDeletingMessageIds(prev => prev.filter(id => id !== deletedMessage.id))
    }, 500)
  }

  const handleNewGroup = (newGroup) => {
    setGroups(prev => {
      const exists = prev.some(group => group.id === newGroup.id)
      if (exists) return prev
      return [...prev, newGroup]
    })
  }

  const handleUpdatedGroup = (updatedGroup) => {
    setGroups(prev => 
      prev.map(group => 
        group.id === updatedGroup.id ? updatedGroup : group
      )
    )
    
    if (activeGroup && activeGroup.id === updatedGroup.id) {
      setActiveGroup(updatedGroup)
    }
  }

  const sendSupportMessage = async (e) => {
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
    
    setSupportMessages(prev => [...prev, tempMessage])
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
      
      setSupportMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
      setError('Failed to send message. Please check your connection and try again.')
      sentMessageTimestampsRef.current.delete(messageKey)
      setSupportMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessage(text)
    } finally {
      setSending(false)
    }
  }

  const sendGroupMessage = async (e) => {
    if (e) e.preventDefault()
    
    if (!message.trim() || !activeGroup || sending) return

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
      group_id: activeGroup.id,
      sender_id: studentUser.id,
      sender_name: studentUser.name,
      message: text,
      created_at: now.toISOString(),
      isTemp: true,
      reply_to: replyingTo
    }
    
    // Update both the specific group messages and current view
    setGroupMessages(prev => ({
      ...prev,
      [activeGroup.id]: [...(prev[activeGroup.id] || []), tempMessage]
    }))
    setMessages(prev => [...prev, tempMessage])
    setMessage('')
    setSending(true)
    setError('')
    setReplyingTo(null)

    try {
      const result = await chatService.sendGroupMessage(
        activeGroup.id,
        studentUser.id,
        text,
        studentUser.name,
        replyingTo?.id
      )

      if (result.error) throw result.error
      
      // Update both the specific group messages and current view
      setGroupMessages(prev => ({
        ...prev,
        [activeGroup.id]: (prev[activeGroup.id] || []).map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      }))
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...result.data, isTemp: false } : msg
        )
      )
      
    } catch (error) {
      setError('Failed to send message. Please check your connection and try again.')
      sentMessageTimestampsRef.current.delete(messageKey)
      setGroupMessages(prev => ({
        ...prev,
        [activeGroup.id]: (prev[activeGroup.id] || []).filter(msg => msg.id !== tempId)
      }))
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessage(text)
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async (e) => {
    if (activeTab === 'support') {
      await sendSupportMessage(e)
    } else if (activeTab === 'groups' && activeGroup) {
      await sendGroupMessage(e)
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
    if (conversation && activeTab === 'support') {
      setupRealtimeSubscription(conversation.id)
    } else if (activeGroup && activeTab === 'groups') {
      setupGroupRealtimeSubscription(activeGroup.id)
    } else {
      initializeChat()
    }
  }

  const checkForNewMessages = async () => {
    if (activeTab === 'support' && conversation) {
      try {
        const { data: newMessages, error } = await chatService.getMessages(conversation.id)
        if (!error && newMessages) {
          setSupportMessages(newMessages)
          setMessages(newMessages)
        }
      } catch (error) {
        console.error('Error manually refreshing messages:', error)
      }
    } else if (activeTab === 'groups' && activeGroup) {
      try {
        const { data: newMessages, error } = await chatService.getGroupMessages(activeGroup.id)
        if (!error && newMessages) {
          setGroupMessages(prev => ({
            ...prev,
            [activeGroup.id]: newMessages
          }))
          setMessages(newMessages)
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
      
      let error
      if (activeTab === 'support' && conversation) {
        const result = await chatService.deleteMessages(conversation.id, selectedMessages)
        error = result.error
      } else if (activeTab === 'groups' && activeGroup) {
        const result = await chatService.deleteGroupMessages(activeGroup.id, selectedMessages)
        error = result.error
      }
      
      if (error) throw new Error(error)
      
      setTimeout(() => {
        if (activeTab === 'support') {
          setSupportMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
        } else if (activeTab === 'groups' && activeGroup) {
          setGroupMessages(prev => ({
            ...prev,
            [activeGroup.id]: (prev[activeGroup.id] || []).filter(msg => !selectedMessages.includes(msg.id))
          }))
        }
        setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
        setDeletingMessageIds(prev => prev.filter(id => !selectedMessages.includes(id)))
      }, 500)
      
      setShowConfirmDelete(false)
      setIsSelectionMode(false)
      setSelectedMessages([])
      
    } catch (error) {
      setError('Failed to delete selected messages. Please try again.')
      setDeletingMessageIds(prev => prev.filter(id => !selectedMessages.includes(id)))
    } finally {
      setActionInProgress(false)
    }
  }

  const handleClearChat = async () => {
    if ((activeTab === 'support' && !conversation) || (activeTab === 'groups' && !activeGroup)) return
    
    setActionInProgress(true)
    try {
      let error
      
      if (activeTab === 'support' && conversation) {
        const result = await chatService.clearConversation(conversation.id)
        error = result.error
        if (!error) {
          setSupportMessages([])
          setMessages([])
        }
      } else if (activeTab === 'groups' && activeGroup) {
        const result = await chatService.clearGroupMessages(activeGroup.id)
        error = result.error
        if (!error) {
          setGroupMessages(prev => ({
            ...prev,
            [activeGroup.id]: []
          }))
          setMessages([])
        }
      }
      
      if (error) throw new Error(error)
      
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

  // ================================
  // NEW GROUP CHAT FUNCTIONS
  // ================================

  const selectGroup = async (group) => {
    try {
      if (isSelectionMode) exitSelectionMode()
      if (replyingTo) setReplyingTo(null)
      
      // console.log('👥 Selecting group:', group.name, group.id)
      
      // Unsubscribe from previous subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      if (groupMessagesSubscriptionRef.current) {
        groupMessagesSubscriptionRef.current.unsubscribe()
        groupMessagesSubscriptionRef.current = null
      }
      
      setActiveGroup(group)
      setError('')
      sentMessageTimestampsRef.current.clear()
      setLoading(true)
      
      // Always fetch fresh messages
      const { data: groupMessagesData, error: messagesError } = await chatService.getGroupMessages(group.id)
      if (messagesError) {
        console.error('Error loading group messages:', messagesError)
        setError('Failed to load group messages')
        setMessages([])
      } else {
        const msgs = groupMessagesData || []
        // console.log(`📬 Loaded ${msgs.length} messages for group`)
        setGroupMessages(prev => ({
          ...prev,
          [group.id]: msgs
        }))
        setMessages(msgs)
      }
      setLoading(false)

      // Fetch group members
      const { data: members, error: membersError } = await chatService.getGroupMembers(group.id)
      if (!membersError && members) {
        setGroupMembers(prev => ({
          ...prev,
          [group.id]: members
        }))
      }

      // Setup real-time subscription AFTER setting state
      setTimeout(() => {
        setupGroupRealtimeSubscription(group.id)
      }, 100)
    } catch (error) {
      console.error('Error selecting group:', error)
      setError('Failed to load group')
      setLoading(false)
    }
  }

  const selectSupportChat = () => {
    if (isSelectionMode) exitSelectionMode()
    if (replyingTo) setReplyingTo(null)
    
    // Unsubscribe from group messages
    if (groupMessagesSubscriptionRef.current) {
      groupMessagesSubscriptionRef.current.unsubscribe()
      groupMessagesSubscriptionRef.current = null
    }
    
    setActiveGroup(null)
    setMessages(supportMessages)
    setError('')
    
    // Re-setup support subscription
    if (conversation) {
      setupRealtimeSubscription(conversation.id)
    }
  }

  const getDomainBadge = (domain) => {
    const config = domains[domain] || domains.other
    return (
      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
        {config.name}
      </span>
    )
  }

  const getCurrentChatInfo = () => {
    if (activeTab === 'support' || !activeGroup) {
      return {
        type: 'support',
        name: 'Support Team',
        avatar: 'S',
        status: isOnline ? 'Online' : 'Connecting...',
        subtitle: 'Always here to help'
      }
    } else if (activeTab === 'groups' && activeGroup) {
      const domainConfig = domains[activeGroup.domain] || domains.other
      return {
        type: 'group',
        name: activeGroup.name,
        avatar: activeGroup.name.charAt(0).toUpperCase(),
        status: `${groupMembers[activeGroup.id]?.length || 0} members`,
        subtitle: activeGroup.description,
        domain: activeGroup.domain,
        domainConfig: domainConfig
      }
    }
    return null
  }

  const chatInfo = getCurrentChatInfo()

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
      <div className={`chat-layout ${chatLoaded ? 'animate-chat-open' : ''}`}>
        {/* Chat Header with animation */}
        <div className={`bg-gradient-to-r from-blue-500 to-blue-600 px-3 md:px-4 py-3 md:py-4 shadow-md flex-shrink-0 ${chatLoaded ? 'animate-header-slide' : ''}`}>
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
              <button
                onClick={goBack}
                className="p-1.5 md:p-2 rounded-full hover:bg-white/20 transition-all duration-200 btn-hover flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg ${isOnline ? 'animate-avatar-bounce' : ''}`}>
                  <span className="text-blue-600 font-bold text-base md:text-lg">
                    {chatInfo?.avatar}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                  <span className="truncate">{chatInfo?.name}</span>
                  {chatInfo?.type === 'group' && <span className="flex-shrink-0">{getDomainBadge(chatInfo.domain)}</span>}
                </h2>
                <p className="text-xs text-blue-100 truncate hidden sm:block">
                  {chatInfo?.status} • {chatInfo?.subtitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {isSelectionMode ? (
                <div className="flex items-center text-gray-700 ml-2 animate-fade-in">
                  <button
                    onClick={exitSelectionMode}
                    className="p-1.5 rounded-full hover:bg-gray-200 mr-2 btn-hover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="font-medium text-sm">{selectedMessages.length} selected</span>
                  
                  {selectedMessages.length > 0 && (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="ml-3 text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-all duration-200 flex items-center text-xs btn-hover"
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
                    className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 btn-hover"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 animate-scale-in">
                      <div className="py-1">
                        <button
                          onClick={enterSelectionMode}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                        >
                          <span>Select messages</span>
                        </button>
                        <button
                          onClick={checkForNewMessages}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          <span>Refresh messages</span>
                        </button>
                        <button
                          onClick={() => setShowConfirmClear(true)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>Clear chat</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tab switcher in header */}
              {activeTab === 'groups' && (
                <button
                  onClick={() => {
                    setActiveTab('support')
                    selectSupportChat()
                  }}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 btn-hover flex-shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span className="text-white text-xs md:text-sm font-medium">Support</span>
                </button>
              )}
              {activeTab === 'support' && groups.length > 0 && (
                <button
                  onClick={() => setActiveTab('groups')}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 btn-hover flex-shrink-0"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-white text-xs md:text-sm font-medium">Groups</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group List Sidebar */}
        {activeTab === 'groups' && !activeGroup && (
          <div className="flex-1 overflow-y-auto bg-white border-r border-gray-200">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Your Groups</h3>
              {groups.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No groups available</p>
                  <p className="text-sm mb-4">You haven't been added to any domain groups yet.</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>🎓 Join domain-specific discussions</p>
                    <p>👥 Connect with peers in your field</p>
                    <p>💬 Share knowledge and resources</p>
                    <p>🚀 Collaborate on projects</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const domainConfig = domains[group.domain] || domains.other
                    return (
                      <div
                        key={group.id}
                        onClick={() => selectGroup(group)}
                        className="group-item p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {group.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-800 text-sm truncate">
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
                              {/* {getDomainBadge(group.domain)} */}
                              <span className="text-xs text-gray-400 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {group.member_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex justify-between items-center animate-slide-in-top">
            <div className="flex items-center max-w-3xl mx-auto w-full">
              <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={retryConnection}
              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-100 ml-3 transition-all duration-200 btn-hover"
            >
              Retry
            </button>
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 animate-slide-in-top">
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
                className="p-1 rounded-full hover:bg-gray-200 transition-all duration-200 flex-shrink-0 btn-hover"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Messages with staggered animations */}
        {(activeTab === 'support' || (activeTab === 'groups' && activeGroup)) && (
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 custom-scrollbar"
          >
            <div className="max-w-3xl mx-auto space-y-1">
              {messages.length === 0 ? (
                <div className={`text-center py-16 ${chatLoaded ? 'animate-fade-in' : ''}`}>
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <MessageCircle className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {activeTab === 'support' ? 'Welcome to Support Chat' : `Welcome to ${activeGroup?.name}`}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {activeTab === 'support' 
                      ? 'Our team is here to help you with any questions!'
                      : 'Start a conversation with your group members!'
                    }
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                      {activeTab === 'support' ? '💬 Ask any question you have' : '💬 Share your thoughts'}
                    </p>
                    <p className="animate-fade-in" style={{animationDelay: '0.2s'}}>
                      {activeTab === 'support' ? '⚡ Get instant responses' : '👥 Connect with peers'}
                    </p>
                    <p className="animate-fade-in" style={{animationDelay: '0.3s'}}>
                      {activeTab === 'support' ? '🔒 Your conversations are secure' : '🎓 Domain-specific discussions'}
                    </p>
                  </div>
                </div>
              ) : (
                getMessageGroups().map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`} className="space-y-1">
                    <div className="flex justify-center">
                      <div className={`inline-block bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 rounded-full ${chatLoaded ? 'animate-fade-in' : ''}`}>
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
                      const staggerClass = chatLoaded && msgIndex < 5 ? `message-stagger-${Math.min(msgIndex + 1, 5)}` : ''
                      
                      // Determine message style based on chat type and sender
                      let messageStyle = ''
                      if (activeTab === 'support') {
                        messageStyle = isCurrentUser 
                          ? 'bg-blue-500 text-white rounded-br-md rounded-2xl' 
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200 rounded-2xl'
                      } else {
                        // Group chat styles
                        if (isCurrentUser) {
                          messageStyle = 'group-message-student'
                        } else if (msg.sender_role === 'admin') {
                          messageStyle = 'group-message-admin'
                        } else {
                          messageStyle = 'group-message-other'
                        }
                      }
                      
                      return (
                        <div
                          key={msg.id}
                          className={`message-wrapper flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'message-deleted' : ''} ${isSelected ? 'message-selected' : ''} ${msg.isTemp ? 'animate-message-appear' : ''} ${chatLoaded ? 'animate-messages-stagger' : ''} ${staggerClass}`}
                        >
                          <div className={`flex ${!isCurrentUser && 'items-end'} max-w-xs lg:max-w-md ${showSender ? 'mt-2' : 'mt-1'} px-2 py-1 rounded-lg`}>
                            {/* Sender Avatar */}
                            {!isCurrentUser && showSender && (
                              <div className={`w-8 h-8 ${
                                activeTab === 'groups' && msg.sender_role === 'admin'
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              } rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0 animate-scale-in`}>
                                <span className="text-white font-semibold text-xs">
                                  {activeTab === 'groups' && msg.sender_role === 'admin' 
                                    ? 'A' 
                                    : msg.sender_name?.charAt(0).toUpperCase() || 'U'
                                  }
                                </span>
                              </div>
                            )}
                            
                            {/* Message Content */}
                            <div className={`flex flex-col ${!isCurrentUser && !showSender ? 'ml-10' : ''}`}>
                              {/* Sender Name */}
                              {showSender && !isCurrentUser && (
                                <span className="text-xs font-medium text-gray-600 mb-1 ml-1">
                                  {msg.sender_name || (activeTab === 'groups' && msg.sender_role === 'admin' ? 'Admin' : 'User')}
                                </span>
                              )}
                              
                              {/* WhatsApp-Style Reply Preview inside message */}
                              {repliedMessage && (
                                <div className={`${isCurrentUser ? 'reply-preview-student' : 'reply-preview-admin'} animate-fade-in`}>
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
                              
                              {/* Message Bubble */}
                              <div
                                className={`px-3 py-2 transition-all duration-200 ${messageStyle} ${msg.isTemp ? 'opacity-70' : ''} ${isSelectionMode && isCurrentUser ? 'cursor-pointer hover:bg-blue-400' : ''}`}
                                onClick={() => isSelectionMode && toggleMessageSelection(msg.id, true)}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                                <div className={`flex items-center text-xs mt-1 ${
                                  isCurrentUser ? 'text-blue-100 justify-end' : 'text-gray-400'
                                }`}>
                                  {msg.isTemp ? (
                                    <div className="flex items-center animate-pulse">
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

                              {/* Message Actions - Show on hover for non-current user messages */}
                              {!isSelectionMode && !msg.isTemp && !isCurrentUser && (
                                <div className="message-actions flex items-center justify-end space-x-1 mt-1">
                                  <button 
                                    onClick={() => handleReply(msg)}
                                    className="p-1 rounded-full hover:bg-gray-200 transition-all duration-200 group btn-hover"
                                    title="Reply to this message"
                                  >
                                    <Reply className="w-3 h-3 text-gray-500 group-hover:text-blue-500" />
                                  </button>
                                  <button 
                                    onClick={() => {}}
                                    className="p-1 rounded-full hover:bg-gray-200 transition-all duration-200 group btn-hover"
                                    title="Forward message"
                                  >
                                    <Forward className="w-3 h-3 text-gray-500 group-hover:text-blue-500" />
                                  </button>
                                  <button 
                                    onClick={() => {}}
                                    className="p-1 rounded-full hover:bg-gray-200 transition-all duration-200 group btn-hover"
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
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-sm mr-2 mb-1 flex-shrink-0 animate-pulse">
                      <span className="text-white font-semibold text-xs">
                        {activeTab === 'groups' ? chatInfo?.avatar : 'S'}
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
        )}

        {/* Message Input with animation */}
        {(activeTab === 'support' || (activeTab === 'groups' && activeGroup)) && (
          <div className={`bg-white border-t border-gray-200 pt-2 sticky bottom-0 flex-shrink-0 ${chatLoaded ? 'animate-input-slide' : ''}`}>
            <form onSubmit={sendMessage} className="flex items-end space-x-2 max-w-3xl mx-auto">
              {/* Emoji Picker */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-all duration-200 flex-shrink-0 btn-hover"
                  disabled={isSelectionMode}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 w-64 h-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-y-auto custom-scrollbar animate-scale-in">
                    <div className="p-3 grid grid-cols-8 gap-1">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="p-1 hover:bg-gray-100 rounded transition-all duration-200 text-lg hover:scale-110"
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
                        : `Type a message in ${activeTab === 'support' ? 'support' : activeGroup?.name}...`
                  }
                  disabled={sending || (activeTab === 'support' && !conversation) || (activeTab === 'groups' && !activeGroup) || isSelectionMode}
                  rows="1"
                  className="w-full rounded-2xl py-3 px-4 bg-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:opacity-50 transition-all duration-200 auto-resize custom-scrollbar input-enhanced"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!message.trim() || sending || (activeTab === 'support' && !conversation) || (activeTab === 'groups' && !activeGroup) || isSelectionMode}
                className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 btn-hover ${
                  message.trim() && !sending && ((activeTab === 'support' && conversation) || (activeTab === 'groups' && activeGroup)) && !isSelectionMode
                    ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:shadow-md' 
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
        )}

        {/* Clear Chat Confirmation Modal */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-scale-in">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Clear entire chat?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">
                This will permanently delete all messages in this {activeTab === 'support' ? 'conversation' : 'group'}. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-all duration-200 btn-hover"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-all duration-200 flex items-center justify-center btn-hover"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-scale-in">
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
                  className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-all duration-200 btn-hover"
                  disabled={actionInProgress}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white bg-red-500 hover:bg-red-600 font-medium transition-all duration-200 flex items-center justify-center btn-hover"
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
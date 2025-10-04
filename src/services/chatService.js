// src/services/chatService.js
import { supabase } from '../config/supabase'

export const chatService = {
  // Create or get conversation between student and admin
  async getOrCreateConversation(studentId, studentName, studentEmail) {
    try {
      const conversationId = `conv_${studentId}_admin`
      console.log('🔄 Getting or creating conversation:', conversationId)

      // First, try to get existing conversation
      const { data: existingConv, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      // If no conversation exists (PGRST116 = no rows), create one
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('📝 Creating new conversation...')
        
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              id: conversationId,
              student_id: studentId,
              student_name: studentName,
              student_email: studentEmail,
              admin_id: 'admin_1',
              created_at: new Date().toISOString(),
              last_message: 'Chat started',
              last_message_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating conversation:', createError)
          throw createError
        }

        console.log('✅ New conversation created:', newConv)
        return newConv
        
      } else if (fetchError) {
        // Some other error occurred
        console.error('❌ Error fetching conversation:', fetchError)
        throw fetchError
      }

      console.log('✅ Found existing conversation:', existingConv)
      return existingConv

    } catch (error) {
      console.error('💥 Error in getOrCreateConversation:', error)
      throw error
    }
  },

  // Send message
  async sendMessage(conversationId, senderId, message, senderName, senderRole) {
    try {
      console.log('📤 Sending message...', {
        conversationId,
        senderId,
        message: message.substring(0, 50),
        senderName,
        senderRole
      })

      // Insert the message
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            sender_name: senderName,
            sender_role: senderRole,
            message: message,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('❌ Error inserting message:', error)
        throw error
      }

      console.log('✅ Message inserted successfully:', data[0])

      // Update conversation last message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: message.length > 50 ? message.substring(0, 50) + '...' : message,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (updateError) {
        console.warn('⚠️ Could not update conversation last message:', updateError)
        // Don't throw here - message was sent successfully
      }

      return { data: data[0], error: null }

    } catch (error) {
      console.error('💥 Error in sendMessage:', error)
      return { data: null, error }
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId) {
    try {
      console.log('📨 Getting messages for:', conversationId)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error getting messages:', error)
        return { data: null, error }
      }

      console.log(`✅ Retrieved ${data?.length || 0} messages`)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getMessages:', error)
      return { data: null, error }
    }
  },

  // Listen for new messages (real-time)
  subscribeToMessages(conversationId, callback) {
    console.log('🔔 Subscribing to messages for:', conversationId)

    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🆕 Real-time message received:', payload.new)
          callback({type: 'INSERT', data: payload.new})
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🗑️ Real-time message deleted:', payload.old)
          callback({type: 'DELETE', data: payload.old})
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('✏️ Real-time message updated:', payload.new)
          callback({type: 'UPDATE', data: payload.new})
        }
      )
      .subscribe()
  },

  // Get all conversations for admin
  async getAdminConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('❌ Error getting admin conversations:', error)
        return { data: null, error }
      }

      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getAdminConversations:', error)
      return { data: null, error }
    }
  },

  // Listen for new conversations (admin real-time)
  subscribeToConversations(callback) {
    console.log('🔔 Subscribing to conversations')

    return supabase
      .channel('conversations-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('🔄 Conversation update:', payload)
          callback(payload)
        }
      )
      .subscribe()
  },

  // Delete entire conversation and all its messages
  async deleteConversation(conversationId) {
    try {
      console.log('🗑️ Deleting conversation:', conversationId)

      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError)
        throw messagesError
      }

      console.log('✅ All messages deleted')

      // Then delete the conversation itself
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (conversationError) {
        console.error('❌ Error deleting conversation:', conversationError)
        throw conversationError
      }

      console.log('✅ Conversation deleted successfully')
      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in deleteConversation:', error)
      return { data: null, error }
    }
  },

  // Delete specific messages
  async deleteMessages(conversationId, messageIds) {
    try {
      console.log('🗑️ Deleting messages:', messageIds)

      if (!messageIds || messageIds.length === 0) {
        return { data: { success: true }, error: null }
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds)

      if (error) {
        console.error('❌ Error deleting messages:', error)
        throw error
      }

      console.log(`✅ ${messageIds.length} messages deleted successfully`)

      // Update the conversation's last message
      await this.updateConversationLastMessage(conversationId)

      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in deleteMessages:', error)
      return { data: null, error }
    }
  },

  // Clear all messages in a conversation (keep the conversation)
  async clearConversation(conversationId) {
    try {
      console.log('🧹 Clearing conversation:', conversationId)

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (error) {
        console.error('❌ Error clearing conversation messages:', error)
        throw error
      }

      // Update conversation to show it's empty
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: 'Chat cleared',
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (updateError) {
        console.warn('⚠️ Could not update conversation after clearing:', updateError)
      }

      console.log('✅ Conversation cleared successfully')
      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in clearConversation:', error)
      return { data: null, error }
    }
  },

  // Helper method to update conversation's last message
  async updateConversationLastMessage(conversationId) {
    try {
      console.log('🔄 Updating last message for conversation:', conversationId)

      // Get the most recent message in the conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (messagesError) {
        console.error('❌ Error getting last message:', messagesError)
        return
      }

      let lastMessage = 'No messages yet'
      let lastMessageAt = new Date().toISOString()

      if (messages && messages.length > 0) {
        lastMessage = messages[0].message.length > 50 
          ? messages[0].message.substring(0, 50) + '...' 
          : messages[0].message
        lastMessageAt = messages[0].created_at
      }

      // Update the conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: lastMessage,
          last_message_at: lastMessageAt
        })
        .eq('id', conversationId)

      if (updateError) {
        console.warn('⚠️ Could not update conversation last message:', updateError)
      } else {
        console.log('✅ Conversation last message updated')
      }

    } catch (error) {
      console.error('💥 Error in updateConversationLastMessage:', error)
    }
  },

  // Mark messages as read
  async markMessagesAsRead(messageIds, readerId = 'admin_1') {
    try {
      console.log('👀 Marking messages as read:', messageIds)

      if (!messageIds || messageIds.length === 0) {
        return { data: { success: true }, error: null }
      }

      const { error } = await supabase
        .from('messages')
        .update({
          read_at: new Date().toISOString(),
          read_by: readerId
        })
        .in('id', messageIds)

      if (error) {
        console.error('❌ Error marking messages as read:', error)
        throw error
      }

      console.log(`✅ ${messageIds.length} messages marked as read`)
      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in markMessagesAsRead:', error)
      return { data: null, error }
    }
  },

  // Get unread message count for admin
  async getUnreadMessageCount(adminId = 'admin_1') {
    try {
      console.log('📊 Getting unread message count for admin')

      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .neq('sender_id', adminId) // Messages not sent by admin
        .is('read_at', null) // Not read yet

      if (error) {
        console.error('❌ Error getting unread message count:', error)
        return { data: 0, error: null }
      }

      const count = data?.length || 0
      console.log(`✅ Unread messages: ${count}`)
      return { data: count, error: null }

    } catch (error) {
      console.error('💥 Error in getUnreadMessageCount:', error)
      return { data: 0, error: null }
    }
  },
  
  // Get conversations for a specific student
  async getStudentConversations(studentId) {
    try {
      console.log('🔍 Getting conversations for student:', studentId)
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', studentId)
        .order('last_message_at', { ascending: false })
        
      if (error) {
        console.error('❌ Error getting student conversations:', error)
        return { data: null, error }
      }
      
      console.log(`✅ Retrieved ${data?.length || 0} conversations for student`)
      return { data, error: null }
      
    } catch (error) {
      console.error('💥 Error in getStudentConversations:', error)
      return { data: null, error }
    }
  },
  
  // Pin/unpin important conversations
  async togglePinnedConversation(conversationId, isPinned) {
    try {
      console.log(`${isPinned ? '📌' : '🔄'} ${isPinned ? 'Pinning' : 'Unpinning'} conversation:`, conversationId)
      
      const { error } = await supabase
        .from('conversations')
        .update({
          is_pinned: isPinned,
          pinned_at: isPinned ? new Date().toISOString() : null
        })
        .eq('id', conversationId)
        
      if (error) {
        console.error(`❌ Error ${isPinned ? 'pinning' : 'unpinning'} conversation:`, error)
        throw error
      }
      
      console.log(`✅ Conversation successfully ${isPinned ? 'pinned' : 'unpinned'}`)
      return { data: { success: true }, error: null }
      
    } catch (error) {
      console.error('💥 Error in togglePinnedConversation:', error)
      return { data: null, error }
    }
  },
  
  // Add support for message archiving
  async archiveMessages(messageIds, isArchived = true) {
    try {
      console.log(`${isArchived ? '📦' : '🔄'} ${isArchived ? 'Archiving' : 'Unarchiving'} messages:`, messageIds)
      
      if (!messageIds || messageIds.length === 0) {
        return { data: { success: true }, error: null }
      }
      
      const { error } = await supabase
        .from('messages')
        .update({
          is_archived: isArchived,
          archived_at: isArchived ? new Date().toISOString() : null
        })
        .in('id', messageIds)
        
      if (error) {
        console.error(`❌ Error ${isArchived ? 'archiving' : 'unarchiving'} messages:`, error)
        throw error
      }
      
      console.log(`✅ ${messageIds.length} messages ${isArchived ? 'archived' : 'unarchived'} successfully`)
      return { data: { success: true }, error: null }
      
    } catch (error) {
      console.error('💥 Error in archiveMessages:', error)
      return { data: null, error }
    }
  }
}

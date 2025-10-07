// src/services/chatService.js
import { supabase } from '../config/supabase'

export const chatService = {
  // ================================
  // EXISTING ONE-ON-ONE CHAT METHODS
  // ================================

  // Ensure admin exists in Supabase
  async ensureAdminExists() {
    try {
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', 'admin_1')
        .maybeSingle()

      if (existing) return { data: existing, error: null }

      const { data, error } = await supabase
        .from('admin_users')
        .insert([{
          id: 'admin_1',
          name: 'Support Admin',
          email: 'admin@support.com',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error && error.code === '23505') return { data: { id: 'admin_1' }, error: null }
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Ensure student exists in Supabase
  async ensureStudentExists(studentId, studentName, studentEmail) {
    try {
      const { data: existing } = await supabase
        .from('student_users')
        .select('id')
        .eq('id', studentId)
        .maybeSingle()

      if (existing) return { data: existing, error: null }

      const { data, error } = await supabase
        .from('student_users')
        .insert([{
          id: studentId,
          name: studentName,
          email: studentEmail,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error && error.code === '23505') return { data: { id: studentId }, error: null }
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create or get conversation between student and admin
  async getOrCreateConversation(studentId, studentName, studentEmail) {
    try {
      await this.ensureAdminExists()
      await this.ensureStudentExists(studentId, studentName, studentEmail)

      const { data: conversationId, error } = await supabase
        .rpc('create_or_get_conversation', {
          p_student_id: studentId,
          p_student_name: studentName,
          p_student_email: studentEmail,
          p_admin_id: 'admin_1'
        })

      if (error) {
        console.error('❌ Error creating/getting conversation:', error)
        throw error
      }

      console.log('✅ Conversation ID:', conversationId)

      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching conversation:', fetchError)
        throw fetchError
      }

      console.log('✅ Conversation data:', conversation)
      return conversation

    } catch (error) {
      console.error('💥 Error in getOrCreateConversation:', error)
      throw error
    }
  },

  // Send message
  async sendMessage(conversationId, senderId, message, senderName, senderRole, replyTo = null) {
    try {
      console.log('📤 Sending message...', {
        conversationId,
        senderId,
        message: message.substring(0, 50),
        senderName,
        senderRole,
        replyTo
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
            reply_to: replyTo,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('❌ Error inserting message:', error)
        throw error
      }

      console.log('✅ Message inserted successfully:', data[0])
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

  // Listen to all messages (for admin to detect new student conversations)
  subscribeToAllMessages(callback) {
    console.log('🔔 Subscribing to all messages')

    return supabase
      .channel('all-messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔄 All messages update:', payload)
          callback(payload)
        }
      )
      .subscribe()
  },

  // Get specific conversation
  async getConversation(conversationId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
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

  // ================================
  // NEW GROUP CHAT METHODS
  // ================================

  // Create a new group
  async createGroup(groupData) {
    try {
      console.log('👥 Creating new group:', groupData)

      // Use the database function to create group with proper ID generation
      const { data: groupId, error } = await supabase
        .rpc('create_group', {
          p_name: groupData.name,
          p_description: groupData.description,
          p_domain: groupData.domain,
          p_created_by: groupData.createdBy
        })

      if (error) {
        console.error('❌ Error creating group:', error)
        throw error
      }

      console.log('✅ Group created successfully with ID:', groupId)
      
      // Fetch the created group to return complete data
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching created group:', fetchError)
        throw fetchError
      }

      return { data: group, error: null }

    } catch (error) {
      console.error('💥 Error in createGroup:', error)
      return { data: null, error }
    }
  },

  // Get all groups for admin
  async getAdminGroups() {
    try {
      console.log('🔍 Getting all groups for admin')

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false })

      if (error) {
        console.error('❌ Error getting groups:', error)
        return { data: null, error }
      }

      console.log(`✅ Retrieved ${data?.length || 0} groups`)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getAdminGroups:', error)
      return { data: null, error }
    }
  },

  // Get groups for a specific student based on their domain
  async getStudentGroups(studentDomain) {
    try {
      console.log('🔍 Getting groups for student domain:', studentDomain)

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('domain', studentDomain)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })

      if (error) {
        console.error('❌ Error getting student groups:', error)
        return { data: null, error }
      }

      console.log(`✅ Retrieved ${data?.length || 0} groups for domain ${studentDomain}`)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getStudentGroups:', error)
      return { data: null, error }
    }
  },

  // Get specific group
  async getGroup(groupId) {
    try {
      console.log('🔍 Getting group:', groupId)

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error('❌ Error getting group:', error)
        return { data: null, error }
      }

      console.log('✅ Group retrieved:', data)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getGroup:', error)
      return { data: null, error }
    }
  },

  // Get messages for a group
  async getGroupMessages(groupId) {
    try {
      console.log('📨 Getting group messages for:', groupId)

      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error getting group messages:', error)
        return { data: null, error }
      }

      console.log(`✅ Retrieved ${data?.length || 0} group messages`)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getGroupMessages:', error)
      return { data: null, error }
    }
  },

  // Send message to group
  async sendGroupMessage(groupId, senderId, message, senderName, replyTo = null) {
    try {
      console.log('📤 Sending group message...', {
        groupId,
        senderId,
        message: message.substring(0, 50),
        senderName,
        replyTo
      })

      const { data, error } = await supabase
        .from('group_messages')
        .insert([
          {
            group_id: groupId,
            sender_id: senderId,
            sender_name: senderName,
            message: message,
            reply_to: replyTo,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('❌ Error inserting group message:', error)
        throw error
      }

      console.log('✅ Group message inserted successfully:', data[0])
      return { data: data[0], error: null }

    } catch (error) {
      console.error('💥 Error in sendGroupMessage:', error)
      return { data: null, error }
    }
  },

  // Get group members
  async getGroupMembers(groupId) {
    try {
      if (!groupId) {
        // If no groupId provided, get all group members
        const { data, error } = await supabase
          .from('group_members')
          .select('*')

        if (error) {
          console.error('❌ Error getting all group members:', error)
          return { data: null, error }
        }

        return { data, error: null }
      }

      console.log('🔍 Getting group members for:', groupId)

      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)

      if (error) {
        console.error('❌ Error getting group members:', error)
        return { data: null, error }
      }

      console.log(`✅ Retrieved ${data?.length || 0} group members`)
      return { data, error: null }

    } catch (error) {
      console.error('💥 Error in getGroupMembers:', error)
      return { data: null, error }
    }
  },

  // Delete group
  async deleteGroup(groupId) {
    try {
      console.log('🗑️ Deleting group:', groupId)

      // First delete all group messages
      const { error: messagesError } = await supabase
        .from('group_messages')
        .delete()
        .eq('group_id', groupId)

      if (messagesError) {
        console.error('❌ Error deleting group messages:', messagesError)
        throw messagesError
      }

      // Then delete all group members
      const { error: membersError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)

      if (membersError) {
        console.error('❌ Error deleting group members:', membersError)
        throw membersError
      }

      // Finally delete the group
      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (groupError) {
        console.error('❌ Error deleting group:', groupError)
        throw groupError
      }

      console.log('✅ Group deleted successfully')
      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in deleteGroup:', error)
      return { data: null, error }
    }
  },

  // Clear all messages in a group
  async clearGroupMessages(groupId) {
    try {
      console.log('🧹 Clearing group messages for:', groupId)

      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('group_id', groupId)

      if (error) {
        console.error('❌ Error clearing group messages:', error)
        throw error
      }

      // Update group to show it's empty
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          last_message: 'Group chat cleared',
          last_activity: new Date().toISOString()
        })
        .eq('id', groupId)

      if (updateError) {
        console.warn('⚠️ Could not update group after clearing:', updateError)
      }

      console.log('✅ Group messages cleared successfully')
      return { data: { success: true }, error: null }

    } catch (error) {
      console.error('💥 Error in clearGroupMessages:', error)
      return { data: null, error }
    }
  },

  // ================================
  // REAL-TIME SUBSCRIPTIONS FOR GROUPS
  // ================================

  // Listen for group messages (real-time)
  subscribeToGroupMessages(groupId, callback) {
    console.log('🔔 Subscribing to group messages for:', groupId)

    return supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('🆕 Real-time group message received:', payload.new)
          callback({ eventType: 'INSERT', new: payload.new })
        }
      )
      .subscribe()
  },

  // Listen for group updates (real-time)
  subscribeToGroups(callback) {
    console.log('🔔 Subscribing to groups')

    return supabase
      .channel('groups-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        (payload) => {
          console.log('🔄 Group update:', payload)
          callback(payload)
        }
      )
      .subscribe()
  },

  // Delete group messages
  async deleteGroupMessages(groupId, messageIds) {
    try {
      if (!messageIds || messageIds.length === 0) {
        return { data: { success: true }, error: null }
      }

      const { error } = await supabase
        .from('group_messages')
        .delete()
        .in('id', messageIds)

      if (error) throw error

      return { data: { success: true }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get all students from Firebase (for admin to add to groups)
  async getAllStudentsFromFirebase() {
    try {
      // This will be called from the component with Firebase access
      // Return empty here, actual implementation in component
      return { data: [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Add member to group
  async addGroupMember(groupId, userId, role = 'member') {
    try {
      const { data: existing } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) return { data: existing, error: null }

      const { data, error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: userId, role }])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Remove member from group
  async removeGroupMember(groupId, userId) {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
      return { data: { success: true }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
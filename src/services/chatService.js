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
          callback(payload.new)
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
  }
}
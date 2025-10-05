import { useState, useRef, useEffect } from 'react'
import { exportToExcel, formatDataForExcel } from '../utils/excelExport'
import { queryAPI } from '../services/apii'

// Data Table Component
const DataTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">No data available</p>
  }

  const columns = Object.keys(data[0])

  return (
    <div className="overflow-x-auto mt-4 animate-fadeIn">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((column) => (
              <th 
                key={column}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr 
              key={index} 
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {typeof row[column] === 'object' 
                    ? JSON.stringify(row[column]) 
                    : String(row[column] || '-')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const QueryBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your CodeTrack assistant. Ask me anything about students, their coding progress, or any data queries you have.',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await queryAPI(inputValue)
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date(),
        data: response.data || null
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: {
          success: false,
          message: 'Sorry, I encountered an error processing your request. Please try again.',
          error: error.message
        },
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDownloadExcel = (data) => {
    if (data && data.length > 0) {
      const formattedData = formatDataForExcel(data)
      exportToExcel(formattedData, 'query-results')
    }
  }

  const exampleQueries = [
    "Show AI department students",
    "Who solved more than 300 leetcode problems?",
    "Get students with codeforces rating above 800",
    "Show all students from Technology college",
    "Find students by roll number 23IT1207",
    "Get phone number of student with registerNumber 312423205031"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '90vw' }}>
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CodeTrack Assistant</h1>
              <p className="mt-1 text-sm text-gray-600">Ask questions about student data and analytics</p>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-white rounded-md border border-gray-200">AI Powered</span>
              <span className="px-3 py-1 bg-white rounded-md border border-gray-200">Real-time</span>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            
            {/* Messages Container */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}
                >
                  <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                    
                    {/* Message Header */}
                    <div className={`flex items-center mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs font-medium text-gray-500">
                        {message.type === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-lg px-4 py-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {typeof message.content === 'string' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div>
                          <p className="text-sm leading-relaxed mb-2">{message.content.message}</p>
                          {message.content.success && message.data && (
                            <div className="mt-3">
                              <DataTable data={message.data} />
                              <button
                                onClick={() => handleDownloadExcel(message.data)}
                                className="mt-3 inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-150"
                              >
                                Download Excel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="max-w-3xl mr-12">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-gray-500">Assistant</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Typing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question here..."
                    rows="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    disabled={isLoading}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Press Enter to send, Shift + Enter for new line</p>
            </div>

          </div>
        </main>

        {/* Example Queries - Bottom Section */}
        <section>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Example Queries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(query)}
                  className="text-left text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-150"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default QueryBot
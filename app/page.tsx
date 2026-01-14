'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Call {
  id: string;
  clientName: string;
  phoneNumber: string;
  scheduledTime: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'missed' | 'in-progress';
  notes: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface AIResponse {
  message: string;
  action?: string;
  data?: any;
}

export default function Home() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load demo data
    const demoCall: Call = {
      id: '1',
      clientName: 'John Smith',
      phoneNumber: '+1-555-0123',
      scheduledTime: new Date(Date.now() + 3600000),
      duration: 30,
      status: 'scheduled',
      notes: 'Discuss Q4 sales report',
      priority: 'high',
      category: 'Sales'
    };
    setCalls([demoCall]);

    setChatHistory([{
      role: 'assistant',
      content: 'Hello! I\'m your AI business calls assistant. I can help you schedule calls, manage your call list, take notes, and provide insights. Try asking me to "schedule a call" or "show my upcoming calls".'
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { role: 'user' as const, content: userInput };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          calls: calls,
          chatHistory: chatHistory
        })
      });

      const data: AIResponse = await response.json();

      // Handle different actions
      if (data.action === 'schedule_call' && data.data) {
        const newCall: Call = {
          id: Date.now().toString(),
          ...data.data,
          scheduledTime: new Date(data.data.scheduledTime)
        };
        setCalls(prev => [...prev, newCall]);
      } else if (data.action === 'update_call' && data.data) {
        setCalls(prev => prev.map(call =>
          call.id === data.data.id ? { ...call, ...data.data } : call
        ));
      } else if (data.action === 'delete_call' && data.data) {
        setCalls(prev => prev.filter(call => call.id !== data.data.id));
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      }]);
    }

    setIsLoading(false);
    setUserInput('');
  };

  const getStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'missed': return 'bg-red-500';
      case 'in-progress': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: Call['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📞 Business Calls AI Agent</h1>
          <p className="text-gray-600">Intelligent call management powered by AI</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calls Dashboard */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">📋 Calls Dashboard</h2>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {calls.filter(c => c.status === 'scheduled').length}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {calls.filter(c => c.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {calls.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No calls scheduled</p>
              ) : (
                calls.map(call => (
                  <div key={call.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{call.clientName}</h3>
                      <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">📱 {call.phoneNumber}</p>
                    <p className="text-sm text-gray-600 mb-1">
                      🕐 {format(call.scheduledTime, 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">⏱️ {call.duration} min</p>
                    <p className={`text-sm font-medium mb-1 ${getPriorityColor(call.priority)}`}>
                      Priority: {call.priority.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">{call.notes}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {call.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Chat Interface */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 flex flex-col h-[600px]">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">💬 AI Assistant</h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-lg p-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me to schedule a call, update status, or get insights..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setUserInput('Schedule a new call')}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-100 transition-colors"
              >
                📅 Schedule Call
              </button>
              <button
                onClick={() => setUserInput('Show upcoming calls')}
                className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors"
              >
                📊 View Schedule
              </button>
              <button
                onClick={() => setUserInput('Summarize today\'s calls')}
                className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded hover:bg-green-100 transition-colors"
              >
                📝 Daily Summary
              </button>
              <button
                onClick={() => setUserInput('What are my high priority calls?')}
                className="text-xs bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition-colors"
              >
                🔥 Priority Calls
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center mt-8 text-gray-600 text-sm pb-4">
          <p>AI-powered business calls management • Built with Next.js</p>
        </footer>
      </div>
    </div>
  );
}

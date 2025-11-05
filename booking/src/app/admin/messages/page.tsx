'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status: string;
  dateCreated: string;
  dateSent: string;
}

interface Conversations {
  [phoneNumber: string]: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversations>({});
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedPhone, conversations]);

  useEffect(() => {
    fetchMessages();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    try {
      const response = await fetch('/api/whatsapp/messages');
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
        // Auto-select first conversation if none selected
        if (!selectedPhone && Object.keys(data.conversations).length > 0) {
          setSelectedPhone(Object.keys(data.conversations)[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedPhone || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedPhone,
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Refresh messages after sending
        setTimeout(fetchMessages, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  const formatPhoneNumber = (phone: string) => {
    return phone.replace('whatsapp:', '').replace('+', '');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-black">Mensajes WhatsApp</h1>
          <p className="text-sm text-gray-600 mt-1">
            {Object.keys(conversations).length} conversaciones
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {Object.keys(conversations).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay conversaciones aún
            </div>
          ) : (
            Object.keys(conversations).map((phone) => {
              const msgs = conversations[phone];
              const lastMsg = msgs[msgs.length - 1];

              return (
                <motion.button
                  key={phone}
                  onClick={() => setSelectedPhone(phone)}
                  className={`w-full p-4 text-left border-b border-gray-200 transition-colors ${
                    selectedPhone === phone
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-black">
                      {formatPhoneNumber(phone)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(lastMsg.dateCreated)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {lastMsg.direction === 'outbound-api' && '✓ '}
                    {lastMsg.body}
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPhone ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-black">
                    {formatPhoneNumber(selectedPhone)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {conversations[selectedPhone]?.length} mensajes
                  </div>
                </div>
                <button
                  onClick={fetchMessages}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-black font-medium"
                >
                  Actualizar
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <AnimatePresence>
                {conversations[selectedPhone]?.map((msg, idx) => {
                  const isOutgoing = msg.direction === 'outbound-api';
                  const showDate =
                    idx === 0 ||
                    formatDate(msg.dateCreated) !==
                      formatDate(
                        conversations[selectedPhone][idx - 1].dateCreated
                      );

                  return (
                    <div key={msg.sid}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-700 font-medium">
                            {formatDate(msg.dateCreated)}
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex mb-4 ${
                          isOutgoing ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                            isOutgoing
                              ? 'bg-black text-white'
                              : 'bg-white border border-gray-200 text-black'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words text-sm">
                            {msg.body}
                          </div>
                          <div
                            className={`text-xs mt-1.5 ${
                              isOutgoing ? 'text-gray-300' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(msg.dateCreated)}
                            {isOutgoing && (
                              <span className="ml-1">
                                {msg.status === 'delivered' && '✓✓'}
                                {msg.status === 'sent' && '✓'}
                                {msg.status === 'failed' && '✗'}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black"
                  rows={3}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Presiona Enter para enviar, Shift + Enter para nueva línea
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <div className="text-lg font-medium">Selecciona una conversación</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

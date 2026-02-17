import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, user }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const currentConversationIdRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations from local storage
  useEffect(() => {
    if (user) {
      const storedConversations = localStorage.getItem(`chatHistory_${user.id}`);
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
    } else {
        setConversations([]);
        setCurrentConversationId(null);
        currentConversationIdRef.current = null;
        setMessages([]);
    }
  }, [user]);

  // Sync ref with state
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Save conversations to local storage whenever they change
  useEffect(() => {
    if (user && conversations.length > 0) {
      localStorage.setItem(`chatHistory_${user.id}`, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  // Load messages for the current conversation
  useEffect(() => {
    if (currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv) {
        setMessages(currentConv.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [currentConversationId, conversations]);

  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    currentConversationIdRef.current = null;
    setMessages([]);
  }, []);

  const selectConversation = useCallback((id) => {
    setCurrentConversationId(id);
    currentConversationIdRef.current = id;
  }, []);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);

    const activeId = currentConversationIdRef.current;

    if (!activeId) {
      // Start a new conversation
      const newConversationId = Date.now().toString();
      // Update ref immediately to handle subsequent calls in same cycle
      currentConversationIdRef.current = newConversationId;

      const titleContent = message.content.replace(/<[^>]*>?/gm, '');
      const newConversation = {
        id: newConversationId,
        title: titleContent.substring(0, 30) + (titleContent.length > 30 ? '...' : ''),
        messages: [message],
        timestamp: new Date().toISOString()
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversationId);
    } else {
      // Update existing conversation
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            messages: [...conv.messages, message],
            timestamp: new Date().toISOString()
          };
        }
        return conv;
      }));
    }
  }, []);

  const updateConversationTitle = useCallback((id, newTitle) => {
    setConversations(prev => prev.map(conv => {
        if (conv.id === id) {
            return { ...conv, title: newTitle };
        }
        return conv;
    }));
  }, []);
  
  const deleteConversation = useCallback((id) => {
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (currentConversationIdRef.current === id) {
          setCurrentConversationId(null);
          currentConversationIdRef.current = null;
          setMessages([]);
      }
  }, []);

  const value = {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    setIsLoading,
    startNewChat,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

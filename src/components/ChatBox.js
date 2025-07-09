

import React, { useRef, useEffect } from 'react';


const ChatBox = ({ messages, messageInput, setMessageInput, onSend }) => {
 
 const messagesEndRef = useRef(null);

  // Add this useEffect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 
    const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Chat Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #222222", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#181818" }}>
        <span style={{ fontSize: "16px" }}>💬</span>
        <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#ffffff" }}>Chat</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#000000" }}>
        {messages.length === 0 ? (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            height: "100%", 
            color: "#cccccc", 
            fontSize: "0.875rem" 
          }}>
            Start a conversation...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{ 
                display: "flex", 
                justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start',
                marginBottom: "12px"
              }}
            >
                
              <div
                style={{
                  maxWidth: "240px",
                  padding: "8px 12px",
                  borderRadius: "25px",
                  backgroundColor: message.sender === 'me' ? "#19f0b8" : "#222222",
                  color: message.sender === 'me' ? "#000000" : "#ffffff",
                  border: message.sender === 'me' ? "1px solid #00ffcb" : "1px solid #222222"
                }}
              >
                <p style={{ fontSize: "0.875rem", margin: 0 }}>{message.text}</p>
                
              </div>
            </div>
          ))
        )}
          <div ref={messagesEndRef} />

      </div>

      {/* Message Input */}
      <div style={{ padding: "16px", borderTop: "1px solid #222222", backgroundColor: "#000000" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: "#181818",
              border: "1px solid #222222",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "0.875rem",
              color: "#ffffff",
              outline: "none"
            }}
            onFocus={(e) => e.target.style.borderColor = "#19f0b8"}
            onBlur={(e) => e.target.style.borderColor = "#222222"}
          />
          <button
            onClick={onSend}
            disabled={!messageInput.trim()}
            style={{
              background: messageInput.trim() ? "linear-gradient(135deg, #19f0b8 0%, #00ffcb 100%)" : "#23272b",
              padding: "8px",
              borderRadius: "50%",
              border: "none",
              cursor: messageInput.trim() ? "pointer" : "not-allowed",
              transition: "all 0.3s",
              boxShadow: messageInput.trim() ? "0 0 15px rgba(25, 240, 184, 0.3)" : "none"
            }}
            onMouseOver={(e) => {
              if (messageInput.trim()) {
                e.target.style.boxShadow = "0 0 20px rgba(25, 240, 184, 0.5)";
              }
            }}
            onMouseOut={(e) => {
              if (messageInput.trim()) {
                e.target.style.boxShadow = "0 0 15px rgba(25, 240, 184, 0.3)";
              }
            }}
          >
            <span style={{ color: messageInput.trim() ? "#000000" : "#cccccc", fontSize: "16px" }}>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;


import React, { useRef, useEffect } from 'react';


const ChatBox = ({ messages, messageInput, setMessageInput, onSend }) => {
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      position: "relative"  // Add this
    }}>
      {/* Chat Header */}
      <div style={{ 
        padding: "12px 16px", 
        borderBottom: "1px solid #222222", 
        display: "flex", 
        alignItems: "center", 
        gap: "8px", 
        backgroundColor: "#181818",
        flexShrink: 0  // Add this - prevents header from shrinking
      }}>
        <span style={{ fontSize: "16px" }}>💬</span>
        <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#ffffff" }}>Chat</span>
      </div>

      {/* Messages - FIXED HEIGHT */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: "16px", 
        backgroundColor: "#000000",
        minHeight: 0  // Add this - allows flex item to shrink below content size
      }}>
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

{/* Emoji Reactions - Add this BEFORE Message Input */}
<div style={{
  padding: "8px 16px",
  borderTop: "1px solid #222222",
  backgroundColor: "#000000",
  display: "flex",
  gap: "8px",
  justifyContent: "center",
  flexWrap: "wrap"
}}>
  {['😂', '❤️', '😮', '😢', '😡', '🔥'].map((emoji, index) => (
    <button
      key={index}
     onClick={() => {
  // Call onSend with the emoji directly
  onSend(emoji);
}}
      style={{
        background: "none",
        border: "1px solid #222222",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        fontSize: "18px",
        cursor: "pointer",
        transition: "all 0.3s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = "#19f0b8";
        e.target.style.transform = "scale(1.1)";
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = "transparent";
        e.target.style.transform = "scale(1)";
      }}
    >
      {emoji}
    </button>
  ))}
</div>




      {/* Message Input - FIXED POSITION */}
      <div style={{ 
        padding: "16px", 
        borderTop: "1px solid #222222", 
        backgroundColor: "#000000",
        flexShrink: 0  // Add this - prevents input from shrinking
      }}>
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
          >
            <span style={{ color: messageInput.trim() ? "#000000" : "#cccccc", fontSize: "16px" }}>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
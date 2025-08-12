import React, { useRef, useEffect, useState } from 'react';

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY;

export default function ChatBox({ messages, messageInput, setMessageInput, onSend }) {
  const messagesEndRef = useRef(null);
  const [showGif, setShowGif] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- GIPHY / TENOR --- //
  useEffect(() => {
    if (!showGif) return;
    fetchGifs(""); // load trending when opened
  }, [showGif]);

  const fetchGifs = async (keyword) => {
    setGifLoading(true);
    try {
      const endpoint =
        `https://tenor.googleapis.com/v2/${keyword ? "search" : "featured"}?key=${TENOR_API_KEY}&limit=20&q=${keyword}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifResults(data.results || []);
    } catch (err) {
      console.error("Failed to load gifs", err);
    }
    setGifLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  const gifRef = useRef(null);

// close popup when clicking outside
useEffect(() => {
  function handleClickOutside(event) {
    if (gifRef.current && !gifRef.current.contains(event.target)) {
      setShowGif(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      position: "relative"
    }}>
      {/* Header */}
      <div style={{
        
        padding: "3px 8px",
        borderBottom: "1px solid #222",
        display: "flex",
        background: "#000000",
        alignItems: "center",
        color: "#fff",
        fontSize: "0.875rem",
        gap: "5px",
        fontWeight: 500
      }}>
       <img src="/talk.png" alt="chat" style={{width:40, height:40}} />
<span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#ffffff" }}>
    Chat
  </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        background: "#000",
        scrollbarWidth: "thin",
        scrollbarColor: "#333 #000"
      }}>
        {messages.length === 0 ? (
          <div style={{ color: "#777", textAlign: "center" }}>Start a conversation…</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.sender === 'me' ? "flex-end" : "flex-start",
              marginBottom: "10px"
            }}>
              <div style={{
                maxWidth: 260,
                background: m.sender === 'me' ? "#222" : "#222",
                color: m.sender === 'me' ? "#fff" : "#fff",  //text colour inside message bubble
                padding: "8px 8px",
                borderRadius: '25px',
                fontSize: "0.875rem"
              }}>
                  {m.type === "gif" ? (
  <img src={m.url} alt="gif" style={{ width:200, borderRadius:12 }} />
) : (
  <p>{m.text}</p>
)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji and GIF Bar */}
      <div style={{
         padding: "8px 16px",
  borderTop: "1px solid #222222",
  backgroundColor: "#000000",
  display: "flex",
  gap: "8px",
  justifyContent: "center",
  flexWrap: "wrap"
      }}>
        <div style={{ display: "grid",
gridTemplateColumns: "repeat(6,1fr)",
gap: "38px",
 }}>
          {['😂', '❤️', '😮', '😡', '🔥'].map((e) => (
  <button
    onClick={() => onSend(e)}
    key={e}
    style={{
      position:"relative",
      width: 35,
      height: 35,
      fontSize: "1.5rem",
      borderRadius: "50%",
      background: "transparent",
      color: "#fff",
      border: "1px solid #000",
      cursor: "pointer",
      transition: "all 0.25s"
    }}
    onMouseEnter={(btn) => {
      btn.currentTarget.style.background = "#222";
      btn.currentTarget.style.boxShadow = "0 0 10px rgba(255,90,31,0.6)"; // orange glow
      btn.currentTarget.style.transform = "scale(1.15)";
    }}
    onMouseLeave={(btn) => {
      btn.currentTarget.style.background = "transparent";
      btn.currentTarget.style.boxShadow = "none";
      btn.currentTarget.style.transform = "scale(1)";
    }}
  >
    {e}
  </button>
))}

          {/* GIF Button */}
          <button
            onClick={() => setShowGif(!showGif)}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "transparent", border: "1px solid #333", color: "#fff" }}
          >GIF</button>
        </div>
      </div>

      {/* GIF PICKER PANEL */}
      {showGif && (
        <div 
        ref={gifRef}
        style={{
          position: "absolute",
          bottom: "65px",
          right: "10px",
          width: "280px",
          maxHeight: "300px",
          background: "#000",
          border: "1px solid #333",
          borderRadius: "12px",
          padding: "8px",
          overflowY: "auto",
          zIndex: 10
        }}>
          <input
            placeholder="Search GIF..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              fetchGifs(e.target.value);
            }}
            style={{
              width: "100%", marginBottom: "8px",
              borderRadius: "8px", border: "1px solid #444",
              background: "#111", color: "#fff", padding: "6px"
            }}
          />
          {gifLoading ? <div style={{ color: "#aaa" }}>Loading…</div> : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gifResults.map(g => (
                <img
                  key={g.id}
                  onClick={() => { onSend({url:g.media_formats.tinygif.url}); setShowGif(false); }}
                  src={g.media_formats.tinygif.url}
                  alt=""
                  style={{
                    width: "80px", height: "80px", objectFit: "cover",
                    borderRadius: "8px", cursor: "pointer"
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid #222",
        background: "#000"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            onKeyPress={handleKeyPress}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type message…"
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 20,
              background: "#181818", color: "#fff",
              border: "1px solid #333"
            }}
          />
          <button
            onClick={onSend}
            disabled={!messageInput.trim()}
            style={{
              background: messageInput.trim() ? "linear-gradient(135deg,#19f0b8,#00ffcb)" : "#333",
              padding: "12px",
              borderRadius: "50%",
              border: 'none',
              cursor: messageInput.trim() ? "pointer" : "not-allowed"
            }}>
            <img src="/send.png" alt="send" style={{width:20, height:20}} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function LandingPage({ setAgreed }) {
  return (
    <div style={{
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
      color: "#fff",
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ 
        textAlign: "center", 
        maxWidth: "600px",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "40px",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)"
      }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "20px", fontWeight: "bold" }}>
          OnStrays
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "30px" }}>
          <b>About:</b> Connect with random people across India for 1:1 video chats.<br />
          <b>Disclaimer:</b> Users must be 18+. By using this app, you agree not to share personal, illegal, or abusive content.<br /><br />
          <b>Rules:</b> No nudity, hate speech, or illegal activities. Moderation is minimal. Use at your own risk.<br />
          <b>Privacy:</b> No data is stored. All connections are peer-to-peer after matching.
        </p>
        <button
          style={{
            padding: "16px 48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "#fff",
            border: "none",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
          }}
          onClick={() => setAgreed(true)}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          I Agree, Enter Chat
        </button>
      </div>
    </div>
  );
}

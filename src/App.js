import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";

const SIGNAL_SERVER_URL = "https://onstrays-july.onrender.com"; // backend url

function App() {
  // AGREEMENT STATE
  const [agreed, setAgreed] = useState(false);

  // Video chat state & refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status, setStatus] = useState("Waiting for match...");
  const [socket, setSocket] = useState(null);

  // WebRTC state
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isPolite, setIsPolite] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);

  // WebRTC configuration
  const pcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(pcConfig);
    pcRef.current = pc;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Connected!");
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          candidate: event.candidate.toJSON(),
          partnerId: partnerId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      switch (pc.connectionState) {
        case "connected":
          setStatus("Connected!");
          break;
        case "disconnected":
          setStatus("Connection lost...");
          break;
        case "failed":
          setStatus("Connection failed");
          break;
        case "closed":
          setStatus("Connection closed");
          break;
        default:
          break;
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        // Restart ICE if connection fails
        pc.restartIce();
      }
    };

    // Perfect Negotiation: Handle negotiation needed
    pc.onnegotiationneeded = async () => {
      try {
        console.log("Negotiation needed, isPolite:", isPolite);
        makingOfferRef.current = true;
        
        await pc.setLocalDescription();
        if (socket && partnerId) {
          socket.emit("offer", {
            offer: pc.localDescription,
            partnerId: partnerId,
          });
        }
      } catch (error) {
        console.error("Error in negotiation:", error);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }, [socket, partnerId, isPolite]);

  // Clean up peer connection
  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setPartnerId(null);
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;
  }, []);

  // Handle incoming offer (Perfect Negotiation)
  const handleOffer = useCallback(async (data) => {
    try {
      console.log("Received offer, isPolite:", isPolite);
      
      const offerCollision = 
        makingOfferRef.current || 
        pcRef.current?.signalingState !== "stable";

      ignoreOfferRef.current = !isPolite && offerCollision;
      
      if (ignoreOfferRef.current) {
        console.log("Ignoring offer due to collision (impolite peer)");
        return;
      }

      isSettingRemoteAnswerPendingRef.current = true;
      
      await pcRef.current.setRemoteDescription(data.offer);
      isSettingRemoteAnswerPendingRef.current = false;
      
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      
      if (socket && partnerId) {
        socket.emit("answer", {
          answer: pcRef.current.localDescription,
          partnerId: partnerId,
        });
      }
    } catch (error) {
      console.error("Error handling offer:", error);
      isSettingRemoteAnswerPendingRef.current = false;
    }
  }, [isPolite, socket, partnerId]);

  // Handle incoming answer (Perfect Negotiation)
  const handleAnswer = useCallback(async (data) => {
    try {
      console.log("Received answer");
      
      if (isSettingRemoteAnswerPendingRef.current) {
        console.log("Waiting for remote answer to be set...");
        return;
      }
      
      await pcRef.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (data) => {
    try {
      if (pcRef.current && data.candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }, []);

  // Handle matched event from server
  const handleMatched = useCallback((data) => {
    console.log("Matched with:", data.partnerId, "Role:", data.role);
    setPartnerId(data.partnerId);
    setIsPolite(data.role === "polite");
    setStatus(`Connecting to ${data.partnerId}...`);
    
    // Create new peer connection for this match
    createPeerConnection();
  }, [createPeerConnection]);

  // Handle partner disconnected
  const handlePartnerDisconnected = useCallback(() => {
    console.log("Partner disconnected");
    setStatus("Partner disconnected. Finding new match...");
    cleanupPeerConnection();
    setStatus("Waiting for match...");
  }, [cleanupPeerConnection]);

  // Handle partner next
  const handlePartnerNext = useCallback(() => {
    console.log("Partner clicked next");
    setStatus("Partner skipped. Finding new match...");
    cleanupPeerConnection();
    setStatus("Waiting for match...");
  }, [cleanupPeerConnection]);

  // Initialize socket connection and media
  useEffect(() => {
    if (!agreed) return;

    let cleanup = false;

    const initializeConnection = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (cleanup) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create socket connection
        const s = io(SIGNAL_SERVER_URL, { 
          transports: ["websocket", "polling"],
          
          
        });

        if (cleanup) {
          s.disconnect();
          return;
        }

        setSocket(s);

        // Socket event listeners
        s.on("connect", () => {
          console.log("Connected to server");
          setStatus("Waiting for match...");
        });

        s.on("disconnect", () => {
          console.log("Disconnected from server");
          setStatus("Disconnected from server");
        });

        s.on("matched", handleMatched);
        s.on("partner_disconnected", handlePartnerDisconnected);
        s.on("partner_next", handlePartnerNext);
        s.on("offer", handleOffer);
        s.on("answer", handleAnswer);
        s.on("ice-candidate", handleIceCandidate);

        s.on("connect_error", (error) => {
          console.error("Connection error:", error);
          setStatus("Connection error. Retrying...");
        });

      } catch (error) {
        console.error("Error initializing:", error);
        setStatus("Camera/Mic access denied.");
      }
    };

    initializeConnection();

    return () => {
      cleanup = true;
      
      // Clean up media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      
      // Clean up peer connection
      cleanupPeerConnection();
      
      // Clean up socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [agreed, handleMatched, handlePartnerDisconnected, handlePartnerNext, handleOffer, handleAnswer, handleIceCandidate, cleanupPeerConnection]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (socket) {
      console.log("Requesting next match");
      socket.emit("next");
      setStatus("Finding new match...");
      cleanupPeerConnection();
    }
  }, [socket, cleanupPeerConnection]);

  // LANDING PAGE
  if (!agreed) {
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

  // VIDEO CHAT PAGE
  return (
    <div style={{ 
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", 
      color: "#fff", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px"
    }}>
      <h1 style={{ marginBottom: "20px", fontSize: "2.5rem", fontWeight: "bold" }}>
        OnStrays
      </h1>
      
      <div style={{ 
        display: "flex", 
        gap: "20px", 
        marginBottom: "20px",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <div style={{ position: "relative" }}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
            style={{ 
              width: "400px", 
              height: "300px",
              background: "#374151", 
              borderRadius: "15px",
              border: "2px solid #4f46e5",
              objectFit: "cover"
            }} 
          />
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px"
          }}>
            You
          </div>
        </div>
        
        <div style={{ position: "relative" }}>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            style={{ 
              width: "400px", 
              height: "300px",
              background: "#374151", 
              borderRadius: "15px",
              border: "2px solid #10b981",
              objectFit: "cover"
            }} 
          />
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px"
          }}>
            Stranger
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: "20px", 
        fontSize: "1.2rem",
        textAlign: "center",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "10px 20px",
        borderRadius: "10px",
        backdropFilter: "blur(5px)"
      }}>
        {status}
      </div>
      
      <div style={{ display: "flex", gap: "15px" }}>
        <button 
          onClick={handleNext} 
          disabled={!socket}
          style={{ 
            padding: "14px 40px", 
            borderRadius: "10px", 
            background: socket ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "#6b7280",
            color: "#fff", 
            border: "none", 
            fontWeight: "bold",
            fontSize: "16px",
            cursor: socket ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            boxShadow: socket ? "0 4px 15px rgba(37, 99, 235, 0.4)" : "none"
          }}
          onMouseOver={(e) => socket && (e.target.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => socket && (e.target.style.transform = "translateY(0)")}
        >
          Next
        </button>
      </div>
      
      <div style={{ 
        marginTop: "20px", 
        fontSize: "12px", 
        opacity: "0.7",
        textAlign: "center"
      }}>
        Role: {isPolite ? "Polite" : "Impolite"} | Partner: {partnerId || "None"}
      </div>
    </div>
  );
}

export default App;
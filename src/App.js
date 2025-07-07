import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import LandingPage from "./pages/myLandingPage";

const SIGNAL_SERVER_URL = "https://onstrays-july.onrender.com"; // backend url

function App() {
  // AGREEMENT STATE
  const [agreed, setAgreed] = useState(false);

  if (!agreed) {
    return <LandingPage setAgreed={setAgreed} />;
  }

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
  const connectionTimerRef = useRef(null);

  // User reconnection state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionTimer, setReconnectionTimer] = useState(0);
  const [connectionLost, setConnectionLost] = useState(false);
  const reconnectionTimerRef = useRef(null);
  const reconnectionCountdownRef = useRef(null);

  // Network detection state
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const onlineCheckIntervalRef = useRef(null);

  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);

  // Store socket reference for manual negotiation
  const socketRef = useRef(null);

  // Internet connection checker
  const checkInternetConnection = async () => {
    try {
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Reconnection countdown function
  const startReconnectionCountdown = useCallback(() => {
    let timeLeft = 10; // 10 seconds
    setReconnectionTimer(timeLeft);
    setIsReconnecting(true);
    
    reconnectionCountdownRef.current = setInterval(() => {
      timeLeft--;
      setReconnectionTimer(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(reconnectionCountdownRef.current);
        setIsReconnecting(false);
        setConnectionLost(true);
        setStatus("❌ Connection lost - unable to reconnect");
      }
    }, 1000);
  }, []);

  // Clear reconnection timers
  const clearReconnectionTimers = useCallback(() => {
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
    if (reconnectionCountdownRef.current) {
      clearInterval(reconnectionCountdownRef.current);
      reconnectionCountdownRef.current = null;
    }
    setIsReconnecting(false);
    setReconnectionTimer(0);
    setConnectionLost(false);
  }, []);

  // Handle online/offline status
  const handleOnlineStatus = useCallback(async () => {
    const online = await checkInternetConnection();
    setIsOnline(online);
    
    if (!online && !showOfflineWarning) {
      setShowOfflineWarning(true);
      // Pause any ongoing reconnection attempts
      if (isReconnecting) {
        clearReconnectionTimers();
        setStatus("📵 You're offline - check your internet");
      } else if (partnerId) {
        setStatus("📵 You're offline - connection lost");
      } else {
        setStatus("📵 No internet connection");
      }
    } else if (online && showOfflineWarning) {
      setShowOfflineWarning(false);
      // Resume based on current state
      if (partnerId && connectionLost) {
        setStatus("🔄 Internet restored - trying to reconnect...");
        startReconnectionCountdown();
      } else if (partnerId) {
        setStatus("✅ Internet restored - resuming chat");
      } else {
        setStatus("✅ Internet restored - waiting for match...");
      }
    }
  }, [showOfflineWarning, isReconnecting, partnerId, connectionLost, clearReconnectionTimers, startReconnectionCountdown]);

  // Create peer connection with dynamic Cloudflare TURN credentials
  const createPeerConnection = useCallback(async () => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    let config;
    try {
      console.log('🔄 Fetching Cloudflare TURN credentials...');
      const response = await fetch(`${SIGNAL_SERVER_URL}/api/turn-credentials`);
      const data = await response.json();
      console.log('🔍 Cloudflare API Response:', JSON.stringify(data, null, 2));

      // Build the iceServers array, flatten if needed
      const servers = [];
      data.iceServers.forEach(server => {
        // If 'urls' is a string, make it an array
        const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
        urls.forEach(url => {
          servers.push({
            urls: url,
            username: server.username,
            credential: server.credential
          });
        });
      });

      config = {
        iceServers: servers,
        iceCandidatePoolSize: 10,
      };

      console.log('✅ Cloudflare credentials loaded');
    } catch (error) {
      console.error('❌ Failed to get TURN credentials:', error);

      // Fallback config
      config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:a.relay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ],
        iceCandidatePoolSize: 10,
      };
    }

    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("➕ Adding track:", track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log("📺 Received remote track:", event.track.kind);
      console.log("🔍 DEBUG: connectionTimer exists?", !!connectionTimerRef.current);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Connected!");
        
        if (connectionTimerRef.current) {
          console.log("🕐 Connection successful - clearing timeout");
          clearTimeout(connectionTimerRef.current);
          connectionTimerRef.current = null;
        } else {
          console.log("❌ No connectionTimer to clear!");
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        const candidate = event.candidate;
        
        // Enhanced logging info (like the successful clone)
        console.log(`🧊 Local Candidate Type: ${candidate.type}`);
        console.log(`🧊 Candidate Address: ${candidate.address || 'unknown'}`);
        console.log(`🧊 Candidate Protocol: ${candidate.protocol}`);
        console.log(`🧊 Full candidate: ${candidate.candidate}`);
        
        // Check for Cloudflare relay (TURN) candidate
        if (candidate.type === 'relay') {
          console.log(`✅ CLOUDFLARE TURN WORKING! Address: ${candidate.address}`);
        }

        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate.toJSON(),
          partnerId: partnerId,
        });
      } else if (!event.candidate) {
        console.log("🧊 ICE gathering complete");
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", pc.connectionState);
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

    // Enhanced ICE connection state handling with manual reconnection
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          console.log("ICE connection established");
          // Clear any reconnection attempts
          clearReconnectionTimers();
          pc._iceRestartAttempted = false;
          setStatus("Connected!");
          break;
          
        case "disconnected":
          console.log("ICE connection disconnected, attempting reconnection...");
          if (!isReconnecting && !connectionLost && !showOfflineWarning) {
            setStatus(`📵 Connection lost, trying to reconnect... (${reconnectionTimer}s)`);
            startReconnectionCountdown();
            
            // Try ICE restart
            if (!pc._iceRestartAttempted) {
              pc._iceRestartAttempted = true;
              setTimeout(() => {
                if (pc.iceConnectionState === "disconnected") {
                  console.log("Executing ICE restart...");
                  pc.restartIce();
                }
              }, 2000);
            }
          }
          break;
          
        case "failed":
          console.log("ICE connection failed completely");
          clearReconnectionTimers();
          setConnectionLost(true);
          setStatus("❌ Connection failed - unable to reconnect");
          break;
          
        case "checking":
          if (isReconnecting) {
            setStatus(`🔄 Reconnecting... (${reconnectionTimer}s)`);
          } else {
            console.log("ICE connection checking...");
            setStatus("Connecting...");
          }
          break;
          
        default:
          break;
      }
    };

    return pc;
  }, [partnerId, isReconnecting, connectionLost, reconnectionTimer, showOfflineWarning, startReconnectionCountdown, clearReconnectionTimers]);

  // Clean up peer connection
  const cleanupPeerConnection = useCallback(() => {
    // Clear reconnection timers
    clearReconnectionTimers();
    
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
  }, [clearReconnectionTimers]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (socket) {
      console.log("Requesting next match");
      socket.emit("next");
      setStatus("Finding new match...");
      cleanupPeerConnection();
    }
  }, [socket, cleanupPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (data) => {
    try {
      console.log("📥 Received offer from partner");
      
      const offerCollision = 
        makingOfferRef.current || 
        pcRef.current?.signalingState !== "stable";

      ignoreOfferRef.current = !isPolite && offerCollision;
      
      if (ignoreOfferRef.current) {
        console.log("🚫 Ignoring offer due to collision");
        return;
      }

      console.log("✅ Processing offer...");
      isSettingRemoteAnswerPendingRef.current = true;
      
      await pcRef.current.setRemoteDescription(data.offer);
      isSettingRemoteAnswerPendingRef.current = false;
      
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      // FIX: Use partnerId from the offer data instead of state
      const targetPartnerId = data.partnerId || partnerId;
      console.log("🔍 About to send answer to:", targetPartnerId);
        
      if (socketRef.current && targetPartnerId) {
        console.log("📤 Sending answer to partner");
        socketRef.current.emit("answer", {
          answer: pcRef.current.localDescription,
          partnerId: targetPartnerId,
        });
      } else {
        console.error("❌ Cannot send answer - missing socket or partnerId");
      }
    } catch (error) {
      console.error("❌ Error handling offer:", error);
      isSettingRemoteAnswerPendingRef.current = false;
    }
  }, [isPolite, partnerId]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (data) => {
    try {
      console.log("📥 Received answer from partner");
      
      if (isSettingRemoteAnswerPendingRef.current) {
        console.log("Waiting for remote answer to be set...");
        return;
      }
      
      await pcRef.current.setRemoteDescription(data.answer);
      console.log("✅ Answer processed successfully");
    } catch (error) {
      console.error("❌ Error handling answer:", error);
    }
  }, []);

  // Handle incoming ICE candidate with buffering
  const handleIceCandidate = useCallback(async (data) => {
    try {
      if (pcRef.current && data.candidate) {
        console.log("📥 Received ICE candidate:", data.candidate.type);
        
        // Check if remote description is set
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log("✅ ICE candidate added");
        } else {
          console.log("⏳ Buffering ICE candidate - no remote description yet");
          // You could store candidates in a buffer array here if needed
          // For now, just skip - WebRTC will handle retransmission
        }
      } else {
        console.log("⏭️ Skipping ICE candidate - no peer connection or candidate");
      }
    } catch (error) {
      console.error("❌ Error adding ICE candidate:", error);
    }
  }, []);

  // Handle matched event with manual negotiation
  const handleMatched = useCallback(async (data) => {
    console.log("🎯 Matched with:", data.partnerId, "Role:", data.role);

    // CLEAR ANY EXISTING TIMER FIRST
    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }

    setPartnerId(data.partnerId);
    setIsPolite(data.role === "polite");
    setStatus(`Connecting to ${data.partnerId}...`);

    // ADD TIMEOUT HERE (no functions, just direct logic)
    const timer = setTimeout(() => {
      console.log("⏰ Connection timeout - auto skipping");
      setStatus("Connection timeout - finding new match...");
      
      // Directly call socket.emit instead of handleNext
      if (socketRef.current) {
        socketRef.current.emit("next");
        setStatus("Finding new match...");
        // Clean up manually
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setPartnerId(null);
      }
    }, 15000); // 15 seconds
    
    connectionTimerRef.current = timer;
    console.log("🔍 TIMER SET:", !!connectionTimerRef.current, "Timer ID:", timer); 

    // Create new peer connection for this match with fresh credentials
    const pc = await createPeerConnection();
    
    // Manual negotiation for impolite peer
    if (data.role === "impolite") {
      console.log("🚀 Starting manual negotiation as impolite");
      setTimeout(async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          console.log("📤 Sending manual offer");
          if (socketRef.current) {
            socketRef.current.emit("offer", {
              offer: pc.localDescription,
              partnerId: data.partnerId,
            });
          } else {
            console.error("❌ No socket available for offer");
          }
        } catch (error) {
          console.error("❌ Manual offer error:", error);
        }
      }, 1000);
    }
  }, [createPeerConnection]);

  // Handle partner disconnected
  const handlePartnerDisconnected = useCallback(() => {
    console.log("Partner disconnected");
    setStatus("Partner disconnected. Finding new match...");
    cleanupPeerConnection();
    setStatus("Waiting for match...");

    if (socketRef.current) {
      console.log("🔄 Rejoining queue after partner disconnect");
      // The backend should automatically add disconnected users back to queue
      // But we can ensure it by emitting a rejoin event
    }
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
    if (!agreed || socket) return;
    
    const initConnection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const s = io(SIGNAL_SERVER_URL, { 
          transports: ["websocket", "polling"]
        });

        setSocket(s);
        socketRef.current = s; // Store in ref for immediate access

        s.on("connect", () => {
          console.log("✅ Connected:", s.id);
          setStatus("Waiting for match...");
        });

        s.on("matched", handleMatched);
        s.on("partner_disconnected", handlePartnerDisconnected);
        s.on("partner_next", handlePartnerNext);
        s.on("offer", (data) => {
          console.log("🎯 OFFER EVENT RECEIVED:", data);
          handleOffer(data);
        });
        s.on("answer", handleAnswer);
        s.on("ice-candidate", handleIceCandidate);

      } catch (error) {
        console.error("Error initializing:", error);
        setStatus("Camera/Mic access denied.");
      }
    };

    initConnection();
  }, [agreed, handleMatched, handlePartnerDisconnected, handlePartnerNext, handleOffer, handleAnswer, handleIceCandidate]);

  // Monitor internet connection
  useEffect(() => {
    // Check immediately
    handleOnlineStatus();
    
    // Check every 3 seconds
    onlineCheckIntervalRef.current = setInterval(handleOnlineStatus, 3000);
    
    // Listen to browser online/offline events
    const handleBrowserOnline = () => {
      console.log('📶 Browser detected online');
      handleOnlineStatus();
    };
    
    const handleBrowserOffline = () => {
      console.log('📵 Browser detected offline');
      setIsOnline(false);
      setShowOfflineWarning(true);
      if (partnerId) {
        setStatus("📵 You're offline - connection lost");
      } else {
        setStatus("📵 No internet connection");
      }
    };
    
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    
    return () => {
      if (onlineCheckIntervalRef.current) {
        clearInterval(onlineCheckIntervalRef.current);
      }
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, [handleOnlineStatus, partnerId]);

  //Landing page

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
        background: showOfflineWarning ? "rgba(239, 68, 68, 0.2)" :
                    connectionLost ? "rgba(239, 68, 68, 0.2)" : 
                    isReconnecting ? "rgba(251, 191, 36, 0.2)" : 
                    "rgba(255, 255, 255, 0.1)",
        padding: "10px 20px",
        borderRadius: "10px",
        backdropFilter: "blur(5px)",
        border: showOfflineWarning ? "2px solid #ef4444" :
                connectionLost ? "2px solid #ef4444" : 
                isReconnecting ? "2px solid #f59e0b" : 
                "1px solid transparent"
      }}>
        {showOfflineWarning ? (
          <div>
            <div style={{ fontSize: "1.4rem", marginBottom: "5px" }}>
              📵 You're Offline
            </div>
            <div style={{ fontSize: "0.9rem", opacity: "0.8" }}>
              Check your internet connection
            </div>
          </div>
        ) : connectionLost ? (
          <div>
            <div style={{ fontSize: "1.4rem", marginBottom: "5px" }}>
              ❌ Connection Lost
            </div>
            <div style={{ fontSize: "0.9rem", opacity: "0.8" }}>
              Unable to reconnect - click Next to find new match
            </div>
          </div>
        ) : isReconnecting ? (
          <div>
            <div style={{ fontSize: "1.4rem", marginBottom: "5px" }}>
              🔄 Trying to Reconnect...
            </div>
            <div style={{ fontSize: "0.9rem", opacity: "0.8" }}>
              {reconnectionTimer} seconds remaining
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <span style={{ 
              width: "8px", 
              height: "8px", 
              borderRadius: "50%", 
              backgroundColor: isOnline ? "#10b981" : "#ef4444" 
            }}></span>
            {status}
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: "15px" }}>
        <button 
          onClick={handleNext} 
          disabled={!socket || isReconnecting || showOfflineWarning}
          style={{ 
            padding: "14px 40px", 
            borderRadius: "10px", 
            background: !socket || isReconnecting || showOfflineWarning ? "#6b7280" : 
                        connectionLost ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" :
                        "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#fff", 
            border: "none", 
            fontWeight: "bold",
            fontSize: "16px",
            cursor: (!socket || isReconnecting || showOfflineWarning) ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: (!socket || isReconnecting || showOfflineWarning) ? "none" : "0 4px 15px rgba(37, 99, 235, 0.4)"
          }}
          onMouseOver={(e) => (socket && !isReconnecting && !showOfflineWarning) && (e.target.style.transform = "translateY(-2px)")}
          onMouseOut={(e) => (socket && !isReconnecting && !showOfflineWarning) && (e.target.style.transform = "translateY(0)")}
        >
          {showOfflineWarning ? "Offline" :
           isReconnecting ? `Reconnecting... (${reconnectionTimer}s)` : 
           connectionLost ? "Find Next Match" : 
           "Next"}
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
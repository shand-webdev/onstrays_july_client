import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import LandingPage from "./pages/myLandingPage.js";
import UserAccount from "./components/UserAccount.js";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import ChatBox from "./components/ChatBox";


const SIGNAL_SERVER_URL = "http://localhost:3001"//"https://onstrays-july.onrender.com";

function App() {
  

  // GOOGLE AUTHENTICATION STATE
  const [user, setUser] = useState(null);
const [agreed, setAgreed] = useState(false);
const [authLoading, setAuthLoading] = useState(true);
const [redirectLoading, setRedirectLoading] = useState(true);
const [displayName, setDisplayName] = useState("Stranger");

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Video chat state & refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status, setStatus] = useState("Waiting for match...");
  const [socket, setSocket] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]); // Array of { sender: "me"|"stranger", text: "..." }
const [messageInput, setMessageInput] = useState("");


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

 

useEffect(() => {
  if (localStorage.getItem('onstrays_agreed') === 'yes') {
    setAgreed(true);
  }
}, []);



//Redirect Handler
useEffect(() => {
  // Only run on mount, handle Firebase redirect for mobile
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        setUser(result.user);
        setDisplayName("Stranger");
        setAgreed(true);
      }
    })
    .finally(() => {
      setRedirectLoading(false);
    });
}, []);


  // AUTH STATE LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("🔄 Auth state changed:", currentUser ? currentUser.displayName : "No user");
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setAgreed(false); // Reset to landing page on sign out
      }
    });

    return () => unsubscribe();
  }, []);


  // [C] Login function
  const signInWithGoogle = async () => {
  setAuthLoading(true);
  try {
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      // Do NOT setAgreed(true) or setUser here (will happen after redirect)
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setDisplayName("Stranger");
      setAgreed(true);
    }
  } catch (error) {
    console.error("❌ Google sign-in error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      alert("Sign-in cancelled. Please try again.");
    } else {
      alert("Sign-in failed. Please try again.");
    }
  } finally {
    setAuthLoading(false);
  }
};





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
    let timeLeft = 10;
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

      const servers = [];
      data.iceServers.forEach(server => {
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("➕ Adding track:", track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      console.log("📺 Received remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setStatus("Connected!");
        
        if (connectionTimerRef.current) {
          console.log("🕐 Connection successful - clearing timeout");
          clearTimeout(connectionTimerRef.current);
          connectionTimerRef.current = null;
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        const candidate = event.candidate;
        
        console.log(`🧊 Local Candidate Type: ${candidate.type}`);
        console.log(`🧊 Candidate Address: ${candidate.address || 'unknown'}`);
        console.log(`🧊 Candidate Protocol: ${candidate.protocol}`);
        
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

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          console.log("ICE connection established");
          clearReconnectionTimers();
          pc._iceRestartAttempted = false;
          setStatus("Connected!");
          break;
          
        case "disconnected":
          console.log("ICE connection disconnected, attempting reconnection...");
          if (!isReconnecting && !connectionLost && !showOfflineWarning) {
            setStatus(`📵 Connection lost, trying to reconnect... (${reconnectionTimer}s)`);
            startReconnectionCountdown();
            
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
    clearReconnectionTimers();
    setMessages([]);
    
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
      setMessages([]); // Clear messages

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

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (data) => {
    try {
      if (pcRef.current && data.candidate) {
        console.log("📥 Received ICE candidate:", data.candidate.type);
        
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log("✅ ICE candidate added");
        } else {
          console.log("⏳ Buffering ICE candidate - no remote description yet");
        }
      } else {
        console.log("⏭️ Skipping ICE candidate - no peer connection or candidate");
      }
    } catch (error) {
      console.error("❌ Error adding ICE candidate:", error);
    }
  }, []);

  // Handle matched event
  const handleMatched = useCallback(async (data) => {
    console.log("🎯 Matched with:", data.partnerId, "Role:", data.role);

    if (connectionTimerRef.current) {
      clearTimeout(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }

    setPartnerId(data.partnerId);
    setIsPolite(data.role === "polite");
    setStatus(`Connecting to ${data.partnerId}...`);

    const timer = setTimeout(() => {
      console.log("⏰ Connection timeout - auto skipping");
      setStatus("Connection timeout - finding new match...");
      
      if (socketRef.current) {
        socketRef.current.emit("next");
        setStatus("Finding new match...");
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setPartnerId(null);
      }
    }, 15000);
    
    connectionTimerRef.current = timer;
    console.log("🔍 TIMER SET:", !!connectionTimerRef.current, "Timer ID:", timer); 

    const pc = await createPeerConnection();
    
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
  if (!agreed || !user || socket) return;
  
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
      socketRef.current = s;

      s.on("connect", () => {
        console.log("✅ Connected:", s.id);
        setStatus("Waiting for match...");
      });
        s.emit("test-connection", { message: "Hello from frontend" });


      s.on("matched", handleMatched);
      s.on("partner_disconnected", handlePartnerDisconnected);
      s.on("partner_next", handlePartnerNext);
      s.on("offer", (data) => {
        console.log("🎯 OFFER EVENT RECEIVED:", data);
        handleOffer(data);
      });
      s.on("answer", handleAnswer);
      s.on("ice-candidate", handleIceCandidate);

      s.on("test-response", (data) => {
  console.log("🧪 FRONTEND: Test response received:", data);
});
      
      // Move this inside the try block:
      s.on("message", (data) => {
          console.log("📨 RECEIVED MESSAGE EVENT:", data); // Add this
  console.log("📨 Message content:", data.message);
        setMessages(prev => [...prev, { 
          sender: "stranger", 
          text: data.message,
          timestamp: new Date()
        }]);
      });

    } catch (error) {
      console.error("Error initializing:", error);
      setStatus("Camera/Mic access denied.");
    }
  };

  initConnection();
}, [agreed, user, socket, handleMatched, handlePartnerDisconnected, handlePartnerNext, handleOffer, handleAnswer, handleIceCandidate]);

  const handleSendMessage = () => {
    console.log("🔥 handleSendMessage called!"); // Add this first
  console.log("📊 State check:", { 
    messageInput: messageInput.trim(), 
    socket: !!socket, 
    partnerId: partnerId }); // Add this debug log

  if (!messageInput.trim() || !socket || !partnerId) {
        console.log("❌ Message blocked - missing requirements");
    return;
  }
  console.log("📤 Sending message to backend:", messageInput, "to partner:", partnerId); // Add this

  // Add message to your own chat
  setMessages(prev => [...prev, { 
    sender: "me", 
    text: messageInput,
    timestamp: new Date()
  }]);
  
  // Send message to partner via socket
  socket.emit("message", {
    message: messageInput,
    partnerId: partnerId
  });

  console.log("🔍 Socket connected?", socket.connected);
console.log("🔍 Socket ID:", socket.id);
    console.log("✅ Message emitted to socket"); // Add this

  
  setMessageInput("");
};



  // Monitor internet connection
  useEffect(() => {
    handleOnlineStatus();
    
    onlineCheckIntervalRef.current = setInterval(handleOnlineStatus, 3000);
    
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


  const handleAgreeAndMaybeLogin = () => {
  if (user) {
    setAgreed(true);
    localStorage.setItem('onstrays_agreed', 'yes');
  } else {
    signInWithGoogle();
  }
};


  // CONDITIONAL RENDERING
  if (redirectLoading || authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "1.5rem"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.3)",
            borderTop: "3px solid #fff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

 if (!agreed || !user) {
  return (
    <LandingPage
      onAgreeAndMaybeLogin={handleAgreeAndMaybeLogin}
      user={user}
      signInWithGoogle={signInWithGoogle}
      onStartVideoChat={() => {
        setAgreed(true);
        localStorage.setItem('onstrays_agreed', 'yes');
      }}
    />
  );
}




 return (
  <div style={{ 
    height: "100vh", 
    width: "100vw",
    backgroundColor: "#000000", 
    color: "#ffffff", 
    display: "flex", 
    flexDirection: "column",
    margin: "0",
    padding: "0",
    position: "fixed",
    top: "0",
    left: "0",
    overflow: "hidden"
  }}>
    {/* Global CSS Reset */}
    <style jsx global>{`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
      
      #root {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
    `}</style>
    
    {/* Navigation Bar */}
    <nav style={{ backgroundColor: "#181818", borderBottom: "1px solid #222222", padding: "16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 
  style={{ 
    fontSize: "1.5rem", 
    fontWeight: "bold", 
    background: "linear-gradient(135deg, #19f0b8 0%, #00ffcb 100%)", 
    WebkitBackgroundClip: "text", 
    WebkitTextFillColor: "transparent",
    cursor: "pointer"
  }}
  onClick={() => setAgreed(false)}
>
  Onstrays
</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "100px" }}>            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isOnline ? "#19f0b8" : "#ef4444" }}></div>
            <span style={{ fontSize: "0.875rem", color: "#cccccc" }}>
              {showOfflineWarning ? "Offline" :
               connectionLost ? "Connection Lost" : 
               isReconnecting ? "Reconnecting..." : 
               status}
            </span>
          </div>
          <UserAccount 
            user={user} 
            displayName={displayName} 
            setDisplayName={setDisplayName} 
          />
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left Side - Stranger Video */}
      <div style={{ width: "60%", backgroundColor: "#181818", position: "relative" }}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: "1024px", maxHeight: "100%" }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover", 
                borderRadius: "8px", 
                backgroundColor: "#222222",
                maxHeight: "calc(100vh - 80px)"
              }}
            />
            
            {/* Status Overlay on Stranger Video */}
            {(!partnerId || !remoteVideoRef.current?.srcObject) && (
              <div style={{
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                backgroundColor: "rgba(34, 34, 34, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                borderRadius: "8px"
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
                  {showOfflineWarning ? "📵" :
                   connectionLost ? "❌" : 
                   isReconnecting ? "🔄" : 
                   "🔍"}
                </div>
                <div style={{ fontSize: "1.2rem", textAlign: "center", marginBottom: "8px", color: "#ffffff" }}>
                  {showOfflineWarning ? "You're Offline" :
                   connectionLost ? "Connection Lost" : 
                   isReconnecting ? "Trying to Reconnect..." : 
                   status}
                </div>
                {(showOfflineWarning || connectionLost || isReconnecting) && (
                  <div style={{ fontSize: "0.9rem", opacity: "0.8", textAlign: "center", color: "#cccccc" }}>
                    {showOfflineWarning ? "Check your internet connection" :
                     connectionLost ? "Unable to reconnect - click Next to find new match" : 
                     `${reconnectionTimer} seconds remaining`}
                  </div>
                )}
              </div>
            )}
            
            {/* Report Button */}
            <button style={{ 
              position: "absolute", 
              top: "16px", 
              left: "16px", 
              backgroundColor: "#ef4444", 
              padding: "8px", 
              borderRadius: "20%", 
              border: "none", 
              cursor: "pointer",
              transition: "background-color 0.3s",
              boxShadow: "0 0 15px rgba(53, 0, 211, 0.3)"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
            onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}>
              <span style={{ color: "#fff", fontSize: "16px" }}>⚠</span>
            </button>
            
            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!socket || isReconnecting || showOfflineWarning}
              style={{ 
                position: "absolute", 
                bottom: "16px", 
                right: "16px", 
                padding: "8px 24px", 
                borderRadius: "20px", 
                border: "none", 
                fontSize: "0.875rem", 
                fontWeight: "500",
                cursor: (!socket || isReconnecting || showOfflineWarning) ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                backgroundColor: !socket || isReconnecting || showOfflineWarning 
                  ? "#23272b" 
                  : connectionLost 
                    ? "#ef4444" 
                    : "#19f0b8",
                background: (!socket || isReconnecting || showOfflineWarning) 
                  ? "#23272b" 
                  : connectionLost 
                    ? "#ef4444" 
                    : "linear-gradient(135deg, #19f0b8 0%, #00ffcb 100%)",
                color: "#000000",
                boxShadow: (!socket || isReconnecting || showOfflineWarning) ? "none" : "0 0 20px rgba(25, 240, 184, 0.4)"
              }}
              onMouseOver={(e) => {
                if (socket && !isReconnecting && !showOfflineWarning) {
                  e.target.style.boxShadow = connectionLost ? "0 0 20px rgba(239, 68, 68, 0.4)" : "0 0 25px rgba(25, 240, 184, 0.6)";
                }
              }}
              onMouseOut={(e) => {
                if (socket && !isReconnecting && !showOfflineWarning) {
                  e.target.style.boxShadow = connectionLost ? "none" : "0 0 20px rgba(25, 240, 184, 0.4)";
                }
              }}
            >
              {showOfflineWarning ? "Offline" :
               isReconnecting ? `Reconnecting... (${reconnectionTimer}s)` : 
               connectionLost ? "Find Next Match" : 
               "Next"}
            </button>
            
            {/* Stranger Name Tag */}
            <div style={{ 
              position: "absolute", 
              bottom: "16px", 
              left: "18px", 
              backgroundColor: "rgba(0, 0, 0, 0.8)", 
              padding: "4px 12px", 
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid #19f0b8"
            }}>
              <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#ffffff" }}>Stranger</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ width: "40%", backgroundColor: "#000000", display: "flex", flexDirection: "column" }}>
        {/* My Video - Top Right */}
        <div style={{ height: "450px", padding: "5px", borderBottom: "1px solid #222222" }}>
          <div style={{ position: "relative", height: "100%" }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover", 
                borderRadius: "8px", 
                backgroundColor: "#222222",
                border: "1px solid #19f0b8"
              }}
            />
            
            {/* My Name Tag */}
            <div style={{ 
              position: "absolute", 
              bottom: "13px", 
              left: "8px", 
              backgroundColor: "rgba(0, 0, 0, 0.8)", 
              padding: "4px 12px", 
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid #19f0b8"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#ffffff" }}>{displayName}</span>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ChatBox
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>

    {/* Debug Info */}
    <div style={{ 
      position: "absolute",
      bottom: "10px",
      left: "10px",
      fontSize: "12px", 
      opacity: "0.7",
      background: "rgba(0, 0, 0, 0.8)",
      padding: "4px 8px",
      borderRadius: "4px",
      color: "#cccccc",
      border: "1px solid #222222"
    }}>
      Role: {isPolite ? "Polite" : "Impolite"} | Partner: {partnerId || "None"}
    </div>
  </div>
);
}

export default App;
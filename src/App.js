import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import LandingPage from "./pages/myLandingPage.js";
import UserAccount from "./components/UserAccount.js";
import { signInWithPopup, signOut, onAuthStateChanged, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';

const SIGNAL_SERVER_URL = "https://onstrays-july.onrender.com";

function App() {
  // AGREEMENT STATE
  const [agreed, setAgreed] = useState(false);

  // GOOGLE AUTHENTICATION STATE
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // NAME MANAGEMENT STATE
  const [displayName, setDisplayName] = useState("Stranger");

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

  const signInWithGoogle = async () => {
  try {
    setAuthLoading(true);
    if (isMobile) {
      // On mobile, use redirect for Google Auth
      await signInWithRedirect(auth, googleProvider);
    } else {
      // On desktop, use popup for Google Auth
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setDisplayName("Stranger"); // Set default name
      setAgreed(true);
      console.log("✅ User signed in:", result.user.displayName);
      console.log("🎭 Display name set to: Stranger");
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

  useEffect(() => {
  // Runs once on first load, for signInWithRedirect
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        setUser(result.user);
        setDisplayName("Stranger");
        setAgreed(true);
      }
    })
    .catch((error) => {
      // Handle redirect errors here if you want
      console.error("Redirect auth error:", error);
    });
}, []);

  // AUTO-TRIGGER GOOGLE SIGN-IN
  useEffect(() => {
    if (agreed && !user && !authLoading) {
      const timer = setTimeout(() => {
        signInWithGoogle();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [agreed, user, authLoading]);

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
  }, [agreed, user, handleMatched, handlePartnerDisconnected, handlePartnerNext, handleOffer, handleAnswer, handleIceCandidate]);

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

  // CONDITIONAL RENDERING
  if (authLoading) {
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

  if (!agreed) {
  return <LandingPage setAgreed={setAgreed} signInWithGoogle={signInWithGoogle} user={user} />;
}


  if (!user) {
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
          maxWidth: "500px",
          background: "rgba(255, 255, 255, 0.1)",
          padding: "40px",
          borderRadius: "20px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "20px", fontWeight: "bold" }}>
            OnStrays
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "30px", lineHeight: "1.6" }}>
            Connecting you anonymously...
          </p>
          
          {!authLoading && (
            <button
              onClick={signInWithGoogle}
              style={{
                padding: "16px 32px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #db4437 0%, #c23321 100%)",
                color: "#fff",
                border: "none",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(219, 68, 55, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                margin: "0 auto"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue Anonymously
            </button>
          )}
          
          <div style={{ 
            marginTop: "20px", 
            fontSize: "0.9rem", 
            opacity: "0.8",
            lineHeight: "1.4"
          }}>
            Quick verification required. Your identity remains anonymous.
          </div>
        </div>
      </div>
    );
  }

  // VIDEO CHAT PAGE
  return (
    <div style={{ 
      background: "linear-gradient(135deg, #0f2027 0%, #2c5364 100%)", 
      color: "#fff", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px",
      position: "relative"
    }}>
      {/* USER ACCOUNT COMPONENT */}
      <UserAccount 
        user={user} 
        displayName={displayName} 
        setDisplayName={setDisplayName} 
      />

      <h1 style={{ marginBottom: "20px", fontSize: "2.5rem", fontWeight: "bold" }}>
        OnStrays
      </h1>

      {/* Display current name */}
      <div style={{ 
        marginBottom: "15px", 
        fontSize: "1rem",
        opacity: "0.8",
        background: "rgba(255, 255, 255, 0.1)",
        padding: "8px 16px",
        borderRadius: "20px",
        backdropFilter: "blur(10px)"
      }}>
        You are: <strong>{displayName}</strong>
      </div>
      
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
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            backdropFilter: "blur(10px)"
          }}>
            {displayName}
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
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            backdropFilter: "blur(10px)"
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

      {/* CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
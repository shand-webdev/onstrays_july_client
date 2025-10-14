import React, { useRef, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import LandingPage from "./pages/myLandingPage.js";
import UserAccount from "./components/UserAccount.js";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import ChatBox from "./components/ChatBox";
import TipButton from "./components/TipButton";
import TipsDisplay from "./components/TipsDisplay"; // ADD THIS LINE
import { motion, AnimatePresence } from 'framer-motion';
import { initializeUser, reportUser } from './services/firebaseService';

const SIGNAL_SERVER_URL = "https://onstrays-july.onrender.com";//"http://localhost:3002";//

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

  //new states for interest matching
const [userInterest, setUserInterest] = useState("Any Interest");
const [selectedCountry, setSelectedCountry] = useState('🇮🇳');
const [lookingFor, setLookingFor] = useState('Any');



  // Chat state
  const [messages, setMessages] = useState([]); // Array of { sender: "me"|"stranger", text: "..." }
const [messageInput, setMessageInput] = useState("");
const [showMessages, setShowMessages] = useState(false);


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

 
// Chat duration and timing
const [chatDuration, setChatDuration] = useState(0);
const [chatStartTime, setChatStartTime] = useState(null);


//report
const [hasReportedPartner, setHasReportedPartner] = useState(false);
const [showReportConfirm, setShowReportConfirm] = useState(false);
const [partnerUserId, setPartnerUserId] = useState(null); // This is crucial!




//like system

const [myTips, setMyTips] = useState(0);
const [partnerTips, setPartnerTips] = useState(0);
const [justReceivedTip, setJustReceivedTip] = useState(false);
const [sessionTipsReceived, setSessionTipsReceived] = useState(0);


const [currentlyTippedUsers, setCurrentlyTippedUsers] = useState(new Set());
const [myTipsReceived, setMyTipsReceived] = useState(0);
const [partnerTipsReceived, setPartnerTipsReceived] = useState(0);

const [myLifetimeTips, setMyLifetimeTips] = useState(0);
const [partnerLifetimeTips, setPartnerLifetimeTips] = useState(0);

// Refs for duration tracking
const chatDurationInterval = useRef(null);

const lastReportTime = useRef(0);



const resetTipsState = useCallback(() => {
  setCurrentlyTippedUsers(new Set());
  setPartnerTipsReceived(0);
  setJustReceivedTip(false);
  
  console.log("🔄 Session state reset for new chat");
}, []);

// Add this after resetTipsState
const startChatDurationTracking = useCallback(() => {
  const startTime = Date.now();
  setChatStartTime(startTime);
  setChatDuration(0);

  // Clear any existing interval
  if (chatDurationInterval.current) {
    clearInterval(chatDurationInterval.current);
  }

  // Start new interval
  chatDurationInterval.current = setInterval(() => {
    const currentDuration = Math.floor((Date.now() - startTime) / 1000);
    setChatDuration(currentDuration);
  }, 1000);

  console.log("⏱️ Started chat duration tracking");
}, []);

// Add this after startChatDurationTracking
const stopChatDurationTracking = useCallback(() => {
  if (chatDurationInterval.current) {
    clearInterval(chatDurationInterval.current);
    chatDurationInterval.current = null;
  }
  
  setChatDuration(0);
  setChatStartTime(null);
  
  console.log("⏹️ Stopped chat duration tracking");
}, []);

  // AUTH STATE LISTENER
 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    console.log("🔄 Auth state changed:", currentUser ? currentUser.displayName : "No user");
    setUser(currentUser || null);
    setAuthLoading(false); // Ensure loading ends even if no user
    
    // Reset any user-specific UI if logged out
    if (!currentUser) {
      setAgreed(false);
      setMyTipsReceived(0);
      setMyLifetimeTips(0);
    }
  });

  return () => unsubscribe();
}, []);


  // [C] Login function
 const signInWithGoogle = async () => {
  setAuthLoading(true);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    setUser(result.user);
    setDisplayName("Stranger");

   
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

const saveSessionToDatabase = useCallback(async () => {
  console.log('🔍 SAVE DEBUG - Current state before save:', {
    user: user?.uid,
    partnerId: partnerId,
    currentlyTippedUsers: Array.from(currentlyTippedUsers),
    sessionTipsReceived: sessionTipsReceived,
    myTipsReceived: myTipsReceived,
    myLifetimeTips: myLifetimeTips
  });

  if (!user || !partnerId) {
    console.log('❌ Missing user or partnerId, skipping save');
    return;
  }
  
  const tipsGiven = currentlyTippedUsers.has(partnerId) ? 1 : 0;
const tipsReceived = 0; // Or remove this function entirely
  
  const sessionData = {
    userId: user.uid,
    partnerId: partnerId,
    tipsGiven: tipsGiven,
    tipsReceived: tipsReceived,
    chatDuration: chatDuration,
    timestamp: Date.now()
  };
  
  console.log('💾 EXACT DATA BEING SAVED:', sessionData);
  
  try {
    
    console.log('✅ Session saved to database');
  } catch (error) {
    console.error('❌ Failed to save session:', error);
  }
},  [user, partnerId, currentlyTippedUsers, sessionTipsReceived, chatDuration]);



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
  
  // Remove all session save logic - no longer needed!
  
  resetTipsState();
  stopChatDurationTracking();
  
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
}, [clearReconnectionTimers, stopChatDurationTracking, resetTipsState]); 

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


  const handleReportUser = useCallback(async () => {
  if (!partnerUserId || !user) {
    console.log("❌ Cannot report: missing data");
    return;
  }

  // Prevent spam reporting
  const now = Date.now();
  if (now - (lastReportTime.current || 0) < 2000) {
    console.log("⏳ Report cooldown - please wait");
    return;
  }
  lastReportTime.current = now;

  try {
    console.log("🚨 Reporting user:", partnerUserId);
    
    // Write to Firebase immediately
    await reportUser(partnerUserId);
    
    // Set reported state
    setHasReportedPartner(true);
    
    // Hide confirmation popup
    setShowReportConfirm(false);
    
    console.log("✅ User reported successfully");
    
    // End chat immediately and go to next
    setTimeout(() => {
      handleNext();
    }, 500);
    
  } catch (error) {
    console.error("❌ Error reporting user:", error);
    alert("Failed to report user. Please try again.");
  }
}, [partnerUserId, user, handleNext]);



 
 

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
  console.log("🎯 Matched with:", data.partnerId, "UserId:", data.partnerUserId);

  // Clear any existing connection timeout
  if (connectionTimerRef.current) {
    clearTimeout(connectionTimerRef.current);
    connectionTimerRef.current = null;
  }

  // Set partner details
  setPartnerId(data.partnerId);
  setPartnerUserId(data.partnerUserId);
  setIsPolite(data.role === "polite");
  setStatus(`Connecting to ${data.partnerId}...`);

  // Load partner's lifetime tips from BACKEND (not Firebase)
  if (data.partnerUserId && socketRef.current) {
    socketRef.current.emit('get_user_tips', { userId: data.partnerUserId }, (partnerStats) => {
      console.log("✅ Partner lifetime tips loaded:", partnerStats.received);
      setPartnerLifetimeTips(partnerStats.received || 0);
    });
  }

  // Reset tips state for new chat
  resetTipsState();

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

// Start tracking chat duration for tip unlock
startChatDurationTracking();


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
  }, [createPeerConnection, resetTipsState, startChatDurationTracking]);

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
  
  const initConnection = async () => {     // Function starts executing...

    try {
    // Check if permissions are already granted
    const permissions = await navigator.permissions.query({ name: 'camera' });
    console.log("📷 Camera permission:", permissions.state);
    
    // For Safari/iOS, we need to request permissions differently
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, //  facing mode for mobile
        audio: true 
      });
    } catch (permissionError) {
      console.error("❌ Permission denied:", permissionError);
      
      // Show user-friendly message instead of generic error
      if (permissionError.name === 'NotAllowedError') {
        setStatus("❌ Camera/Mic access denied. Please allow and refresh the page.");
        
        // For iOS Safari, show specific instructions
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          setStatus("📱 iOS: Go to Settings > Safari > Camera & Microphone > Allow");
        }
        
        return; // Exit early, don't try to connect
      }
      throw permissionError;
    }
      
      localStreamRef.current = stream;// Success! stream contains video/audio tracks
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream; // Video appears on screen
      }

      const s = io(SIGNAL_SERVER_URL, { // Continue with socket connection...
        transports: ["websocket", "polling"]
      });

      setSocket(s);
      socketRef.current = s;

      s.on("connect", () => {
  console.log("✅ Connected:", s.id);
  
  s.emit("join", {
    userId: user.uid,
    interest: userInterest || "Any Interest",
    country: selectedCountry || "US"
  });
  
  // Load my lifetime tips from backend
  s.emit("get_my_tips", (stats) => {
    console.log("📊 Loaded my tips from backend:", stats);
    
    // If backend has no data but we loaded from Firebase earlier, migrate it
    if (stats.received === 0 && stats.given === 0 && myLifetimeTips > 0) {
      console.log("🔄 Migrating Firebase tips to backend...");
      
      fetch(`${SIGNAL_SERVER_URL}/admin/migrate-user-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          tipsGiven: myLifetimeTips, // Loaded from Firebase earlier
          tipsReceived: myTipsReceived
        })
      }).then(() => {
        console.log("✅ Migration complete");
        // Reload tips from backend
        s.emit("get_my_tips", (newStats) => {
          setMyLifetimeTips(newStats.received);
        });
      });
    } else {
      setMyLifetimeTips(stats.received);
    }
  });
  
  setStatus("Looking for match...");
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

// NEW TIP LISTENERS (REDIS-BACKED)
s.on('tip_confirmed', (data) => {
  console.log("✅ Tip confirmed by backend:", data);
  setMyLifetimeTips(data.myTipsReceived);
  setPartnerLifetimeTips(data.partnerTipsReceived);
});

s.on('tip_received', (data) => {
  console.log("💖 Received tip from partner:", data);
  setMyLifetimeTips(data.myNewTotal);
  setJustReceivedTip(true);
  setTimeout(() => setJustReceivedTip(false), 2000);
});

s.on("tip_error", (data) => {
  console.error("❌ Tip error from server:", data);
});

s.on("test-response", (data) => {
  console.log("🧪 FRONTEND: Test response received:", data);
});

s.on("message", (data) => {
  console.log("📨 RECEIVED MESSAGE EVENT:", data);
  const formatted = data.type === "gif"
    ? { sender: "stranger", type: "gif", url: data.url, timestamp: new Date() }
    : { sender: "stranger", type: "text", text: data.text, timestamp: new Date() };
  setMessages(prev => [...prev, formatted]);
});


// Listen for connection errors
s.on("tip_error", (data) => {
  console.error("❌ Tip error from server:", data);
  // Handle tip errors if needed
});

    } catch (error) {
      console.error("Error initializing:", error);
      setStatus("Camera/Mic access denied.");
    }
  };

  initConnection();
}, [agreed, user, socket, selectedCountry, userInterest, handleMatched, handlePartnerDisconnected, handlePartnerNext, handleOffer, handleAnswer, handleIceCandidate]);

const handleSendMessage = (customMessage = null) => {
  // More specific GIF detection
  if (customMessage && typeof customMessage === "object" && customMessage.url) {
    // GIF path
    const gifObject = {
      sender: "me",
      type: "gif", 
      url: customMessage.url,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, gifObject]);
    
    socket.emit("message", {
      type: "gif",
      url: customMessage.url,
      partnerId,
    });
    return;
  }

  // TEXT path (includes emojis and regular text)
  const messageText = customMessage || messageInput.trim();
  if (!messageText || !socket || !partnerId) return;

  const textObject = {
    sender: "me",
    type: "text", 
    text: messageText,
    timestamp: new Date()
  };

  setMessages((prev) => [...prev, textObject]);

  socket.emit("message", {
    type: "text",
    text: messageText,
    partnerId,
  });

  if (!customMessage) setMessageInput("");
};


useEffect(() => {
  // This runs when 'agreed' changes from true to false (leaving video chat)
  return () => {
    if (agreed) { // Only cleanup if we were in video chat
      console.log("🚨 User leaving video chat - cleaning up...");
      
      // Stop camera/microphone
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("🛑 Stopped track:", track.kind);
        });
        localStreamRef.current = null;
      }
      
      // Close WebRTC connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      
      // Disconnect from socket
      if (socketRef.current) {
        socketRef.current.emit("disconnect_match");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      setSocket(null);
      setPartnerId(null);
      setMessages([]);
    }
  };
}, [agreed]); // Watches 'agreed' - runs cleanup when it changes


// Add this debug useEffect in App.js
useEffect(() => {
  console.log('🔍 TIP STATE DEBUG:', {
    myTipsReceived: myTipsReceived,
    myLifetimeTips: myLifetimeTips,
    sessionTipsReceived: sessionTipsReceived,
    partnerLifetimeTips: partnerLifetimeTips,
    currentlyTippedUsers: Array.from(currentlyTippedUsers)
  });
}, [myTipsReceived, myLifetimeTips, sessionTipsReceived, partnerLifetimeTips, currentlyTippedUsers]);


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

//writing tips backend
const handleTipToggle = useCallback(async (newTipState) => {
  if (!partnerId || !user || !partnerUserId) {
    console.log("❌ Cannot tip: missing data", { partnerId, user: !!user, partnerUserId });
    return;
  }

  // Prevent rapid spam clicking
  const now = Date.now();
  if (now - (lastTipTime.current || 0) < 1000) {
    console.log("⏳ Tip cooldown - please wait");
    return;
  }
  lastTipTime.current = now;

  console.log(`🌟 ${newTipState ? 'Giving' : 'Removing'} tip to partner:`, partnerUserId);

  // Optimistic UI update (instant visual feedback)
  setCurrentlyTippedUsers(prev => {
    const newSet = new Set(prev);
    if (newTipState) {
      newSet.add(partnerId);
    } else {
      newSet.delete(partnerId);
    }
    return newSet;
  });

  // Send to backend - backend handles everything
  if (socketRef.current) {
    socketRef.current.emit("tip_toggle", {
      targetUserId: partnerUserId,
      fromUserId: user.uid,
      action: newTipState ? "tip" : "untip"
    });
    console.log("📤 Tip request sent to backend");
  }

}, [partnerId, user, partnerUserId]);

// Add this ref for tip cooldown
const lastTipTime = useRef(0);

  // CONDITIONAL RENDERING
if (authLoading) {
      return (
      <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ffe5b4 0%, #ffb347 40%, #ff6f3c 70%, #000000 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#000",
      fontSize: "1.5rem",
      transition: "background 0.8s ease-in-out"
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
     onStartVideoChat={(interest, country, lookingFor) => {
  console.log("🎯 Starting video chat with:", { interest, country, lookingFor });
  setUserInterest(interest);
  setSelectedCountry(country);
  setAgreed(true);
  localStorage.setItem('onstrays_agreed', 'yes');
}}
    />
  );
}




 return (
  <div style={{ 
    height: "100vh", 
    maxHeight: "100vh",  // Add this
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
    
    {window.innerWidth > 768 && (
  <nav style={{ backgroundColor: "#1C1315", borderBottom: "1px solid #222222", padding: "10px 24px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1 
        style={{ 
          fontSize: "2rem", 
          fontWeight: "bold", 
          background: "linear-gradient(135deg, #FF8C00 0%, #FF5A1F 100%)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          cursor: "pointer"
        }}

  onClick={() => {
  console.log("🏠 Going back to landing page...");
  
  // Stop camera/microphone immediately
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => {
      track.stop();
      console.log("🛑 Stopped track:", track.kind);
    });
    localStreamRef.current = null;
  }
  
  // Close WebRTC connection
  if (pcRef.current) {
    pcRef.current.close();
    pcRef.current = null;
  }
  
  // Disconnect from partner
  if (socketRef.current) {
    socketRef.current.emit("disconnect_match");
    socketRef.current.disconnect();
    socketRef.current = null;
  }
  
  // Reset state
  setSocket(null);
  setPartnerId(null);
  setMessages([]);
  setAgreed(false); // Go back to landing page
}}


>
  Onstrays
</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "100px" }}>         
     <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isOnline ? "#19f0b8" : "#ef4444" }}></div>
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
    )}

    {/* Main Content */}
    <div style={{ flex: 1, display: "flex", flexDirection: window.innerWidth <= 768 ? "column" : "row" ,overflow: "hidden" }}>

      {/* Left Side - Stranger Video */}
      <div style={{ width: window.innerWidth <= 768 ? "100%" : "60%", backgroundColor: "#0A0A0A", position: "relative" }}>
        <div style={{ height: window.innerWidth <= 768 ? "64vh" : "100%",  display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
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
                backgroundColor: "#0A0A0A",
                maxHeight: "calc(100vh - 80px)"
              }}
            />

            
            
<TipButton 
  onTipToggle={handleTipToggle}
  disabled={!socket || !partnerId}
  chatDuration={chatDuration}
  isVisible={!!partnerId}
  isTipped={currentlyTippedUsers.has(partnerId)}
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
            <button 
  onClick={() => setShowReportConfirm(true)}
  disabled={!partnerId}
  title="Report user"
  style={{ 
    position: "absolute", 
    bottom: window.innerWidth <= 768 ? "5px" : "70px", 
   
    left: window.innerWidth <= 768 ? "10px" : "20px",
    backgroundColor: "#ef4444", 
    color: "#ffffff",
    border: "none", 
    borderRadius: "12px", 
    padding: "10px 16px", 
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: partnerId ? "pointer" : "not-allowed",
    opacity: partnerId ? 1 : 0.5,
    transition: "all 0.3s ease",
    boxShadow: partnerId ? "0 0 10px rgba(239, 68, 68, 0.5)" : "none"
  }}
  onMouseOver={(e) => {
    if (partnerId) e.target.style.backgroundColor = "#dc2626";
  }}
  onMouseOut={(e) => {
    if (partnerId) e.target.style.backgroundColor = "#ef4444";
  }}
>
  Report
</button>

            
<TipsDisplay 
 tipsCount={partnerLifetimeTips} // CHANGE from partnerTipsReceived
  justReceived={false}
  isVisible={!!partnerId}
  position="stranger"
/>
{/* Report Confirmation Popup */}
{showReportConfirm && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "#222",
      padding: "30px",
      borderRadius: "15px",
      border: "1px solid #ef4444",
      textAlign: "center",
      maxWidth: "300px"
    }}>
      <h3 style={{ color: "#fff", marginBottom: "20px" }}>Report this user?</h3>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        <button
          onClick={handleReportUser}
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Yes, Report
        </button>
        <button
          onClick={() => setShowReportConfirm(false)}
          style={{
            backgroundColor: "#666",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!socket || isReconnecting || showOfflineWarning}
              style={{ 
                position: "absolute",
    bottom: "5px",
    left: window.innerWidth <= 768 ? "auto"  : "16px", // Center on desktop
    right: "16px",
    padding: "16px 24px",
    width: window.innerWidth <= 768 ? "82px" : "calc(100% - 32px)", 
    borderRadius: "999px", // Fully rounded
    border: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    backgroundColor: (!socket || isReconnecting || showOfflineWarning)
      ? "#23272b"
      : "#333333",  // Default dark grey
    color: "#ffffff",
    cursor: (!socket || isReconnecting || showOfflineWarning) ? "not-allowed" : "pointer",
    transition: "all 0.3s ease",
    zIndex: 10
  }}
  onMouseEnter={(e) => {
    if (socket && !isReconnecting && !showOfflineWarning) {
      e.target.style.backgroundColor = "#ff5a1f";
    }
  }}
  onMouseLeave={(e) => {
    if (socket && !isReconnecting && !showOfflineWarning) {
      e.target.style.backgroundColor = "#333333";
    }
  }}
  onTouchStart={(e) => {
    if (socket && !isReconnecting && !showOfflineWarning) {
      e.target.style.backgroundColor = "#ff5a1f";
    }
  }}
  onTouchEnd={(e) => {
    if (socket && !isReconnecting && !showOfflineWarning) {
      setTimeout(() => {
        e.target.style.backgroundColor = "#333333";
      }, 150); // Small delay for visual feedback
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
  top: "12px", 
  left: "12px", 
  backgroundColor: "#000", 
  color: "#ff5a1f", 
  border: "1px solid #953312", 
  borderRadius: "12px", 
  padding: "8px 15px", 
  fontSize: "0.875rem", 
  fontWeight: "500" 
}}>
  Stranger
</div>
          </div>
        </div>
      </div>

      {/* Right Side */}
<div style={{ 
  width: window.innerWidth <= 768 ? "100%" : "40%", // Adjust width for mobile
  backgroundColor: "#0A0A0A", 
  display: "flex", 
  flexDirection: "column",
  height: window.innerWidth <= 768 ? "50vh" : "100%",
  //maxHeight: "100vh"
  position: "relative" // for floating elements mobil
}}>      

  {/* My Video - Top Right */}
<div style={{ 
height: window.innerWidth <= 768 ? "320px" : "45vh", // Fixed pixel height for mobile
  maxHeight: window.innerWidth <= 768 ? "35vh" : "45vh", // Safety constraint
  minHeight: window.innerWidth <= 768 ? "280px" : "400px", // Minimum usable height  
  padding: "12px", 
  borderBottom: window.innerWidth <= 768 ? "none" : "1.5px solidrgb(33, 33, 33)",
  background: "linear-gradient(135deg, #000 0%, #000000 100%)",
  borderRadius: "12px 12px 0 0",
  overflow: "hidden"
}}>
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
        backgroundColor: "#0A0A0A",
        border: "2px solid #953312",
        transform: "scaleX(-1)",
        //boxShadow: "0 8px 25px rgba(255, 90, 31, 0.2)"
      }}
    />

    {/* My Name Tag */}
    <div style={{ 
      position: "absolute", 
      top: "15px", 
      left: "15px", 
      backgroundColor: "rgba(0, 0, 0, 0.9)", 
      color: "#ff5a1f", 
      border: "1px solid #ff5a1f", 
      borderRadius: "8px", 
      padding: "6px 14px",
      backdropFilter: "blur(10px)",
      display: "flex",           
  alignItems: "center",      
  justifyContent: "center",  
  minWidth: "80px"      
      //boxShadow: "0 4px 12px rgba(255, 90, 31, 0.3)"
    }}>
      <span style={{ fontSize: "0.8rem", 
        fontWeight: "600", 
        color: "#ff5a1f",
        textAlign: "center",
    whiteSpace: "nowrap"
        }}>
        {displayName}
      </span>
    </div>

    

    <TipsDisplay 
      tipsCount={myLifetimeTips}
      justReceived={justReceivedTip}
      isVisible={true}
      position="self"
    />


  {/*Small Message Corner - Mobile Only */}
            {window.innerWidth <= 768 && showMessages && (
              <div style={{
                position: "fixed",
                zIndex: 1000, 
                bottom: "58px",
                right: "15px",
                width: "200px",
                maxHeight: "250px",
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
    
                overflowY: "auto",
                overflowX: "hidden",              // Prevent horizontal scroll
scrollbarWidth: "thin",           // Firefox
WebkitScrollbarWidth: "thin",     // Webkit browsers
// Add smooth scrolling behavior
scrollBehavior: "smooth"
              }}>
                {/* Messages */}
                {messages.slice(-5).map((message, index) => (
                  <div
                    key={index}
                    style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>
                      {message.sender === 'me' ? '🟢' : '🔴'}
                    </span>
                    <span style={{
                      fontSize: "11px",
                      color: "#ffffff",
                      wordBreak: "break-word"
                    }}>
                      {message.text}
                    </span>
                  </div>
                ))}
                
                {/* Message Input */}
                <div style={{
                  display: "flex",
                  gap: "4px",
                  marginTop: "4px",
                  background: "rgba(0, 0, 0, 0.5)",
                  borderRadius: "12px",
                  padding: "4px"
                }}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type..."
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11px",
                      outline: "none",
                      padding: "4px 6px"
                    }}
                    autoFocus
                  />
                  
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!messageInput.trim()}
                    style={{
                      background: messageInput.trim() 
                        ? "linear-gradient(135deg, #19f0b8 0%, #00ffcb 100%)" 
                        : "rgba(255, 255, 255, 0.3)",
                      border: "none",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: messageInput.trim() ? "pointer" : "not-allowed"
                    }}
                  >
                    <span style={{ color: messageInput.trim() ? "#000000" : "#ffffff", fontSize: "10px" }}>
                      ➤
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

       
{/* Chat Section - Desktop Only */}
{window.innerWidth > 768 && (
  <div style={{ 
    height: "55vh", // ADJUST CHAT HEIGHT
    overflow: "hidden",
    display: "flex", 
    flexDirection: "column",
    background: "linear-gradient(180deg, #0A0A0A 0%, #111 100%)",
    borderRadius: "0 0 12px 12px",
    
    borderTop: "none"
  }}>
    <ChatBox
      messages={messages}
      messageInput={messageInput}
      setMessageInput={setMessageInput}
      onSend={handleSendMessage}
    />
  </div>
)}
      </div>
    </div>

   


  {/* Floating Toggle Button - Mobile Only */}
{window.innerWidth <= 768 && (
  <div style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1001
  }}>
    <button
      onClick={() => setShowMessages(!showMessages)}
      style={{
        background: showMessages 
          ? "rgba(255, 255, 255, 0.2)" 
          : "linear-gradient(135deg, #19f0b8 0%, #00ffcb 100%)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "50%",
        minWidth: "56px",
        minHeight: "56px",
        width: "56px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s ease"
      }}
    >
      <span style={{ 
        color: showMessages ? "#ffffff" : "#000000", 
        fontSize: "20px"
      }}>
        {showMessages ? "✕" : "💬"}
      </span>
    </button>
  </div>
)}

  </div> 
);
}

export default App;
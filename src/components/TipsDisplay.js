import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';



const TipsDisplay = ({ 
  tipsCount = 0, 
  justReceived = false, 
  isVisible = true,
  position = "stranger" // ADD THIS - "stranger" or "self"
}) => {
  if (!isVisible) return null;

  return (
  <div style={{ position: "relative" }}>
    {/* Total Tips Box */}
    <motion.div
      style={{
        position: "absolute",
bottom: position === "self" 
  ? (window.innerWidth <= 768 ? "10px" : "15px")    // Your video position
  : (window.innerWidth <= 768 ? "55px" : "580px"), // Partner video position
  
left: "10px", // Same left for both
width: window.innerWidth <= 768 ? "calc(100% - 32px)" : "auto",
maxWidth: window.innerWidth <= 768 ? "100px" : "none",
        
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontWeight: "600",
        zIndex: 15,
        border: "1px solid rgba(255, 90, 31, 0.3)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        minWidth: "70px"
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: justReceived ? [1, 1.1, 1] : 1,
        boxShadow: justReceived
          ? [
              "0 0 0 rgba(255, 90, 31, 0)",
              "0 0 20px rgba(255, 90, 31, 0.6)",
              "0 0 8px rgba(255, 90, 31, 0.3)"
            ]
          : "0 2px 8px rgba(0, 0, 0, 0.3)"
      }}
      transition={{ duration: 0.6 }}
    >
      {/* Coin Icon */}
      <img 
        src="/coin.png" 
        alt="tip" 
        style={{ 
          width: "16px", 
          height: "16px", 
          objectFit: "contain",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
        }}
      />
      
      {/* Tips Text */}
      <span style={{
        color: "#ff5a1f",
        fontSize: "12px",
        fontWeight: "700",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)"
      }}>
        Tips  : {tipsCount}
      </span>
    
</motion.div>

    {/* Floating +1 Animation */}
    <AnimatePresence>
      {justReceived && (
        <motion.div
          style={{
            position: "absolute",
            bottom: "45px",
            left: "90px",
            color: "#ffae7a",
            fontSize: "14px",
            fontWeight: "bold",
            pointerEvents: "none",
            zIndex: 20
          }}
          initial={{ 
            opacity: 0, 
            y: 0,
            scale: 0.5
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -20, -30, -40],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          exit={{ 
            opacity: 0,
            y: -50,
            scale: 0
          }}
          transition={{ 
            duration: 2,
            ease: "easeOut"
          }}
        >
          +1
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};

export default TipsDisplay;
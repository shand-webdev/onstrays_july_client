import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TipButton = ({ 
  onTipToggle, 
  disabled = false, 
  chatDuration = 5,
  isVisible = true,
  isTipped = false // New prop to control tip state
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const canTip = chatDuration >= 5 && !disabled; // 30 seconds minimum
  const timeProgress = Math.min(chatDuration / 5, 1); // 0 to 1 over 30 seconds

  const handleTipClick = async () => {
    if (!canTip || isAnimating) return;

    setIsAnimating(true);

    try {
      await onTipToggle(!isTipped); // Toggle the tip state
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
    } catch (error) {
      console.error('Error toggling tip:', error);
      setIsAnimating(false);
    }
  };



  const getButtonContent = () => {
    return (
      <motion.div
        whileHover={canTip ? { scale: 1.1 } : {}}
        whileTap={canTip ? { scale: 0.95 } : {}}
        animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
        style={{
          filter: `grayscale(${(1 - timeProgress) * 100}%)`,
          transition: "filter 0.3s ease"
        }}
      >
        <img 
        src="/coin.png"
        position="relative"
        style={{ width: "30px", height: "30px" }}
        />
      </motion.div>
    );
  };

  const getButtonStyle = () => {
    let backgroundColor, boxShadow, cursor, opacity, scale;
    
    if (isTipped) {
      // Tipped state - gold with glow
      backgroundColor = "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)";
      boxShadow = "0 0 25px rgba(255, 215, 0, 0.6)";
      cursor = "pointer";
      opacity = 1;
      scale = 1.05;
    } else if (chatDuration < 5) {
      // Unlocking state - gradually becomes visible and interactive
      backgroundColor = `linear-gradient(135deg, #666 0%, #888 100%)`;
      boxShadow = timeProgress > 0.8 ? "0 0 10px rgba(255, 215, 0, 0.2)" : "none";
      cursor = timeProgress >= 1 ? "pointer" : "not-allowed";
      opacity = 0.3 + (timeProgress * 0.7); // Gradually becomes more visible
      scale = 1;
    } else if (disabled) {
      // Disabled state
      backgroundColor = "rgba(128, 128, 128, 0.3)";
      boxShadow = "none";
      cursor = "not-allowed";
      opacity = 0.5;
      scale = 1;
    } else {
      // Ready to tip state - fully unlocked
      backgroundColor = "linear-gradient(135deg, #666 0%, #888 100%)";
      boxShadow = "0 0 15px rgba(255, 215, 0, 0.3)";
      cursor = "pointer";
      opacity = 1;
      scale = timeProgress >= 1 ? 1.05 : 1; // Subtle pop when unlocked
    }

    return {
      position: "absolute",
      bottom: "70px",
      right: "19px",
      background: backgroundColor,
      border: "none",
      borderRadius: "50%",
      width: "56px",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: cursor,
      boxShadow: boxShadow,
      opacity: opacity,
      transform: `scale(${scale})`,
      transition: "all 0.3s ease",
      zIndex: 20
    };
  };

  const getTooltipText = () => {
    if (chatDuration < 5) {
      return "Chat for 5 seconds to unlock tip";
    } else if (isTipped) {
      return "Click to remove tip";
    } else {
      return "Send tip";
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div style={{ position: "relative" }}>
      {/* Main Button */}
      <motion.button
        onClick={handleTipClick}
        disabled={!canTip || isAnimating}
        style={getButtonStyle()}
        whileHover={canTip ? { scale: 1.05 } : {}}
        whileTap={canTip ? { scale: 0.95 } : {}}
        title={getTooltipText()}
      >
        {getButtonContent()}
      </motion.button>



      {/* Tip Success Animation */}
      <AnimatePresence>
        {isAnimating && isTipped && (
          <motion.div
            style={{
              position: "absolute",
              bottom: "80px",
              right: "36px",
              pointerEvents: "none",
              zIndex: 25
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  fontSize: "12px"
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 0
                }}
                animate={{
                  x: (Math.random() - 0.5) * 60,
                  y: -Math.random() * 40 - 10,
                  opacity: 0,
                  scale: 1
                }}
                transition={{
                  duration: 5,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              >
                🪙
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip State Indicator */}
      {canTip && (
        <motion.div
          style={{
            position: "absolute",
            bottom: "130px",
            right: "16px",
            background: "rgba(0, 0, 0, 0.8)",
            color: isTipped ? "#FFD700" : "#19f0b8",
            padding: "4px 8px",
            borderRadius: "15px",
            fontSize: "10px",
            border: `1px solid ${isTipped ? "#FFD700" : "#19f0b8"}`,
            backdropFilter: "blur(10px)",
            zIndex: 15
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
        >
          {isTipped ? "Tipped ✨" : "Ready to tip"}
        </motion.div>
      )}
    </motion.div>
  );
};
export default TipButton;
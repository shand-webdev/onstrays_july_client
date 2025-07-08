import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';

const UserAccount = ({ user, displayName, setDisplayName }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsEditingName(false);
        setTempName("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("✅ User signed out");
    } catch (error) {
      console.error("❌ Sign-out error:", error);
    }
  };

  const startEditingName = () => {
    setTempName(displayName);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setTempName("");
    setIsEditingName(false);
  };

  const saveName = () => {
    const trimmed = tempName.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      setDisplayName(trimmed);
      setIsEditingName(false);
      setTempName("");
      console.log("✅ Name updated to:", trimmed);
    } else {
      alert("Name must be between 2-20 characters");
    }
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  return (
    <div 
      ref={dropdownRef}
      style={{ 
        position: "absolute", 
        top: "8px", 
        right: "30px",
        zIndex: 1000
      }}
    >
      {/* User Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: user.photoURL 
            ? `url(${user.photoURL})` 
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "3px solid rgba(255, 255, 255, 0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#fff",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.05)";
          e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
        }}
      >
        {!user.photoURL && displayName.charAt(0).toUpperCase()}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div style={{
          position: "absolute",
          top: "60px",
          right: "0",
          width: "280px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "15px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          padding: "20px",
          color: "#1f2937",
          animation: "slideDown 0.2s ease-out"
        }}>
          {/* User Info Section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingBottom: "15px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            marginBottom: "15px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: user.photoURL 
                ? `url(${user.photoURL})` 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#fff"
            }}>
              {!user.photoURL && displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>
                {user.displayName || "User"}
              </div>
              <div style={{ fontSize: "12px", opacity: "0.7" }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Display Name Section */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ 
              fontSize: "12px", 
              fontWeight: "600", 
              marginBottom: "8px", 
              display: "block",
              color: "#374151"
            }}>
              Chat Display Name
            </label>
            
            {isEditingName ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyPress}
                  placeholder="Enter name (2-20 chars)"
                  maxLength={20}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
                <button 
                  onClick={saveName}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: "#10b981",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  ✓
                </button>
                <button 
                  onClick={cancelEditingName}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    background: "#ef4444",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div 
                onClick={startEditingName}
                style={{
                  padding: "10px 12px",
                  background: "rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background 0.2s ease"
                }}
                onMouseOver={(e) => e.target.style.background = "rgba(0, 0, 0, 0.1)"}
                onMouseOut={(e) => e.target.style.background = "rgba(0, 0, 0, 0.05)"}
              >
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "12px", opacity: "0.6" }}>✏️</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default UserAccount;
import React, { useState } from 'react';
import LegalPages from './LegalPages';

export default function LandingPage({ onAgreeAndMaybeLogin, user, signInWithGoogle, onStartVideoChat }) {  
  const [selectedCountry, setSelectedCountry] = useState('🇮🇳');
  const [lookingFor, setLookingFor] = useState('Any');
  const [selectedInterest, setSelectedInterest] = useState("Any Interest");
  const [showLegalPages, setShowLegalPages] = useState(false);
  const [legalPageType, setLegalPageType] = useState('privacy');
  

  if (showLegalPages) {
  return <LegalPages initialPage={legalPageType} onBack={() => setShowLegalPages(false)} />;
}

  console.log("showLegalPages:", showLegalPages)

  const countries = [
    '🇮🇳', '🇺🇸', '🇬🇧', '🇯🇵', '🇩🇪',
    '🇫🇷', '🇨🇦', '🇦🇺', '🇧🇷', '🇰🇷'
  ];

  const countryFlags = {
    '🇮🇳': 'in',
    '🇺🇸': 'us',
    '🇬🇧': 'gb',
    '🇯🇵': 'jp',
    '🇩🇪': 'de',
    '🇫🇷': 'fr',
    '🇨🇦': 'ca',
    '🇦🇺': 'au',
    '🇧🇷': 'br',
    '🇰🇷': 'kr',
  };

  const interests = [
    { label: 'Music', emoji: '🎵' },
    { label: 'Tech', emoji: '💻' },
    { label: 'AI', emoji: '🤖' },
    { label: 'Books', emoji: '📚' },
    { label: 'Fitness', emoji: '🏋️' },
    { label: 'Movies', emoji: '🎬' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Gaming', emoji: '🎮' },
  ];

  // Responsive helper
  const isMobile = window.innerWidth <= 768;

  const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );

  const GenderIcon = ({ type }) => {
    if (type === 'Any') return <span style={{ fontSize: 18 }}>👤</span>;
    if (type === 'Girl') return <span style={{ fontSize: 18 }}>👧</span>;
    if (type === 'Boy') return <span style={{ fontSize: 18 }}>👦</span>;
    return null;
  };

  // If showing legal pages, render LegalPages component
  if (showLegalPages) {
    return <LegalPages initialPage={legalPageType} onBack={() => setShowLegalPages(false)} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
      }}
    >
      {/* Landing Page Section */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          paddingBottom: isMobile ? 60 : 0,
          position: 'relative',
        }}
      >
        {/* Top Navigation */}
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#1a1a1a',
              border: '2px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            className="start-button"
            onClick={() => {
              if (!user) {
                signInWithGoogle();
              } else {
                onStartVideoChat();
              }
            }}
          >
            <UserIcon />
          </div>
        </div>

        {/* Left Side - Hero + Photo Cards */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 20 : 40,
            minHeight: isMobile ? '40vh' : undefined,
          }}
        >
          {/* Hero Section */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: isMobile ? 30 : 40,
              maxWidth: 500,
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? '2.5rem' : '3rem',
                fontWeight: 500,
                color: '#fff',
                marginBottom: 15,
                textShadow: '0 0 20px rgb(253, 253, 253)',
                lineHeight: 1.2,
              }}
            >
              Connect with like minded people
            </h1>
            <p
              style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                color: '#aaa',
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              Interest based video chat for meaningful conversations
            </p>
          </div>

          {/* Existing Photo Cards Container */}
          <div
            style={{
              position: 'relative',
              width: isMobile ? 240 : 320,
              height: isMobile ? 300 : 400,
            }}
          >
            {[
              "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=600&fit=crop",
              "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=600&fit=crop",
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=600&fit=crop",
            ].map((src, idx) => (
              <div
                key={src}
                style={{
                  position: 'absolute',
                  width: isMobile ? 200 : 280,
                  height: isMobile ? 260 : 360,
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  top: idx * (isMobile ? 20 : 20),
                  left: idx * (isMobile ? 20 : 20),
                  zIndex: 3 - idx,
                  transform: `rotate(${idx === 0 ? -5 : idx === 1 ? 2 : -2}deg)`,
                }}
              >
                <img
                  src={src}
                  alt={`Person ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 20 : 40,
          }}
        >
          <div
            style={{
              background: '#111',
              borderRadius: 20,
              padding: isMobile ? '30px 20px' : 40,
              width: '100%',
              maxWidth: 400,
              border: '1px solid #222',
            }}
          >
            {/* Logo */}
            <h1
              style={{
                fontFamily: 'monospace, "Orbitron"',
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: 800,
                textAlign: 'center',
                marginBottom: 10,
                color: '#00ff88',
                textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88',
                letterSpacing: 2,
              }}
            >
              ONSTRAYS
            </h1>
            <p
              style={{
                textAlign: 'center',
                color: '#aaa',
                marginBottom: 30,
                fontSize: '1.1rem',
              }}
            >
              Connect securely with strangers.
            </p>

            {/* Country Selection */}
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                Country Selection
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {countries.map((country) => (
                  <button
                    key={country}
                    style={{
                      aspectRatio: '1',
                      border: '2px solid #333',
                      borderRadius: 12,
                      background: selectedCountry === country ? '#1a4a35' : '#1a1a1a',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 8,
                      color: selectedCountry === country ? '#00ff88' : '#fff',
                      transition: 'all 0.3s',
                      borderColor: selectedCountry === country ? '#00ff88' : '#333',
                      width: 58,
                      height: 66,
                    }}
                    onClick={() => setSelectedCountry(country)}
                  >
                    <img
                      src={`https://flagcdn.com/w40/${countryFlags[country]}.png`}
                      alt={country}
                      style={{ width: 32, height: 24, borderRadius: 4, marginBottom: 4 }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                Looking For
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                {['Any', 'Girl', 'Boy'].map((option) => (
                  <button
                    key={option}
                    style={{
                      flex: 1,
                      padding: 12,
                      border: '2px solid #333',
                      borderRadius: 25,
                      background: lookingFor === option ? '#1a4a35' : '#1a1a1a',
                      color: lookingFor === option ? '#00ff88' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s',
                      borderColor: lookingFor === option ? '#00ff88' : '#333',
                    }}
                    onClick={() => setLookingFor(option)}
                  >
                    <GenderIcon type={option} />
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                Your Interests
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
                  gap: 10,
                }}
              >
                {/* Add "Any Interest" as first option */}
                <button
                  onClick={() => setSelectedInterest("Any Interest")}
                  style={{
                    background: selectedInterest === "Any Interest" ? "#1a4a35" : "#1a1a1a",
                    color: selectedInterest === "Any Interest" ? "#00ff88" : "#fff",
                    border: selectedInterest === "Any Interest" ? "2px solid #00ff88" : "2px solid #333",
                    borderRadius: 25,
                    padding: "10px 16px",
                    margin: "0 4px 4px 0",
                    cursor: "pointer",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    gridColumn: "1 / -1" // Span full width
                  }}
                >
                  <span style={{ fontSize: 18 }}>👥</span> Any Interest
                </button>

                {interests.map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => setSelectedInterest(label)}
                    style={{
                      background: selectedInterest === label ? "#1a4a35" : "#1a1a1a",
                      color: selectedInterest === label ? "#00ff88" : "#fff",
                      border: selectedInterest === label ? "2px solid #00ff88" : "2px solid #333",
                      borderRadius: 25,
                      padding: "10px 16px",
                      margin: "0 4px 4px 0",
                      cursor: "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              style={{
                width: '100%',
                padding: 16,
                background: user 
                  ? 'linear-gradient(135deg, #00ff88, #00cc6a)' 
                  : 'linear-gradient(135deg, #ff4444, #cc2222)',
                border: 'none',
                borderRadius: 25,
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 30,
                transition: 'all 0.3s',
                boxShadow: user 
                  ? '0 10px 30px rgba(0,255,136,0.3)' 
                  : '0 10px 30px rgba(255,68,68,0.3)',
              }}
              className="start-button"
              onClick={() => {
                if (user) {
                  console.log("🚀 Passing data:", { selectedInterest, selectedCountry, lookingFor });
                  onStartVideoChat(selectedInterest, selectedCountry, lookingFor);
                } else {
                  if (isMobile) {
                    localStorage.setItem('onstrays_agreed', 'yes');
                  }
                  signInWithGoogle();
                }
              }}
            >
              {user ? "Start Video Chat" : "Login to Video Chat"}
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        style={{
          width: '100%',
          padding: isMobile ? '60px 20px 120px 20px' : '80px 40px 120px 40px',
          background: '#000',
          borderTop: '1px solid #222',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 700,
              color: '#00ff88',
              marginBottom: isMobile ? '40px' : '60px',
              textShadow: '0 0 20px #00ff88',
            }}
          >
            How It Works
          </h2>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: isMobile ? '40px' : '60px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '120px' : '150px',
                  height: isMobile ? '120px' : '150px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                }}
              >
                <span style={{ fontSize: '3rem' }}>🎯</span>
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Choose Your Interest
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Select what you're passionate about from music to tech to books
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '120px' : '150px',
                  height: isMobile ? '120px' : '150px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                }}
              >
                <span style={{ fontSize: '3rem' }}>🤝</span>
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Get Matched Instantly
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                We connect you with someone who shares your interests
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '120px' : '150px',
                  height: isMobile ? '120px' : '150px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                }}
              >
                <span style={{ fontSize: '3rem' }}>💬</span>
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Start Meaningful Conversations
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Validate ideas, learn new things, grow together
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition Cards */}
      <div
        style={{
          width: '100%',
          padding: isMobile ? '60px 20px 120px 20px' : '80px 40px 120px 40px',
          background: '#000',
          borderTop: '1px solid #222',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 700,
              color: '#00ff88',
              marginBottom: isMobile ? '40px' : '60px',
              textShadow: '0 0 20px #00ff88',
            }}
          >
            Why Choose OnStrays
          </h2>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: isMobile ? '40px' : '60px',
            }}
          >
            {/* Card 1: Interest-Based Matching */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '200px' : '250px',
                  height: isMobile ? '150px' : '180px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=300&h=200&fit=crop"
                  alt="Network connections"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Find Your Community
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                No more random strangers. Connect with people who share your passions and interests.
              </p>
            </div>

            {/* Card 2: Secure & Private */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '200px' : '250px',
                  height: isMobile ? '150px' : '180px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop"
                  alt="Security shield"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Built for Privacy
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Your conversations stay private. No data leaks, no hidden trackers, no malware.
              </p>
            </div>

            {/* Card 3: Judgment Free Zone */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: isMobile ? '200px' : '250px',
                  height: isMobile ? '150px' : '180px',
                  margin: '0 auto 20px auto',
                  background: '#111',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #333',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop"
                  alt="People discussing ideas"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: isMobile ? '1.3rem' : '1.5rem',
                  color: '#00ff88',
                  marginBottom: '10px',
                  fontWeight: 600,
                }}
              >
                Validate Freely
              </h3>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Share your ideas without fear. Get honest feedback and grow in a judgment free space.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Community Guidelines Section */}
      <div
        style={{
          width: '100%',
          padding: isMobile ? '60px 20px 120px 20px' : '80px 40px 120px 40px',
          background: '#000',
          borderTop: '1px solid #222',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 700,
              color: '#00ff88',
              marginBottom: isMobile ? '30px' : '40px',
              textShadow: '0 0 20px #00ff88',
            }}
          >
            Community Guidelines
          </h2>
          
          <div
            style={{
              textAlign: 'left',
              background: '#111',
              borderRadius: '20px',
              padding: isMobile ? '30px 20px' : '40px',
              border: '2px solid #333',
              marginBottom: '30px',
            }}
          >
            <p
              style={{
                color: '#aaa',
                fontSize: isMobile ? '1rem' : '1.1rem',
                marginBottom: '25px',
                textAlign: 'center',
              }}
            >
              By using OnStrays, you agree to follow these guidelines:
            </p>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '20px',
                color: '#fff',
              }}
            >
              <div>
                <h4
                  style={{
                    color: '#00ff88',
                    fontSize: '1.1rem',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  ✅ Do's
                </h4>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.6, color: '#ccc' }}>
                  <li style={{ marginBottom: '8px' }}>Be respectful and kind to everyone</li>
                  <li style={{ marginBottom: '8px' }}>Have meaningful conversations</li>
                  <li style={{ marginBottom: '8px' }}>Report inappropriate behavior</li>
                  <li style={{ marginBottom: '8px' }}>Keep personal info private</li>
                  <li style={{ marginBottom: '8px' }}>Be yourself and authentic</li>
                </ul>
              </div>
              
              <div>
                <h4
                  style={{
                    color: '#ff4444',
                    fontSize: '1.1rem',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  ❌ Don'ts
                </h4>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.6, color: '#ccc' }}>
                  <li style={{ marginBottom: '8px' }}>No spam or promotional content</li>
                  <li style={{ marginBottom: '8px' }}>No sharing personal details</li>
                  <li style={{ marginBottom: '8px' }}>No recording without consent</li>
                </ul>
              </div>
            </div>
            
            <div
              style={{
                marginTop: '25px',
                padding: '20px',
                background: '#0a0a0a',
                borderRadius: '15px',
                border: '1px solid #333',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  color: '#ff4444',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Age Requirement: 18+ Only
              </p>
              <p
                style={{
                  color: '#aaa',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  margin: 0,
                }}
              >
                OnStrays is only for users 18 years and older. By using our platform, you confirm you meet this requirement.
              </p>
            </div>
          </div>
          
          <p
            style={{
              color: '#666',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            For detailed information, read our{' '}
            <span 
              style={{ color: '#00ff88', cursor: 'pointer' }}
              onClick={() => {
                setLegalPageType('privacy');
                setShowLegalPages(true);
              }}
            >
              Privacy Policy
            </span>
            {' '}and{' '}
            <span 
              style={{ color: '#00ff88', cursor: 'pointer' }}
              onClick={() => {
                setLegalPageType('terms');
                setShowLegalPages(true);
              }}
            >
              Terms of Service
            </span>
            .
            <br />
            Questions? <span 
              style={{ color: '#00ff88', cursor: 'pointer' }}
              onClick={() => {
                setLegalPageType('contact');
                setShowLegalPages(true);
              }}
            >
              Contact us
            </span> anytime.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#000',
          padding: '15px 20px',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? 15 : 20,
            flexWrap: 'wrap',
          }}
        >
          {['About', 'Contact', 'Blogs', 'Privacy Policy', 'Terms', 'Careers', "© 2025 OnStrays. All rights reserved."].map((link) => {
            const isLegalPage = ['About', 'Contact', 'Privacy Policy', 'Terms', 'Careers', 'Blogs'].includes(link);
            const pageId = {
              'About': 'about',
              'Contact': 'contact', 
              'Privacy Policy': 'privacy',
              'Terms': 'terms',
              'Careers': 'careers',
              'Blogs': 'blog'
            }[link];

            return (
              <a
                key={link}
                href="#"
                onClick={(e) => {
                  console.log("clicked:", link, "pageId:", pageId)
                  if (isLegalPage) {
                    e.preventDefault();
                    setLegalPageType(pageId);
                    setShowLegalPages(true);
                  }
                }}
                style={{
                  color: '#666',
                  textDecoration: 'none',
                  fontSize: isMobile ? 10 : 11,
                  transition: 'color 0.3s',
                  marginRight: 2,
                  cursor: isLegalPage ? 'pointer' : 'default'
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#999')}
                onMouseOut={e => (e.currentTarget.style.color = '#666')}
              >
                {link}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";



export default function LandingPage({ onAgreeAndMaybeLogin, user }) {
  const [selectedCountry, setSelectedCountry] = useState('🇮🇳');
  const [lookingFor, setLookingFor] = useState('Any');
  const [selectedInterests, setSelectedInterests] = useState([]);

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

  const handleLogin = () => {
    // TODO: Google Auth here
    alert('Google Auth login triggered');
  };

  const handleStartChat = () => {
    // TODO: Pass details to next page, call setAgreed(true) to enter chat
    setAgreed(true);
   
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

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

  // -- Main JSX --

  return (
    
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: '#000',
        paddingBottom: isMobile ? 60 : 0,
        position: 'relative',
        color: '#fff',
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
      setAgreed(true);
    }
  }}
        >
          <UserIcon />
        </div>
      </div>

      {/* Left Side - Photo Cards */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 20 : 40,
          minHeight: isMobile ? '40vh' : undefined,
        }}
      >
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
    <span style={{ fontSize: 18 }}>{country}</span>
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
              {interests.map(({ label, emoji }) => (
  <button
    key={label}
    onClick={() => toggleInterest(label)}
    style={{
      // your styles...
      background: selectedInterests.includes(label) ? "#1a4a35" : "#1a1a1a",
      color: selectedInterests.includes(label) ? "#00ff88" : "#fff",
      border: selectedInterests.includes(label) ? "2px solid #00ff88" : "2px solid #333",
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
              background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
              border: 'none',
              borderRadius: 25,
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 30,
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(0,255,136,0.3)',
            }}
            className="start-button"
  onClick={onAgreeAndMaybeLogin}

>
            {user ? "Start Video Chat" : "Continue with Google"}
          </button>
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
          {['About', 'Contact', 'Blogs', 'Privacy Policy', 'Terms', 'Careers', "© 2025 OnStrays. All rights reserved."].map((link) => (
            <a
              key={link}
              href="#"
              style={{
                color: '#666',
                textDecoration: 'none',
                fontSize: isMobile ? 10 : 11,
                transition: 'color 0.3s',
                marginRight: 2,
              }}
              onMouseOver={e => (e.currentTarget.style.color = '#999')}
              onMouseOut={e => (e.currentTarget.style.color = '#666')}
            >
              {link}
              
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

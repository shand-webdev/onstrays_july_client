import React, { useState } from 'react';

import AboutPage from './AboutPage';



export default function LegalPages({ initialPage, onBack }) {
const [activePage, setActivePage] = useState(initialPage || 'privacy');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isMobile = window.innerWidth <= 768;

  const pages = [
    { id: 'privacy', title: 'Privacy Policy', icon: '🔒' },
    { id: 'terms', title: 'Terms of Service', icon: '📋' },
    { id: 'contact', title: 'Contact', icon: '💬' },
    { id: 'about', title: 'About', icon: '🏢' },
    { id: 'careers', title: 'Careers', icon: '💼' },
    { id: 'blog', title: 'Blog', icon: '📰' },
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'privacy':
        return <PrivacyContent />;
      case 'terms':
        return <TermsContent />;
      case 'contact':
        return <ContactContent />;
      case 'about':
        return <AboutPage />;
      case 'careers':
        return <CareersContent />;
      case 'blog':
        return <BlogContent />;
      default:
        return <PrivacyContent />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e1e1e1',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ☰
              </button>
            )}
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#262626',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              OnStrays
            </h1>
          </div>

          {/* Back to Main App */}
          <button
onClick={onBack}
            style={{
              background: '#00ff88',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#000',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,255,136,0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#00e67a';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#00ff88';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← Back to OnStrays
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Sidebar */}
        <aside style={{
          width: isMobile ? (sidebarOpen ? '280px' : '0') : '280px',
          background: '#ffffff',
          borderRight: '1px solid #e1e1e1',
          minHeight: 'calc(100vh - 73px)',
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? '73px' : '73px',
          left: 0,
          zIndex: 999,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          boxShadow: isMobile ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
        }}>
          <nav style={{ padding: '24px 0' }}>
            <div style={{
              padding: '0 24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#8e8e8e',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Legal & Support
              </h2>
            </div>
            
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setActivePage(page.id);
                  setSidebarOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  border: 'none',
                  background: activePage === page.id ? '#f0f0f0' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activePage === page.id ? 600 : 400,
                  color: activePage === page.id ? '#262626' : '#8e8e8e',
                  transition: 'all 0.2s ease',
                  borderLeft: activePage === page.id ? '3px solid #00ff88' : '3px solid transparent'
                }}
                onMouseOver={(e) => {
                  if (activePage !== page.id) {
                    e.target.style.background = '#f8f8f8';
                    e.target.style.color = '#262626';
                  }
                }}
                onMouseOut={(e) => {
                  if (activePage !== page.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#8e8e8e';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{page.icon}</span>
                {page.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: '73px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 998
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: isMobile ? '24px 16px' : '40px 48px',
          background: '#ffffff',
          marginLeft: isMobile ? '0' : '0',
          minHeight: 'calc(100vh - 73px)'
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Privacy Policy Content
function PrivacyContent() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#262626',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Privacy Policy
        </h1>
        <p style={{
          color: '#8e8e8e',
          fontSize: '14px',
          margin: 0
        }}>
          Last updated: June 15, 2025
        </p>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid #e1e1e1'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 12px 0'
        }}>
          🔒 Your Privacy Matters
        </h3>
        <p style={{
          color: '#737373',
          fontSize: '15px',
          lineHeight: '1.6',
          margin: 0
        }}>
          OnStrays is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our interest-based video chat platform.
        </p>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          Information We Collect
        </h2>
        
        <div style={{
          background: '#ffffff',
          border: '1px solid #e1e1e1',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#262626',
            margin: '0 0 12px 0'
          }}>
            Account Information
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#00ff88' }}>✓</span>
              Google account information (name, email, profile picture)
            </li>
            <li style={{
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#00ff88' }}>✓</span>
              User preferences (interests, country, gender preference)
            </li>
            <li style={{
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#00ff88' }}>✓</span>
              Display name (if customized)
            </li>
          </ul>
        </div>

        <div style={{
          background: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#c53030',
            margin: '0 0 12px 0'
          }}>
            We DO NOT Collect
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li style={{
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#e53e3e' }}>✗</span>
              Video or audio recordings
            </li>
            <li style={{
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#e53e3e' }}>✗</span>
              Chat message content
            </li>
            <li style={{
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#e53e3e' }}>✗</span>
              Personal conversations
            </li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          How We Use Your Information
        </h2>
        
        <div style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
        }}>
          {[
            { title: 'Matching', desc: 'Connect you with users who share your interests', icon: '🎯' },
            { title: 'Authentication', desc: 'Verify your identity through Google Sign-In', icon: '🔐' },
            { title: 'Safety', desc: 'Prevent abuse and maintain community guidelines', icon: '🛡️' },
            { title: 'Improvement', desc: 'Analyze usage patterns to enhance user experience', icon: '📊' }
          ].map((item, index) => (
            <div key={index} style={{
              background: '#ffffff',
              border: '1px solid #e1e1e1',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#262626',
                margin: '0 0 8px 0'
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#737373',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{
        background: '#f0fff4',
        border: '1px solid #9ae6b4',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#276749',
          margin: '0 0 8px 0'
        }}>
          Questions about your privacy?
        </h3>
        <p style={{
          fontSize: '15px',
          color: '#2d3748',
          margin: '0 0 16px 0'
        }}>
          We're here to help. Contact us anytime.
        </p>
        <button style={{
          background: '#00ff88',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          color: '#000',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}

// Placeholder components for other pages
// Terms of Service Content
function TermsContent() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#262626',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Terms of Service
        </h1>
        <p style={{
          color: '#8e8e8e',
          fontSize: '14px',
          margin: 0
        }}>
          Last updated: June 15, 2025
        </p>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid #e1e1e1'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 12px 0'
        }}>
          ✅ Welcome to Onstrays
        </h3>
        <p style={{
          color: '#737373',
          fontSize: '15px',
          lineHeight: '1.6',
          margin: 0
        }}>
          By using Onstrays, you agree to these Terms of Service. We aim to offer a safe, fun, and respectful space for discovering new people through interest-based video chat.
        </p>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          What You Can Do
        </h2>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          background: '#ffffff',
          border: '1px solid #e1e1e1',
          borderRadius: '12px',
          padding: '24px'
        }}>
          {[
            "Use Onstrays if you are 13 or older",
            "Connect with others based on your interests",
            "Express yourself respectfully",
            "Report inappropriate behavior",
            "Use your Google account to sign in"
          ].map((item, index) => (
            <li key={index} style={{
              padding: '8px 0',
              borderBottom: index !== 4 ? '1px solid #f0f0f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#00b894' }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          What You Cannot Do
        </h2>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          background: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '12px',
          padding: '24px'
        }}>
          {[
            "Harass, bully, or intimidate others",
            "Share explicit, hateful, or violent content",
            "Pretend to be someone else",
            "Use bots, spam, or scam others",
            "Break the law or our community rules"
          ].map((item, index) => (
            <li key={index} style={{
              padding: '8px 0',
              borderBottom: index !== 4 ? '1px solid #ffe5e5' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              color: '#737373'
            }}>
              <span style={{ color: '#e53e3e' }}>✗</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          Community and Safety
        </h2>
        <div style={{
          background: '#edf2f7',
          border: '1px solid #cbd5e0',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <p style={{
            fontSize: '15px',
            color: '#4a5568',
            margin: '0 0 12px 0',
            lineHeight: '1.6'
          }}>
            We rely on our users to maintain a respectful community. Please report abuse, use common sense when talking to strangers, and never share sensitive personal information.
          </p>
          <p style={{
            fontSize: '15px',
            color: '#4a5568',
            margin: 0,
            lineHeight: '1.6'
          }}>
            We may suspend or remove your access if you violate these terms.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          margin: '0 0 16px 0',
          letterSpacing: '-0.25px'
        }}>
          Updates to These Terms
        </h2>
        <div style={{
          background: '#fefcbf',
          border: '1px solid #faf089',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <p style={{
            fontSize: '15px',
            color: '#665c00',
            margin: 0,
            lineHeight: '1.6'
          }}>
            We may update these Terms occasionally. If we make major changes, we’ll notify you through the app or email. Continued use means you agree to the latest terms.
          </p>
        </div>
      </section>

      <div style={{
        background: '#f0fff4',
        border: '1px solid #9ae6b4',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#276749',
          margin: '0 0 8px 0'
        }}>
          Need Help or Have Questions?
        </h3>
        <p style={{
          fontSize: '15px',
          color: '#2d3748',
          margin: '0 0 16px 0'
        }}>
          Our team is here for you. Let us know if you need clarification or want to report an issue.
        </p>
        <button style={{
          background: '#00ff88',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          color: '#000',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}


function ContactContent() {
  return (
   <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#262626',
          marginBottom: '8px'
        }}>
          Contact Us
        </h1>
        <p style={{ fontSize: '14px', color: '#8e8e8e' }}>
          Need help? Have feedback? We're listening.
        </p>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid #e1e1e1'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#262626', marginBottom: '12px' }}>
          💬 Message Our Team
        </h3>
        <p style={{ fontSize: '15px', color: '#737373', marginBottom: '16px' }}>
          If you're facing a bug, account issue, or simply want to share feedback — shoot us an email. We usually reply within 48 hours.
        </p>
        <p style={{ fontSize: '15px', fontWeight: 600 }}>
          📧 <a href="mailto:team@onstrays.com" style={{ color: '#00cc88', textDecoration: 'none' }}>team@onstrays.com</a>
        </p>
      </div>

      <div style={{
        background: '#fffaf0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid #f6ad55'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#dd6b20', marginBottom: '12px' }}>
          🔐 Your Privacy
        </h3>
        <p style={{ fontSize: '15px', color: '#555' }}>
          We do not collect or store any of your contact messages outside our inbox. No message data is shared with third-party tools or ad networks.
        </p>
      </div>

      <div style={{
        background: '#e6fffa',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #81e6d9',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#319795', marginBottom: '8px' }}>
          Connect with Us
        </h3>
        <p style={{ fontSize: '15px', color: '#2c7a7b', marginBottom: '16px' }}>
          Follow our journey, updates, and shoutouts:
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <a href="https://instagram.com/onstrays" target="_blank" rel="noopener noreferrer" style={{ color: '#319795' }}>Instagram</a>
        
        </div>
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#262626',
        margin: '0 0 32px 0'
      }}>
        About OnStrays
      </h1>
      <p style={{ color: '#737373', fontSize: '15px', lineHeight: '1.6' }}>
        About page content will be added here...
      </p>
    </div>
  );
}

function CareersContent() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#262626',
        margin: '0 0 32px 0'
      }}>
        Careers
      </h1>
      <p style={{ color: '#737373', fontSize: '15px', lineHeight: '1.6' }}>
        Careers - no available opportunities yet.
      </p>
    </div>
  );
}

function BlogContent() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#262626',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          What is Onstrays? And Why We Built It.
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#8e8e8e',
          margin: 0
        }}>
          Published on July 15, 2025
        </p>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid #e1e1e1'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#262626',
          marginBottom: '12px'
        }}>
          🚀 Built for Real Human Conversations
        </h3>
        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#737373',
          margin: 0
        }}>
          Onstrays is a video chat platform built on one simple idea: that strangers can spark some of the most meaningful, human conversations  when they are matched well, treated with respect, and protected from online harm. 
        </p>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          marginBottom: '16px',
          letterSpacing: '-0.25px'
        }}>
          🔐 Why We Had to Build This (and Fast)
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#444',
          lineHeight: '1.7',
          marginBottom: '24px'
        }}>
          Over the past few years, many video chat apps  especially those from lesser known Chinese companies  have flooded the internet. Most promise connection, fun, and anonymity. But behind the scenes, they come bundled with:
        </p>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {[
            { icon: '⚠️', text: 'Malware hidden in app downloads' },
            { icon: '📹', text: 'Undisclosed recording of video/audio sessions' },
            { icon: '🌐', text: 'Data sent to offshore servers without user consent' },
            { icon: '🔓', text: 'Lack of encryption or security protocols' },
            { icon: '🤖', text: 'Bots pretending to be people' }
          ].map((item, idx) => (
            <li key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid #eee',
              fontSize: '15px',
              color: '#555'
            }}>
              <span>{item.icon}</span>
              {item.text}
            </li>
          ))}
        </ul>

        <p style={{
          fontSize: '16px',
          color: '#444',
          lineHeight: '1.7',
          marginTop: '24px'
        }}>
          As builders, we were shocked. As users, we were disappointed. As humans, we were worried. That’s when we decided to create **Onstrays**  a platform built with **integrity**, **transparency**, and **real technical safeguards**.
        </p>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          marginBottom: '16px',
          letterSpacing: '-0.25px'
        }}>
          🛡️ How Onstrays Protects You
        </h2>
        <div style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: '1fr'
        }}>
          {[
            {
              icon: '🔐',
              title: 'Privacy-First by Design',
              desc: 'We don’t record, store, or transmit your video or audio. Period.'
            },
            {
              icon: '👀',
              title: 'No Creepy Tracking',
              desc: 'We don’t follow you around the web or sell your data. Your chats disappear when you leave.'
            },
            {
              icon: '🧠',
              title: 'Smart Matchmaking',
              desc: 'We use your selected interests (not your private data) to connect you with the right people.'
            },
            {
              icon: '🧼',
              title: 'No Bots, No Spam',
              desc: 'We verify every connection to make sure it’s a real human on the other end.'
            },
            {
              icon: '🔎',
              title: 'Fully Transparent',
              desc: 'Our privacy policy is readable. Our source code is clean. And you’re always in control.'
            }
          ].map((item, index) => (
            <div key={index} style={{
              background: '#ffffff',
              border: '1px solid #e1e1e1',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#262626',
                marginBottom: '8px'
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#737373',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#262626',
          marginBottom: '16px',
          letterSpacing: '-0.25px'
        }}>
          🌍 Our Vision
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#444',
          lineHeight: '1.7',
          marginBottom: '24px'
        }}>
          Onstrays isn’t just a tech product. It’s a belief that conversations with strangers can be beautiful, spontaneous, and safe. It’s our answer to the broken state of social media and the creepy state of video chat apps.
        </p>
        <p style={{
          fontSize: '16px',
          color: '#444',
          lineHeight: '1.7'
        }}>
          We want to create a world where:
          <br />
          <strong>→</strong> You feel safe talking to anyone<br />
          <strong>→</strong> Your data is yours and yours only<br />
          <strong>→</strong> You’re matched for vibes, not views<br />
          <strong>→</strong> You actually enjoy being online again
        </p>
      </section>

      <div style={{
        background: '#f0fff4',
        border: '1px solid #9ae6b4',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#276749',
          marginBottom: '8px'
        }}>
          Want to try the safer way to meet new people?
        </h3>
        <p style={{
          fontSize: '15px',
          color: '#2d3748',
          marginBottom: '16px'
        }}>
          Sign in, set your interests, and begin your first meaningful chat today. You’ll feel the difference.
        </p>
        <button style={{
          background: '#00ff88',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          color: '#000',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          Start Chatting on Onstrays
        </button>
      </div>
    </div>
  

  );
}
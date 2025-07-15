import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

export default function AboutPage() {
  const [countStats, setCountStats] = useState({
    users: 0,
    conversations: 0,
    interests: 0,
    satisfaction: 0
  });
  
  const isMobile = window.innerWidth <= 768;
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const valuesRef = useRef(null);
  const ctaRef = useRef(null);
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  
  const statsInView = useInView(statsRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });

  // Smooth scroll container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  // Section slide variants
  const sectionVariants = {
    hidden: { 
      opacity: 0, 
      y: 100,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1
      }
    }
  };

  // Item variants for staggered animations
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Counter animation effect
  useEffect(() => {
    if (statsInView) {
      const targetStats = { users: 10000, conversations: 25000, interests: 20, satisfaction: 95 };
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setCountStats({
          users: Math.floor(targetStats.users * progress),
          conversations: Math.floor(targetStats.conversations * progress),
          interests: Math.floor(targetStats.interests * progress),
          satisfaction: Math.floor(targetStats.satisfaction * progress)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setCountStats(targetStats);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [statsInView]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ 
        maxWidth: '100%', 
        overflow: 'hidden',
        scrollBehavior: 'smooth',
        willChange: 'transform'
      }}
    >
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          
          position: 'relative',
          padding: isMobile ? '20px' : '40px',
          overflow: 'hidden'
        }}
      >
        {/* Subtle animated background */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 30%, rgba(0,255,136,0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 50%)`,
            y: y
          }}
        />
        
        <motion.div 
          variants={itemVariants}
          style={{
            textAlign: 'center',
            maxWidth: '800px',
            zIndex: 2
          }}
        >
          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: isMobile ? '2.5rem' : '4rem',
              fontWeight: 700,
              color: '#000000',
              marginBottom: '20px',
              lineHeight: 1.2
            }}
          >
            Where Ideas Find Their
            <motion.span
              variants={itemVariants}
              style={{
                color: '#00ff88',
                display: 'block'
              }}
            >
              People
            </motion.span>
          </motion.h1>
          
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              color: '#cccccc',
              marginBottom: '30px',
              lineHeight: 1.6
            }}
          >
            Connect with like-minded people who get your ideas
          </motion.p>
          
          <motion.div
            variants={itemVariants}
            style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#999999',
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            OnStrays is India's first interest-based video chat platform designed for meaningful conversations, idea validation, and authentic connections - without judgment, without data exploitation.
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          padding: isMobile ? '60px 20px' : '100px 40px',
          background: '#ffffff',
          textAlign: 'center'
        }}
      >
        <motion.h2
          variants={itemVariants}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 700,
            color: '#262626',
            marginBottom: '40px'
          }}
        >
          Our Mission
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '40px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          <motion.div
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            style={{
              textAlign: 'left',
              padding: '30px',
              borderRadius: '15px',
              background: '#f8f9fa',
              willChange: 'transform'
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#00ff88',
              marginBottom: '20px'
            }}>
              The Problem
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#666666',
              lineHeight: 1.6
            }}>
              Ever tried to validate a startup idea with friends? You get the polite 'that's nice' response. Ever wanted to discuss AI trends but your circle thinks you're being too 'techy'? We've all been there.
            </p>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.3 }
            }}
            style={{
              textAlign: 'left',
              padding: '30px',
              borderRadius: '15px',
              background: '#f8f9fa',
              willChange: 'transform'
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#00ff88',
              marginBottom: '20px'
            }}>
              The Solution
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#666666',
              lineHeight: 1.6
            }}>
              OnStrays was born from a simple realization: the best conversations happen when you're talking to someone who genuinely gets what you're passionate about.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Statistics Section */}
      <motion.section
        ref={statsRef}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          padding: isMobile ? '60px 20px' : '100px 40px',
          background: '#f8f9fa',
          textAlign: 'center'
        }}
      >
        <motion.h2
          variants={itemVariants}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 700,
            color: '#262626',
            marginBottom: '60px'
          }}
        >
          By the Numbers
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: '40px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          {[
            { key: 'users', label: 'Active Users', suffix: '+', color: '#00ff88' },
            { key: 'conversations', label: 'Conversations', suffix: '+', color: '#007bff' },
            { key: 'interests', label: 'Interest Categories', suffix: '', color: '#ffc107' },
            { key: 'satisfaction', label: 'User Satisfaction', suffix: '%', color: '#28a745' }
          ].map((stat, index) => (
            <motion.div
              key={stat.key}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              style={{
                padding: '30px 20px',
                background: '#ffffff',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: `2px solid ${stat.color}20`,
                willChange: 'transform',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: 700,
                color: stat.color,
                marginBottom: '10px'
              }}>
                {countStats[stat.key].toLocaleString()}{stat.suffix}
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#666666',
                fontWeight: 500
              }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          padding: isMobile ? '60px 20px' : '100px 40px',
          background: '#ffffff'
        }}
      >
        <motion.h2
          variants={itemVariants}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 700,
            color: '#262626',
            marginBottom: '60px',
            textAlign: 'center'
          }}
        >
          How OnStrays Works
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '40px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {[
            {
              step: '01',
              title: 'Choose Your Passion',
              description: 'Select from 20+ interests - from AI and startups to music and travel',
              icon: '🎯',
              color: '#00ff88'
            },
            {
              step: '02',
              title: 'Smart Matching',
              description: 'Our algorithm connects you with someone who shares your interests and mindset',
              icon: '🤝',
              color: '#007bff'
            },
            {
              step: '03',
              title: 'Validate & Grow',
              description: 'Have meaningful conversations, test ideas, and learn from like-minded peers',
              icon: '💡',
              color: '#ffc107'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -15,
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              style={{
                padding: '40px 30px',
                background: '#ffffff',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                textAlign: 'center',
                position: 'relative',
                border: `2px solid ${feature.color}20`,
                cursor: 'pointer',
                willChange: 'transform'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '30px',
                background: feature.color,
                color: '#ffffff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700
              }}>
                {feature.step}
              </div>
              
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px',
                marginTop: '10px'
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#262626',
                marginBottom: '15px'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                fontSize: '1rem',
                color: '#666666',
                lineHeight: 1.6,
                margin: 0
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        ref={valuesRef}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          padding: isMobile ? '60px 20px' : '100px 40px',
          background: '#f8f9fa',
          color: '#000000'
        }}
      >
        <motion.h2
          variants={itemVariants}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 700,
            marginBottom: '60px',
            textAlign: 'center'
          }}
        >
          Our Values
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '40px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          {[
            {
              title: 'Authentic Connections',
              description: 'No superficial small talk. Connect with people who share your passions and can contribute to your growth.',
              icon: '🤝'
            },
            {
              title: 'Validation-First',
              description: 'Whether you\'re testing a business idea, exploring a career path, or diving into new interests - find people who can give you real feedback.',
              icon: '✅'
            },
            {
              title: 'Privacy-First',
              description: 'Your conversations are yours. No recordings, no data mining, no hidden trackers. Built on secure Indian infrastructure.',
              icon: '🔒'
            },
            {
              title: 'Judgment-Free Zone',
              description: 'Escape the \'mom test\' and family pressure. Explore ideas freely with peers who understand your perspective.',
              icon: '🌟'
            }
          ].map((value, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
              style={{
                padding: '30px',
                background: '#ffffff',
                borderRadius: '15px',
                border: '2px solid rgba(0,255,136,0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                willChange: 'transform',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '20px'
              }}>
                {value.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: '#00ff88',
                marginBottom: '15px'
              }}>
                {value.title}
              </h3>
              
              <p style={{
                fontSize: '1rem',
                color: '#666666',
                lineHeight: 1.6,
                margin: 0
              }}>
                {value.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        ref={ctaRef}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{
          padding: isMobile ? '60px 20px' : '100px 40px',
          background: '#00ff88',
          textAlign: 'center',
          color: '#000000'
        }}
      >
        <motion.h2
          variants={itemVariants}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 700,
            marginBottom: '20px'
          }}
        >
          Ready to Find Your People?
        </motion.h2>
        
        <motion.p
          variants={itemVariants}
          style={{
            fontSize: '1.2rem',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px auto'
          }}
        >
          Join thousands of young Indians who are already validating ideas, learning from peers, and building meaningful connections.
        </motion.p>
        
        <motion.button
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
          }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: 600,
            background: '#000000',
            color: '#00ff88',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            willChange: 'transform'
          }}
          onClick={() => window.location.href = '/'}
        >
          Start Connecting Now
        </motion.button>
      </motion.section>
    </motion.div>
  );
}
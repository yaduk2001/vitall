import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Allow everyone (including guests) to browse content on the UserDashboard
    navigate('/userhome');
  };

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Expert-Led Courses',
      description: 'Master new skills with structured courses from industry professionals and verified tutors.',
      color: '#1e3a8a'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Creator Channels',
      description: 'Explore a world of creativity with vlogs, music, and entertainment from your favorite creators.',
      color: '#3b82f6'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'AI Study Buddy',
      description: 'Your personal AI companion "Nova" helps you learn faster with personalized guidance.',
      color: '#6366f1'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Engaging Community',
      description: 'Connect with fellow learners, discuss topics, and share your achievements.',
      color: '#8b5cf6'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Verified Certificates',
      description: 'Earn recognized certificates upon course completion to boost your career.',
      color: '#a855f7'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Monetize Your Talent',
      description: 'Creators and Tutors can earn by sharing their knowledge and creativity.',
      color: '#ec4899'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '500+', label: 'Tutors & Creators' },
    { number: '1K+', label: 'Courses & Channels' },
    { number: '50K+', label: 'Hours of Content' }
  ];

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="animated-bg" style={{
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
      }}>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container relative">
          <Link to="/" className="nav-logo">
            <img src={logoImage} alt="SUPE AI" className="logo-img" />
            <span className="logo-text">SUPE AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="nav-links hidden md:flex">
            <Link to="/home" className="nav-link" onClick={handleBrowseClick}>Browse Courses</Link>
            <Link to="/userhome" className="nav-link">Channels</Link>
            <Link to="/login" className="nav-link secondary">Sign In</Link>
            <Link to="/register" className="nav-link primary">Get Started</Link>
          </div>

          {/* Mobile Menu Trigger - Unique Sphere/Icon */}
          <button
            className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 flex items-center justify-center relative overflow-hidden group shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse-slow"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-50' : ''}`}></div>
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white z-10">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white z-10">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Mobile Glassmorphic Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute top-full right-0 mt-4 w-64 p-4 rounded-2xl bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-3 animate-fade-in-up z-50 md:hidden">
              <Link to="/home" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-200 transition-all font-medium" onClick={handleBrowseClick}>
                <span className="text-lg">📚</span> Browse Courses
              </Link>
              <Link to="/userhome" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-200 transition-all font-medium">
                <span className="text-lg">📺</span> Channels
              </Link>
              <div className="h-px bg-white/10 my-1"></div>
              <Link to="/login" className="flex items-center justify-center p-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/register" className="flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">🚀 Transform Your Learning Experience</span>
          </div>
          <h1 className="hero-title">
            Master Skills.
            <br />
            Explore
            <span className="gradient-text"> Creativity.</span>
          </h1>
          <p className="hero-description">
            The all-in-one platform where education meets entertainment.
            Join expert-led courses or discover amazing content from creators worldwide.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="cta-button primary-btn">
              Start Learning
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/userhome" className="cta-button secondary-btn">
              Explore Channels
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">📚</div>
            <div className="card-text">Courses</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">🎨</div>
            <div className="card-text">Creators</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">✨</div>
            <div className="card-text">AI Powered</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`stats-section ${isVisible ? 'visible' : ''}`}>
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={`features-section ${isVisible ? 'visible' : ''}`}>
        <div className="section-header">
          <h2 className="section-title">Why Choose SUPE AI?</h2>
          <p className="section-subtitle">
            Everything you need to learn, teach, and grow in one powerful platform
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{
                animationDelay: `${index * 0.1}s`,
                '--card-color': feature.color
              } as React.CSSProperties}
            >
              <div className="feature-icon" style={{ color: feature.color }}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`cta-section ${isVisible ? 'visible' : ''}`}>
        <div className="cta-container">
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-description">
            Join SUPE AI today. Whether you're here to learn, create, or just watch,
            there's a place for you in our growing community.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary-btn large">
              Create Free Account
            </Link>
            <Link to="/home" className="cta-button secondary-btn large" onClick={handleBrowseClick}>
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src={logoImage} alt="SUPE AI" className="footer-logo" />
            <span className="footer-text">SUPE AI</span>
          </div>
          <div className="footer-links">
            <Link to="/home" className="footer-link" onClick={handleBrowseClick}>Courses</Link>
            <Link to="/channels" className="footer-link">Channels</Link>
            <Link to="/login" className="footer-link">Sign In</Link>
            <Link to="/register" className="footer-link">Register</Link>
          </div>
          <div className="footer-copyright">
            © 2024 SUPE AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Custom Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-icon">🔒</div>
              <h3 className="modal-title">Access Restricted</h3>
            </div>
            <p className="modal-message">
              Only registered students can access the courses. Please register as a student to explore our content.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setShowAuthModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={() => navigate('/register')}
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: white;
          padding: 32px;
          border-radius: 20px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          transform: scale(0.9);
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .modal-header {
          margin-bottom: 16px;
        }

        .modal-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
        }

        .modal-message {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 24px;
          font-size: 16px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .modal-btn.primary {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
        }

        .modal-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(30, 58, 138, 0.3);
        }

        .modal-btn.secondary {
          background: #f1f5f9;
          color: #64748b;
        }

        .modal-btn.secondary:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          min-height: 100vh;
          background: #ffffff;
          position: relative;
          overflow-x: hidden;
        }

        /* Animated Background */
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          transition: transform 0.1s ease-out;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 20s infinite ease-in-out;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          top: -250px;
          left: -250px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          bottom: -200px;
          right: -200px;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #ec4899 0%, #f59e0b 100%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Navigation */
        .landing-nav {
          position: relative;
          z-index: 100;
          padding: 20px 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #1f2937;
          font-weight: 700;
          font-size: 20px;
        }

        .logo-img {
          height: 40px;
          width: auto;
          border-radius: 8px;
        }

        .logo-text {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          text-decoration: none;
          color: #4b5563;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.2s ease;
          padding: 8px 16px;
          border-radius: 8px;
        }

        .nav-link:hover {
          color: #1e3a8a;
          background: #f0f4ff;
        }

        .nav-link.primary {
          background: #1e3a8a;
          color: white;
          padding: 10px 20px;
        }

        .nav-link.primary:hover {
          background: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
        }

        .nav-link.secondary {
          border: 2px solid #1e3a8a;
          color: #1e3a8a;
        }

        .nav-link.secondary:hover {
          background: #1e3a8a;
          color: white;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .hero-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero-badge {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
          border: 1px solid #c7d2fe;
          border-radius: 50px;
          width: fit-content;
        }

        .badge-text {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .gradient-text {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 18px;
          line-height: 1.7;
          color: #64748b;
          max-width: 540px;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .cta-button.primary-btn {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(30, 58, 138, 0.3);
        }

        .cta-button.primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(30, 58, 138, 0.4);
        }

        .cta-button.secondary-btn {
          background: white;
          color: #1e3a8a;
          border: 2px solid #1e3a8a;
        }

        .cta-button.secondary-btn:hover {
          background: #1e3a8a;
          color: white;
          transform: translateY(-2px);
        }

        .cta-button.large {
          padding: 16px 32px;
          font-size: 18px;
        }

        .hero-visual {
          position: relative;
          height: 400px;
        }

        .floating-card {
          position: absolute;
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          animation: floatCard 6s infinite ease-in-out;
        }

        .card-1 {
          top: 0;
          left: 0;
          width: 140px;
          animation-delay: 0s;
        }

        .card-2 {
          top: 120px;
          right: 40px;
          width: 160px;
          animation-delay: 2s;
        }

        .card-3 {
          bottom: 0;
          left: 60px;
          width: 150px;
          animation-delay: 4s;
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        .card-icon {
          font-size: 40px;
        }

        .card-text {
          font-weight: 600;
          color: #1e3a8a;
          font-size: 14px;
        }

        /* Stats Section */
        .stats-section {
          position: relative;
          z-index: 10;
          padding: 60px 32px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease 0.2s;
        }

        .stats-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }

        .stat-card {
          text-align: center;
          padding: 32px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.6s ease forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(30, 58, 138, 0.15);
        }

        .stat-number {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          color: #64748b;
          font-weight: 500;
        }

        /* Features Section */
        .features-section {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 32px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease 0.4s;
        }

        .features-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 42px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 18px;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .feature-card {
          position: relative;
          background: white;
          border-radius: 24px;
          padding: 40px 32px;
          border: 2px solid #f1f5f9;
          transition: all 0.4s ease;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.6s ease forwards;
        }

        .feature-card:hover {
          transform: translateY(-12px);
          border-color: var(--card-color);
          box-shadow: 0 20px 48px rgba(30, 58, 138, 0.15);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
          border-radius: 16px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(5deg);
          background: linear-gradient(135deg, var(--card-color) 0%, var(--card-color) 100%);
          color: white !important;
        }

        .feature-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .feature-description {
          font-size: 16px;
          line-height: 1.6;
          color: #64748b;
        }

        .feature-hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, var(--card-color) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .feature-card:hover .feature-hover-effect {
          opacity: 0.05;
        }

        /* CTA Section */
        .cta-section {
          position: relative;
          z-index: 10;
          padding: 60px 32px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease 0.6s;
        }

        .cta-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-size: 42px;
          font-weight: 800;
          color: white;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .cta-description {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .cta-section .cta-button.primary-btn {
          background: white;
          color: #1e3a8a;
        }

        .cta-section .cta-button.primary-btn:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .cta-section .cta-button.secondary-btn {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .cta-section .cta-button.secondary-btn:hover {
          background: white;
          color: #1e3a8a;
        }

        /* Footer */
        .landing-footer {
          position: relative;
          z-index: 10;
          padding: 60px 32px 40px;
          background: #0f172a;
          color: white;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 32px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-logo {
          height: 36px;
          width: auto;
          border-radius: 6px;
        }

        .footer-text {
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .footer-links {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: white;
        }

        .footer-copyright {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
            padding-top: 40px;
          }

          .hero-visual {
            height: 300px;
            margin-top: 40px;
            display: none; /* Hide floating cards on tablets/mobile to reduce clutter */
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .nav-container {
             padding: 0 20px;
          }

          .hero-title {
            font-size: 40px;
          }

          .hero-description {
            font-size: 16px;
            margin: 0 auto;
          }

          .hero-cta {
            justify-content: center;
          }
          
          .cta-buttons {
             flex-direction: column;
             gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .nav-links {
             gap: 8px;
          }
          
          /* Hide text links on mobile, keep buttons */
          .nav-link:not(.primary):not(.secondary) {
             display: none;
          }
          
          .nav-link.primary, .nav-link.secondary {
             padding: 8px 14px;
             font-size: 13px;
          }

          .hero-section {
            padding: 40px 16px;
          }
          
          .hero-title {
             font-size: 34px;
          }

          .stats-container {
            grid-template-columns: 1fr;
          }
          
          .features-grid {
             grid-template-columns: 1fr;
          }
          
          .footer-container {
             flex-direction: column;
             text-align: center;
          }
          
          .footer-links {
             justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;


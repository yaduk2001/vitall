import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, registerUser } from '../config/api';

const Register: React.FC = () => {
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<'student' | 'user' | 'organization' | 'content_creator'>('student');
  const [creatorType, setCreatorType] = useState<string>('vlogger');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // mirror Astro behavior of dynamic label/placeholder (same text currently)
  }, [role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await registerUser(
        (fullNameRef.current?.value || '').trim(),
        (emailRef.current?.value || '').toLowerCase().trim(),
        passwordRef.current?.value || '',
        role,
        role === 'content_creator' ? creatorType : undefined
      );

      if (role === 'organization' || role === 'content_creator') {
        setSuccessMessage('Registration request received. Please wait until approved.');
        setIsStudent(false);
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // For students, do not auto-login. Redirect to login page.
      setSuccessMessage('Registration successful! Please login to continue.');
      setIsStudent(true);
      setShowSuccessPopup(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      let msg = 'Registration failed.';
      if (err && err.message) {
        try { msg = JSON.parse(err.message).error || msg; } catch { msg = err.message; }
      }
      setError(msg);
    }
  }

  return (
    <section className="auth-container">
      <div className="left-panel">
        <div className="bg"></div>
        <div className="overlay"></div>
        <div className="brand">
          <h2>Welcome to</h2>
          <h1>SUPE AI</h1>
          <p>Your personal study coach</p>
        </div>
      </div>
      <div className="right-panel">
        <div className="panel-background-effects">
          <div className="bg-gradient-orb orb-1"></div>
          <div className="bg-gradient-orb orb-2"></div>
          <div className="bg-gradient-orb orb-3"></div>
        </div>

        <div className="form-header">
          <div className="header-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Create New Account</h2>
          <p className="form-subtitle">Join us and start your learning journey today!</p>
        </div>

        <form id="register-form" className="form" onSubmit={onSubmit}>
          <div className="input-group" data-field="name">
            <label>
              <span className="label-icon">👤</span>
              Full Name
            </label>
            <div className="input-wrapper">
              <input
                ref={fullNameRef}
                type="text"
                placeholder="Enter Your Name"
                required
                className="form-input"
                onFocus={(e) => {
                  e.currentTarget.closest('.input-group')?.classList.add('focused');
                }}
                onBlur={(e) => {
                  e.currentTarget.closest('.input-group')?.classList.remove('focused');
                }}
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="input-group" data-field="email">
            <label>
              <span className="label-icon">✉️</span>
              Email Address
            </label>
            <div className="input-wrapper">
              <input
                ref={emailRef}
                type="email"
                placeholder="Enter Your Email"
                required
                className="form-input"
                onFocus={(e) => {
                  e.currentTarget.closest('.input-group')?.classList.add('focused');
                }}
                onBlur={(e) => {
                  e.currentTarget.closest('.input-group')?.classList.remove('focused');
                }}
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="input-group" data-field="password">
            <label>
              <span className="label-icon">🔒</span>
              Password
            </label>
            <div className="password-field">
              <div className="input-wrapper">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Your Password"
                  required
                  className="form-input"
                  onFocus={(e) => {
                    e.currentTarget.closest('.input-group')?.classList.add('focused');
                  }}
                  onBlur={(e) => {
                    e.currentTarget.closest('.input-group')?.classList.remove('focused');
                  }}
                />
                <div className="input-glow"></div>
                <button
                  type="button"
                  id="togglePassword"
                  className="toggle-visibility"
                  aria-label="Show password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19l-3.42-3.43a4 4 0 0 0-5.76-5.76l-3.42-3.42z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Updated Account Type Selection */}
          <div className="input-group" style={{ zIndex: 50 }}>
            <label className="block text-sm font-medium text-gray-700">I am a...</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-md py-3 px-4 flex items-center justify-between shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left"
              >
                <span className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${role === 'student' ? 'bg-blue-600' :
                    role === 'user' ? 'bg-green-600' :
                      role === 'organization' ? 'bg-indigo-600' : 'bg-red-600'
                    }`}>
                    <i className={`fas ${role === 'student' ? 'fa-user-graduate' :
                      role === 'user' ? 'fa-user' :
                        role === 'organization' ? 'fa-chalkboard-teacher' : 'fa-video'
                      }`}></i>
                  </span>
                  <div>
                    <span className="block font-bold text-gray-900 text-sm">
                      {role === 'student' ? 'Student' :
                        role === 'user' ? 'User (Viewer)' :
                          role === 'organization' ? 'Tutor' : 'Content Creator'}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {role === 'student' ? 'I want to learn & enroll in courses' :
                        role === 'user' ? 'I want to watch & explore content' :
                          role === 'organization' ? 'I want to teach courses' : 'I want to upload videos & music'}
                    </span>
                  </div>
                </span>
                <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white shadow-xl rounded-md border border-gray-100 overflow-hidden animate-fade-in-down">
                  {[
                    { id: 'student', label: 'Student', desc: 'Learn & Grow', icon: 'fa-user-graduate', color: 'bg-blue-600' },
                    { id: 'user', label: 'User', desc: 'Watch & Explore', icon: 'fa-user', color: 'bg-green-600' },
                    { id: 'organization', label: 'Tutor', desc: 'Teach Courses', icon: 'fa-chalkboard-teacher', color: 'bg-indigo-600' },
                    { id: 'content_creator', label: 'Content Creator', desc: 'Upload Music/Vlogs', icon: 'fa-video', color: 'bg-red-600' }
                  ].map((type) => (
                    <div
                      key={type.id}
                      onClick={() => { setRole(type.id as any); setIsDropdownOpen(false); }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${type.color} bg-opacity-90 group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${type.icon}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.desc}</p>
                      </div>
                      {role === type.id && <i className="fas fa-check text-blue-600 ml-auto"></i>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {role === 'content_creator' && (
            <div className="input-group" style={{ animation: 'slideDown 0.4s ease forwards' }}>
              <label>
                <span className="label-icon">🎨</span>
                Creator Type
              </label>
              <div className="creator-type-grid">
                {[
                  { id: 'vlogger', icon: '📹', label: 'Vlogger', desc: 'Video Content' },
                  { id: 'music_company', icon: '🎵', label: 'Music', desc: 'Rights Holder' },
                  { id: 'corporate', icon: '🏢', label: 'Corporate', desc: 'Training' },
                  { id: 'medical', icon: '🩺', label: 'Medical', desc: 'Health Edu' }
                ].map((type) => (
                  <div
                    key={type.id}
                    className={`creator-card ${creatorType === type.id ? 'selected' : ''}`}
                    onClick={() => setCreatorType(type.id)}
                  >
                    <div className="creator-card-icon">{type.icon}</div>
                    <div className="creator-card-label">{type.label}</div>
                    <div className="creator-card-desc">{type.desc}</div>
                    <div className="selection-ring"></div>
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="terms">
            <label className="terms-checkbox-label">
              <input type="checkbox" id="agree" required />
              <span className="custom-checkbox">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="terms-text">
                I agree with the <a href="#">Terms of services</a> and <a href="#">Privacy Policy</a>
              </span>
            </label>
          </div>

          <button className="primary" type="submit">
            <span className="btn-text">Create Account</span>
            <span className="btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="btn-shine"></div>
          </button>

          {!!error && (
            <div className="error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="text-center mt-4 mb-2">
            <span className="text-gray-500 font-medium text-sm">Already have an account? </span>
            <a
              href="/login"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
              className="text-blue-600 font-bold hover:underline transition-all cursor-pointer text-sm"
            >
              Sign In
            </a>
          </div>

          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">Or sign up with</span>
            <span className="divider-line"></span>
          </div>

          <div className="social-row">
            <a className="social google" href={`${API_CONFIG.BASE_URL}/api/auth/google`}>
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </span>
              <span className="social-text">Google</span>
            </a>
            <a className="social facebook" href={`${API_CONFIG.BASE_URL}/api/auth/facebook`}>
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="currentColor" />
                </svg>
              </span>
              <span className="social-text">Facebook</span>
            </a>
          </div>
        </form>

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="success-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
            <div className="success-popup" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon-wrapper">
                <div className="success-checkmark">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="checkmark-circle" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="checkmark-path" />
                  </svg>
                </div>
              </div>
              <h3 className="success-title">{isStudent ? 'Registration Successful!' : 'Request Received!'}</h3>
              <p className="success-message">{successMessage}</p>
              <div className="success-progress-bar">
                <div className="success-progress-fill"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
      .auth-container { 
        display: grid; 
        grid-template-columns: 1.08fr 1fr; 
        min-height: 80vh; 
        border-radius: 20px; 
        overflow: hidden; 
        background: white; 
        box-shadow: 0 20px 60px rgba(13,71,161,.12), 0 0 0 1px rgba(13,71,161,.05); 
        max-width: 1180px; 
        margin: 3rem auto; 
        border: 2px solid rgba(207,225,255,0.5);
        position: relative;
        animation: fadeInScale 0.6s ease;
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @media (max-width: 768px) {
        .auth-container {
          grid-template-columns: 1fr;
          margin: 1rem;
          min-height: auto;
        }
        .left-panel {
          display: none;
        }
        .right-panel {
          padding: 2rem;
        }
      }

      .auth-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(30,58,138,0.02) 0%, rgba(59,130,246,0.02) 100%);
        pointer-events: none;
        z-index: 0;
      }
      .left-panel { 
        position:relative; 
        overflow: hidden;
      }
      .left-panel .bg { 
        position:absolute; 
        inset:0; 
        background-image:url('/images/f444684b69ba2248faad9fed8ae6d631b4cc0fbd.jpg'); 
        background-size:cover; 
        background-position:center; 
        filter:saturate(145%) contrast(112%);
        animation: bgZoom 20s infinite ease-in-out, bgMove 25s infinite ease-in-out;
      }
      @keyframes bgZoom {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes bgMove {
        0%, 100% { 
          background-position: center center;
        }
        25% { 
          background-position: 55% 45%;
        }
        50% { 
          background-position: 45% 55%;
        }
        75% { 
          background-position: 50% 50%;
        }
      }
      .left-panel .overlay { 
        position:absolute; 
        inset:0; 
        background: linear-gradient(0deg, rgba(57,103,207,.14), rgba(57,103,207,.14)), linear-gradient(180deg, rgba(247,251,255,.58), rgba(225,239,255,.58));
        animation: overlayPulse 8s infinite ease-in-out, overlayMove 12s infinite ease-in-out;
      }
      @keyframes overlayPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.95; }
      }
      @keyframes overlayMove {
        0%, 100% { 
          transform: translate(0, 0);
        }
        33% { 
          transform: translate(5px, -5px);
        }
        66% { 
          transform: translate(-5px, 5px);
        }
      }
      .brand { 
        position:relative; 
        z-index:1; 
        padding:3.25rem; 
        height:100%; 
        display:flex; 
        flex-direction:column; 
        justify-content:center;
        animation: fadeInLeft 0.8s ease, brandFloat 6s ease-in-out infinite;
      }
      @keyframes fadeInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes brandFloat {
        0%, 100% {
          transform: translateY(0) translateX(0);
        }
        50% {
          transform: translateY(-15px) translateX(5px);
        }
      }
      .brand h2 { 
        color:#2b2b2b; 
        font-weight:700; 
        margin:0 0 .35rem 0; 
        opacity:.95;
        animation: fadeInUp 0.8s ease 0.2s both, textFloat 4s ease-in-out infinite 0.2s;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes textFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }
      .brand h1 { 
        font-size:76px; 
        line-height:1; 
        color:#16376f; 
        letter-spacing:.5px; 
        margin:.15rem 0 .65rem; 
        font-weight:800; 
        text-shadow:0 2px 0 rgba(255,255,255,.35);
        background: linear-gradient(135deg, #16376f 0%, #1e3a8a 50%, #3b82f6 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: fadeInUp 0.8s ease 0.4s both, titleFloat 5s ease-in-out infinite 0.4s, titleShimmer 3s ease-in-out infinite;
        position: relative;
      }
      @keyframes titleFloat {
        0%, 100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(-10px) scale(1.02);
        }
      }
      @keyframes titleShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .brand p { 
        color:#34495e; 
        font-weight:600; 
        opacity:.85;
        animation: fadeInUp 0.8s ease 0.6s both, subtitleFloat 4.5s ease-in-out infinite 0.6s;
      }
      @keyframes subtitleFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }
      .right-panel { 
        position:relative; 
        padding:3rem 3.25rem; 
        display:flex; 
        flex-direction:column; 
        justify-content:center;
        z-index: 1;
        animation: fadeInRight 0.8s ease;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        overflow: hidden;
      }

      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Background Effects */
      .panel-background-effects {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }

      .bg-gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.4;
        animation: orbFloat 15s ease-in-out infinite;
      }

      .orb-1 {
        width: 300px;
        height: 300px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        top: -100px;
        right: -100px;
        animation-delay: 0s;
      }

      .orb-2 {
        width: 250px;
        height: 250px;
        background: linear-gradient(135deg, #ec4899, #f59e0b);
        bottom: -80px;
        left: -80px;
        animation-delay: 5s;
      }

      .orb-3 {
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, #10b981, #3b82f6);
        top: 50%;
        right: -50px;
        animation-delay: 10s;
      }

      @keyframes orbFloat {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -30px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }

      /* Form Header */
      .form-header {
        text-align: center;
        margin-bottom: 2.5rem;
        position: relative;
        z-index: 1;
        animation: fadeInDown 0.6s ease 0.2s both;
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .header-icon-wrapper {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        animation: iconBounce 2s ease-in-out infinite;
        position: relative;
      }

      .header-icon-wrapper::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 22px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
        opacity: 0.3;
        z-index: -1;
        animation: iconGlow 2s ease-in-out infinite;
      }

      @keyframes iconBounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-6px) scale(1.05); }
      }

      @keyframes iconGlow {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
      }
      .auth-container::before { 
        content:""; 
        position:absolute; 
        left:50%; 
        top:0; 
        bottom:0; 
        width:1px; 
        background:linear-gradient(180deg, transparent 0%, #d9e6ff 20%, #d9e6ff 80%, transparent 100%);
        z-index: 1;
      }
      .form-header h2 { 
        text-align:center; 
        margin: 0 0 0.5rem 0; 
        font-size:32px;
        font-weight: 800;
        color: #0f172a;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        background-size: 200% 200%;
        animation: titleShimmer 3s ease-in-out infinite;
      }

      @keyframes titleShimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .form-subtitle {
        color: #64748b;
        font-size: 15px;
        margin: 0;
        font-weight: 500;
      }

      .form { 
        display:flex; 
        flex-direction:column; 
        gap:1.5rem; 
        max-width:480px; 
        margin:0 auto; 
        width:100%;
        position: relative;
        z-index: 1;
      }

      .input-group {
        animation: fadeInUp 0.6s ease both;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .input-group::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 50%;
        transform: translateY(-50%) scaleY(0);
        width: 4px;
        height: 0;
        background: linear-gradient(180deg, #3b82f6, #8b5cf6);
        border-radius: 2px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
      }

      .input-group.focused {
        transform: translateX(8px);
        padding-left: 4px;
      }

      .input-group.focused::before {
        transform: translateY(-50%) scaleY(1);
        height: 60%;
      }

      .input-group.focused .label-icon {
        animation: iconBounce 0.6s ease;
        transform: scale(1.2);
      }

      .input-group.focused .form-input {
        border-color: #3b82f6;
        box-shadow: 
          0 0 0 4px rgba(59, 130, 246, 0.1),
          0 4px 16px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px) scale(1.01);
      }

      .input-group:nth-child(1) { animation-delay: 0.1s; }
      .input-group:nth-child(2) { animation-delay: 0.2s; }
      .input-group:nth-child(3) { animation-delay: 0.3s; }
      .input-group:nth-child(4) { animation-delay: 0.4s; }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .form label { 
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight:700; 
        color:#374151;
        font-size: 14px;
        margin-bottom: 0.5rem;
      }

      .label-icon {
        font-size: 18px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .input-wrapper {
        position: relative;
      }

      .form input { 
        height:56px; 
        padding:0 1.5rem; 
        border:2px solid #e5e7eb; 
        border-radius:14px; 
        font-size:1rem; 
        background:#fff;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        width: 100%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        position: relative;
        z-index: 1;
      }

      .input-glow {
        position: absolute;
        inset: -2px;
        border-radius: 16px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
        opacity: 0;
        transition: opacity 0.4s ease;
        z-index: 0;
        filter: blur(8px);
      }

      .form input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 
          0 0 0 4px rgba(59, 130, 246, 0.1),
          0 4px 16px rgba(59, 130, 246, 0.15);
        transform: translateY(-2px);
        background: #ffffff;
      }

      /* Custom Dropdown Animation & Style */
      .custom-dropdown-container {
        position: relative;
        z-index: 50;
      }
      .dropdown-trigger {
        background: #fff;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: all 0.3s ease;
        height: 56px;
        position: relative;
        z-index: 51;
      }
      .dropdown-trigger:hover, .dropdown-trigger.active {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59,130,246,0.1);
      }
      .selected-value {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: #1f2937;
      }
      .selected-value .icon {
        font-size: 1.2rem;
      }
      .dropdown-arrow {
        color: #6b7280;
        transition: transform 0.3s ease;
      }
      .dropdown-trigger.active .dropdown-arrow {
        transform: rotate(180deg);
      }

      .dropdown-options {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        z-index: 100;
      }
      .dropdown-options.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .dropdown-option {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: background 0.2s;
        border-bottom: 1px solid #f3f4f6;
      }
      .dropdown-option:last-child {
        border-bottom: none;
      }
      .dropdown-option:hover {
        background: #f9fafb;
      }
      .dropdown-option.selected {
        background: #eff6ff;
      }
      .option-icon {
        font-size: 1.2rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      }
      .option-content {
        flex: 1;
      }
      .option-title {
        display: block;
        font-weight: 600;
        color: #1f2937;
        font-size: 0.95rem;
      }
      .option-desc {
        display: block;
        font-size: 0.8rem;
        color: #6b7280;
      }
      .option-check {
        color: #2563eb;
        font-weight: bold;
      }

      /* Creator Type Grid */
      .creator-type-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .creator-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        padding: 1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .creator-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border-color: #93c5fd;
      }
      .creator-card.selected {
        border-color: #3b82f6;
        background: #eff6ff;
        box-shadow: 0 4px 15px rgba(37,99,235,0.15);
      }
      .creator-card-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        transition: transform 0.3s;
      }
      .creator-card:hover .creator-card-icon {
        transform: scale(1.1);
      }
      .creator-card-label {
        font-weight: 700;
        color: #1f2937;
        font-size: 0.9rem;
      }
      .creator-card-desc {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 2px;
      }
      .selection-ring {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 16px;
        height: 16px;
        border: 2px solid #d1d5db;
        border-radius: 50%;
        transition: all 0.3s;
      }
      .creator-card.selected .selection-ring {
        border-color: #2563eb;
        background: #2563eb;
        box-shadow: 0 0 0 2px white, 0 0 0 4px #bfdbfe;
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .form input:focus + .input-glow {
        opacity: 0.3;
      }

      .form input::placeholder {
        color: #9ca3af;
        transition: color 0.3s ease;
      }

      .form input:focus::placeholder {
        color: #cbd5e1;
      }
      .password-field { 
        position:relative; 
      }
      .password-field input { 
        padding-right:56px; 
      }
      .toggle-visibility { 
        position:absolute; 
        right:12px; 
        top:50%; 
        transform:translateY(-50%); 
        width:40px; 
        height:40px; 
        display:flex; 
        align-items:center; 
        justify-content:center; 
        border:none; 
        background:transparent; 
        cursor:pointer; 
        border-radius:10px;
        transition: all 0.3s ease;
        color: #6b7280;
        z-index: 2;
      }
      .toggle-visibility:hover { 
        background:#f3f4f6;
        color: #3b82f6;
        transform: translateY(-50%) scale(1.1);
      }
      .toggle-visibility:active {
        transform: translateY(-50%) scale(0.95);
      }
      .role-selection { 
        display:flex; 
        flex-direction:column; 
        gap:1rem; 
      }
      .role-option { 
        display:flex; 
        align-items:center; 
        gap:1rem; 
        padding:1.25rem; 
        border:2px solid #e5e7eb; 
        border-radius:16px; 
        cursor:pointer; 
        background:linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .role-option::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s ease;
      }

      .role-option:hover { 
        background:linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%);
        border-color:#3b82f6;
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
      }

      .role-option:hover::before {
        transform: scaleX(1);
      }

      .role-option.selected {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-color: #3b82f6;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
        transform: translateY(-2px);
      }

      .role-option.selected::before {
        transform: scaleX(1);
      }

      .role-option input[type="radio"] { 
        margin:0;
        width: 0;
        height: 0;
        opacity: 0;
        position: absolute;
      }

      .role-icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.4s ease;
        position: relative;
      }

      .student-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .tutor-icon {
        background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }

      .role-option:hover .role-icon-wrapper,
      .role-option.selected .role-icon-wrapper {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      }

      .role-label { 
        display:flex; 
        flex-direction:column; 
        gap:.25rem;
        flex: 1;
      }
      .role-title { 
        font-weight:700; 
        color:#111827;
        font-size: 16px;
        transition: color 0.3s ease;
      }

      .role-option.selected .role-title {
        color: #1e3a8a;
      }

      .role-desc { 
        font-size:.875rem; 
        color:#6b7280; 
        transition: color 0.3s ease;
      }

      .role-option.selected .role-desc {
        color: #4b5563;
      }

      .role-checkmark {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      .role-option.selected .role-checkmark {
        opacity: 1;
        transform: scale(1);
        animation: checkmarkPop 0.4s ease;
      }

      @keyframes checkmarkPop {
        0% {
          transform: scale(0) rotate(-180deg);
        }
        50% {
          transform: scale(1.2) rotate(10deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
      .terms { 
        margin-top: 0.5rem;
      }

      .terms-checkbox-label {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        cursor: pointer;
        color: #6b7280;
        font-size: 14px;
        line-height: 1.5;
        transition: color 0.3s ease;
      }

      .terms-checkbox-label:hover {
        color: #374151;
      }

      .terms-checkbox-label input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .custom-checkbox {
        width: 22px;
        height: 22px;
        border: 2px solid #d1d5db;
        border-radius: 6px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
        transition: all 0.3s ease;
        position: relative;
      }

      .custom-checkbox svg {
        opacity: 0;
        transform: scale(0);
        transition: all 0.2s ease;
        color: white;
      }

      .terms-checkbox-label input[type="checkbox"]:checked + .custom-checkbox {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .terms-checkbox-label input[type="checkbox"]:checked + .custom-checkbox svg {
        opacity: 1;
        transform: scale(1);
        animation: checkboxCheck 0.3s ease;
      }

      @keyframes checkboxCheck {
        0% {
          transform: scale(0) rotate(-180deg);
        }
        50% {
          transform: scale(1.2) rotate(10deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      .terms-text {
        flex: 1;
      }

      .terms a {
        color: #3b82f6;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        position: relative;
      }

      .terms a::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transition: width 0.3s ease;
      }

      .terms a:hover {
        color: #2563eb;
      }

      .terms a:hover::after {
        width: 100%;
      }
      .primary { 
        margin-top: 0.5rem; 
        background:linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%); 
        background-size: 200% 200%;
        color:white; 
        border:none; 
        height:58px; 
        padding:0 2rem; 
        border-radius:14px; 
        cursor:pointer; 
        font-weight:700; 
        font-size: 16px;
        box-shadow:0 8px 24px rgba(30,58,138,.3);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        animation: buttonPulse 3s ease-in-out infinite;
      }

      @keyframes buttonPulse {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .btn-text {
        position: relative;
        z-index: 2;
      }

      .btn-icon {
        position: relative;
        z-index: 2;
        transition: transform 0.3s ease;
      }

      .btn-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.6s ease;
      }

      .primary:hover .btn-shine {
        left: 100%;
      }

      .primary:hover .btn-icon {
        transform: translateX(4px);
      }

      .primary:hover { 
        background:linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #7c3aed 100%);
        background-size: 200% 200%;
        transform: translateY(-3px);
        box-shadow:0 16px 40px rgba(30,58,138,.4);
      }

      .primary:active {
        transform: translateY(-1px);
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
        position: relative;
      }

      .divider-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
      }

      .divider-text {
        color: #9ca3af;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
      }

      .error { 
        color:#dc2626; 
        background:linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
        border:2px solid #fecaca; 
        padding:1rem 1.25rem; 
        border-radius:12px; 
        margin-top:12px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 14px;
        animation: errorShake 0.5s ease;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
      }

      @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .error svg {
        flex-shrink: 0;
        color: #dc2626;
      }

      .social-row { 
        display:flex; 
        justify-content:space-between; 
        gap:12px; 
        margin-top:0;
      }

      .social { 
        display:flex; 
        align-items:center; 
        justify-content:center; 
        gap:10px; 
        height:48px; 
        padding:0 1.25rem; 
        border-radius:12px; 
        text-decoration:none; 
        font-weight:600; 
        font-size:14px; 
        width:48%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        border: 2px solid;
      }

      .social::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .social:hover::before {
        opacity: 1;
      }

      .social-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
      }

      .social:hover .social-icon {
        transform: scale(1.1);
      }

      .social-text {
        position: relative;
        z-index: 1;
      }

      .social.google { 
        background:#ffffff; 
        border-color:#e5e7eb; 
        color:#1f2937;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .social.google:hover { 
        background:#f9fafb;
        border-color: #d1d5db;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .social.facebook { 
        background:linear-gradient(135deg, #1877f2 0%, #166fe5 100%); 
        color:#ffffff; 
        border-color:#166fe5;
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
      }

      .social.facebook:hover { 
        background:linear-gradient(135deg, #166fe5 0%, #1460d1 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(24, 119, 242, 0.4);
      }

      /* Success Popup */
      .success-popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeInOverlay 0.3s ease;
      }

      @keyframes fadeInOverlay {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .success-popup {
        background: white;
        border-radius: 24px;
        padding: 3rem 2.5rem;
        max-width: 420px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: popupSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        overflow: hidden;
      }

      @keyframes popupSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .success-popup::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
        animation: progressLine 3s linear;
      }

      @keyframes progressLine {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }

      .success-icon-wrapper {
        margin-bottom: 1.5rem;
      }

      .success-checkmark {
        width: 100px;
        height: 100px;
        margin: 0 auto;
        position: relative;
        animation: checkmarkScale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes checkmarkScale {
        0% {
          transform: scale(0);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }

      .success-checkmark svg {
        width: 100%;
        height: 100%;
        color: #10b981;
      }

      .checkmark-circle {
        stroke-dasharray: 62.83;
        stroke-dashoffset: 62.83;
        animation: drawCircle 0.6s ease-out forwards;
      }

      @keyframes drawCircle {
        to {
          stroke-dashoffset: 0;
        }
      }

      .checkmark-path {
        stroke-dasharray: 18;
        stroke-dashoffset: 18;
        animation: drawCheck 0.4s ease-out 0.6s forwards;
      }

      @keyframes drawCheck {
        to {
          stroke-dashoffset: 0;
        }
      }

      .success-title {
        font-size: 28px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 1rem 0;
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: titleFadeIn 0.5s ease 0.3s both;
      }

      @keyframes titleFadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .success-message {
        font-size: 16px;
        color: #64748b;
        margin: 0 0 2rem 0;
        line-height: 1.6;
        animation: messageFadeIn 0.5s ease 0.5s both;
      }

      @keyframes messageFadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .success-progress-bar {
        width: 100%;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }

      .success-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 2px;
        width: 0;
        animation: progressFill 3s linear;
      }

      @keyframes progressFill {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }

      @media (max-width: 980px) { 
        .auth-container { 
          grid-template-columns: 1fr; 
          min-height: 70vh; 
          margin:1rem; 
        } 
        .left-panel { 
          display:none; 
        } 
        .auth-container::before{
          display:none;
        } 
        .form{
          max-width:100%;
        }
        .success-popup {
          padding: 2rem 1.5rem;
          max-width: 90%;
        }
      }
      `}</style>
    </section>
  );
};

export default Register;



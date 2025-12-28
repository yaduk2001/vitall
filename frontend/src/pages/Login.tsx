import React, { useRef, useState } from 'react';
import { API_CONFIG, login } from '../config/api';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const Login: React.FC = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await login((emailRef.current?.value || '').trim(), passwordRef.current?.value || '');
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'organization') {
        if (res.user.isApproved) {
          navigate('/Tutordashboard');
        } else {
          showWarning('Your organization account is pending admin approval. Please wait for approval.');
          navigate('/home');
        }
      } else if (res.user.role === 'content_creator') {
        if (res.user.isApproved) {
          navigate('/CreatorDashboard');
        } else {
          showWarning('Your creator account is pending verification. Please wait for approval.');
          navigate('/home');
        }
      }
      else navigate('/home');
    } catch (err: any) {
      let msg = 'Login failed.';
      if (err && err.message) {
        try {
          msg = JSON.parse(err.message).error || msg;
        } catch { msg = err.message; }
      }
      setError(msg);
    }
  }

  return (
    <section className="auth-container">
      <div className="left-panel">
        <div className="bg"></div>
        <div className="overlay"></div>
        <div className="holographic-shimmer"></div>
        <div className="holographic-overlay"></div>

        {/* 3D Floating Elements */}
        <div className="floating-3d-elements">
          <div className="shape-3d shape-1">
            <div className="shape-face front"></div>
            <div className="shape-face back"></div>
            <div className="shape-face right"></div>
            <div className="shape-face left"></div>
            <div className="shape-face top"></div>
            <div className="shape-face bottom"></div>
          </div>
          <div className="shape-3d shape-2">
            <div className="shape-face front"></div>
            <div className="shape-face back"></div>
            <div className="shape-face right"></div>
            <div className="shape-face left"></div>
            <div className="shape-face top"></div>
            <div className="shape-face bottom"></div>
          </div>
          <div className="shape-3d shape-3">
            <div className="shape-face front"></div>
            <div className="shape-face back"></div>
            <div className="shape-face right"></div>
            <div className="shape-face left"></div>
            <div className="shape-face top"></div>
            <div className="shape-face bottom"></div>
          </div>
          <div className="geometric-sphere sphere-1"></div>
          <div className="geometric-sphere sphere-2"></div>
          <div className="geometric-ring ring-1"></div>
          <div className="geometric-ring ring-2"></div>
        </div>

        {/* Educational Icons */}
        <div className="educational-icons">
          <div className="edu-icon icon-1">📚</div>
          <div className="edu-icon icon-2">🎓</div>
          <div className="edu-icon icon-3">✏️</div>
          <div className="edu-icon icon-4">📝</div>
          <div className="edu-icon icon-5">🔬</div>
          <div className="edu-icon icon-6">💡</div>
          <div className="edu-icon icon-7">⭐</div>
          <div className="edu-icon icon-8">📊</div>
        </div>

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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h2>Login to your account</h2>
          <p className="form-subtitle">Welcome back! Please enter your details</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <div className="input-group">
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
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="label-icon">🔒</span>
              Password
            </label>
            <div className="password-field">
              <div className="input-wrapper">
                <input
                  ref={passwordRef}
                  type="password"
                  placeholder="Enter Your Password"
                  required
                  className="form-input"
                />
                <div className="input-glow"></div>
              </div>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button className="primary" type="submit">
            <span className="btn-text">Login</span>
            <span className="btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="btn-shine"></div>
          </button>

          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">Or continue with</span>
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

          <div className="alt-actions">
            <span>Don't have an account?</span>
            <Link className="link" to="/register">
              <span>Sign up</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {!!error && (
            <div className="error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      <style>{`
      .auth-container { 
        display: grid; 
        grid-template-columns: 1.08fr 1fr; 
        min-height: 80vh; 
        border-radius: 20px; 
        overflow: hidden; 
        background: white; 
        box-shadow: 
          0 20px 60px rgba(13,71,161,.12), 
          0 0 0 1px rgba(13,71,161,.05),
          0 0 80px rgba(59, 130, 246, 0.1);
        max-width: 1180px; 
        margin: 3rem auto; 
        border: 2px solid rgba(207,225,255,0.5);
        position: relative;
        animation: fadeInScale 0.6s ease;
        transform-style: preserve-3d;
        perspective: 1000px;
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
        perspective: 1000px;
        transform-style: preserve-3d;
      }
      .left-panel .bg { 
        position:absolute; 
        inset:0; 
        background-image:url('/images/f444684b69ba2248faad9fed8ae6d631b4cc0fbd.jpg'); 
        background-size:cover; 
        background-position:center; 
        filter:saturate(145%) contrast(112%) hue-rotate(5deg);
        animation: bgZoom 20s infinite ease-in-out;
        transform: translateZ(0);
      }
      @keyframes bgZoom {
        0%, 100% { transform: scale(1) translateZ(0); }
        50% { transform: scale(1.05) translateZ(0); }
      }
      .left-panel .overlay { 
        position:absolute; 
        inset:0; 
        background: linear-gradient(0deg, rgba(57,103,207,.14), rgba(57,103,207,.14)), linear-gradient(180deg, rgba(247,251,255,.58), rgba(225,239,255,.58));
        animation: overlayPulse 8s infinite ease-in-out;
        z-index: 1;
      }
      @keyframes overlayPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.95; }
      }

      /* Holographic Effects */
      .holographic-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          105deg,
          transparent 40%,
          rgba(255, 255, 255, 0.1) 45%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0.1) 55%,
          transparent 60%
        );
        background-size: 200% 200%;
        animation: holographicShimmer 3s infinite;
        z-index: 2;
        pointer-events: none;
        mix-blend-mode: overlay;
      }

      @keyframes holographicShimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .holographic-overlay {
        position: absolute;
        inset: 0;
        background: 
          linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(225deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          linear-gradient(45deg, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
        z-index: 2;
        pointer-events: none;
        animation: holographicShift 8s ease-in-out infinite;
      }

      @keyframes holographicShift {
        0%, 100% { 
          opacity: 0.6;
          transform: translateZ(0) scale(1);
        }
        50% { 
          opacity: 0.8;
          transform: translateZ(10px) scale(1.02);
        }
      }
      /* 3D Floating Shapes */
      .floating-3d-elements {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        transform-style: preserve-3d;
      }

      .shape-3d {
        position: absolute;
        width: 80px;
        height: 80px;
        transform-style: preserve-3d;
        animation: float3D 6s ease-in-out infinite;
      }

      .shape-1 {
        top: 15%;
        left: 10%;
        animation-delay: 0s;
        transform: rotateX(45deg) rotateY(45deg);
      }

      .shape-2 {
        top: 60%;
        right: 15%;
        animation-delay: 2s;
        transform: rotateX(-30deg) rotateY(-30deg);
      }

      .shape-3 {
        bottom: 20%;
        left: 20%;
        animation-delay: 4s;
        transform: rotateX(60deg) rotateY(60deg);
      }

      @keyframes float3D {
        0%, 100% {
          transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
        }
        33% {
          transform: translateY(-30px) rotateX(120deg) rotateY(120deg) rotateZ(30deg);
        }
        66% {
          transform: translateY(-15px) rotateX(240deg) rotateY(240deg) rotateZ(60deg);
        }
      }

      .shape-face {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(59, 130, 246, 0.3);
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
        backdrop-filter: blur(10px);
      }

      .shape-1 .shape-face.front { transform: rotateY(0deg) translateZ(40px); }
      .shape-1 .shape-face.back { transform: rotateY(180deg) translateZ(40px); }
      .shape-1 .shape-face.right { transform: rotateY(90deg) translateZ(40px); }
      .shape-1 .shape-face.left { transform: rotateY(-90deg) translateZ(40px); }
      .shape-1 .shape-face.top { transform: rotateX(90deg) translateZ(40px); }
      .shape-1 .shape-face.bottom { transform: rotateX(-90deg) translateZ(40px); }

      .shape-2 .shape-face.front { transform: rotateY(0deg) translateZ(40px); }
      .shape-2 .shape-face.back { transform: rotateY(180deg) translateZ(40px); }
      .shape-2 .shape-face.right { transform: rotateY(90deg) translateZ(40px); }
      .shape-2 .shape-face.left { transform: rotateY(-90deg) translateZ(40px); }
      .shape-2 .shape-face.top { transform: rotateX(90deg) translateZ(40px); }
      .shape-2 .shape-face.bottom { transform: rotateX(-90deg) translateZ(40px); }

      .shape-3 .shape-face.front { transform: rotateY(0deg) translateZ(40px); }
      .shape-3 .shape-face.back { transform: rotateY(180deg) translateZ(40px); }
      .shape-3 .shape-face.right { transform: rotateY(90deg) translateZ(40px); }
      .shape-3 .shape-face.left { transform: rotateY(-90deg) translateZ(40px); }
      .shape-3 .shape-face.top { transform: rotateX(90deg) translateZ(40px); }
      .shape-3 .shape-face.bottom { transform: rotateX(-90deg) translateZ(40px); }

      /* Geometric Spheres */
      .geometric-sphere {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.2));
        border: 2px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
        box-shadow: 
          0 0 30px rgba(59, 130, 246, 0.3),
          inset -20px -20px 40px rgba(0, 0, 0, 0.2);
        animation: sphereFloat 8s ease-in-out infinite;
      }

      .sphere-1 {
        width: 120px;
        height: 120px;
        top: 25%;
        right: 20%;
        animation-delay: 0s;
      }

      .sphere-2 {
        width: 90px;
        height: 90px;
        bottom: 30%;
        left: 15%;
        animation-delay: 3s;
      }

      @keyframes sphereFloat {
        0%, 100% {
          transform: translateY(0) translateZ(0) scale(1);
        }
        50% {
          transform: translateY(-40px) translateZ(20px) scale(1.1);
        }
      }

      /* Geometric Rings */
      .geometric-ring {
        position: absolute;
        border-radius: 50%;
        border: 3px solid;
        border-color: rgba(59, 130, 246, 0.4);
        background: transparent;
        box-shadow: 
          0 0 20px rgba(59, 130, 246, 0.3),
          inset 0 0 20px rgba(139, 92, 246, 0.2);
        animation: ringRotate 10s linear infinite;
      }

      .ring-1 {
        width: 100px;
        height: 100px;
        top: 45%;
        left: 25%;
        animation-delay: 0s;
      }

      .ring-2 {
        width: 70px;
        height: 70px;
        bottom: 15%;
        right: 25%;
        animation-delay: 2s;
      }

      @keyframes ringRotate {
        0% {
          transform: rotateZ(0deg) translateZ(0);
        }
        100% {
          transform: rotateZ(360deg) translateZ(0);
        }
      }

      /* Educational Icons */
      .educational-icons {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }

      .edu-icon {
        position: absolute;
        font-size: 48px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
        animation: iconFloat 6s ease-in-out infinite;
        opacity: 0.7;
      }

      .icon-1 { top: 10%; left: 15%; animation-delay: 0s; }
      .icon-2 { top: 20%; right: 20%; animation-delay: 0.8s; }
      .icon-3 { top: 40%; left: 8%; animation-delay: 1.6s; }
      .icon-4 { top: 50%; right: 12%; animation-delay: 2.4s; }
      .icon-5 { bottom: 35%; left: 18%; animation-delay: 3.2s; }
      .icon-6 { bottom: 25%; right: 18%; animation-delay: 4s; }
      .icon-7 { top: 65%; left: 12%; animation-delay: 4.8s; }
      .icon-8 { bottom: 10%; right: 10%; animation-delay: 5.6s; }

      @keyframes iconFloat {
        0%, 100% {
          transform: translateY(0) translateZ(0) rotateZ(0deg) scale(1);
        }
        50% {
          transform: translateY(-20px) translateZ(10px) rotateZ(5deg) scale(1.1);
        }
      }

      .brand { 
        position:relative; 
        z-index:3; 
        padding:3.25rem; 
        height:100%; 
        display:flex; 
        flex-direction:column; 
        justify-content:center;
        animation: fadeInLeft 0.8s ease;
        transform: translateZ(20px);
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
      .brand h2 { 
        color:#2b2b2b; 
        font-weight:700; 
        margin:0 0 .35rem 0; 
        opacity:.95;
        animation: fadeInUp 0.8s ease 0.2s both;
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
      .brand h1 { 
        font-size:76px; 
        line-height:1; 
        color:#16376f; 
        letter-spacing:.5px; 
        margin:.15rem 0 .65rem; 
        font-weight:800; 
        text-shadow:
          0 2px 0 rgba(255,255,255,.35),
          0 0 30px rgba(59, 130, 246, 0.3),
          0 0 60px rgba(139, 92, 246, 0.2);
        background: linear-gradient(135deg, #16376f 0%, #1e3a8a 50%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        background-size: 200% 200%;
        animation: fadeInUp 0.8s ease 0.4s both, holographicText 3s ease-in-out infinite;
        position: relative;
        transform: translateZ(30px);
      }

      @keyframes holographicText {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .brand p { 
        color:#34495e; 
        font-weight:600; 
        opacity:.85;
        animation: fadeInUp 0.8s ease 0.6s both;
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
        max-width:420px; 
        margin:0 auto; 
        width:100%;
        position: relative;
        z-index: 1;
      }

      .input-group {
        animation: fadeInUp 0.6s ease both;
      }

      .input-group:nth-child(1) { animation-delay: 0.1s; }
      .input-group:nth-child(2) { animation-delay: 0.2s; }

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

      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: -0.5rem;
        font-size: 14px;
      }

      .remember-me {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #6b7280;
        font-weight: 500;
        position: relative;
      }

      .remember-me input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        opacity: 0;
        position: absolute;
      }

      .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid #d1d5db;
        border-radius: 4px;
        position: relative;
        transition: all 0.3s ease;
        background: white;
      }

      .remember-me input[type="checkbox"]:checked + .checkmark {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-color: #3b82f6;
      }

      .remember-me input[type="checkbox"]:checked + .checkmark::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
      }

      .forgot-password {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .forgot-password:hover {
        color: #2563eb;
        text-decoration: underline;
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

      .alt-actions { 
        display:flex; 
        align-items:center; 
        gap:.5rem; 
        justify-content:center; 
        margin-top:1.5rem; 
        color:#6b7280;
        font-size: 14px;
      }

      .alt-actions .link { 
        color:#3b82f6; 
        font-weight:700; 
        text-decoration:none;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
      }

      .alt-actions .link:hover { 
        color: #2563eb;
        gap: 8px;
      }

      .alt-actions .link svg {
        transition: transform 0.3s ease;
      }

      .alt-actions .link:hover svg {
        transform: translateX(2px);
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
      @media (max-width: 980px) { .auth-container { grid-template-columns: 1fr; min-height: 70vh; margin:1rem; } .left-panel { display:none; } .auth-container::before{display:none;} .form{max-width:100%;} }
      `}</style>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[100] space-y-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default Login;



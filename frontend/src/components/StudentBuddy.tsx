import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import BuddyModelViewer from './BuddyModelViewer';

const StudentBuddy: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'buddy', text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentAnim, setCurrentAnim] = useState('Wave');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [buddyPosition, setBuddyPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 420 });
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 660, y: window.innerHeight - 520 });
  const [isDraggingBuddy, setIsDraggingBuddy] = useState(false);
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [greetingText, setGreetingText] = useState('Hello! How are you doing today?');

  // AI Integration State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [availableLessons, setAvailableLessons] = useState<{ id: string, title: string }[]>([]);
  const [showLessonSelector, setShowLessonSelector] = useState(false);

  const location = useLocation();

  const allowedStudentPaths = useMemo(
    () => ['/home', '/channels', '/video', '/organization'],
    []
  );

  const ANIMATION_LIST = ['Normal Pose', 'Wave', 'Walking', 'Rumba Dance', 'Stretching', 'T Pose'];

  // Check role and active status
  const checkState = useMemo(
    () => () => {
      try {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
          setShouldShow(false);
          return;
        }
        const parsed = JSON.parse(rawUser);
        const roleOk = parsed?.role === 'student';

        const active = localStorage.getItem('buddy_active') === 'true';
        const savedConfig = JSON.parse(localStorage.getItem('user_buddy_config') || '{}');

        setShouldShow(roleOk);
        setIsActive(active);
        setConfig(savedConfig);
        if (active) {
          setCurrentAnim('Wave'); // Reset to wave on activation
          setIsModelLoaded(false); // Reset load state
        }
      } catch {
        setShouldShow(false);
      }
    },
    []
  );

  useEffect(() => {
    checkState();
    window.addEventListener('storage', checkState);
    return () => window.removeEventListener('storage', checkState);
  }, [checkState]);

  // Handle Lesson Changes (for AI Context)
  useEffect(() => {
    const handleLessonChange = () => {
      const lessonId = localStorage.getItem('current_lesson_id');
      if (lessonId !== currentLessonId) {
        console.log('Lesson changed:', lessonId);
        setCurrentLessonId(lessonId);
        if (lessonId) {
          startSession(lessonId);
        } else {
          setSessionId(null);
        }
      }
    };

    window.addEventListener('lesson_change', handleLessonChange);
    // Also check on mount/update
    handleLessonChange();

    return () => window.removeEventListener('lesson_change', handleLessonChange);
    return () => window.removeEventListener('lesson_change', handleLessonChange);
  }, [currentLessonId]);

  // Handle Available Lessons Update
  useEffect(() => {
    const updateLessons = () => {
      try {
        const lessonsStr = localStorage.getItem('current_course_lessons');
        if (lessonsStr) {
          setAvailableLessons(JSON.parse(lessonsStr));
        } else {
          setAvailableLessons([]);
        }
      } catch (e) {
        console.error('Failed to parse lessons:', e);
      }
    };

    window.addEventListener('course_lessons_update', updateLessons);
    updateLessons(); // Initial check

    return () => window.removeEventListener('course_lessons_update', updateLessons);
  }, []);

  const startSession = async (lessonId: string) => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;

      console.log('Starting AI session for lesson:', lessonId);
      const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/buddy/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id || user._id,
          lessonId: lessonId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        console.log('Buddy session started:', data.sessionId);

        // Add a greeting from the AI
        setMessages(prev => [...prev, {
          role: 'buddy',
          text: "I've reviewed the document for this lesson. Feel free to ask me any questions about it!"
        }]);
      } else {
        console.error('Failed to start session:', await res.text());
      }
    } catch (error) {
      console.error('Failed to start buddy session:', error);
    }
  };

  // Handle Model Load
  const handleModelLoaded = useCallback(() => {
    setIsModelLoaded(true);
  }, []);

  // Greeting & Animation (Triggered after load)
  useEffect(() => {
    if (isActive && shouldShow && isModelLoaded) {
      // Delay slightly to ensure smooth entrance
      const timer = setTimeout(() => {
        // Get user info
        const userStr = localStorage.getItem('user');
        let userName = 'there';
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userName = user.name || user.fullName || 'there';
          } catch (e) {
            userName = 'there';
          }
        }

        // Get buddy name
        const buddyName = config?.buddyName || 'Buddy';

        // Create personalized greeting
        const newGreetingText = `Hello! My name is ${buddyName}. What can I do for you, ${userName}?`;
        setGreetingText(newGreetingText); // Update state for bubble

        // Show bubble
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 6000); // Hide after 6s

        // Speak with sweet female voice
        if ('speechSynthesis' in window) {
          const speak = () => {
            const utterance = new SpeechSynthesisUtterance(newGreetingText);
            const voices = window.speechSynthesis.getVoices();

            const preferredVoice = voices.find(v => v.name.includes('Zira')) ||
              voices.find(v => v.name.includes('Google US English')) ||
              voices.find(v => v.name.includes('Female'));

            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }

            utterance.pitch = 1.2;
            utterance.rate = 1.05;

            window.speechSynthesis.speak(utterance);
          };

          if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speak;
          } else {
            speak();
          }
        }

        // Stop waving after 4 seconds (approx speech duration)
        setTimeout(() => {
          setCurrentAnim('Normal Pose');
        }, 4000);

      }, 1000); // 1s delay after load

      return () => clearTimeout(timer);
    }
  }, [isActive, shouldShow, isModelLoaded]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Auto-close buddy when navigating to /buddy page
  useEffect(() => {
    if (location.pathname === '/buddy' && isActive) {
      localStorage.setItem('buddy_active', 'false');
      window.dispatchEvent(new Event('storage'));
      setIsActive(false);
    }
  }, [location.pathname, isActive]);

  // Dragging handlers for buddy
  const handleBuddyMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDraggingBuddy(true);
    setDragOffset({
      x: e.clientX - buddyPosition.x,
      y: e.clientY - buddyPosition.y
    });
  };

  // Dragging handlers for chat
  const handleChatMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDraggingChat(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
  };

  // Global mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingBuddy) {
        const newBuddyX = e.clientX - dragOffset.x;
        const newBuddyY = e.clientY - dragOffset.y;

        setBuddyPosition({
          x: newBuddyX,
          y: newBuddyY
        });
        // Update chat position to stay on the left of buddy
        setChatPosition({
          x: newBuddyX - 340, // 320px chat width + 20px gap
          y: newBuddyY - 100 // Slightly higher than buddy
        });
      } else if (isDraggingChat) {
        setChatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingBuddy(false);
      setIsDraggingChat(false);
    };

    if (isDraggingBuddy || isDraggingChat) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBuddy, isDraggingChat, dragOffset]);

  const isOnStudentPage = useMemo(
    () => allowedStudentPaths.some((path) => location.pathname.startsWith(path)),
    [allowedStudentPaths, location.pathname]
  );

  if (!shouldShow || !isOnStudentPage || !isActive) {
    return null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    const newMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(newMessages);
    setInputText('');

    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const BUDDY_CHAT_ENDPOINT = `${BASE_URL}/api/buddy/chat`;

    try {
      const response = await fetch(BUDDY_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          userId: JSON.parse(localStorage.getItem('user') || '{}').id,
          buddyConfig: config,
          sessionId: sessionId // Include the session ID if available
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'buddy',
          text: data.response || "I received your message!"
        }]);
      } else {
        console.error('Backend error:', response.status);
        // Fallback or error message
        setMessages(prev => [...prev, {
          role: 'buddy',
          text: "I'm having trouble connecting to my brain right now. Please try again later."
        }]);
      }
    } catch (error) {
      console.error('Buddy chat error:', error);
      setMessages(prev => [...prev, {
        role: 'buddy',
        text: "Connection error. Please check your internet connection."
      }]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent window click from closing immediately
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div className="buddy-overlay-container">
        {/* Chat Panel */}
        {isChatVisible && (
          <div
            className="chat-panel"
            style={{
              left: `${chatPosition.x}px`,
              top: `${chatPosition.y}px`,
              cursor: isDraggingChat ? 'grabbing' : 'default'
            }}
          >
            <div
              className="chat-header"
              onMouseDown={handleChatMouseDown}
              style={{ cursor: isDraggingChat ? 'grabbing' : 'grab' }}
            >
              <span>💬 Chat with {config?.buddyName || 'Buddy'}</span>
              {availableLessons.length > 0 && (
                <button
                  onClick={() => setShowLessonSelector(!showLessonSelector)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '0.8rem'
                  }}
                >
                  {showLessonSelector ? 'Close' : '📚'}
                </button>
              )}
            </div>

            {/* Lesson Selector Dropdown */}
            {showLessonSelector && availableLessons.length > 0 && (
              <div className="lesson-selector">
                <div className="lesson-selector-header">Select a Lesson Context:</div>
                {availableLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${currentLessonId === lesson.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentLessonId(lesson.id);
                      localStorage.setItem('current_lesson_id', lesson.id);
                      startSession(lesson.id);
                      setShowLessonSelector(false);
                    }}
                  >
                    {lesson.title}
                    {currentLessonId === lesson.id && ' ✓'}
                  </div>
                ))}
              </div>
            )}

            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <strong>{msg.role === 'user' ? 'You' : config?.buddyName || 'Buddy'}:</strong> {msg.text}
                </div>
              ))}
              {messages.length === 0 && <p className="empty-chat">Start a conversation!</p>}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </div>
        )}

        {/* 3D Model Overlay */}
        <div
          className="buddy-model-wrapper"
          onContextMenu={handleContextMenu}
          onMouseDown={handleBuddyMouseDown}
          title="Drag to move | Right-click for animations"
          style={{
            left: `${buddyPosition.x}px`,
            top: `${buddyPosition.y}px`,
            cursor: isDraggingBuddy ? 'grabbing' : 'grab'
          }}
        >
          {/* Speech Bubble */}
          {showBubble && (
            <div className="buddy-bubble">
              {greetingText}
              <div className="buddy-bubble-arrow"></div>
            </div>
          )}

          <BuddyModelViewer
            modelPath={config?.modelPath || '/studybuddy/female buddy/hi4.glb'}
            animationName={currentAnim}
            className="buddy-canvas"
            autoRotate={false}
            showDebug={false}
            onAnimationsLoaded={handleModelLoaded}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="anim-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-header">Animations</div>
          {ANIMATION_LIST.map(anim => (
            <div
              key={anim}
              className={`menu-item ${currentAnim === anim ? 'active' : ''}`}
              onClick={() => {
                setCurrentAnim(anim);
                setContextMenu(null);
              }}
            >
              {anim}
            </div>
          ))}
          <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }}></div>
          <div className="menu-divider"></div>
          <div
            className="menu-item"
            onClick={() => {
              setIsChatVisible(!isChatVisible);
              setContextMenu(null);
            }}
          >
            {isChatVisible ? 'Hide Chat' : 'Show Chat'}
          </div>
          <div
            className="menu-item menu-item-danger"
            onClick={() => {
              localStorage.setItem('buddy_active', 'false');
              window.dispatchEvent(new Event('storage'));
              setIsActive(false);
              setContextMenu(null);
            }}
          >
            Close Buddy
          </div>
        </div >
      )}

      <style>{`
        .buddy-overlay-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 50;
          pointer-events: none;
        }

        .buddy-model-wrapper {
          width: 280px;
          height: 380px;
          position: fixed;
          pointer-events: auto;
          user-select: none;
          z-index: 51;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .buddy-canvas {
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .buddy-bubble {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 12px 18px;
          border-radius: 18px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          z-index: 60;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-size: 0.95rem;
          pointer-events: none;
        }

        .buddy-bubble-arrow {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: white;
          clip-path: polygon(0 0, 100% 0, 50% 100%);
        }

        @keyframes popIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.5); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        .chat-panel {
          position: fixed;
          width: 320px;
          height: 480px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          pointer-events: auto;
          user-select: none;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: 600;
          color: white;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .lesson-selector {
          background: rgba(255, 255, 255, 0.95);
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          max-height: 150px;
          overflow-y: auto;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lesson-selector-header {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
          padding-left: 4px;
        }

        .lesson-item {
          padding: 6px 10px;
          font-size: 0.85rem;
          color: #334155;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.1s;
        }

        .lesson-item:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .lesson-item.active {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 600;
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
        }

        .chat-message {
          padding: 10px 14px;
          border-radius: 16px;
          max-width: 85%;
          font-size: 0.9rem;
          line-height: 1.5;
          color: white;
        }

        .chat-message.user {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .chat-message.buddy {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .empty-chat {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          margin-top: 20px;
          margin-bottom: auto;
          font-size: 0.85rem;
        }

        .chat-input {
          padding: 10px;
          border-top: 1px solid rgba(226, 232, 240, 0.8);
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.8);
        }

        .chat-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          outline: none;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
        }
        
        .chat-input input:focus {
          border-color: #3b82f6;
        }

        .chat-input button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }
        
        .chat-input button:hover {
          background: #2563eb;
        }

        /* Context Menu Styles */
        .anim-context-menu {
            position: fixed;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 8px;
            z-index: 100;
            min-width: 160px;
            border: 1px solid #e2e8f0;
            animation: fadeIn 0.1s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .menu-header {
            padding: 8px 12px;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #f1f5f9;
            margin-bottom: 4px;
        }

        .menu-item {
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            color: #334155;
            transition: all 0.1s;
        }

        .menu-item:hover {
            background: #f1f5f9;
            color: #0f172a;
        }

        .menu-item.active {
            background: #eff6ff;
            color: #2563eb;
            font-weight: 500;
        }
      `}</style>
    </>
  );
};

export default StudentBuddy;

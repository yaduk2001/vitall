import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';
import ContinueWatchingCard, { ContinueWatchingItem } from '../components/dashboard/ContinueWatchingCard';
import CourseCard, { Course } from '../components/dashboard/CourseCard';
import SubscriptionRow from '../components/dashboard/SubscriptionRow';
import ContentCard from '../components/dashboard/ContentCard';
import NotificationBell from '../components/dashboard/NotificationBell';
import MobileSidebar from '../components/MobileSidebar';

// Type definitions (minimal/shared)
type Channel = { tutorId: string; name: string };
type Notification = {
  id: string;
  studentId: string;
  tutorId: string;
  type: 'new_course' | 'new_video';
  title: string;
  message: string;
  contentId: string;
  isRead: boolean;
  createdAt: string;
};

const Home: React.FC = () => {
  const BASE_URL = useMemo(() => (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000', []);

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [contentList, setContentList] = useState<any[]>([]);
  const [myLearning, setMyLearning] = useState<Course[]>([]);
  const [subs, setSubs] = useState<Channel[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Voice
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<any>(null);

  // Filters
  const [filter, setFilter] = useState<'all' | 'mathematics' | 'science' | 'art' | 'tech'>('all');

  // Helpers
  function getUser() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }

  // Auth Validation
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('token');
      const user = getUser();
      if (!token || !user) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setIsAuthenticated(true);
          setCurrentUser(await res.json());
        }
      } catch (e) {
        // Fallback to local user if network fails slightly, or force logout
        setIsAuthenticated(true);
        setCurrentUser(user);
      }
    };
    validateAuth();
  }, [BASE_URL]);

  // Data Loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Fetch main courses (Recommended)
        const coursesRes = await fetch(`${BASE_URL}/api/courses`);
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);

        // 2. Fetch User-Specific Data if logged in
        if (isAuthenticated && currentUser?.role === 'student') {
          // Continue Watching
          const cwRes = await fetch(`${BASE_URL}/api/continue-watching/${currentUser.id || currentUser._id}?limit=4`);
          if (cwRes.ok) {
            const cwData = await cwRes.json();
            setContinueWatching(cwData.continueWatching || []);
          }

          // Subscriptions
          const subRes = await fetch(`${BASE_URL}/api/subscriptions/by-student/${currentUser.id || currentUser._id}`);
          if (subRes.ok) {
            const subData = await subRes.json();
            // For each sub, fetch channel details (simplified for demo, ideally backend returns expanded)
            const subList = subData.subscriptions || [];
            const channels: Channel[] = [];
            for (const s of subList) {
              const chRes = await fetch(`${BASE_URL}/api/channels/${s.tutorId}`);
              if (chRes.ok) {
                const chData = await chRes.json();
                if (chData.channel) channels.push(chData.channel);
              }
            }
            setSubs(channels);
          }

          // Fetch My Learning (Enrolled Courses)
          const myLearningRes = await fetch(`${BASE_URL}/api/enrollments/my-learning/${currentUser.id || currentUser._id}`);
          if (myLearningRes.ok) {
            const mlData = await myLearningRes.json();
            setMyLearning(mlData.courses || []);
          }
        }

        // 3. Fetch Creator Content (Public)
        const contentRes = await fetch(`${BASE_URL}/api/content`);
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContentList(contentData.content || []);
        }
      } catch (e) {
        console.error('Data load error:', e);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated !== null) { // Wait for auth check to finish potentially
      loadData();
    }
  }, [BASE_URL, isAuthenticated, currentUser]);

  // Voice Search Setup
  const listeningRef = useRef<boolean>(false);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setHasSpeech(true);
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true; // Use interim results for smoother feedback
      rec.lang = 'en-US';

      rec.onstart = () => {
        listeningRef.current = true;
        if (voiceBtnRef.current) {
          voiceBtnRef.current.classList.add('text-red-600', 'scale-110');
          // Add a pulsing ring effect if possible, or just color change
        }
      };

      rec.onend = () => {
        listeningRef.current = false;
        if (voiceBtnRef.current) {
          voiceBtnRef.current.classList.remove('text-red-600', 'scale-110');
        }
      };

      rec.onresult = (e: any) => {
        let transcript = '';
        const results = e.results;
        for (let i = 0; i < results.length; ++i) {
          transcript += results[i][0].transcript;
        }

        if (transcript) {
          setSearchQuery(transcript);
          handleSearch(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        listeningRef.current = false;
        if (voiceBtnRef.current) voiceBtnRef.current.classList.remove('text-red-600', 'scale-110');
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    try {
      if (listeningRef.current) {
        rec.stop();
      } else {
        rec.start();
      }
    } catch (e) {
      console.error("Voice toggle error:", e);
      // Reset state if error
      listeningRef.current = false;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const lower = query.toLowerCase();
    const results = courses.filter(c =>
      c.title.toLowerCase().includes(lower) ||
      c.description?.toLowerCase().includes(lower)
    );
    setSearchResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex font-sans text-gray-900">

      {/* Sidebar (Desktop) */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen z-30 transition-all duration-300">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6">
          <a href="/home" className="flex items-center space-x-3 group">
            <img src={logoImage} alt="Vital" className="w-10 h-10 rounded-xl shadow-sm group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden lg:block">Vital</span>
          </a>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {[
            { icon: 'fa-home', label: 'Dashboard', path: '/home', active: true },
            { icon: 'fa-compass', label: 'Explore', path: '/channels' },
            { icon: 'fa-play-circle', label: 'Subscriptions', path: '/subscriptions' },
            { icon: 'fa-book-open', label: 'My Learning', path: '/library' },
            { icon: 'fa-users', label: 'Community', path: '/community' },
            { icon: 'fa-robot', label: 'AI Buddy', path: '/buddy' },
          ].map(item => (
            <a key={item.label} href={item.path} className={`flex items-center lg:px-4 px-2 py-3.5 rounded-xl transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
              <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
              <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Mini Profile (Sidebar Footer) */}
        {isAuthenticated && currentUser && (
          <div className="p-4 border-t border-gray-50">
            <div className="flex items-center lg:space-x-3 justify-center lg:justify-start">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                  {currentUser.name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User'} Plan
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-4 md:px-6 flex items-center justify-between gap-4">

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 group-focus-within:text-blue-500 transition-colors hidden md:block"></i>
              </div>
              <input
                type="text"
                className="w-full pl-4 md:pl-11 pr-12 py-3 bg-gray-50 border-none rounded-2xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-sm text-sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                ref={voiceBtnRef}
                onClick={toggleVoice}
                className={`absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors ${!hasSpeech && 'hidden'}`}
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>

            {/* Search Dropdown */}
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(c => (
                    <a key={c.id} href={`/video/${c.id}`} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url('${c.thumbnailUrl}')` }}></div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{c.title}</h4>
                        <p className="text-xs text-gray-500">Course</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No results found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-5 ml-6">
            {isAuthenticated ? (
              <>
                <NotificationBell user={currentUser} />
                <ProfileMenu />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 pb-24">

          {/* Hero / Welcome */}
          {/* Hero / Welcome - Authenticated Only */}
          {isAuthenticated && currentUser && !isSearching && (
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    Welcome Back {currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''} 👋
                  </h1>
                  <p className="text-gray-500 mt-2 font-medium">You're on a {currentUser.streak || 1}-day streak! Keep it up!</p>
                </div>

                {/* Streak Pill */}
                <div className="mt-4 md:mt-0 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full flex items-center space-x-2 text-orange-600 font-bold shadow-sm">
                  <i className="fas fa-fire animate-pulse"></i>
                  <span>{currentUser.streak || 1} Day Streak</span>
                </div>
              </div>

              {/* Continue Watching Carousel */}
              {continueWatching.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-history text-blue-500 mr-2"></i> Continue Learning
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                    {continueWatching.map(item => (
                      <div key={item.id} className="snap-start">
                        <ContinueWatchingCard item={item} baseUrl={BASE_URL} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Main Content Grid */}
          <section>
            {!isSearching && filter === 'all' && (
              <>
                {/* 1. Creator Content Section (Visible for 'user' and 'student' but prioritized for 'user') */}
                {(currentUser?.role === 'user' || !currentUser) && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-red-600">●</span> Fresh from Creators
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                      {loading ? (
                        [1, 2, 3, 4].map(n => <div key={n} className="aspect-video bg-gray-100 rounded-xl animate-pulse"></div>)
                      ) : (
                        contentList.map((item: any) => (
                          <ContentCard key={item._id} content={item} />
                        ))
                      )}
                      {contentList.length === 0 && !loading && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                          {!currentUser ? (
                            <>
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <i className="fas fa-lock text-2xl"></i>
                              </div>
                              <h3 className="text-lg font-bold text-gray-700 mb-2">Login Required</h3>
                              <p className="text-gray-500 max-w-sm">Sorry, no contents available for guest users. Please login to view more.</p>
                              <Link to="/login" className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                Login Now
                              </Link>
                            </>
                          ) : (
                            <p className="text-gray-400 text-sm">No creator content yet. Be the first to upload!</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Course Sections (Visible ONLY for 'student') */}
                {currentUser?.role === 'student' && (
                  <>
                    {/* My Learning (Enrolled Courses) */}
                    {myLearning.length > 0 && (
                      <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-gray-900">My Learning</h2>
                          <Link to="/library" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {myLearning.slice(0, 4).map(course => (
                            <CourseCard key={course.id} course={course} baseUrl={BASE_URL} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subscriptions Rows */}
                    {subs.length > 0 && (
                      <div className="mb-12">
                        {subs.map(sub => (
                          <SubscriptionRow key={sub.tutorId} channel={sub} baseUrl={BASE_URL} />
                        ))}
                      </div>
                    )}

                    {/* Recommended For You */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recommended Courses</h2>

                        {/* Simple Filter Pills */}
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                          {['All', 'Tech', 'Design', 'Business'].map(f => (
                            <button
                              key={f}
                              className="px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-100 hover:border-blue-200 hover:text-blue-600 bg-white transition-all whitespace-nowrap"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                          [1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <div key={n} className="aspect-video bg-gray-100 rounded-2xl animate-pulse"></div>
                          ))
                        ) : (
                          courses.map(course => (
                            <CourseCard key={course.id} course={course} baseUrl={BASE_URL} />
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={currentUser}
        links={[
          { icon: 'fa-home', label: 'Dashboard', path: '/home', active: true },
          { icon: 'fa-compass', label: 'Explore', path: '/channels' },
          { icon: 'fa-play-circle', label: 'Subscriptions', path: '/subscriptions' },
          { icon: 'fa-book-open', label: 'My Learning', path: '/library' },
          { icon: 'fa-users', label: 'Community', path: '/community' },
          { icon: 'fa-robot', label: 'AI Buddy', path: '/buddy' },
        ]}
      />
    </div>
  );
};

export default Home;

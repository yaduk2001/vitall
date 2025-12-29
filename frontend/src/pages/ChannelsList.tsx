import React, { useEffect, useState, useRef } from 'react';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';
import NotificationBell from '../components/dashboard/NotificationBell';

type Channel = {
  id: string;
  tutorId: string;
  name: string;
  organization?: string;
  description?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  coverUrl?: string;
  subscriberCount?: number;
  courseCount?: number;
  role?: string;
  creatorType?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
};

type User = {
  id: string;
  _id: string;
  role: string;
  name: string;
  email: string;
};

type Notification = {
  id: string;
  studentId: string;
  tutorId: string;
  type: 'new_course' | 'new_video';
  title: string;
  message: string;
  contentId: string;
  contentTitle: string;
  tutorName: string;
  isRead: boolean;
  createdAt: string;
};

const ChannelsList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'recommended' | 'liked' | 'history' | 'enrolled' | 'subscriptions'>('recommended');
  const [hasSpeech, setHasSpeech] = useState<boolean>(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef<boolean>(false);

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }

  // Validate authentication
  async function validateAuth() {
    const token = localStorage.getItem('token');
    const user = getUser();

    if (!token || !user) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setAuthLoading(false);
      return false;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setCurrentUser(data);
        setAuthLoading(false);
        return true;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      setIsAuthenticated(true);
      setCurrentUser(user);
      setAuthLoading(false);
      return true;
    }
  }

  useEffect(() => {
    const loadChannels = async () => {
      try {
        console.log('Loading channels from:', `${BASE_URL}/api/channels`);
        // Get all active channels
        const channelsRes = await fetch(`${BASE_URL}/api/channels`);

        console.log('Channels response status:', channelsRes.status);

        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          console.log('Channels data received:', channelsData);
          const channelsList = channelsData.channels || [];
          console.log('Number of channels found:', channelsList.length);

          // Get course counts for each channel
          const channelsWithCounts = await Promise.all(
            channelsList.map(async (channel: any) => {
              try {
                console.log(`Fetching courses for channel "${channel.name}" with tutorId:`, channel.tutorId);
                const coursesRes = await fetch(`${BASE_URL}/api/courses/by-tutor/${channel.tutorId}`);
                console.log(`Courses response status for ${channel.name}:`, coursesRes.status);

                if (coursesRes.ok) {
                  const coursesData = await coursesRes.json();
                  console.log(`Courses found for ${channel.name}:`, coursesData.courses?.length || 0);
                  console.log(`Course data sample:`, coursesData.courses?.[0] || 'No courses');

                  return {
                    ...channel,
                    courseCount: coursesData.courses?.length || 0
                  };
                } else {
                  console.error(`Failed to fetch courses for ${channel.name}:`, await coursesRes.text());
                  return { ...channel, courseCount: 0 };
                }
              } catch (e) {
                console.error(`Error fetching courses for ${channel.name}:`, e);
                return { ...channel, courseCount: 0 };
              }
            })
          );

          console.log('Channels with course counts:', channelsWithCounts);
          setChannels(channelsWithCounts);
        } else {
          const errorText = await channelsRes.text();
          console.error('Failed to load channels:', channelsRes.status, errorText);
        }
      } catch (e) {
        console.error('Failed to load channels:', e);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [BASE_URL]);

  // Load user subscriptions
  useEffect(() => {
    (async () => {
      await validateAuth();
      const user = getUser();
      if (!user || user.role !== 'student') return;

      try {
        const res = await fetch(`${BASE_URL}/api/subscriptions/by-student/${user.id || user._id}`);
        if (res.status === 401 || res.status === 403) {
          // Unauthorized - clear auth and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setCurrentUser(null);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const subs = data.subscriptions || [];
          setSubscriptions(subs.map((sub: any) => sub.tutorId));
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      }
    })();
  }, [BASE_URL]);

  // Voice search setup
  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setHasSpeech(true);
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recognitionRef.current = rec;
    rec.onstart = () => {
      listeningRef.current = true;
      if (voiceBtnRef.current) voiceBtnRef.current.classList.add('listening');
    };
    rec.onend = () => {
      listeningRef.current = false;
      if (voiceBtnRef.current) voiceBtnRef.current.classList.remove('listening');
    };
    rec.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript; else interimTranscript += res[0].transcript;
      }
      const combined = `${finalTranscript}${interimTranscript}`.trim();
      if (combined) {
        if (searchRef.current) searchRef.current.value = combined;
        setSearchTerm(combined);
      }
    };
    rec.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      listeningRef.current = false;
      if (voiceBtnRef.current) voiceBtnRef.current.classList.remove('listening');
    };
  }, []);

  function toggleVoice() {
    const rec = recognitionRef.current;
    if (!rec) return alert('Speech recognition is not supported in this browser.');
    try {
      if (listeningRef.current) rec.stop(); else rec.start();
    } catch (e) { console.error(e); }
  }


  const handleSubscribe = async (tutorId: string) => {
    const user = getUser();
    if (!user || user.role !== 'student') {
      alert('Please log in as a student to subscribe to channels.');
      return;
    }

    setSubscribing(tutorId);
    try {
      const res = await fetch(`${BASE_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user.id || user._id,
          tutorId: tutorId
        })
      });

      if (res.ok) {
        setSubscriptions(prev => [...prev, tutorId]);
        // Update subscriber count locally
        setChannels(prev => prev.map(channel =>
          channel.tutorId === tutorId
            ? { ...channel, subscriberCount: (channel.subscriberCount || 0) + 1 }
            : channel
        ));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (tutorId: string) => {
    const user = getUser();
    if (!user || user.role !== 'student') return;

    setSubscribing(tutorId);
    try {
      const res = await fetch(`${BASE_URL}/api/subscriptions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user.id || user._id,
          tutorId: tutorId
        })
      });

      if (res.ok) {
        setSubscriptions(prev => prev.filter(id => id !== tutorId));
        // Update subscriber count locally
        setChannels(prev => prev.map(channel =>
          channel.tutorId === tutorId
            ? { ...channel, subscriberCount: Math.max((channel.subscriberCount || 1) - 1, 0) }
            : channel
        ));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('Failed to unsubscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const filteredChannels = channels.filter(channel => {
    // Role-based filtering
    if (currentUser?.role === 'student') {
      // Students see Tutors (Organizations)
      if (channel.role !== 'organization') return false;
    } else {
      // Users and Anonymous see Content Creators
      // If the channel is a Tutor/Organization, hide it
      if (channel.role === 'organization') return false;
    }

    // Text search filtering
    return (
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (channel.organization && channel.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleChannelClick = (tutorId: string) => {
    window.location.href = `/organization/${tutorId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">

      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen z-30 flex-shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <a href="/home" className="flex items-center gap-3">
            <img src={logoImage} alt="Vital" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Vital</span>
          </a>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <a href="/home" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <i className="fas fa-home"></i>
            </div>
            Dashboard
          </a>
          <a href="/channels" className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl transition-all font-semibold shadow-sm shadow-blue-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <i className="fas fa-compass"></i>
            </div>
            Explore
          </a>
          <a href="/subscriptions" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <i className="fas fa-play-circle"></i>
            </div>
            Subscriptions
          </a>
          <a href="/library" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <i className="fas fa-book-open"></i>
            </div>
            My Learning
          </a>
          <a href="/community" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all group font-medium">
            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <i className="fas fa-users"></i>
            </div>
            Community
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-4 md:px-8 flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <div className="relative group max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
              </div>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                className="w-full pl-11 pr-12 py-2.5 bg-gray-50 border-none rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                placeholder="Search channels, tutors..."
              />
              <button
                ref={voiceBtnRef}
                onClick={toggleVoice}
                disabled={!hasSpeech}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${hasSpeech ? 'text-gray-400 hover:text-blue-600 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell user={currentUser} />

            {(() => {
              if (authLoading) return <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>;
              if (isAuthenticated && currentUser) return <ProfileMenu user={currentUser} />;
              return (
                <a href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-blue-200">
                  Sign in
                </a>
              );
            })()}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* Discover Section Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 mb-10 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase border border-white/10">Discover</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Channels</h1>
                <p className="text-indigo-100 max-w-xl text-lg opacity-90">
                  {currentUser ?
                    `Welcome back, ${currentUser.name || 'Creator'}! Discover new content.` :
                    "Welcome Guest! content related for Creators are visible for you, Login to get more features."
                  }
                </p>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px] text-center border border-white/10">
                  <div className="text-3xl font-bold">{filteredChannels.length}</div>
                  <div className="text-xs font-medium uppercase tracking-wide opacity-80">Channels</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 min-w-[120px] text-center border border-white/10">
                  <div className="text-3xl font-bold">{filteredChannels.reduce((sum, ch) => sum + (ch.courseCount || 0), 0)}</div>
                  <div className="text-xs font-medium uppercase tracking-wide opacity-80">Courses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Channels Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Discovering channels...</p>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No channels found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {searchTerm ? `We couldn't find any channels matching "${searchTerm}".` : "There are no channels available right now."}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-blue-600 font-semibold hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredChannels.map((channel, index) => (
                <div
                  key={channel.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Banner */}
                  <div className={`h-24 w-full bg-gradient-to-r relative ${channel.bannerUrl ? '' : 'from-blue-500 to-indigo-600'}`}>
                    {channel.bannerUrl && (
                      <img src={channel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>

                  {/* Card Content */}
                  <div className="px-6 pt-0 pb-6 flex-1 flex flex-col relative">
                    {/* Floating Avatar */}
                    <div className="-mt-10 mb-3 flex justify-between items-end">
                      <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
                        <img
                          src={channel.avatarUrl || `https://ui-avatars.com/api/?name=${channel.name}&background=random`}
                          alt={channel.name}
                          className="w-full h-full rounded-xl object-cover bg-gray-100"
                        />
                      </div>
                      {/* Action Button (Top) */}
                      <button
                        onClick={() => handleChannelClick(channel.tutorId)}
                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors mb-2"
                      >
                        <i className="fas fa-arrow-right -rotate-45"></i>
                      </button>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {channel.name}
                      </h3>
                      {channel.organization && (
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                          {channel.organization}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                        {channel.description || "No description available for this channel."}
                      </p>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex gap-2 mb-6">
                      <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <i className="fas fa-users text-gray-400"></i>
                        {formatSubscriberCount(channel.subscriberCount || 0)}
                      </div>
                      <div className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <i className="fas fa-book-open text-gray-400"></i>
                        {channel.courseCount || 0} Courses
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-auto">
                      {subscriptions.includes(channel.tutorId) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnsubscribe(channel.tutorId); }}
                          disabled={subscribing === channel.tutorId}
                          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          {subscribing === channel.tutorId ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <><span>Subscribed</span><i className="fas fa-check text-xs"></i></>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSubscribe(channel.tutorId); }}
                          disabled={subscribing === channel.tutorId}
                          className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-blue-600 shadow-md shadow-gray-200 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                          {subscribing === channel.tutorId ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            'Subscribe'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default ChannelsList;

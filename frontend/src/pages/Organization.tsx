import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const Organization: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'about'>('courses');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2 3 3 7-7 3 3 3-3v12H3z', type: 'route', href: '/home' },
      { id: 'hero', label: 'Overview', icon: 'M4 6h16v12H4z', type: 'internal' },
      { id: 'courses', label: 'Courses', icon: 'M9 18V5l12 6-12 6z', type: 'internal' },
      { id: 'about', label: 'About', icon: 'M12 3v18m9-9H3', type: 'internal' },
      {
        id: 'certificates',
        label: 'Certificates',
        icon: 'M6 4h12v14l-6-3-6 3z',
        type: 'route',
        href: id ? `/organization/${id}/certificates` : '/home',
      },
      { id: 'library', label: 'Library', icon: 'M5 4h14v4H5z M5 10h14v10H5z', type: 'internal' },
    ],
    [id]
  );

  const getInitials = (value: string | undefined | null) => {
    if (!value) return 'GU';
    const parts = value.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('');
    return initials || value.slice(0, 2).toUpperCase();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: (typeof navItems)[number]) => {
    if (item.type === 'route') return;
    e.preventDefault();
    const el = document.getElementById(item.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    (async function run() {
      const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const tutorId = String(id || '');
      const userJson = localStorage.getItem('user');
      let currentUser: any = null;
      try {
        currentUser = userJson ? JSON.parse(userJson) : null;
      } catch {}

      const updateEnrollmentButtonStates = async () => {
        if (!currentUser || currentUser.role !== 'student') return;
        try {
          const enrollRes = await fetch(`${BASE_URL}/api/enrollments/by-student/${currentUser.id || currentUser._id}`);
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            const enrolledCourseIds = enrollData.enrollments?.map((enr: any) => enr.courseId) || [];
            const enrollButtons = document.querySelectorAll('[data-enroll]');
            enrollButtons.forEach((btn) => {
              const courseId = btn.getAttribute('data-course-id');
              if (enrolledCourseIds.includes(courseId)) {
                btn.textContent = 'Enrolled';
                btn.className = 'enroll-btn enrolled';
                (btn as HTMLButtonElement).disabled = true;
              }
            });
          }
        } catch (e) {
          console.error('Error checking existing enrollments:', e);
        }
      };

      try {
        const res = await fetch(`${BASE_URL}/api/channels/${tutorId}`);
        let subscribed = false;
        if (currentUser && currentUser.role === 'student') {
          try {
            const subRes = await fetch(`${BASE_URL}/api/subscriptions/by-student/${currentUser.id || currentUser._id}`);
            if (subRes.ok) {
              const { subscriptions } = await subRes.json();
              subscribed = subscriptions.some((sub: any) => sub.tutorId === tutorId);
            }
          } catch (e) {
            console.error('Error checking subscription status:', e);
          }
        }
        if (res.ok) {
          const { channel } = await res.json();
          setChannel(channel);
          setIsSubscribed(subscribed);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Error fetching channel:', e);
        setLoading(false);
      }

      try {
        const res = await fetch(`${BASE_URL}/api/courses/by-tutor/${tutorId}`);
        const data = await res.json();
        const list = data.courses || [];
        setCourses(list);
        if (currentUser && currentUser.role === 'student') {
          setTimeout(() => updateEnrollmentButtonStates(), 100);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    })();
  }, [id]);

  useEffect(() => {
    const sectionIds = ['hero', 'courses', 'about', 'library'];
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          root: null,
          rootMargin: '-20% 0px -65% 0px',
          threshold: 0.2,
        }
      );
      observer.observe(node);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [channel, courses]);

  const handleEnroll = async (courseId: string) => {
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const userJson = localStorage.getItem('user');
    let currentUser: any = null;
    try {
      currentUser = userJson ? JSON.parse(userJson) : null;
    } catch {}

    if (!currentUser) {
      alert('Please login as student to enroll in courses');
      window.location.href = '/login';
      return;
    }

    if (currentUser.role !== 'student') {
      alert('Only students can enroll in courses');
      return;
    }

    try {
      const subRes = await fetch(`${BASE_URL}/api/subscriptions/by-student/${currentUser.id || currentUser._id}`);
      if (subRes.ok) {
        const { subscriptions } = await subRes.json();
        const isCurrentlySubscribed = subscriptions.some((sub: any) => sub.tutorId === id);
        if (!isCurrentlySubscribed) {
          alert('Please subscribe to this channel first before enrolling in courses.');
          return;
        }
      }
    } catch (e) {
      console.error('Error checking subscription for enrollment:', e);
    }

    try {
      const existingEnrollRes = await fetch(`${BASE_URL}/api/enrollments/by-student/${currentUser.id || currentUser._id}`);
      if (existingEnrollRes.ok) {
        const existingEnrollData = await existingEnrollRes.json();
        const isAlreadyEnrolled = existingEnrollData.enrollments?.some((enr: any) => enr.courseId === courseId);
        if (isAlreadyEnrolled) {
          alert('You are already enrolled in this course!');
          window.location.href = `/video/${courseId}`;
          return;
        }
      }
    } catch (e) {
      console.error('Error checking existing enrollment:', e);
    }

    try {
      const enrollRes = await fetch(`${BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentUser.id || currentUser._id, courseId })
      });
      if (enrollRes.ok) {
        const btn = document.querySelector(`[data-course-id="${courseId}"]`) as HTMLButtonElement;
        if (btn) {
          btn.textContent = 'Enrolled';
          btn.className = 'enroll-btn enrolled';
          btn.disabled = true;
        }
        alert('Enrolled successfully! Redirecting to course...');
        setTimeout(() => {
          window.location.href = `/video/${courseId}`;
        }, 1000);
      } else {
        const errorData = await enrollRes.json().catch(() => ({}));
        alert(`Enroll failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const userJson = localStorage.getItem('user');
    let currentUser: any = null;
    try {
      currentUser = userJson ? JSON.parse(userJson) : null;
    } catch {}

    if (!currentUser) {
      alert('Please login as a student to subscribe to this channel');
      window.location.href = '/login';
      return;
    }

    if (currentUser.role !== 'student') {
      alert('Only students can subscribe to channels');
      return;
    }

    setSubscribing(true);

    try {
      let res;
      if (isSubscribed) {
        res = await fetch(`${BASE_URL}/api/subscriptions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: currentUser.id || currentUser._id, tutorId: id })
        });
      } else {
        res = await fetch(`${BASE_URL}/api/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: currentUser.id || currentUser._id, tutorId: id })
        });
      }

      if (res.ok) {
        setIsSubscribed(!isSubscribed);
        if (isSubscribed) {
          alert('Successfully unsubscribed from this channel!');
        } else {
          alert('Successfully subscribed to this channel!');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`${isSubscribed ? 'Unsubscribe' : 'Subscribe'} failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(`Failed to ${isSubscribed ? 'unsubscribe' : 'subscribe'}. Please try again.`);
    } finally {
      setSubscribing(false);
    }
  };

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const currentUser = getUser();
  const canSubscribe = currentUser && currentUser.role === 'student';

  if (loading) {
    return (
      <div className="studio-shell">
        <div className="loading-panel">
          <div className="loading-spinner"></div>
          <p>Loading channel...</p>
        </div>
        <style>{`
          .studio-shell {
            min-height: 100vh;
            background: radial-gradient(circle at top left, #1f2937, #0f172a 45%, #020617);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .loading-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 32px 40px;
            border-radius: 24px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
          }
          .loading-spinner {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 3px solid rgba(148, 163, 184, 0.25);
            border-top-color: #38bdf8;
            animation: spin 0.9s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-panel p {
            margin: 0;
            font-weight: 500;
            letter-spacing: 0.02em;
          }
        `}</style>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="studio-shell">
        <div className="loading-panel">
          <h2>Channel not found</h2>
          <a href="/channels" className="primary-link">Back to Channels</a>
        </div>
        <style>{`
          .studio-shell {
            min-height: 100vh;
            background: radial-gradient(circle at top left, #1f2937, #0f172a 45%, #020617);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .loading-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 32px 40px;
            border-radius: 24px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
            text-align: center;
          }
          .loading-panel h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
          }
          .primary-link {
            display: inline-flex;
            gap: 10px;
            align-items: center;
            padding: 12px 22px;
            border-radius: 999px;
            background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
            color: white;
            text-decoration: none;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .primary-link:hover {
            filter: brightness(1.05);
          }
        `}</style>
      </div>
    );
  }

  const channelHandle = channel.name?.toLowerCase().replace(/\s+/g, '') || 'channel';

  return (
    <div className={`studio-shell ${navCollapsed ? 'nav-collapsed' : ''}`}>
      <div className="bg-atmosphere">
        <div className="glow-sphere sphere-1"></div>
        <div className="glow-sphere sphere-2"></div>
        <div className="glow-trail trail-1"></div>
        <div className="glow-trail trail-2"></div>
      </div>

      <header className="studio-topbar">
        <button
          className="nav-toggle"
          onClick={() => setNavCollapsed((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="topbar-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-copy">
            <span className="brand-title">Supe Learn</span>
            <span className="brand-sub">Creator Studio</span>
          </div>
        </div>
        <div className="topbar-search">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" placeholder="Search courses, channels, topics" />
          </div>
        </div>
        <div className="topbar-actions">
          <button className="topbar-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405C18.21 14.79 18 14.397 18 14V11a6 6 0 1 0-12 0v3c0 .397-.21.79-.595 1.595L4 17h5m2 4a2 2 0 0 0 4 0"></path>
            </svg>
          </button>
          <button className="topbar-btn" title="Upload">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
          <div className="user-avatar">
            <span>{getInitials(currentUser?.name || currentUser?.fullName || currentUser?.username || currentUser?.email || channel.name)}</span>
          </div>
        </div>
      </header>

      <aside className="studio-sidenav">
        <div className="sidenav-scroll">
          <div className="sidenav-section">
            <span className="section-label">Navigation</span>
            <nav>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href ? item.href : `#${item.id}`}
                  className={`nav-item ${item.type !== 'internal' ? '' : activeSection === item.id ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={item.icon}></path>
                  </svg>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
          <div className="sidenav-section">
            <span className="section-label">Quick Filters</span>
            <div className="quick-filters">
              <button>Live Streams</button>
              <button>Workshops</button>
              <button>Bootcamps</button>
              <button>Recorded</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="studio-main">
        <section className="channel-hero" id="hero">
          <div className="hero-content">
            <div className="hero-profile">
              <div className="profile-glow"></div>
              <img
                src={channel.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face&auto=format'}
                alt={channel.name}
              />
            </div>
            <div className="hero-details">
              <h1>{channel.name || 'Channel'}</h1>
              <div className="hero-meta">
                <span>@{channelHandle}</span>
                <span>•</span>
                <span>{channel.subscriberCount || 0} Subscribers</span>
                {channel.organization && (
                  <>
                    <span>•</span>
                    <span>{channel.organization}</span>
                  </>
                )}
              </div>
              <div className="hero-actions">
                {canSubscribe ? (
                  <button
                    className={`subscribe-pill ${isSubscribed ? 'subscribed' : ''}`}
                    onClick={handleSubscribe}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <span className="pill-loader"></span>
                    ) : isSubscribed ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        Subscribed
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14m7-7H5"></path>
                        </svg>
                        Subscribe
                      </>
                    )}
                  </button>
                ) : (
                  <a href="/login" className="subscribe-pill">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14m7-7H5"></path>
                    </svg>
                    Subscribe
                  </a>
                )}
                <button className="hero-icon-btn" title="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 21h4a2 2 0 0 1-4 0zm-7-3h18l-1.68-1.68A2 2 0 0 1 18 14.86V11a6 6 0 0 0-12 0v3.86a2 2 0 0 1-.32 1.14z"></path>
                  </svg>
                </button>
                <button className="hero-icon-btn" title="Share">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 12v7a1 1 0 0 0 1 1h7"></path>
                    <polyline points="14 3 21 3 21 10"></polyline>
                    <line x1="21" y1="3" x2="10" y2="14"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="hero-stats">
              <div>
                <span>{courses.length}</span>
                <label>Courses</label>
              </div>
              <div>
                <span>{courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0)}</span>
                <label>Modules</label>
              </div>
              <div>
                <span>4.9</span>
                <label>Average Rating</label>
              </div>
            </div>
          </div>
        </section>

        <section className="channel-tabs-strip" id="courses">
          <button
            className={`tab-chip ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <span>Courses</span>
            <em>{courses.length}</em>
          </button>
          <button
            className={`tab-chip ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <span>About</span>
          </button>
        </section>

        <section className="channel-content-area">
          {activeTab === 'courses' ? (
            courses.length === 0 ? (
              <div className="empty-illustration">
                <div className="empty-visual">
                  <div className="vector vector-a"></div>
                  <div className="vector vector-b"></div>
                  <div className="vector vector-c"></div>
                </div>
                <h3>No courses yet</h3>
                <p>This creator is working on exciting content. Check back soon!</p>
              </div>
            ) : (
              <div className="course-mosaic">
                {courses.map((course) => {
                  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                  const thumbnailUrl = course.thumbnailUrl
                    ? course.thumbnailUrl.startsWith('http')
                      ? course.thumbnailUrl
                      : course.thumbnailData
                        ? `${BASE_URL}/api/files/${course.id}/thumbnail`
                        : `${BASE_URL}${course.thumbnailUrl}`
                    : '';

                  return (
                    <article key={course.id} className="course-card">
                      <div className="card-media">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={course.title} />
                        ) : (
                          <div className="media-fallback">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                              <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                              <circle cx="9" cy="9" r="1.5"></circle>
                              <path d="M21 15l-5-5-11 11"></path>
                            </svg>
                          </div>
                        )}
                        <div className="media-overlay">
                          <a href={`/video/${course.id}`} className="overlay-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"></path>
                            </svg>
                            Watch preview
                          </a>
                          <span className="badge">{course.modules?.length || 0} modules</span>
                        </div>
                      </div>
                      <div className="card-body">
                        <a href={`/video/${course.id}`} className="course-title">{course.title}</a>
                        {course.description && (
                          <p className="course-snippet">{course.description.slice(0, 110)}...</p>
                        )}
                        <div className="card-footer">
                          <div className="course-meta">
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 12h18M3 6h18M3 18h10"></path>
                              </svg>
                              {course.category || 'Learning path'}
                            </span>
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 8v4l2.5 1.5"></path>
                                <circle cx="12" cy="12" r="9"></circle>
                              </svg>
                              {course.duration || 'Self-paced'}
                            </span>
                          </div>
                          {canSubscribe && (
                            <button
                              className="enroll-cta"
                              data-enroll={course.id}
                              data-course-id={course.id}
                              onClick={(e) => {
                                e.preventDefault();
                                handleEnroll(course.id);
                              }}
                            >
                              Enroll
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <div className="about-layout" id="about">
              <section className="about-card">
                <h3>Channel Story</h3>
                <p>{channel.description || channel.bio || 'No description provided for this channel.'}</p>
              </section>
              {(channel.socialLinks && (channel.socialLinks.website || channel.socialLinks.twitter || channel.socialLinks.linkedin || channel.socialLinks.youtube)) && (
                <section className="about-card">
                  <h3>Connect</h3>
                  <ul className="link-grid">
                    {channel.socialLinks.website && (
                      <li>
                        <a href={channel.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <span>Website</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </li>
                    )}
                    {channel.socialLinks.twitter && (
                      <li>
                        <a href={`https://twitter.com/${channel.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                          <span>Twitter</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                          </svg>
                        </a>
                      </li>
                    )}
                    {channel.socialLinks.linkedin && (
                      <li>
                        <a href={channel.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <span>LinkedIn</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"></path>
                            <circle cx="4" cy="4" r="2"></circle>
                          </svg>
                        </a>
                      </li>
                    )}
                    {channel.socialLinks.youtube && (
                      <li>
                        <a href={channel.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                          <span>YouTube</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff"></polygon>
                          </svg>
                        </a>
                      </li>
                    )}
                  </ul>
                </section>
              )}
              <section className="about-card stats">
                <h3>Channel Insights</h3>
                <div className="insights-grid">
                  <div>
                    <strong>{channel.subscriberCount || 0}</strong>
                    <span>Subscribers</span>
                  </div>
                  <div>
                    <strong>{courses.length}</strong>
                    <span>Courses</span>
                  </div>
                  <div>
                    <strong>{courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0)}</strong>
                    <span>Modules</span>
                  </div>
                  <div>
                    <strong>4.9</strong>
                    <span>Community Rating</span>
                  </div>
                </div>
              </section>
            </div>
          )}
          <section className="library-panel" id="library">
            <div className="library-card">
              <h3>Resource Library</h3>
              <p>Browse curated notes, slides, and assignments shared by this creator. More resources coming soon.</p>
              <button className="library-cta">Explore resources</button>
            </div>
          </section>
        </section>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }
        .studio-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto 1fr;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #0f172a;
          background:
            radial-gradient(circle at 5% 10%, rgba(191, 226, 255, 0.6), transparent 40%),
            radial-gradient(circle at 80% 0%, rgba(254, 215, 170, 0.5), transparent 45%),
            linear-gradient(135deg, #f8fafc 0%, #eef2ff 70%, #ffffff 100%);
          overflow: hidden;
          position: relative;
        }
        .studio-shell.nav-collapsed {
          grid-template-columns: 72px 1fr;
        }
        .bg-atmosphere {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .glow-sphere {
          position: absolute;
          border-radius: 999px;
          filter: blur(90px);
          opacity: 0.45;
          animation: float 16s ease-in-out infinite;
        }
        .sphere-1 {
          width: 420px;
          height: 420px;
          background: rgba(59, 130, 246, 0.25);
          top: -160px;
          left: -120px;
        }
        .sphere-2 {
          width: 360px;
          height: 360px;
          background: rgba(248, 113, 113, 0.25);
          bottom: -140px;
          right: -60px;
          animation-delay: 4s;
        }
        .glow-trail {
          position: absolute;
          width: 220px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.25), transparent);
          opacity: 0.8;
          animation: trailMove 12s linear infinite;
        }
        .trail-1 {
          top: 18%;
          left: 18%;
        }
        .trail-2 {
          bottom: 22%;
          right: 22%;
          animation-delay: 6s;
        }
        @keyframes float {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(30px, 40px, 0); }
        }
        @keyframes trailMove {
          0% { transform: translateX(-60px); opacity: 0; }
          20% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translateX(120px); opacity: 0; }
        }
        .studio-topbar {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 24px;
          align-items: center;
          padding: 16px 28px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(203, 213, 225, 0.6);
          position: sticky;
          top: 0;
          z-index: 5;
        }
        .nav-toggle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-toggle span {
          width: 18px;
          height: 2px;
          background: #e2e8f0;
          border-radius: 999px;
        }
        .nav-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.4);
        }
        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(244, 114, 182, 0.9));
          display: grid;
          place-items: center;
          font-size: 18px;
          color: white;
        }
        .brand-copy {
          display: flex;
          flex-direction: column;
          line-height: 1;
          color: #0f172a;
        }
        .brand-title {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .brand-sub {
          font-size: 11px;
          color: rgba(100, 116, 139, 0.7);
          letter-spacing: 0.06em;
        }
        .topbar-search {
          max-width: 520px;
          width: 100%;
        }
        .search-box {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(247, 250, 252, 0.85);
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }
        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: #1e293b;
        }
        .search-box svg {
          color: rgba(100, 116, 139, 0.8);
        }
        .search-box:hover {
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.12);
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .topbar-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(248, 250, 252, 0.9);
          color: rgba(30, 41, 59, 0.85);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .topbar-btn:hover {
          transform: translateY(-1px);
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(96, 165, 250, 0.9));
          display: grid;
          place-items: center;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: white;
        }
        .studio-sidenav {
          grid-row: 2 / -1;
          background: rgba(255, 255, 255, 0.92);
          border-right: 1px solid rgba(203, 213, 225, 0.5);
          position: relative;
          z-index: 2;
        }
        .studio-shell.nav-collapsed .studio-sidenav {
          width: 72px;
        }
        .sidenav-scroll {
          height: calc(100vh - 72px);
          overflow-y: auto;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .sidenav-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(100, 116, 139, 0.6);
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          color: rgba(15, 23, 42, 0.9);
          text-decoration: none;
          transition: background 0.2s ease, color 0.2s ease;
          border: 1px solid transparent;
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 550;
        }
        .nav-item svg {
          color: rgba(59, 130, 246, 0.65);
        }
        .nav-item:hover {
          background: rgba(59, 130, 246, 0.12);
          color: rgba(37, 99, 235, 0.95);
          border-color: rgba(59, 130, 246, 0.2);
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(248, 113, 113, 0.22));
          border-color: rgba(59, 130, 246, 0.35);
          color: rgba(29, 78, 216, 0.98);
        }
        .nav-item span {
          transition: opacity 0.2s ease;
        }
        .studio-shell.nav-collapsed .nav-item span,
        .studio-shell.nav-collapsed .section-label,
        .studio-shell.nav-collapsed .quick-filters {
          opacity: 0;
          pointer-events: none;
        }
        .quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .quick-filters button {
          border: none;
          border-radius: 999px;
          padding: 6px 14px;
          background: rgba(226, 232, 240, 0.7);
          color: rgba(30, 41, 59, 0.7);
          cursor: pointer;
          font-size: 12px;
          letter-spacing: 0.02em;
        }
        .quick-filters button:hover {
          background: rgba(59, 130, 246, 0.25);
          color: rgba(26, 64, 165, 0.95);
        }
        .studio-main {
          grid-row: 2 / -1;
          position: relative;
          z-index: 1;
          padding: 32px;
          overflow-y: auto;
        }
        .channel-hero {
          margin-bottom: 32px;
        }
        .hero-content {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 24px;
          background: rgba(255, 255, 255, 0.88);
          border-radius: 24px;
          padding: 24px 32px;
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 20px 50px rgba(148, 163, 184, 0.25);
          align-items: center;
          position: relative;
          overflow: hidden;
          scroll-margin-top: 140px;
        }
        .hero-content::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), transparent 55%);
          pointer-events: none;
        }
        .hero-profile {
          position: relative;
          width: 120px;
          height: 120px;
        }
        .profile-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), transparent);
          filter: blur(16px);
          animation: pulse 4s ease-in-out infinite;
        }
        .hero-profile img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(226, 232, 240, 0.8);
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.96); opacity: 0.55; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .hero-details h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #1e293b;
        }
        .hero-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
          color: rgba(71, 85, 105, 0.75);
        }
        .hero-actions {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .subscribe-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(79, 70, 229, 0.85));
          color: white;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          text-decoration: none;
        }
        .subscribe-pill.subscribed {
          background: rgba(226, 232, 240, 0.7);
          color: rgba(30, 41, 59, 0.75);
        }
        .subscribe-pill:hover:not(:disabled) {
          filter: brightness(1.03);
        }
        .pill-loader {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(226, 232, 240, 0.4);
          border-top-color: rgba(255, 255, 255, 0.9);
          animation: spin 0.8s linear infinite;
        }
        .hero-icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(203, 213, 225, 0.6);
          background: rgba(248, 250, 252, 0.9);
          display: grid;
          place-items: center;
          color: rgba(71, 85, 105, 0.85);
          cursor: pointer;
        }
        .hero-icon-btn:hover {
          background: rgba(59, 130, 246, 0.12);
          color: rgba(37, 99, 235, 0.85);
        }
        .hero-stats {
          grid-column: 1 / -1;
          display: flex;
          gap: 28px;
          margin-top: 12px;
        }
        .hero-stats div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hero-stats span {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }
        .hero-stats label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(100, 116, 139, 0.6);
        }
        .channel-tabs-strip {
          display: flex;
          gap: 14px;
          margin-bottom: 24px;
        }
        .tab-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.6);
          background: rgba(248, 250, 252, 0.9);
          color: rgba(30, 41, 59, 0.8);
          font-size: 13px;
          letter-spacing: 0.03em;
          cursor: pointer;
        }
        .tab-chip em {
          font-style: normal;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.18);
        }
        .tab-chip.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(248, 113, 113, 0.22));
          border-color: rgba(59, 130, 246, 0.35);
          color: rgba(30, 64, 175, 0.95);
        }
        .channel-content-area {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .empty-illustration {
          display: grid;
          justify-items: center;
          gap: 16px;
          padding: 64px 32px;
          border: 1px dashed rgba(203, 213, 225, 0.8);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          color: rgba(71, 85, 105, 0.8);
        }
        .empty-visual {
          position: relative;
          width: 160px;
          height: 100px;
        }
        .vector {
          position: absolute;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(248, 113, 113, 0.25));
          filter: blur(2px);
          animation: drift 12s ease-in-out infinite;
        }
        .vector-a {
          width: 120px;
          height: 18px;
          top: 10px;
          left: 10px;
        }
        .vector-b {
          width: 80px;
          height: 18px;
          bottom: 12px;
          right: 0;
          animation-delay: 4s;
        }
        .vector-c {
          width: 60px;
          height: 18px;
          top: 40px;
          right: 40px;
          animation-delay: 7s;
        }
        @keyframes drift {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.7; }
          50% { transform: translate3d(20px, -10px, 0); opacity: 1; }
        }
        .empty-illustration h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .empty-illustration p {
          margin: 0;
          color: rgba(71, 85, 105, 0.65);
          max-width: 420px;
          text-align: center;
        }
        .course-mosaic {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          scroll-margin-top: 140px;
        }
        .course-card {
          overflow: hidden;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 16px 40px rgba(148, 163, 184, 0.25);
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .course-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 50px rgba(148, 163, 184, 0.35);
        }
        .card-media {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }
        .card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .course-card:hover .card-media img {
          transform: scale(1.05);
        }
        .media-fallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: rgba(120, 140, 160, 0.6);
          background: rgba(243, 244, 246, 0.8);
        }
        .media-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px;
          opacity: 0;
          transition: opacity 0.25s ease;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%, rgba(255, 255, 255, 0.9));
        }
        .course-card:hover .media-overlay {
          opacity: 1;
        }
        .overlay-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(248, 250, 252, 0.92);
          color: rgba(30, 41, 59, 0.8);
          text-decoration: none;
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .badge {
          align-self: flex-end;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.18);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(37, 99, 235, 0.9);
        }
        .card-body {
          padding: 20px 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .course-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          text-decoration: none;
        }
        .course-title:hover {
          color: #2563eb;
        }
        .course-snippet {
          margin: 0;
          color: rgba(71, 85, 105, 0.75);
          line-height: 1.5;
          font-size: 14px;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .course-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: rgba(100, 116, 139, 0.7);
        }
        .course-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .course-meta svg {
          color: rgba(100, 116, 139, 0.65);
        }
        .enroll-cta {
          padding: 10px 18px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(14, 165, 233, 0.35));
          color: rgba(30, 41, 59, 0.85);
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
        }
        .enroll-cta:hover {
          filter: brightness(1.03);
        }
        .about-layout {
          display: grid;
          gap: 24px;
          scroll-margin-top: 140px;
        }
        .about-card {
          padding: 24px 28px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 18px 40px rgba(148, 163, 184, 0.22);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .about-card h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        .about-card p {
          margin: 0;
          color: rgba(71, 85, 105, 0.75);
          line-height: 1.6;
        }
        .link-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }
        .link-grid a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(247, 250, 252, 0.9);
          color: rgba(37, 99, 235, 0.85);
          text-decoration: none;
        }
        .link-grid a:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .about-card.stats {
          gap: 18px;
        }
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 18px;
        }
        .insights-grid div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(247, 250, 252, 0.92);
        }
        .insights-grid strong {
          font-size: 20px;
          font-weight: 600;
        }
        .insights-grid span {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(100, 116, 139, 0.65);
        }
        .library-panel {
          display: grid;
          scroll-margin-top: 140px;
        }
        .library-card {
          padding: 28px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 18px 40px rgba(148, 163, 184, 0.22);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .library-card h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        .library-card p {
          margin: 0;
          color: rgba(71, 85, 105, 0.75);
          line-height: 1.6;
        }
        .library-cta {
          align-self: flex-start;
          padding: 10px 18px;
          border-radius: 12px;
          border: none;
          background: rgba(148, 163, 184, 0.25);
          color: rgba(71, 85, 105, 0.85);
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: not-allowed;
        }
        .library-cta:hover {
          filter: none;
        }
        @media (max-width: 1280px) {
          .studio-shell {
            grid-template-columns: 240px 1fr;
          }
        }
        @media (max-width: 1024px) {
          .studio-shell {
            grid-template-columns: 200px 1fr;
          }
          .studio-shell.nav-collapsed {
            grid-template-columns: 64px 1fr;
          }
          .studio-topbar {
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            row-gap: 16px;
          }
          .topbar-search {
            grid-column: 1 / -1;
            max-width: none;
          }
          .channel-hero {
            grid-template-columns: 1fr;
          }
          .hero-actions {
            justify-content: center;
            flex-wrap: wrap;
          }
          .hero-stats {
            justify-content: center;
            flex-wrap: wrap;
          }
          .course-mosaic {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .studio-shell {
            grid-template-columns: 1fr;
          }
          .studio-sidenav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: auto;
            border-right: none;
            border-top: 1px solid rgba(203, 213, 225, 0.6);
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(12px);
            transform: translateY(100%);
            transition: transform 0.3s ease;
          }
          .studio-shell.nav-collapsed .studio-sidenav {
            transform: translateY(0);
          }
          .sidenav-scroll {
            height: auto;
            flex-direction: row;
            justify-content: space-between;
          }
          .quick-filters {
            display: none;
          }
          .studio-main {
            padding: 24px;
          }
          .hero-content {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
          }
          .hero-actions {
            justify-content: center;
            flex-wrap: wrap;
          }
          .hero-stats {
            justify-content: center;
            flex-wrap: wrap;
          }
          .course-mosaic {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Organization;

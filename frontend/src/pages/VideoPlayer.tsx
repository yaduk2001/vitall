import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface Module {
  title: string;
  order: number;
  type?: string;
  videoUrl?: string;
  resourceUrl?: string;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
  durationSeconds?: number;
  lessonId?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  modules: Module[];
  tutorId: string;
}

interface Comment {
  id: string;
  studentId: string;
  courseId: string;
  moduleIndex: number;
  moduleType: string;
  content: string;
  isResolved: boolean;
  tutorReply?: {
    content: string;
    repliedAt: string;
    repliedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get module parameter from URL for continue watching
  const urlParams = new URLSearchParams(window.location.search);
  const moduleParam = urlParams.get('module');
  const referrer = urlParams.get('ref'); // Get referrer parameter

  // Determine back URL based on referrer and user role
  const getBackUrl = () => {
    if (referrer === 'creator') return '/CreatorDashboard';
    if (currentUser?.role === 'content_creator') return '/CreatorDashboard';
    return '/home'; // Default to home for students
  };

  // Header state variables
  const [hasSpeech, setHasSpeech] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);

  // Comment state variables
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  // Share state variables
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareTitle, setShareTitle] = useState<string>('');

  // Like state variables
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liking, setLiking] = useState<boolean>(false);
  const voiceBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef<boolean>(false);
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  const BASE_URL = useMemo(() => (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000', []);

  useEffect(() => {
    loadCourse();
  }, [id]);

  // Validate authentication on component mount
  useEffect(() => {
    validateAuth();
  }, [BASE_URL]);

  // Load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadNotifications();
    }
  }, [isAuthenticated, currentUser, BASE_URL]);

  // Refresh progress when course or currentModule changes
  useEffect(() => {
    if (course && currentUser && isAuthenticated) {
      loadProgress(currentUser, course.id, course.modules);
    }
  }, [course, currentModule, isAuthenticated, currentUser]);

  // Update current lesson ID for AI Buddy
  useEffect(() => {
    if (course && course.modules && course.modules[currentModule]) {
      const moduleData = course.modules[currentModule];
      if (moduleData.lessonId) {
        console.log('Setting current lesson ID:', moduleData.lessonId);
        localStorage.setItem('current_lesson_id', moduleData.lessonId);
        window.dispatchEvent(new Event('lesson_change'));
      } else {
        console.log('Clearing current lesson ID');
        localStorage.removeItem('current_lesson_id');
        window.dispatchEvent(new Event('lesson_change'));
      }
    }
  }, [currentModule, course]);

  // Load likes when course or module changes
  useEffect(() => {
    if (course && currentUser && isAuthenticated) {
      loadLikes();
    }
  }, [course, currentModule, isAuthenticated, currentUser]);

  // Load comments when module changes
  useEffect(() => {
    if (course && isAuthenticated && showComments) {
      loadComments();
    }
  }, [currentModule, course, isAuthenticated, showComments]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        listeningRef.current = true;
        if (voiceBtnRef.current) voiceBtnRef.current.classList.add('listening');
      };

      recognition.onend = () => {
        listeningRef.current = false;
        if (voiceBtnRef.current) voiceBtnRef.current.classList.remove('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (searchRef.current) searchRef.current.value = transcript;
      };

      recognitionRef.current = recognition;
      setHasSpeech(true);
    }
  }, []);

  const loadCourse = async () => {
    try {
      const courseId = String(id || '');

      // Check if user is logged in
      const userJson = localStorage.getItem('user');
      let currentUser: any = null;
      try {
        currentUser = userJson ? JSON.parse(userJson) : null;
      } catch { }

      if (!currentUser) {
        setError('Please login to access course content');
        return;
      }

      if (currentUser.role !== 'student') {
        setError('Only students can access course content');
        return;
      }

      // Check enrollment
      const enrollmentRes = await fetch(`${BASE_URL}/api/enrollments/by-student/${currentUser.id || currentUser._id}`);
      if (enrollmentRes.ok) {
        const { enrollments } = await enrollmentRes.json();
        const isEnrolled = enrollments.some((enr: any) => enr.courseId === courseId);
        if (!isEnrolled) {
          // Redirect to course details for enrollment
          window.location.href = `/course/${courseId}`;
          return;
        }
      } else {
        // Fallback for safety, or error handling
        window.location.href = `/course/${courseId}`;
        return;
      }

      // Load course data
      const res = await fetch(`${BASE_URL}/api/courses/${courseId}`);
      if (!res.ok) {
        setError('Failed to load course');
        return;
      }

      const data = await res.json();
      const courseData = data.course;
      setCourse(courseData);

      // Save course lessons to localStorage for Buddy context
      if (courseData.modules) {
        const lessons = courseData.modules
          .filter((m: any) => m.lessonId)
          .map((m: any) => ({
            id: m.lessonId,
            title: m.title
          }));
        localStorage.setItem('current_course_lessons', JSON.stringify(lessons));
        window.dispatchEvent(new Event('course_lessons_update'));
      }
      await loadProgress(currentUser, courseId, courseData.modules);

      // Set initial module from URL parameter if provided
      if (moduleParam !== null) {
        const moduleIndex = parseInt(moduleParam);
        if (!isNaN(moduleIndex) && moduleIndex >= 0 && moduleIndex < courseData.modules.length) {
          setCurrentModule(moduleIndex);
        }
      }

    } catch (e) {
      console.error('Error loading course:', e);
      setError('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (user: any, courseId: string, modules: Module[]) => {
    try {
      const progressRes = await fetch(`${BASE_URL}/api/progress/${user.id || user._id}/${courseId}`);
      if (progressRes.ok) {
        const progressResult = await progressRes.json();
        const progressData = progressResult.progress || [];

        // Extract completed module indices and save progress data to localStorage
        const moduleProgress = new Map();
        progressData.forEach((p: any) => {
          const key = `${p.moduleIndex}_${p.moduleType}`;
          moduleProgress.set(key, p.progress);

          // Save progress data to localStorage for resume functionality
          if (p.moduleType === 'video' && p.lastPositionSeconds > 0) {
            localStorage.setItem(`video_progress_${user.id || user._id}_${courseId}_${p.moduleIndex}`,
              JSON.stringify({
                progress: p.progress,
                lastPositionSeconds: p.lastPositionSeconds,
                watchTimeSeconds: p.watchTimeSeconds,
                lastWatchedAt: p.lastWatchedAt
              })
            );
          }
        });

        // A module is considered complete if video is completed (90% watched) or document is accessed
        const completed: number[] = [];
        for (let i = 0; i < modules.length; i++) {
          const mod = modules[i];
          if (mod.type === 'video' && mod.videoUrl) {
            const videoProgress = moduleProgress.get(`${i}_video`) || 0;
            if (videoProgress >= 90) {
              completed.push(i);
            }
          } else if (mod.type === 'document' && mod.documentUrl) {
            const documentProgress = moduleProgress.get(`${i}_document`) || 0;
            if (documentProgress >= 100) {
              completed.push(i);
            }
          }
        }

        setCompletedModules(completed);

        // Calculate progress percentage
        const progressPercentage = modules.length > 0 ? Math.round((completed.length / modules.length) * 100) : 0;
        setProgress(progressPercentage);

        console.log('Loaded progress from database:', progressData);
        console.log('Completed modules:', completed);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const saveProgress = async (moduleIdx: number, moduleType: string = 'video', progressPercent: number = 100, watchTimeSeconds: number = 0, lastPositionSeconds: number = 0) => {
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      // Save to localStorage for immediate resume functionality
      if (user && moduleType === 'video' && lastPositionSeconds > 0) {
        localStorage.setItem(`video_progress_${user.id || user._id}_${id}_${moduleIdx}`,
          JSON.stringify({
            progress: progressPercent,
            lastPositionSeconds,
            watchTimeSeconds,
            lastWatchedAt: new Date().toISOString()
          })
        );
      }

      const progressRes = await fetch(`${BASE_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user?.id || user?._id,
          courseId: id,
          moduleIndex: moduleIdx,
          moduleType,
          progress: progressPercent,
          watchTimeSeconds,
          lastPositionSeconds
        })
      });

      if (progressRes.ok) {
        console.log('Progress saved to database');

        // Update local state if module is complete
        if (progressPercent >= 90 && !completedModules.includes(moduleIdx)) {
          const newCompleted = [...completedModules, moduleIdx];
          setCompletedModules(newCompleted);

          // Update progress percentage
          const newProgress = course ? Math.round((newCompleted.length / course.modules.length) * 100) : 0;
          setProgress(newProgress);

          // Show completion message
          setTimeout(() => {
            showSuccess('Module completed! 🎉');
          }, 500);
        } else if (progressPercent < 90 && completedModules.includes(moduleIdx)) {
          // If progress dropped below 90%, remove from completed
          const newCompleted = completedModules.filter(idx => idx !== moduleIdx);
          setCompletedModules(newCompleted);

          // Update progress percentage
          const newProgress = course ? Math.round((newCompleted.length / course.modules.length) * 100) : 0;
          setProgress(newProgress);
        }

        // Record analytics
        fetch(`${BASE_URL}/api/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'complete',
            courseId: id,
            moduleOrder: moduleIdx + 1,
            userId: user?.id || user?._id
          })
        });

      } else {
        console.error('Failed to save progress to database');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const playModule = (moduleIdx: number) => {
    if (!course) return;

    // Check if module is unlocked
    const canAccess = moduleIdx === 0 || completedModules.includes(moduleIdx - 1);
    if (!canAccess) {
      showWarning(`Please complete Module ${moduleIdx} first before accessing this module.`);
      return;
    }

    setCurrentModule(moduleIdx);

    // For document modules, mark as complete when accessed
    const currentModuleData = course.modules[moduleIdx];
    if (currentModuleData?.type === 'document') {
      saveProgress(moduleIdx, 'document', 100, 0, 0);
    }

    // Record analytics
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      fetch(`${BASE_URL}/api/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'watch',
          courseId: id,
          moduleOrder: moduleIdx + 1,
          userId: user?.id || user?._id
        })
      });
    } catch (error) {
      console.error('Failed to record analytics:', error);
    }
  };

  const handleVideoEnd = () => {
    const video = document.querySelector('video');
    if (video) {
      saveProgress(currentModule, 'video', 100, video.duration, video.duration);
    }
  };

  const handleVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      const progressPercent = Math.round((video.currentTime / video.duration) * 100);
      const watchTimeSeconds = video.currentTime;
      const lastPositionSeconds = video.currentTime;

      // Save progress every 10 seconds or when significant progress is made
      if (video.currentTime % 10 < 1 || progressPercent % 10 === 0) {
        saveProgress(currentModule, 'video', progressPercent, watchTimeSeconds, lastPositionSeconds);
      }
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      const progressPercent = Math.round((video.currentTime / video.duration) * 100);
      const watchTimeSeconds = video.currentTime;
      const lastPositionSeconds = video.currentTime;

      // Update progress bar
      const progressBar = document.getElementById('video-progress-bar');
      const progressText = document.getElementById('video-progress-text');
      if (progressBar && progressText) {
        progressBar.style.width = `${progressPercent}%`;
        progressText.textContent = `${progressPercent}%`;
      }

      // Save progress every 10 seconds for better tracking
      if (Math.floor(video.currentTime) % 10 === 0 && video.currentTime > 0) {
        console.log(`Saving progress: Module ${currentModule}, ${progressPercent}%, ${Math.round(video.currentTime)}s`);
        saveProgress(currentModule, 'video', progressPercent, watchTimeSeconds, lastPositionSeconds);
      }

      // Also save to localStorage immediately for instant resume
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (user && course) {
        localStorage.setItem(`video_progress_${user.id || user._id}_${id}_${currentModule}`,
          JSON.stringify({
            progress: progressPercent,
            lastPositionSeconds,
            watchTimeSeconds,
            lastWatchedAt: new Date().toISOString()
          })
        );
      }
    }
  };

  // Header helper functions
  function getUser() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }

  // Load notifications for the current user
  const loadNotifications = async () => {
    const user = getUser();
    if (!user) return;

    setNotificationsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/${user.id || user._id}`);
      if (res.status === 401 || res.status === 403) {
        // Unauthorized - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  // Load comments for current module
  const loadComments = async () => {
    if (!course || !isAuthenticated) return;

    setCommentsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${course.id}/${currentModule}`);
      if (res.status === 401 || res.status === 403) {
        // Unauthorized - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit a new comment
  const submitComment = async () => {
    if (!newComment.trim() || !course || !currentUser || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.id || currentUser._id,
          courseId: course.id,
          moduleIndex: currentModule,
          moduleType: currentModuleData?.type || 'video',
          content: newComment.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        showSuccess('Comment posted successfully!');
      } else {
        const errorData = await res.json();
        showError(`Failed to post comment: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      showError('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle comments section
  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  // Share functions
  const openShareModal = () => {
    if (!course) return;

    const currentUrl = window.location.href;
    const moduleTitle = currentModuleData?.title || `Module ${currentModule + 1}`;
    const shareTitleText = `${course.title} - ${moduleTitle}`;

    setShareUrl(currentUrl);
    setShareTitle(shareTitleText);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showInfo('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showInfo('Link copied to clipboard!');
    }
  };

  const shareOnSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    let shareUrl_platform = '';

    switch (platform) {
      case 'twitter':
        shareUrl_platform = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl_platform = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl_platform = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl_platform = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl_platform = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      default:
        return;
    }

    window.open(shareUrl_platform, '_blank', 'width=600,height=400');
  };

  // Like functions
  const toggleLike = async () => {
    if (!course || !currentUser || liking) return;

    setLiking(true);
    try {
      const res = await fetch(`${BASE_URL}/api/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.id || currentUser._id,
          courseId: course.id,
          moduleIndex: currentModule,
          moduleType: currentModuleData?.type || 'video'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      } else {
        const errorData = await res.json();
        console.error('Failed to toggle like:', errorData.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const loadLikes = async () => {
    if (!course || !currentUser) return;

    try {
      const res = await fetch(`${BASE_URL}/api/likes/${course.id}/${currentModule}?studentId=${currentUser.id || currentUser._id}`);
      if (res.status === 401 || res.status === 403) {
        // Unauthorized - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  // Validate authentication with backend
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
        // Token is invalid, clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      // On network error, assume user is still valid if we have local data
      setIsAuthenticated(true);
      setCurrentUser(user);
      setAuthLoading(false);
      return true;
    }
  }

  function toggleVoice() {
    const rec = recognitionRef.current;
    if (!rec) return showWarning('Speech recognition is not supported in this browser.');
    try {
      if (listeningRef.current) rec.stop(); else rec.start();
    } catch { }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
        </div>
      </div>
    );
  }

  const sortedModules = course.modules.sort((a, b) => a.order - b.order);
  const currentModuleData = sortedModules[currentModule];

  return (
    <div className="home">
      {/* Main Header - copied from Home.tsx */}
      <header className="header">
        <div className="header-left">
          <a className="logo" href={getBackUrl()}>
            <img src={logoImage} alt="Logo" className="logo-image" />
          </a>
        </div>

        <div className="header-center">
          <div className="search-container">
            <div className="searchbar" role="search">
              <input ref={searchRef} className="search" placeholder="Search" aria-label="Search" />
            </div>
            <button className="search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button ref={voiceBtnRef} className={`voice-btn${hasSpeech ? '' : ' disabled'}`} aria-label="Voice Search" onClick={toggleVoice} disabled={!hasSpeech}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="header-right">
          <button className={`notification-btn ${showNotifications ? 'active' : ''}`} aria-label="Notifications" onClick={toggleNotifications}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div id="notifications-dropdown" className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={async () => {
                      const user = getUser();
                      if (user) {
                        try {
                          const res = await fetch(`${BASE_URL}/api/notifications/mark-all-read/${user.id || user._id}`, {
                            method: 'PUT'
                          });
                          if (res.ok) {
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                          }
                        } catch (error) {
                          console.error('Error marking all as read:', error);
                        }
                      }
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notifications-content">
                {notificationsLoading ? (
                  <div className="notifications-loading">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="no-notifications">
                    <div className="no-notifications-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p>No notifications yet</p>
                    <span>You'll see notifications here when your subscribed tutors upload new content.</span>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                          // Navigate to the content
                          window.location.href = `/video/${notification.contentId}`;
                        }}
                      >
                        <div className="notification-content">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-meta">
                            <span className="notification-tutor">{notification.tutorName}</span>
                            <span className="notification-time">{new Date(notification.createdAt).toLocaleDateString()}</span>
                          </div>
                          {!notification.isRead && <div className="unread-dot"></div>}
                        </div>
                        <button
                          className="delete-notification-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(() => {
            if (authLoading) {
              return <div style={{ color: '#666', fontSize: '14px' }}>Loading...</div>;
            }
            if (isAuthenticated && currentUser) {
              return (
                <div className="profile-menu-container" style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    className="profile-menu-button"
                    style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      const menu = document.getElementById('student-profile-menu');
                      if (menu) {
                        menu.style.display = menu.style.display === 'none' || !menu.style.display ? 'block' : 'none';
                      }
                    }}
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt="Profile"
                        className="profile-pic"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs border border-gray-200 shadow-sm cursor-pointer transition-transform hover:-translate-y-px hover:shadow-md">
                        {(currentUser.name || currentUser.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div
                    id="student-profile-menu"
                    style={{
                      display: 'none',
                      position: 'absolute',
                      right: '0',
                      top: '100%',
                      marginTop: '12px',
                      width: '200px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
                      zIndex: 30,
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 20px',
                        fontSize: '14px',
                        color: '#374151',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                        (e.target as HTMLElement).style.color = '#1e3a8a';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        (e.target as HTMLElement).style.color = '#374151';
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append('avatar', file);
                            const res = await fetch('http://localhost:5000/api/upload-avatar', {
                              method: 'POST',
                              body: formData,
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            if (res.ok) {
                              const data = await res.json();
                              const updatedUser = { ...currentUser, avatarUrl: data.avatarUrl };
                              localStorage.setItem('user', JSON.stringify(updatedUser));
                              setCurrentUser(updatedUser);
                              location.reload();
                            }
                          } catch (error) {
                            console.error('Upload failed:', error);
                          }
                        };
                        input.click();
                      }}
                    >
                      Update Profile Picture
                    </button>
                    <button
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 20px',
                        fontSize: '14px',
                        color: '#dc2626',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = '#fef2f2';
                        (e.target as HTMLElement).style.color = '#b91c1c';
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        (e.target as HTMLElement).style.color = '#dc2626';
                      }}
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                        window.location.href = '/login';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              );
            } else {
              return <a className="signin" href="/login">Sign in</a>;
            }
          })()}
        </div>
      </header>

      {/* Horizontal line under header */}
      <div className="header-divider"></div>

      {/* Video Player Header - existing header with progress and back button */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Progress: {progress}%
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {sortedModules.length} Modules
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: '#ffffff' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Player */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Video Progress Indicator */}
              {currentModuleData?.type === 'video' && currentModuleData?.videoUrl && (
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Video Progress</span>
                    <span className="text-sm text-gray-500" id="video-progress-text">0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      id="video-progress-bar"
                      style={{ width: '0%' }}
                    ></div >
                  </div >
                </div >
              )}
              <div className="aspect-video bg-black">
                {currentModuleData?.type === 'video' && currentModuleData?.videoUrl ? (
                  <video
                    key={currentModule}
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    onEnded={handleVideoEnd}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onProgress={handleVideoProgress}
                    onLoadedMetadata={async (e) => {
                      // Resume from last position if available
                      const video = e.currentTarget;
                      const userJson = localStorage.getItem('user');
                      const user = userJson ? JSON.parse(userJson) : null;

                      if (user && course) {
                        let resumePosition = 0;
                        let savedProgressPercent = 0;

                        // First, try to get from localStorage (fastest)
                        const savedProgress = localStorage.getItem(`video_progress_${user.id || user._id}_${id}_${currentModule}`);
                        if (savedProgress) {
                          const progress = JSON.parse(savedProgress);
                          if (progress.lastPositionSeconds > 0 && progress.lastPositionSeconds < video.duration) {
                            resumePosition = progress.lastPositionSeconds;
                            savedProgressPercent = progress.progress || Math.round((resumePosition / video.duration) * 100);
                            console.log('Found localStorage progress:', progress);
                          }
                        }

                        // If no localStorage data, try to get from database
                        if (resumePosition === 0) {
                          try {
                            const progressRes = await fetch(`${BASE_URL}/api/progress/${user.id || user._id}/${id}/${currentModule}`);
                            if (progressRes.ok) {
                              const progressData = await progressRes.json();
                              if (progressData.progress && progressData.lastPositionSeconds > 0 && progressData.lastPositionSeconds < video.duration) {
                                resumePosition = progressData.lastPositionSeconds;
                                savedProgressPercent = progressData.progress;
                                console.log('Found database progress:', progressData);

                                // Also save to localStorage for next time
                                localStorage.setItem(`video_progress_${user.id || user._id}_${id}_${currentModule}`,
                                  JSON.stringify({
                                    progress: progressData.progress,
                                    lastPositionSeconds: progressData.lastPositionSeconds,
                                    watchTimeSeconds: progressData.watchTimeSeconds,
                                    lastWatchedAt: progressData.lastWatchedAt
                                  })
                                );
                              }
                            }
                          } catch (error) {
                            console.error('Error loading progress from database:', error);
                          }
                        }

                        // Resume from the saved position
                        if (resumePosition > 0) {
                          // Set video position
                          video.currentTime = resumePosition;

                          // Update progress bar to show the SAVED progress, not current position
                          const progressBar = document.getElementById('video-progress-bar');
                          const progressText = document.getElementById('video-progress-text');
                          if (progressBar && progressText) {
                            progressBar.style.width = `${savedProgressPercent}%`;
                            progressText.textContent = `${savedProgressPercent}%`;
                          }

                          console.log(`Resuming video from ${Math.round(resumePosition)}s (${savedProgressPercent}%)`);
                        } else {
                          // No saved progress, reset progress bar
                          const progressBar = document.getElementById('video-progress-bar');
                          const progressText = document.getElementById('video-progress-text');
                          if (progressBar && progressText) {
                            progressBar.style.width = '0%';
                            progressText.textContent = '0%';
                          }
                        }
                      }
                    }}
                  >
                    <source
                      src={currentModuleData.videoUrl.startsWith('http')
                        ? currentModuleData.videoUrl
                        : `${BASE_URL}${currentModuleData.videoUrl}`
                      }
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : currentModuleData?.type === 'document' && currentModuleData?.documentUrl ? (
                  <div className="w-full h-full flex flex-col bg-gray-900">
                    {/* If PDF or Text, show in iframe */}
                    {(currentModuleData.documentType?.includes('pdf') || currentModuleData.documentType?.includes('text')) ? (
                      <iframe
                        src={currentModuleData.documentUrl.startsWith('http')
                          ? currentModuleData.documentUrl
                          : `${BASE_URL}${currentModuleData.documentUrl}`
                        }
                        className="w-full flex-1 bg-white"
                        title={currentModuleData.title}
                      />
                    ) : (
                      /* For other files, show download prompt */
                      <div className="flex-1 flex flex-col items-center justify-center text-white p-8">
                        <div className="text-6xl mb-4">
                          {currentModuleData.documentType?.includes('word') ? '📄' :
                            currentModuleData.documentType?.includes('excel') ? '📊' :
                              currentModuleData.documentType?.includes('powerpoint') ? '📊' : '📁'}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{currentModuleData.title}</h3>
                        <p className="text-gray-300 mb-6">{currentModuleData.documentName}</p>
                        <p className="text-sm text-gray-400 mb-6 max-w-md text-center">
                          This file type cannot be previewed directly. Please download it to view.
                        </p>
                      </div>
                    )}

                    {/* Download Bar */}
                    <div className="bg-gray-800 p-4 flex items-center justify-between border-t border-gray-700">
                      <div className="text-white">
                        <p className="font-medium">{currentModuleData.documentName}</p>
                        <p className="text-xs text-gray-400">{currentModuleData.documentType || 'Document'}</p>
                      </div>
                      <a
                        href={currentModuleData.documentUrl.startsWith('http')
                          ? currentModuleData.documentUrl
                          : `${BASE_URL}${currentModuleData.documentUrl}`
                        }
                        download={currentModuleData.documentName || 'document'}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-xl font-semibold mb-2">Welcome to {course.title}</h3>
                      <p className="text-gray-300 max-w-md">{course.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div >

            {/* Engagement Section */}
            < div className="bg-white rounded-lg shadow-sm p-6" >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Engagement</h2>
                <div className="flex items-center space-x-3">
                  {/* Like Button */}
                  <button
                    onClick={toggleLike}
                    disabled={!isAuthenticated || !currentUser || liking}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isLiked
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } ${(!isAuthenticated || !currentUser || liking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{likeCount}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={openShareModal}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                {isAuthenticated && currentUser ? (
                  <>Like this {currentModuleData?.type === 'video' ? 'video' : 'module'} or share it with others</>
                ) : (
                  <>Please log in to like and share content</>
                )}
              </p>
            </div >

            {/* Comments Section */}
            < div className="bg-white rounded-lg shadow-sm p-6" >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Comments</h2>
                <button
                  onClick={toggleComments}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showComments ? 'Hide Comments' : 'Show Comments'}
                </button>
              </div>

              {
                showComments && (
                  <>
                    {/* Comment Form */}
                    {isAuthenticated && currentUser && currentUser.role === 'student' && (
                      <div className="mb-6">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                              maxLength={1000}
                            />
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                {newComment.length}/1000 characters
                              </span>
                              <button
                                onClick={submitComment}
                                disabled={!newComment.trim() || submittingComment}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-4">
                      {commentsLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-600 mt-2">Loading comments...</p>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                S
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-gray-900">Student</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{comment.content}</p>

                                {/* Tutor Reply */}
                                {comment.tutorReply && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="font-medium text-blue-900">Tutor Reply</div>
                                      <div className="text-sm text-blue-600">
                                        {new Date(comment.tutorReply.repliedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <p className="text-blue-800">{comment.tutorReply.content}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )
              }
            </div >
          </div >

          {/* Sidebar - Modules */}
          < div className="lg:col-span-1" >
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Course Modules</h2>

              <div className="space-y-2">
                {sortedModules.map((module, idx) => {
                  const isCompleted = completedModules.includes(idx);
                  const isCurrent = idx === currentModule;
                  const canAccess = idx === 0 || completedModules.includes(idx - 1);

                  return (
                    <button
                      key={idx}
                      onClick={() => playModule(idx)}
                      disabled={!canAccess}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${isCurrent
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : canAccess
                          ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                              ? 'bg-blue-500 text-white'
                              : canAccess
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <div>
                            <div className={`font-medium ${canAccess ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                              Module {idx + 1}
                            </div>
                            <div className={`text-sm ${canAccess ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                              {module.title}
                            </div>
                          </div>
                        </div>

                        {module.videoUrl && module.type !== 'document' && (
                          <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {module.documentUrl && module.type === 'document' && (
                          <div className="text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {!canAccess && (
                        <div className="mt-2 text-xs text-gray-500">
                          🔒 Complete previous module to unlock
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div >
        </div >
      </div >

      <style>{`
        /* Global styles */
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #ffffff;
        }
        
        /* Main layout */
        .home {
          min-height: 100vh;
          background: #ffffff;
        }
        
        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          min-width: 200px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        
        .logo-image {
          width: auto;
          height: 50px;
          border-radius: 8px;
          object-fit: contain;
        }
        
        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          max-width: 640px;
          margin: 0 40px;
        }
        
        .search-container {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 540px;
        }
        
        .searchbar {
          flex: 1;
          height: 44px;
          border: 1px solid #d1d5db;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .searchbar:focus-within {
          border-color: #1e3a8a;
          box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
        }
        
        .search {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          padding: 0 20px;
          font-size: 16px;
          background: transparent;
          border-radius: 24px;
        }
        
        .search-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: #1e3a8a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(30, 58, 138, 0.3);
          transition: all 0.2s ease;
        }
        
        .search-btn:hover {
          background: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
        }
        
        .voice-btn {
          width: 44px;
          height: 44px;
          border: 2px solid #374151;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .voice-btn:hover {
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .voice-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .voice-btn.listening {
          background: #dbeafe;
          border-color: #1e3a8a;
          color: #1e3a8a;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 200px;
          justify-content: flex-end;
        }
        
        .notification-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: transparent;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #606060;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .notification-btn:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .notification-btn.active {
          background: #f3f4f6;
          border: 2px solid #000000;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          animation: shake 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          50% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }
        
        .notifications-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 12px;
          width: 450px;
          max-height: 35vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 2px solid #000000;
          z-index: 1000;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .notifications-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }
        
        .notifications-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .mark-all-read-btn {
          background: none;
          border: none;
          color: #1e3a8a;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .mark-all-read-btn:hover {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .notifications-content {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .notifications-loading {
          padding: 40px 24px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }
        
        .no-notifications {
          padding: 40px 24px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }
        
        .no-notifications-icon {
          margin-bottom: 16px;
        }
        
        .no-notifications p {
          margin: 0 0 8px 0;
          font-weight: 600;
          font-size: 16px;
          color: #374151;
        }
        
        .no-notifications span {
          font-size: 14px;
          line-height: 1.4;
        }
        
        .notifications-list {
          padding: 8px 0;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .notification-item:hover {
          background: #f9fafb;
        }
        
        .notification-item.unread {
          background: #f0f9ff;
          border-left: 4px solid #1e3a8a;
        }
        
        .notification-content {
          flex: 1;
          margin-right: 12px;
        }
        
        .notification-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 14px;
        }
        
        .notification-message {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 8px;
        }
        
        .notification-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #9ca3af;
        }
        
        .notification-tutor {
          font-weight: 500;
          color: #1e3a8a;
        }
        
        .unread-dot {
          position: absolute;
          top: 20px;
          right: 50px;
          width: 8px;
          height: 8px;
          background: #1e3a8a;
          border-radius: 50%;
        }
        
        .delete-notification-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          opacity: 0;
          flex-shrink: 0;
        }
        
        .notification-item:hover .delete-notification-btn {
          opacity: 1;
        }
        
        .delete-notification-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .profile-pic {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .profile-pic:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .signin {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 2px solid #1e3a8a;
          border-radius: 24px;
          text-decoration: none;
          color: #1e3a8a;
          font-weight: 600;
          background: transparent;
          transition: all 0.2s ease;
        }
        
        .signin:hover {
          background: #1e3a8a;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
        }
        
        /* Header divider */
        .header-divider {
          height: 1px;
          background: #000000;
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .header {
            padding: 0 16px;
          }
          
          .header-center {
            margin: 0 12px;
          }
          
          .logo {
            font-size: 18px;
          }
          
          .notifications-dropdown {
            width: 320px;
          }
        }
        
        @media (max-width: 640px) {
          .header {
            padding: 0 16px;
          }
          
          .header-center {
            margin: 0 12px;
          }
          
          .logo {
            font-size: 18px;
          }
        }
      `}</style>

      {/* Share Modal */}
      {
        showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share</h3>
                <button
                  onClick={closeShareModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Share this content:</p>
                <p className="font-medium text-gray-900">{shareTitle}</p>
              </div>

              {/* Copy Link */}
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Social Media Share Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Share on social media:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    <span className="text-sm">Twitter</span>
                  </button>

                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-sm">Facebook</span>
                  </button>

                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className="text-sm">LinkedIn</span>
                  </button>

                  <button
                    onClick={() => shareOnSocial('whatsapp')}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    <span className="text-sm">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default VideoPlayer;

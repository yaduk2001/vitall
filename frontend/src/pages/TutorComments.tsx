import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';

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

interface Course {
  id: string;
  title: string;
  modules: Array<{
    title: string;
    order: number;
    type?: string;
  }>;
}

const TutorComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Get user from localStorage
  const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Validate authentication
  const validateAuth = async () => {
    const token = localStorage.getItem('token');
    const user = getUser();
    
    if (!token || !user) {
      window.location.href = '/login';
      return;
    }

    if (user.role !== 'tutor') {
      window.location.href = '/';
      return;
    }

    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  // Load comments for tutor
  const loadComments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tutor/${currentUser.id || currentUser._id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load courses for context
  const loadCourses = async () => {
    if (!currentUser) return;
    
    try {
      const res = await fetch(`${BASE_URL}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        const tutorCourses = data.courses.filter((course: any) => 
          course.tutorId === (currentUser.id || currentUser._id)
        );
        setCourses(tutorCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Submit reply to comment
  const submitReply = async (commentId: string) => {
    if (!replyContent.trim() || !currentUser || submittingReply) return;
    
    setSubmittingReply(true);
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: currentUser.id || currentUser._id,
          replyContent: replyContent.trim()
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? data.comment : comment
        ));
        setReplyContent('');
        setReplyingTo(null);
        alert('Reply posted successfully!');
      } else {
        const errorData = await res.json();
        alert(`Failed to post reply: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Get course title by ID
  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  // Get module title by course ID and module index
  const getModuleTitle = (courseId: string, moduleIndex: number) => {
    const course = courses.find(c => c.id === courseId);
    if (course && course.modules[moduleIndex]) {
      return course.modules[moduleIndex].title;
    }
    return `Module ${moduleIndex + 1}`;
  };

  useEffect(() => {
    validateAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadComments();
      loadCourses();
    }
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/Tutordashboard" className="flex items-center space-x-2">
                <img src="/src/assets/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xl font-bold text-gray-900">Tutor Dashboard</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/Tutordashboard" className="text-gray-700 hover:text-blue-600 font-medium">Dashboard</a>
              <a href="/channel" className="text-gray-700 hover:text-blue-600 font-medium">My Channel</a>
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Comments</h1>
          <p className="text-gray-600 mt-2">Manage and reply to student comments on your courses</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Comments Yet</h3>
            <p className="text-gray-600">Students haven't commented on your courses yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        S
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Student Comment</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Course:</span> {getCourseTitle(comment.courseId)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Module:</span> {getModuleTitle(comment.courseId, comment.moduleIndex)}
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded">
                          {comment.moduleType === 'video' ? '📹 Video' : '📄 Document'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {comment.isResolved ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✓ Resolved
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Tutor Reply Section */}
                {comment.tutorReply ? (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">Your Reply</h4>
                      <span className="text-sm text-blue-600">
                        {new Date(comment.tutorReply.repliedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-800">{comment.tutorReply.content}</p>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    {replyingTo === comment.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReply(comment.id)}
                            disabled={!replyContent.trim() || submittingReply}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reply to Comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorComments;

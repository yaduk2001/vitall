import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  modules: any[];
  createdAt: string;
};

type Channel = {
  id: string;
  tutorId: string;
  name: string;
  organization: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  socialLinks: {
    website: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  subscriberCount: number;
};

const TutorChannel: React.FC = () => {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'courses' | 'about'>('home');

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadChannelData = async () => {
      const user = getUser();
      if (!user) return;

      try {
        console.log('Loading channel data for user:', user.id || user._id);
        const [channelRes, coursesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/channels/${user.id || user._id}`),
          fetch(`${BASE_URL}/api/courses/by-tutor/${user.id || user._id}`)
        ]);

        console.log('Channel response status:', channelRes.status);
        console.log('Courses response status:', coursesRes.status);

        if (channelRes.ok) {
          const channelData = await channelRes.json();
          console.log('Channel data received:', channelData);
          console.log('Channel object:', channelData.channel);
          console.log('Channel socialLinks:', channelData.channel?.socialLinks);
          setChannel(channelData.channel);
        } else {
          const errorText = await channelRes.text();
          console.error('Channel fetch failed:', channelRes.status, errorText);
          if (channelRes.status === 404) {
            console.log('Channel not found - may need to be created');
          }
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        } else {
          console.error('Courses fetch failed:', coursesRes.status);
        }
      } catch (e) {
        console.error('Failed to load channel data:', e);
        setError('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [BASE_URL]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Channel</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {setError(null); setLoading(true); window.location.reload();}}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/Tutordashboard'}
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!channel && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-tv text-blue-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Channel Not Found</h2>
          <p className="text-gray-600 mb-6">It looks like your channel hasn't been set up yet, or there was an error loading it.</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/channel-setup'}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Set Up Channel
            </button>
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="topbar">
        <div className="topbar-left logo-effect">
          <a href="/Tutordashboard" className="flex items-center space-x-2">
            <img src="/src/assets/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          </a>
        </div>
        <div className="topbar-right">
          <div className="flex items-center space-x-6">
            <a href="/CourseUploadPage" className="text-gray-700 hover:text-blue-600 font-medium">Upload</a>
            <a href="/analytics" className="text-gray-700 hover:text-blue-600 font-medium">Analytics</a>
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Channel Banner */}
      {channel && (
      <div className="pt-16">
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
          {channel.bannerUrl && (
            <img src={channel.bannerUrl} alt="Channel Banner" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Channel Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 relative z-10">
            <div className="flex items-end space-x-4 mb-4 md:mb-0">
              <img
                src={channel.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face&auto=format'}
                alt={channel.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
              />
              <div className="text-white md:text-gray-800 pb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{channel.name}</h1>
                <p className="text-sm md:text-base opacity-90 md:opacity-70">
                  {formatSubscriberCount(channel.subscriberCount)} subscribers • {courses.length} courses
                </p>
              </div>
            </div>
            
            <div className="md:ml-auto flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/channel-setup'}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                <i className="fas fa-edit mr-2"></i>
                Customize Channel
              </button>
              <a
                href={`/organization/${channel.tutorId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                View as Student
              </a>
            </div>
          </div>

          {/* Channel Description */}
          {channel.description && (
            <div className="mt-6 max-w-4xl">
              <p className="text-gray-600 leading-relaxed">{channel.description}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mt-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('home')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'home'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Courses
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'home' && (
              <div className="space-y-8">
                {courses.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Latest Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {courses.slice(0, 8).map((course) => (
                        <div key={course.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <i className="fas fa-play-circle text-3xl"></i>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{course.modules?.length || 0} modules</span>
                              <span>{formatDate(course.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-video text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-4">Start creating courses to build your channel</p>
                    <a
                      href="/CourseUploadPage"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Course
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">All Courses ({courses.length})</h2>
                  <div className="flex items-center space-x-4">
                    <a href="/CourseUploadPage" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <i className="fas fa-plus mr-2"></i>
                      Upload Course
                    </a>
                    <a href="/EditUploadsPage" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      <i className="fas fa-edit mr-2"></i>
                      Manage Courses
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl.startsWith('http') ? course.thumbnailUrl : `${BASE_URL}${course.thumbnailUrl}`} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <i className="fas fa-play-circle text-3xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{course.modules?.length || 0} modules</span>
                          <span>{formatDate(course.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="max-w-4xl">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">About {channel.name}</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {channel.description || 'No description available.'}
                    </p>
                  </div>

                  {channel.organization && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Organization</h3>
                      <p className="text-gray-600">{channel.organization}</p>
                    </div>
                  )}

                  {Object.values(channel.socialLinks).some(link => link) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Connect</h3>
                      <div className="flex flex-wrap gap-4">
                        {channel.socialLinks.website && (
                          <a href={channel.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                            <i className="fas fa-globe"></i>
                            <span>Website</span>
                          </a>
                        )}
                        {channel.socialLinks.twitter && (
                          <a href={`https://twitter.com/${channel.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                            <i className="fab fa-twitter"></i>
                            <span>Twitter</span>
                          </a>
                        )}
                        {channel.socialLinks.linkedin && (
                          <a href={channel.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                            <i className="fab fa-linkedin"></i>
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {channel.socialLinks.youtube && (
                          <a href={channel.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                            <i className="fab fa-youtube"></i>
                            <span>YouTube</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{formatSubscriberCount(channel.subscriberCount)}</div>
                        <div className="text-sm text-gray-600">Subscribers</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{courses.length}</div>
                        <div className="text-sm text-gray-600">Courses</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0)}</div>
                        <div className="text-sm text-gray-600">Total Modules</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">Channel</div>
                        <div className="text-sm text-gray-600">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <style>{`
        .topbar { position:fixed; top:0; left:0; right:0; height:64px; background-color:white; border-bottom:1px solid #e5e7eb; z-index:50; display:flex; align-items:center; justify-content:space-between; }
        .topbar-left { width:256px; height:100%; display:flex; align-items:center; padding-left:24px; }
        .topbar-right { flex:1; height:100%; display:flex; align-items:center; justify-content:end; padding:0 24px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default TutorChannel;

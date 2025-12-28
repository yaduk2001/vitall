import React, { useEffect, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface Module {
  title: string;
  order: number;
}

interface Course {
  id: string;
  _id?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isPaid: boolean;
  price: number;
  modules: Module[];
  views?: number;
  sales?: number;
  status?: 'active' | 'draft';
}

const EditUploadsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const ustr = localStorage.getItem('user');
      const user = ustr ? JSON.parse(ustr) : null;
      if (!user) return;

      const res = await fetch(`${BASE_URL}/api/courses/by-tutor/${user.id || user._id}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error("Failed to load courses", e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id || course._id || '');
    setEditTitle(course.title);
    setEditDesc(course.description);
    setEditPrice(course.price || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          price: editPrice
        })
      });

      if (res.ok) {
        // Update local state
        setCourses(prev => prev.map(c =>
          (c.id === id || c._id === id)
            ? { ...c, title: editTitle, description: editDesc, price: editPrice }
            : c
        ));
        setEditingId(null);
        showSuccess('Course updated successfully');
      } else {
        showError('Failed to update course');
      }
    } catch (e) {
      console.error('Update failed', e);
      showError('Error updating course');
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This cannot be undone.')) return;

    try {
      // Implement delete API call if available, for now just UI remove
      // const res = await fetch(`${BASE_URL}/api/courses/${id}`, { method: 'DELETE' });
      // if (res.ok) ...
      showWarning('Delete functionality to be implemented in API');
    } catch (e) {
      showError('Delete failed');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: courses.length,
    active: courses.length, // Assuming all active for now
    views: courses.reduce((acc, c) => acc + (c.views || 0), 0),
    revenue: courses.reduce((acc, c) => acc + (c.sales || 0) * (c.price || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm/50">
        <div className="flex items-center space-x-3 log-effect">
          <a href="/Tutordashboard" className="block">
            <img src="/src/assets/logo.jpg" alt="Logo" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
          </a>
        </div>
        <div className="flex items-center space-x-6">
          <a className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors" href="/Tutordashboard">Dashboard</a>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <ProfileMenu />
          </div>
        </div>
      </div>

      <div className="flex flex-1 pt-0">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col fixed h-full z-20 top-16">
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              <li>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all" href="/CourseUploadPage">
                  <i className="fas fa-upload text-sm w-5 text-center"></i>
                  <span>Upload Course</span>
                </a>
              </li>
              <li>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all" href="/analytics">
                  <i className="fas fa-chart-bar text-sm w-5 text-center"></i>
                  <span>Analytics</span>
                </a>
              </li>
              <li>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all" href="/Monetization">
                  <i className="fas fa-dollar-sign text-sm w-5 text-center"></i>
                  <span>Monetization</span>
                </a>
              </li>
              <li>
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-white bg-blue-600 shadow-blue-200 shadow-md transition-all" href="/EditUploadsPage">
                  <i className="fas fa-edit text-sm w-5 text-center"></i>
                  <span>Edit Uploads</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Courses</h1>
                <p className="text-gray-500 mt-2">Manage your content, update pricing, and track performance.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Total Courses</span>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Total Views</span>
                  <div className="text-2xl font-bold text-blue-600">{stats.views}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Draft</option>
                </select>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fas fa-sort-amount-down"></i>
                </button>
              </div>
            </div>

            {/* Content Display */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  <i className="fas fa-box-open"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900">No courses found</h3>
                <p className="text-gray-500 mb-6">Create your first course to get started.</p>
                <a href="/CourseUploadPage" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                  <i className="fas fa-plus"></i>
                  <span>Create Course</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id || course._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                    {/* Thumbnail */}
                    <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative group">
                      <img src={course.thumbnailUrl || '/placeholder.jpg'} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                        <button className="w-10 h-10 bg-white/20 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-white hover:text-blue-600 transition-colors">
                          <i className="fas fa-play ml-1"></i>
                        </button>
                      </div>
                      <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-bold rounded-lg">
                        {course.modules?.length || 0} Modules
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      {editingId === (course.id || course._id) ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-lg font-bold p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Course Title"
                          />
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-blue-500"
                            rows={2}
                            placeholder="Description"
                          />
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-gray-500 mr-2 text-sm">$</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                                className="bg-transparent font-bold w-20 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => saveEdit(course.id || course._id || '')}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">{course.title}</h3>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-lg ${course.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {course.isPaid ? `$${course.price}` : 'Free'}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                  Active
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">{course.description || "No description provided."}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-eye text-gray-400"></i>
                                <span className="font-medium text-gray-700">{course.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="fas fa-user-graduate text-gray-400"></i>
                                <span className="font-medium text-gray-700">{course.sales || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="fas fa-star text-yellow-400"></i>
                                <span className="font-medium text-gray-700">4.8</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => window.location.href = `/edit-course/${course.id || course._id}`}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                title="Manage Content"
                              >
                                <i className="fas fa-layer-group"></i>
                              </button>
                              <button
                                onClick={() => startEdit(course)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Course"
                              >
                                <i className="fas fa-pen"></i>
                              </button>
                              <button
                                onClick={() => deleteCourse(course.id || course._id || '')}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Course"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

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
    </div>
  );
};

export default EditUploadsPage;



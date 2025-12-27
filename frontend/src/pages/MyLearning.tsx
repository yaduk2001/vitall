import React, { useEffect, useState, useMemo } from 'react';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';
import CourseCard, { Course } from '../components/dashboard/CourseCard';

const MyLearning: React.FC = () => {
    const BASE_URL = useMemo(() => (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000', []);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            try {
                const user = JSON.parse(userStr);
                // Using continue-watching as a proxy for "My Learning" for now, 
                // as well as fetching ALL courses and filtering if needed slightly better in future.
                // For now, let's show Continue Watching items as cards + maybe all courses from subscribed channels?
                // To keep it simple and working: Fetch continue watching with high limit
                const res = await fetch(`${BASE_URL}/api/continue-watching/${user.id || user._id}?limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    // Transform continue watching items back to Course shape roughly
                    const mappedCourses = (data.continueWatching || []).map((item: any) => ({
                        id: item.courseId,
                        title: item.courseTitle,
                        thumbnailUrl: item.courseThumbnail,
                        description: `Module: ${item.moduleTitle}`,
                        modules: [] // dummy
                    }));
                    setCourses(mappedCourses);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [BASE_URL]);

    return (
        <div className="min-h-screen bg-gray-50/50 flex font-sans text-gray-900">
            {/* Sidebar (Desktop) */}
            <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen z-30">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6">
                    <a href="/home" className="flex items-center space-x-3">
                        <img src={logoImage} alt="Vital" className="w-10 h-10 rounded-xl shadow-sm" />
                        <span className="text-xl font-bold text-gray-800 hidden lg:block">Vital</span>
                    </a>
                </div>
                <nav className="flex-1 py-6 px-3 space-y-2">
                    {[
                        { icon: 'fa-home', label: 'Dashboard', path: '/home' },
                        { icon: 'fa-compass', label: 'Explore', path: '/channels' },
                        { icon: 'fa-book-open', label: 'My Learning', path: '/library', active: true },
                        { icon: 'fa-users', label: 'Community', path: '/community' },
                        { icon: 'fa-robot', label: 'AI Buddy', path: '/buddy' },
                    ].map(item => (
                        <a key={item.label} href={item.path} className={`flex items-center lg:px-4 px-2 py-3.5 rounded-xl transition-all ${item.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}`}>
                            <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
                            <span className="ml-3 font-medium hidden lg:block">{item.label}</span>
                        </a>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 px-6 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">My Learning</h1>
                    <div className="flex items-center space-x-5">
                        <ProfileMenu />
                    </div>
                </header>

                <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            [1, 2, 3, 4].map(n => <div key={n} className="aspect-video bg-gray-100 rounded-2xl animate-pulse"></div>)
                        ) : courses.length > 0 ? (
                            courses.map(c => <CourseCard key={c.id} course={c} baseUrl={BASE_URL} />)
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                                    <i className="fas fa-book-open"></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No courses started yet</h3>
                                <p className="text-gray-500 mt-2">Go to Explore to find your first course!</p>
                                <a href="/channels" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">Explore Courses</a>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyLearning;

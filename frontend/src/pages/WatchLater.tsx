import React, { useEffect, useState } from 'react';
import CourseCard from '../components/dashboard/CourseCard';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';

const WatchLater: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check auth
        const userJson = localStorage.getItem('user');
        if (userJson) {
            setUser(JSON.parse(userJson));
        } else {
            window.location.href = '/login';
        }

        // Mock fetching "Watch Later" - for now we'll fetch general courses
        // In a real app, this would hit /api/users/watch-later or similar
        const fetchWatchLater = async () => {
            try {
                const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                const res = await fetch(`${BASE_URL}/api/courses`);
                if (res.ok) {
                    const data = await res.json();
                    // Simulate "Watch Later" by taking a random slice or just showing all for demo
                    setCourses(data.courses?.slice(0, 6) || []);
                }
            } catch (e) {
                console.error('Failed to load watch later:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchWatchLater();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/home" className="flex-shrink-0">
                            <img src={logoImage} alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
                        </a>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                            Watch Later
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/home" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                            &larr; Back to Dashboard
                        </a>
                        {user && <ProfileMenu user={user} />}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Saved for Later</h2>
                    <p className="text-slate-500">Your bookmarked courses and videos.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <CourseCard
                                key={course._id || course.id}
                                course={course}
                                baseUrl={(import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000'}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="text-6xl mb-4">🔖</div>
                        <h3 className="text-lg font-medium text-slate-900">No saved courses</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            When you see a course you like, click the 'Watch Later' button to save it here.
                        </p>
                        <a href="/channels" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                            Explore Channels
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default WatchLater;

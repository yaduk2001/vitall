import React, { useEffect, useState } from 'react';
import CourseCard from '../components/dashboard/CourseCard';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';

const Subscriptions: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [subscribedTutorIds, setSubscribedTutorIds] = useState<string[]>([]);

    useEffect(() => {
        // Check auth
        const userJson = localStorage.getItem('user');
        if (userJson) {
            const userData = JSON.parse(userJson);
            setUser(userData);

            const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

            // 1. Fetch Subscriptions
            const fetchSubs = async () => {
                try {
                    const subRes = await fetch(`${BASE_URL}/api/subscriptions/by-student/${userData.id || userData._id}`);
                    if (subRes.ok) {
                        const subData = await subRes.json();
                        const ids = (subData.subscriptions || []).map((s: any) => s.tutorId);
                        setSubscribedTutorIds(ids);
                        return ids;
                    }
                } catch (e) {
                    console.error("Failed to fetch subs", e);
                }
                return [];
            };

            // 2. Fetch Courses and Filter
            const fetchCourses = async (subIds: string[]) => {
                try {
                    const res = await fetch(`${BASE_URL}/api/courses`);
                    if (res.ok) {
                        const data = await res.json();
                        const allCourses = data.courses || [];

                        // Filter for courses from subscribed tutors
                        // If subIds is empty, we show nothing or maybe recommendations? Let's show specific message.
                        if (subIds.length > 0) {
                            const filtered = allCourses.filter((c: any) => subIds.includes(c.tutorId));
                            setCourses(filtered);
                        } else {
                            setCourses([]);
                        }
                    }
                } catch (e) {
                    console.error('Failed to load courses:', e);
                } finally {
                    setLoading(false);
                }
            };

            fetchSubs().then(ids => fetchCourses(ids));

        } else {
            window.location.href = '/login';
        }
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
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            Subscriptions
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Latest from your Creators</h2>
                    <p className="text-slate-500">New courses and videos from channels you follow.</p>
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
                        <div className="text-6xl mb-4 text-slate-300">📺</div>
                        <h3 className="text-lg font-medium text-slate-900">No updates yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            {subscribedTutorIds.length === 0
                                ? "You haven't subscribed to any channels yet."
                                : "The channels you follow haven't posted any courses yet."}
                        </p>
                        <a href="/channels" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                            Discover Channels
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Subscriptions;

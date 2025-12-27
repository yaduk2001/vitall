import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import ProfileMenu from '../components/ProfileMenu';

const CourseDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            setUser(JSON.parse(userJson));
        }
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // Fetch Course
            const res = await fetch(`${BASE_URL}/api/courses/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data.course);
            }

            // Check Enrollment
            const userJson = localStorage.getItem('user');
            if (userJson) {
                const u = JSON.parse(userJson);
                const enrRes = await fetch(`${BASE_URL}/api/enrollments/by-student/${u.id || u._id}`);
                if (enrRes.ok) {
                    const { enrollments } = await enrRes.json();
                    const enrolled = enrollments.some((e: any) => e.courseId === id);
                    setIsEnrolled(enrolled);
                }
            }
        } catch (e) {
            console.error("Failed to load course details", e);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setEnrolling(true);
        try {
            const res = await fetch(`${BASE_URL}/api/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: user.id || user._id,
                    courseId: id
                })
            });
            if (res.ok) {
                setIsEnrolled(true);
                setShowEnrollModal(true); // Success modal
            } else {
                alert('Failed to enroll. Please try again.');
            }
        } catch (e) {
            console.error('Enrollment error:', e);
            alert('An error occurred during enrollment.');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!course) {
        return <div className="p-8 text-center text-slate-500">Course not found.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/home" className="flex-shrink-0">
                            <img src={logoImage} alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
                        </a>
                        <h1 className="text-xl font-bold text-slate-900 truncate max-w-md">
                            {course.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/home" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                            &larr; Dashboard
                        </a>
                        {user && <ProfileMenu user={user} />}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Hero & Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Hero */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                            <div className="relative aspect-video bg-slate-100">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="text-4xl">📷</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <h1 className="text-3xl font-bold mb-2 shadow-sm">{course.title}</h1>
                                    <div className="flex items-center gap-4 text-sm font-medium">
                                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">{course.modules?.length || 0} Modules</span>
                                        <span>By {course.tutorName || 'Tutor'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">About this Course</h2>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                    {course.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        {/* Modules List */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Course Content</h2>
                            <div className="space-y-4">
                                {course.modules.map((m: any, idx: number) => (
                                    <div key={idx} className="flex items-center p-4 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mr-4">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-slate-900">{m.title}</h3>
                                            <p className="text-xs text-slate-500 capitalize">{m.type}</p>
                                        </div>
                                        {isEnrolled ? (
                                            <div className="text-indigo-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Enrollment Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                                <div className="text-center mb-6">
                                    <span className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Price</span>
                                    <div className="text-4xl font-bold text-slate-900 mt-2">
                                        {course.isPaid ? `$${course.price}` : 'Free'}
                                    </div>
                                </div>
                                {isEnrolled ? (
                                    <button
                                        onClick={() => navigate(`/video/${id}`)}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-200"
                                    >
                                        Continue Learning
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                                <div className="mt-6 space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        <span>Full Lifetime Access</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        <span>Certificate of Completion</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        <span>Access on Mobile and Desktop</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Enrollment Success Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🎉
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">You're Enrolled!</h3>
                        <p className="text-slate-500 mb-6">Welcome to the course. You can now access all modules and materials.</p>
                        <button
                            onClick={() => {
                                setShowEnrollModal(false);
                                navigate(`/video/${id}`);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Start Learning
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDetails;

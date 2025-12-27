import React, { useState, useEffect } from 'react';
import CourseCard, { Course } from './CourseCard';

interface Channel {
    tutorId: string;
    name: string;
}

interface SubscriptionRowProps {
    channel: Channel;
    baseUrl: string;
}

const SubscriptionRow: React.FC<SubscriptionRowProps> = ({ channel, baseUrl }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${baseUrl}/api/courses/by-tutor/${channel.tutorId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                }
            } catch (error) {
                console.error('Error loading courses for channel:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, [channel.tutorId, baseUrl]);

    if (!loading && courses.length === 0) return null;

    return (
        <div className="mb-10 last:mb-0 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {channel.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-none">
                            <a href={`/organization/${channel.tutorId}`} className="hover:text-blue-600 transition-colors">
                                {channel.name}
                            </a>
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Subscribed Channel</p>
                    </div>
                </div>

                <a href={`/organization/${channel.tutorId}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center">
                    View Channel <i className="fas fa-arrow-right ml-1"></i>
                </a>
            </div>

            <div className="relative group/slider">
                {/* Scroll Container */}
                <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide flex gap-5 snap-x">
                    {loading ? (
                        // Skeletons
                        [1, 2, 3, 4].map(k => (
                            <div key={k} className="min-w-[260px] w-[260px] h-[280px] bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))
                    ) : (
                        courses.slice(0, 6).map(course => (
                            <div key={course.id} className="min-w-[260px] w-[260px] snap-start">
                                <CourseCard
                                    course={{ ...course, tutorName: channel.name }}
                                    baseUrl={baseUrl}
                                    onShare={(e) => {
                                        e.preventDefault();
                                        navigator.clipboard.writeText(`${window.location.origin}/video/${course.id}`);
                                        alert('Link copied!');
                                    }}
                                />
                            </div>
                        ))
                    )}

                    {courses.length > 6 && (
                        <div className="min-w-[150px] flex items-center justify-center">
                            <a
                                href={`/organization/${channel.tutorId}`}
                                className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-white border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-500 hover:text-blue-600 hover:scale-110 transition-all font-semibold text-xs text-center p-2"
                            >
                                <span>Show All</span>
                                <span className="text-lg mt-1">{courses.length}</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Fade Gradients for visual scrolling indication */}
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-50/90 to-transparent pointer-events-none group-hover/slider:opacity-0 transition-opacity duration-300 lg:block hidden"></div>
            </div>
        </div>
    );
};

export default SubscriptionRow;

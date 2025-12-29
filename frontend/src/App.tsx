import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import TutorDashboard from './pages/TutorDashboard';
import CourseUploadPage from './pages/CourseUploadPage';
import UploadPageRedirect from './pages/UploadPageRedirect';
import EditUploadsPage from './pages/EditUploadsPage';
import EditCourseContent from './pages/EditCourseContent';
import Analytics from './pages/Analytics';
import Monetization from './pages/Monetization';
import Organization from './pages/Organization';
import OrganizationCertificates from './pages/OrganizationCertificates';
import VideoPlayer from './pages/VideoPlayer';
import Admin from './pages/Admin';
import ChannelSetup from './pages/ChannelSetup';
import TutorChannel from './pages/TutorChannel';
import ChannelsList from './pages/ChannelsList';
import DebugChannel from './pages/DebugChannel';
import TutorComments from './pages/TutorComments';
import StudentBuddy from './components/StudentBuddy';
import BuddyStudio from './pages/BuddyStudio';
import MyLearning from './pages/MyLearning';
import Community from './pages/Community';
import WatchLater from './pages/WatchLater';
import Subscriptions from './pages/Subscriptions';
import CourseDetails from './pages/CourseDetails';

import CreatorDashboard from './pages/CreatorDashboard';
import ContentUploadPage from './pages/ContentUploadPage';
import ContentPlayer from './pages/ContentPlayer';
import CreatorAnalytics from './pages/CreatorAnalytics';
import CreatorSettings from './pages/CreatorSettings';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/userhome" element={<UserDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Tutordashboard" element={<TutorDashboard />} />
        <Route path="/CreatorDashboard" element={<CreatorDashboard />} />
        <Route path="/CourseUploadPage" element={<CourseUploadPage />} />
        <Route path="/ContentUploadPage" element={<ContentUploadPage />} />
        <Route path="/UploadPage" element={<UploadPageRedirect />} />
        <Route path="/EditUploadsPage" element={<EditUploadsPage />} />
        <Route path="/edit-course/:id" element={<EditCourseContent />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/Monetization" element={<Monetization />} />
        <Route path="/organization/:id" element={<Organization />} />
        <Route path="/organization/:id/certificates" element={<OrganizationCertificates />} />
        <Route path="/video/:id" element={<VideoPlayer />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/channel-setup" element={<ChannelSetup />} />
        <Route path="/channel" element={<TutorChannel />} />
        <Route path="/channels" element={<ChannelsList />} />
        <Route path="/debug-channel" element={<DebugChannel />} />
        <Route path="/tutor-comments" element={<TutorComments />} />
        <Route path="/buddy" element={<BuddyStudio />} />

        <Route path="/library" element={<MyLearning />} />
        <Route path="/community" element={<Community />} />
        <Route path="/watch-later" element={<WatchLater />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/watch/:id" element={<ContentPlayer />} />

        {/* Creator Routes */}
        <Route path="/creator/analytics" element={<CreatorAnalytics />} />
        <Route path="/creator/settings" element={<CreatorSettings />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <StudentBuddy />
    </>
  );
};

export default App;



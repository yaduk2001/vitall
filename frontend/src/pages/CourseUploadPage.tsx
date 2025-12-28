import React, { useEffect, useRef, useState } from 'react';
import ProfileMenu from '../components/ProfileMenu';
import ModuleUploadCard from '../components/upload/ModuleUploadCard';
import TrainingModal from '../components/upload/TrainingModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface Module {
  id: number;
  title: string;
  type: 'video' | 'document' | 'audio';
  video: File | null;
  document: File | null;
  order: number;
}

const CourseUploadPage: React.FC = () => {
  const thumbRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const [moduleCount, setModuleCount] = useState<number>(1);
  const [modules, setModules] = useState<Module[]>([
    { id: 1, title: 'Module 1', type: 'video', video: null, document: null, order: 1 }
  ]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [trainingStep, setTrainingStep] = useState<number>(0);
  const [trainingPhase, setTrainingPhase] = useState<'progress' | 'graph'>('progress');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [price, setPrice] = useState<string>('');

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    // Check if user is logged in and is an organization
    const userJson = localStorage.getItem('user');
    let currentUser: any = null;
    try {
      currentUser = userJson ? JSON.parse(userJson) : null;
    } catch { }

    if (!currentUser) {
      showError('Please login to upload courses');
      window.location.href = '/login';
      return;
    }

    if (currentUser.role !== 'organization') {
      showError('Only organizations can upload courses. Please register as an organization.');
      window.location.href = '/register';
      return;
    }

    if (!currentUser.isApproved) {
      showWarning('Your organization account is pending admin approval. Please wait for approval before uploading courses.');
      window.location.href = '/';
      return;
    }
  }, []);

  const handleModuleCountChange = (count: number) => {
    setModuleCount(count);

    // Update modules array
    const newModules: Module[] = [];
    for (let i = 1; i <= count; i++) {
      const existingModule = modules.find(m => m.id === i);
      newModules.push({
        id: i,
        title: existingModule?.title || `Module ${i}`,
        type: existingModule?.type || 'video',
        video: existingModule?.video || null,
        document: existingModule?.document || null,
        order: i
      });
    }
    setModules(newModules);
  };

  const handleModuleTitleChange = (id: number, title: string) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, title } : m
    ));
  };

  const handleModuleTypeChange = (id: number, type: 'video' | 'document' | 'audio') => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, type, video: (type === 'video' || type === 'audio') ? m.video : null, document: type === 'document' ? m.document : null } : m
    ));
  };

  const handleVideoUpload = (id: number, file: File | null) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, video: file } : m
    ));
  };

  const handleDocumentUpload = (id: number, file: File | null) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, document: file } : m
    ));
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onNext() {
    const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const title = (titleRef.current?.value || '').trim();
    const description = (descRef.current?.value || '').trim();

    if (!title) {
      showError('Please enter a course name');
      return;
    }

    // Validate that all modules have content
    const modulesWithoutContent = modules.filter(m =>
      ((m.type === 'video' || m.type === 'audio') && !m.video) || (m.type === 'document' && !m.document)
    );
    if (modulesWithoutContent.length > 0) {
      showError(`Please upload content for all modules. Missing content for: ${modulesWithoutContent.map(m => m.title).join(', ')}`);
      return;
    }

    const userJson = localStorage.getItem('user');
    let currentUser: any = null;
    try {
      currentUser = userJson ? JSON.parse(userJson) : null;
    } catch { }

    console.log('Current user for course upload:', currentUser);
    console.log('TutorId being used:', currentUser.id || currentUser._id);

    try {
      // Upload global thumbnail
      let thumbnailUrl = '';
      const tf = thumbRef.current?.files?.[0];
      if (tf) {
        console.log('Uploading course thumbnail:', tf.name);
        const thumbFd = new FormData();
        thumbFd.append('title', `${title} - Thumbnail`);
        thumbFd.append('thumbnail', tf);
        const tres = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: thumbFd });
        if (tres.ok) {
          const tjson = await tres.json();
          thumbnailUrl = (tjson.video && tjson.video.thumbnailUrl) || '';
          console.log('Thumbnail uploaded successfully:', thumbnailUrl);
        } else {
          console.error('Failed to upload thumbnail:', await tres.text());
          showError('Failed to upload thumbnail. Please try again.');
          return;
        }
      }

      // Upload each module's content
      const modulePayloads: Array<{
        title: string;
        order: number;
        type: string;
        videoUrl: string;
        documentUrl: string;
        documentType: string;
        documentName: string;
        lessonId?: string;
        resourceUrl?: string
      }> = [];

      for (const m of modules) {
        if ((m.type === 'video' || m.type === 'audio') && m.video) {
          console.log(`Uploading ${m.type} for module: ${m.title}`);
          const f = new FormData();
          f.append('title', `${title} - ${m.title}`);
          f.append('video', m.video);
          const r = await fetch(`${BASE_URL}/api/videos`, { method: 'POST', body: f });
          if (r.ok) {
            const j = await r.json();
            const videoUrl = j.video?.videoUrl || '';
            console.log(`${m.type} uploaded successfully for module ${m.title}:`, videoUrl);
            modulePayloads.push({
              title: m.title,
              order: m.order,
              type: m.type, // Use actual type
              videoUrl,
              documentUrl: '',
              documentType: '',
              documentName: '',
              lessonId: '',
              resourceUrl: ''
            });
          } else {
            console.error(`Failed to upload ${m.type} for module ${m.title}:`, await r.text());
            showError(`Failed to upload ${m.type} for module: ${m.title}`);
            return;
          }
        } else if (m.type === 'document' && m.document) {
          console.log(`Uploading document for module: ${m.title}`);
          console.log('Document file details:', {
            name: m.document.name,
            size: m.document.size,
            type: m.document.type
          });

          const f = new FormData();
          f.append('document', m.document);

          console.log('FormData created, sending request to:', `${BASE_URL}/api/documents`);

          const r = await fetch(`${BASE_URL}/api/documents`, { method: 'POST', body: f });

          console.log('Upload response status:', r.status);
          console.log('Upload response ok:', r.ok);

          if (r.ok) {
            const j = await r.json();
            console.log('Upload response JSON:', j);
            const documentUrl = j.documentUrl || '';
            const documentType = j.documentType || '';
            const documentName = j.documentName || '';
            const lessonId = j.lessonId || '';
            console.log(`Document uploaded successfully for module ${m.title}:`, documentUrl);
            modulePayloads.push({
              title: m.title,
              order: m.order,
              type: 'document',
              videoUrl: '',
              documentUrl,
              documentType,
              documentName,
              lessonId,
              resourceUrl: ''
            });
          } else {
            const errorText = await r.text();
            console.error(`Failed to upload document for module ${m.title}:`, errorText);
            console.error('Response status:', r.status);
            console.error('Response headers:', r.headers);
            showError(`Failed to upload document for module: ${m.title}. Error: ${errorText}`);
            return;
          }
        }
      }

      const coursePayload = {
        tutorId: currentUser.id || currentUser._id,
        title,
        description,
        thumbnailUrl,
        tags: [],
        modules: modulePayloads,
        isPaid,
        price: isPaid ? parseFloat(price) : 0
      };

      console.log('Course payload being sent:', coursePayload);
      console.log('Number of modules being saved:', modulePayloads.length);
      console.log('Module payloads details:', modulePayloads);

      const courseRes = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coursePayload)
      });

      console.log('Course creation response status:', courseRes.status);
      console.log('Course creation response ok:', courseRes.ok);

      if (!courseRes.ok) {
        const err = await courseRes.json().catch(() => ({}));
        console.error('Course creation failed:', err);
        console.error('Response status:', courseRes.status);
        console.error('Response text:', await courseRes.text().catch(() => 'Could not read response text'));
        throw new Error(err.error || 'Failed to create course');
      }

      const courseData = await courseRes.json();
      console.log('Course created successfully:', courseData);
      console.log('Course ID:', courseData.course?.id);
      console.log('Modules in created course:', courseData.course?.modules?.length);

      showSuccess('Course created successfully!');
      // window.location.href = '/channel';

      setShowSuccessModal(true);
      setTrainingPhase('progress');

      // Animate progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Wait a moment at 100% then switch and start graph animation
          setTimeout(() => {
            setTrainingPhase('graph');
            // Start graph animation sequence
            setTimeout(() => setTrainingStep(1), 100);
            setTimeout(() => setTrainingStep(2), 2500);
          }, 1000);
        }
        setProgressValue(progress);
      }, 50); // 50ms * 50 steps = 2.5 seconds total duration
    } catch (e: any) {
      showError(`Failed to upload: ${e?.message || e}`);
    }
  }

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
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-white bg-blue-600 shadow-blue-200 shadow-md transition-all" href="/CourseUploadPage">
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
                <a className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all" href="/EditUploadsPage">
                  <i className="fas fa-edit text-sm w-5 text-center"></i>
                  <span>Edit Uploads</span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-50">
            <button className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 w-full transition-all">
              <i className="fas fa-cog text-sm w-5 text-center"></i>
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header Area */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Course</h1>
                <p className="text-gray-500 mt-2">Share your knowledge with the world through video courses</p>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">
                  <i className="fas fa-info"></i>
                </span>
                Course Details
              </h3>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name</label>
                  <input
                    ref={titleRef}
                    type="text"
                    placeholder="e.g. Advanced Machine Learning Patterns"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Description</label>
                  <textarea
                    ref={descRef}
                    placeholder="Describe what students will learn..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 font-medium h-32 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Course Thumbnail</label>
                  <div className="flex gap-6 items-start">
                    <div
                      className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                      onClick={() => thumbRef.current?.click()}
                    >
                      <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <i className={`fas ${thumbnailPreview ? 'fa-sync-alt' : 'fa-image'} text-lg`}></i>
                      </div>
                      <p className="font-medium text-gray-800 mb-1">
                        {thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}
                      </p>
                      <p className="text-xs text-gray-400">1280x720 recommended (Max 50MB)</p>

                      <input
                        ref={thumbRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                      />
                    </div>

                    {thumbnailPreview && (
                      <div className="w-64 aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200 flex-shrink-0">
                        <img
                          src={thumbnailPreview}
                          alt="Course preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 text-sm">
                  <i className="fas fa-tag"></i>
                </span>
                Pricing Strategy
              </h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div
                  className={`flex-1 p-6 border-2 rounded-xl cursor-pointer transition-all ${!isPaid ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setIsPaid(false)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">Free Course</span>
                    {!isPaid && <i className="fas fa-check-circle text-blue-500 text-xl"></i>}
                  </div>
                  <p className="text-sm text-gray-500">Accessible to everyone for free. Great for building an audience.</p>
                </div>

                <div
                  className={`flex-1 p-6 border-2 rounded-xl cursor-pointer transition-all ${isPaid ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setIsPaid(true)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">Paid Course</span>
                    {isPaid && <i className="fas fa-check-circle text-blue-500 text-xl"></i>}
                  </div>
                  <p className="text-sm text-gray-500">Set a one-time price for lifetime access.</p>

                  {isPaid && (
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="19.99"
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Module Config Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-sm">
                    <i className="fas fa-layer-group"></i>
                  </span>
                  Structure
                </h3>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-600 mb-4 font-medium">How many modules does this course have?</p>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleModuleCountChange(count)}
                      className={`w-16 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${moduleCount === count
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200 transform -translate-y-1'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-lg font-bold leading-none">{count}</span>
                      <span className="text-[10px] font-medium opacity-80">Mod</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {modules.map((module) => (
                  <ModuleUploadCard
                    key={module.id}
                    {...module}
                    videoFile={module.video}
                    documentFile={module.document}
                    onTitleChange={(title) => handleModuleTitleChange(module.id, title)}
                    onTypeChange={(type) => handleModuleTypeChange(module.id, type)}
                    onVideoUpload={(file) => handleVideoUpload(module.id, file)}
                    onDocumentUpload={(file) => handleDocumentUpload(module.id, file)}
                  />
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end pt-4">
              <button
                onClick={onNext}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center space-x-3"
              >
                <span>Publish Course</span>
                <i className="fas fa-rocket"></i>
              </button>
            </div>

          </div>
        </div>
      </div >

      {showSuccessModal && (
        <TrainingModal
          progressValue={progressValue}
          trainingPhase={trainingPhase}
          trainingStep={trainingStep}
          onViewPage={() => window.location.href = '/channel'}
        />
      )}

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
    </div >
  );
};

export default CourseUploadPage;
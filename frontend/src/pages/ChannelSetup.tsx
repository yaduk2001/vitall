import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileMenu from '../components/ProfileMenu';

const ChannelSetup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    description: '',
    bannerUrl: '',
    avatarUrl: '',
    socialLinks: {
      website: '',
      twitter: '',
      linkedin: '',
      youtube: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Load existing channel data if available
    const loadChannelData = async () => {
      const user = getUser();
      if (!user) return;
      
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/channels/${user.id || user._id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.channel) {
            setIsEditing(true);
            setFormData({
              name: data.channel.name || '',
              organization: data.channel.organization || '',
              description: data.channel.description || '',
              bannerUrl: data.channel.bannerUrl || '',
              avatarUrl: data.channel.avatarUrl || '',
              socialLinks: data.channel.socialLinks || {
                website: '',
                twitter: '',
                linkedin: '',
                youtube: ''
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to load channel data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [BASE_URL]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch(`${BASE_URL}/api/images`, {
        method: 'POST',
        body: formDataUpload
      });
      
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.imageUrl || data.thumbnailUrl || '';
        if (imageUrl) {
          setFormData(prev => ({
            ...prev,
            [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: imageUrl
          }));
        } else {
          alert('Upload successful but no URL returned');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to upload image: ${errorData.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Image upload error:', e);
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        tutorId: user.id || user._id,
        ...formData
      };

      console.log('Form data before submission:', formData);
      console.log('Full payload being sent:', payload);
      console.log('Social links specifically:', payload.socialLinks);

      const res = await fetch(`${BASE_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Channel save response status:', res.status);

      if (res.ok) {
        const responseData = await res.json();
        console.log('Channel save response data:', responseData);
        alert(isEditing ? 'Channel updated successfully!' : 'Channel setup completed successfully!');
        // Small delay to ensure the data is saved, then navigate
        setTimeout(() => {
          navigate('/channel');
        }, 1000);
      } else {
        const errorText = await res.text();
        console.error('Channel save failed:', res.status, errorText);
        alert(`Failed to save channel settings: ${errorText}`);
      }
    } catch (e) {
      console.error('Channel save error:', e);
      alert('Failed to save channel settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading channel settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="topbar">
        <div className="topbar-left logo-effect">
          <a href="/Tutordashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold logo-text">SUPE.AI</span>
          </a>
        </div>
        <div className="topbar-right">
          <a className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors" href="/Tutordashboard">Dashboard</a>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditing ? 'Edit Channel' : 'Channel Setup'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isEditing 
              ? 'Update your channel profile and settings.' 
              : 'Create your YouTube-like channel profile for students to discover and subscribe to your courses.'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel Banner</label>
              <div className="relative">
                <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                  {formData.bannerUrl ? (
                    <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <i className="fas fa-image text-2xl"></i>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Upload a banner image for your channel (recommended: 1920x320px)</p>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel Avatar</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="fas fa-user text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload channel avatar</p>
                  <p className="text-sm text-gray-500">Recommended: 200x200px square image</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Channel Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your channel name"
                />
              </div>
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">Organization/Institute</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your organization or institute"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Channel Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your channel and what students can expect to learn..."
              />
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Social Links (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="social.website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    id="social.website"
                    name="social.website"
                    value={formData.socialLinks.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label htmlFor="social.twitter" className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    type="text"
                    id="social.twitter"
                    name="social.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="@yourusername"
                  />
                </div>
                <div>
                  <label htmlFor="social.linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    id="social.linkedin"
                    name="social.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label htmlFor="social.youtube" className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                  <input
                    type="text"
                    id="social.youtube"
                    name="social.youtube"
                    value={formData.socialLinks.youtube}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="youtube.com/c/yourchannel"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Channel' : 'Save Channel')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .topbar { position:fixed; top:0; left:0; right:0; height:64px; background-color:white; border-bottom:1px solid #e5e7eb; z-index:20; display:flex; align-items:center; justify-content:space-between; }
        .topbar-left { width:256px; height:100%; display:flex; align-items:center; padding-left:24px; }
        .topbar-right { flex:1; height:100%; display:flex; align-items:center; justify-content:space-between; padding:0 24px; }
      `}</style>
    </div>
  );
};

export default ChannelSetup;

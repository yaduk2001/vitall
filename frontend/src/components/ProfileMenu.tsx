import React, { useEffect, useRef, useState } from 'react';

interface User {
  id?: string;
  _id?: string;
  avatarUrl?: string;
  name?: string;
  email?: string;
  role?: string;
}

const ProfileMenu: React.FC<{ user?: User }> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Priority: user prop > localStorage > default
    if (user?.avatarUrl) {
      setAvatar(user.avatarUrl);
    } else {
      try {
        const a = localStorage.getItem('avatarUrl');
        if (a) setAvatar(a);
      } catch { }
    }

    const onDoc = (e: any) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [user?.avatarUrl]);

  function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = String(ev.target?.result || '');
      setAvatar(url);
      try { localStorage.setItem('avatarUrl', url); } catch { }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} className="flex items-center focus:outline-none">
        {avatar ? (
          <img src={avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-lg cursor-pointer">
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => inputRef.current?.click()}>Update Profile Picture</button>
          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('avatarUrl'); location.href = '/login'; }}>Logout</button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUploadChange} />
    </div>
  );
};

export default ProfileMenu;



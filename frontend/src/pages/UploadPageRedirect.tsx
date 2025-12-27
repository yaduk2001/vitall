import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadPageRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/CourseUploadPage', { replace: true }); }, [navigate]);
  return <div>Redirecting to Course Upload...</div>;
};

export default UploadPageRedirect;



import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Channel = {
  name?: string;
  subscriberCount?: number;
  avatarUrl?: string;
  organization?: string;
};

type Course = {
  id: string;
  title: string;
  modules?: { id: string }[];
};

const OrganizationCertificates: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!id) return;
    (async function run() {
      try {
        const channelRes = await fetch(`${BASE_URL}/api/channels/${id}`);
        if (channelRes.ok) {
          const { channel } = await channelRes.json();
          setChannel(channel);
        }
      } catch (error) {
        console.error('Failed to fetch channel info', error);
      }

      try {
        const coursesRes = await fetch(`${BASE_URL}/api/courses/by-tutor/${id}`);
        if (coursesRes.ok) {
          const { courses } = await coursesRes.json();
          setCourses(courses || []);
        }
      } catch (error) {
        console.error('Failed to fetch courses', error);
      }

      setLoading(false);
    })();
  }, [id, BASE_URL]);

  if (!id) {
    return (
      <div className="cert-page">
        <div className="card">
          <p>Channel not found.</p>
          <button onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cert-page">
        <div className="card">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
        <style>{`
          .spinner {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 3px solid rgba(203, 213, 225, 0.6);
            border-top-color: rgba(59, 130, 246, 0.8);
            animation: spin 0.9s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const completedCourses = courses.filter((course) => course.modules?.length);

  return (
    <div className="cert-page">
      <div className="cert-container">
        <header className="cert-header">
          <Link to={`/organization/${id}`} className="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to Channel
          </Link>
          <h1>Certificates</h1>
          {channel && (
            <div className="channel-meta">
              <img
                src={channel.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face&auto=format'}
                alt={channel.name}
              />
              <div>
                <span className="channel-name">{channel.name}</span>
                <span className="channel-details">
                  {channel.subscriberCount || 0} subscribers
                  {channel.organization ? ` • ${channel.organization}` : ''}
                </span>
              </div>
            </div>
          )}
        </header>

        <section className="cert-body">
          {completedCourses.length > 0 ? (
            <div className="cert-grid">
              {completedCourses.map((course) => (
                <article key={course.id} className="cert-card">
                  <div className="cert-icon">🎓</div>
                  <h2>{course.title}</h2>
                  <p>Download your certificate once the tutor approves completion.</p>
                  <button className="cta" type="button" disabled>
                    Download (Coming soon)
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="placeholder">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15l-3.5 2 .9-4L7 10l4-.3L12 6l1 3.7 4 .3-2.4 3 1 4z"></path>
                <circle cx="12" cy="12" r="9"></circle>
              </svg>
              <h2>No certificates yet</h2>
              <p>Complete the modules in your enrolled courses to unlock certificates from this channel.</p>
              <Link to={`/organization/${id}#courses`} className="cta-link">
                Browse courses
              </Link>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .cert-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 15% 15%, rgba(191, 226, 255, 0.55), transparent 40%),
            radial-gradient(circle at 85% 0%, rgba(254, 215, 170, 0.45), transparent 45%),
            linear-gradient(135deg, #f8fafc 0%, #eef2ff 70%, #ffffff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          box-sizing: border-box;
        }
        .cert-container {
          width: 100%;
          max-width: 960px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 32px;
          border: 1px solid rgba(203, 213, 225, 0.6);
          box-shadow: 0 24px 60px rgba(148, 163, 184, 0.3);
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .cert-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(37, 99, 235, 0.85);
          text-decoration: none;
          font-weight: 500;
        }
        .back-link:hover {
          color: rgba(29, 78, 216, 0.95);
        }
        .cert-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #1e293b;
        }
        .channel-meta {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .channel-meta img {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 3px solid rgba(226, 232, 240, 0.8);
          object-fit: cover;
        }
        .channel-name {
          font-weight: 600;
          color: #1e293b;
        }
        .channel-details {
          display: block;
          font-size: 13px;
          color: rgba(71, 85, 105, 0.8);
        }
        .cert-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cert-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        .cert-card {
          padding: 24px;
          border-radius: 20px;
          border: 1px solid rgba(203, 213, 225, 0.55);
          background: rgba(248, 250, 252, 0.95);
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          color: #1e293b;
        }
        .cert-icon {
          font-size: 28px;
        }
        .cert-card h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        .cert-card p {
          margin: 0;
          font-size: 14px;
          color: rgba(71, 85, 105, 0.75);
        }
        .cta {
          align-self: flex-start;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(14, 165, 233, 0.35));
          color: rgba(30, 41, 59, 0.85);
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .placeholder {
          display: grid;
          justify-items: center;
          gap: 16px;
          padding: 48px 24px;
          border-radius: 24px;
          border: 1px dashed rgba(203, 213, 225, 0.7);
          background: rgba(248, 250, 252, 0.95);
          text-align: center;
        }
        .placeholder h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }
        .placeholder p {
          margin: 0;
          color: rgba(71, 85, 105, 0.75);
          max-width: 420px;
        }
        .cta-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.12);
          color: rgba(37, 99, 235, 0.85);
          text-decoration: none;
          font-weight: 600;
        }
        .cta-link:hover {
          background: rgba(59, 130, 246, 0.18);
        }
        @media (max-width: 768px) {
          .cert-container {
            padding: 24px;
          }
          .channel-meta {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationCertificates;

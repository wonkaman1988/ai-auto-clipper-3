import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [clips, setClips] = useState([]);
  const [activeTab, setActiveTab] = useState('ready');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, ready: 0, processing: 0 });

  useEffect(() => {
    // Load user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Fetch clips
    if (userData.id) {
      fetch(`/api/clips/${userData.id}`)
        .then(res => res.json())
        .then(data => {
          setClips(data);
          setStats({
            total: data.length,
            ready: data.filter(c => c.status === 'ready').length,
            processing: data.filter(c => c.status === 'processing').length,
          });
        });
    }
  }, []);

  const handleDownload = (clipUrl) => {
    window.open(clipUrl, '_blank');
  };

  const handleShare = (clipUrl) => {
    navigator.share?.({ title: 'AI Auto-Clipper', url: clipUrl });
  };

  const filteredClips = clips.filter(c => c.status === activeTab || activeTab === 'all');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🎬 AI Auto-Clipper</h1>
        <div style={styles.userInfo}>
          <span>{user?.name}</span>
          <span style={styles.plan}>{user?.plan?.toUpperCase()}</span>
        </div>
      </header>

      <div style={styles.stats}>
        <div style={styles.statBox}>
          <h3>{stats.total}</h3>
          <p>Total Clips</p>
        </div>
        <div style={styles.statBox}>
          <h3>{stats.ready}</h3>
          <p>Ready to Post</p>
        </div>
        <div style={styles.statBox}>
          <h3>{stats.processing}</h3>
          <p>Processing</p>
        </div>
      </div>

      <div style={styles.tabs}>
        {['ready', 'processing', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === tab ? '#7c3aed' : '#e5e7eb',
              color: activeTab === tab ? 'white' : 'black',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.clipsGrid}>
        {filteredClips.length === 0 ? (
          <p style={styles.noClips}>No clips yet. Check back soon!</p>
        ) : (
          filteredClips.map(clip => (
            <div key={clip._id} style={styles.clipCard}>
              <div style={styles.clipThumbnail}>
                <span>📹 {clip.duration}s</span>
              </div>
              <h4>{clip.title}</h4>
              <p>{clip.description}</p>
              <div style={styles.clipStatus}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: clip.status === 'ready' ? '#10b981' : '#f59e0b',
                }}>
                  {clip.status.toUpperCase()}
                </span>
              </div>
              <div style={styles.actions}>
                <button onClick={() => handleDownload(clip.videoUrl)} style={styles.actionBtn}>
                  ⬇️ Download
                </button>
                <button onClick={() => handleShare(clip.videoUrl)} style={styles.actionBtn}>
                  📤 Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: '#7c3aed',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  plan: {
    backgroundColor: '#a78bfa',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '30px',
  },
  statBox: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  tabButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  clipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  clipCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  clipThumbnail: {
    backgroundColor: '#6b7280',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
  },
  clipStatus: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    padding: '0 15px',
  },
  badge: {
    padding: '5px 10px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    padding: '0 15px 15px',
  },
  actionBtn: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#dbeafe',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  noClips: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '40px',
    gridColumn: '1/-1',
  },
};

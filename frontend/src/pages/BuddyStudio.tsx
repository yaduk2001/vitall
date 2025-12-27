import React, { useMemo, useState, useEffect, useCallback } from 'react';
import logoImage from '../assets/logo.jpg';
import BuddyModelViewer from '../components/BuddyModelViewer';

const personaPresets = [
  { id: 'mentor', title: 'Mentor', desc: 'Helpful explanations and structured study plans.' },
  { id: 'motivator', title: 'Motivator', desc: 'High-energy encouragement and streak tracking.' },
  { id: 'friend', title: 'Friendly', desc: 'Casual tone, quick check-ins, daily nudges.' }
];

const colorPalettes = [
  { id: 'aurora', label: 'Aurora Pulse', colors: ['#1e3a8a', '#9333ea'] },
  { id: 'sunset', label: 'Sunset Bloom', colors: ['#f97316', '#ec4899'] },
  { id: 'neon', label: 'Neon Mint', colors: ['#14b8a6', '#22d3ee'] }
];

const buddyModels = [
  { id: 'hi4', label: 'New Buddy', path: '/studybuddy/female buddy/hi4.glb' }
];

const BuddyStudio: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState('mentor');
  const [selectedPalette, setSelectedPalette] = useState('aurora');
  const [voice, setVoice] = useState('balanced');
  const [buddyName, setBuddyName] = useState('Nova');
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedModel, setSelectedModel] = useState('hi4');
  const [topColor, setTopColor] = useState('#f97316');
  const [bottomColor, setBottomColor] = useState('#0f172a');
  const [footwearColor, setFootwearColor] = useState('#2563eb');
  const [hairColor, setHairColor] = useState('#d97706');
  type AvailableMaterials = {
    top: boolean;
    bottom: boolean;
    footwear: boolean;
    hair: boolean;
  };
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterials>({
    top: true,
    bottom: true,
    footwear: true,
    hair: true
  });
  const [renderMode, setRenderMode] = useState<'customizable' | 'original'>('customizable');

  // Animation Control State
  const [animations, setAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string | undefined>(undefined);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);

  const handleAnimationsLoaded = useCallback((loadedAnimations: string[]) => {
    console.log('🎬 Animations loaded:', loadedAnimations);
    setAnimations(loadedAnimations);
  }, []);

  // Per-model settings storage
  type ModelSettings = {
    buddyName: string;
    persona: string;
    palette: string;
    voice: string;
    topColor: string;
    bottomColor: string;
    footwearColor: string;
    hairColor: string;
  };

  const [modelSettings, setModelSettings] = useState<Record<string, ModelSettings>>({});

  // Save current model's settings
  const saveCurrentModelSettings = () => {
    setModelSettings(prev => ({
      ...prev,
      [selectedModel]: {
        buddyName,
        persona: selectedPersona,
        palette: selectedPalette,
        voice,
        topColor,
        bottomColor,
        footwearColor,
        hairColor
      }
    }));
  };

  // Load settings for a specific model
  const loadModelSettings = (modelId: string) => {
    const settings = modelSettings[modelId];
    if (settings) {
      setBuddyName(settings.buddyName);
      setSelectedPersona(settings.persona);
      setSelectedPalette(settings.palette);
      setVoice(settings.voice);
      setTopColor(settings.topColor);
      setBottomColor(settings.bottomColor);
      setFootwearColor(settings.footwearColor);
      setHairColor(settings.hairColor);
    } else {
      // Set defaults for new model
      const modelLabel = buddyModels.find(m => m.id === modelId)?.label || 'Buddy';
      setBuddyName(modelLabel);
      setSelectedPersona('motivator');
      setSelectedPalette('ocean');
      setVoice('balanced');
      setTopColor('#f97316');
      setBottomColor('#0f172a');
      setFootwearColor('#1e293b');
      setHairColor('#78350f');
    }
  };

  const paletteColors = colorPalettes.find((p) => p.id === selectedPalette)?.colors ?? ['#1e3a8a', '#9333ea'];
  const currentModel = buddyModels.find((m) => m.id === selectedModel) ?? buddyModels[0];

  useEffect(() => {
    console.log('🎯 Selected model changed:', selectedModel, 'Path:', currentModel.path);
  }, [selectedModel, currentModel.path]);

  // Load saved configuration on mount (Cloud or Local)
  useEffect(() => {
    const loadConfig = async () => {
      const userJson = localStorage.getItem('user');
      let cloudConfig = null;

      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          const userId = user.id || user._id;
          const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
          const res = await fetch(`${BASE_URL}/api/buddy/config/${userId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.config && data.config.buddyName) {
              cloudConfig = data.config;
              console.log('Loaded buddy config from cloud:', cloudConfig);
            }
          }
        } catch (e) { console.error('Cloud load error:', e); }
      }

      const savedConfig = cloudConfig || JSON.parse(localStorage.getItem('user_buddy_config') || 'null');

      if (savedConfig) {
        if (savedConfig.buddyName) setBuddyName(savedConfig.buddyName);
        if (savedConfig.persona) setSelectedPersona(savedConfig.persona);
        if (savedConfig.voice) setVoice(savedConfig.voice);
        if (savedConfig.palette) setSelectedPalette(savedConfig.palette);
        if (savedConfig.topColor) setTopColor(savedConfig.topColor);
        if (savedConfig.bottomColor) setBottomColor(savedConfig.bottomColor);
        if (savedConfig.footwearColor) setFootwearColor(savedConfig.footwearColor);
        if (savedConfig.hairColor) setHairColor(savedConfig.hairColor);
      }
    };
    loadConfig();
  }, []);

  return (
    <div className="buddy-studio">
      <header className="buddy-studio__header">
        <div className="header-left">
          <a className="logo" href="/">
            <img src={logoImage} alt="Logo" className="logo-image" />
          </a>
          <div>
            <p className="eyebrow">Study Buddy Lab</p>
            <h1>Customize your AI companion</h1>
          </div>
        </div>
        <div className="header-actions">
          <a className="ghost-btn" href="/home">Back to dashboard</a>
          <button
            className="primary-btn"
            type="button"
            onClick={async () => {
              const config = {
                buddyName,
                persona: selectedPersona,
                voice,
                palette: selectedPalette,
                modelPath: currentModel.path,
                topColor,
                bottomColor,
                footwearColor,
                hairColor
              };

              const userJson = localStorage.getItem('user');
              if (userJson) {
                try {
                  const user = JSON.parse(userJson);
                  const userId = user.id || user._id;
                  const BASE_URL = (import.meta as any).env.PUBLIC_BACKEND_URL || 'http://localhost:5000';
                  const res = await fetch(`${BASE_URL}/api/buddy/config/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                  });
                  if (res.ok) {
                    alert('Buddy configuration synced to cloud!');
                  } else {
                    alert('Saved locally only (Sync failed)');
                  }
                } catch (e) {
                  console.error('Sync error:', e);
                }
              }
              localStorage.setItem('user_buddy_config', JSON.stringify(config));
            }}
          >
            Save configuration
          </button>
        </div>
      </header>

      <div className="studio-grid">
        <section className="buddy-viewer-card">
          <div className="viewer-header">
            <div>
              <h2>{buddyName}</h2>
              <p>Live 3D preview with current persona + palette</p>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label className="switch-label" style={{ marginBottom: 0 }}>
                <div className="switch" style={{ transform: 'scale(0.8)' }}>
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={() => setAutoRotate(!autoRotate)}
                  />
                  <span className="slider round"></span>
                </div>
                <span style={{ fontSize: '0.9rem' }}>Rotate</span>
              </label>

              <label className="toggle">
                <input type="checkbox" checked={showGrid} onChange={() => setShowGrid((prev) => !prev)} />
                <span>Guides</span>
              </label>

              <label className="toggle">
                <input type="checkbox" checked={showDebug} onChange={() => setShowDebug((prev) => !prev)} />
                <span>Dev Info</span>
              </label>
            </div>
          </div>
          <div
            className="viewer-shell"
            style={{
              background: `radial-gradient(circle at top, ${paletteColors[0]}33, #0f172a)`,
              borderColor: paletteColors[0],
              height: '600px'
            }}
          >
            <BuddyModelViewer
              modelPath={currentModel.path}
              className="w-full h-full"
              autoRotate={autoRotate}
              showDebug={showDebug}
              onAnimationsLoaded={handleAnimationsLoaded}
              animationName={currentAnimation}
            />

            {/* Animation Control Panel Toggle */}
            <button
              className="animation-toggle-btn"
              onClick={() => setShowAnimationPanel(!showAnimationPanel)}
              title="Toggle Animations"
            >
              🎬
            </button>

            {/* Animation Panel */}
            {showAnimationPanel && (
              <div className="animation-panel">
                <h3>Animations</h3>
                <div className="animation-list">
                  {animations.length === 0 ? (
                    <p className="no-anims">Loading...</p>
                  ) : (
                    animations.map(anim => (
                      <button
                        key={anim}
                        className={`anim-btn ${currentAnimation === anim ? 'active' : ''}`}
                        onClick={() => setCurrentAnimation(anim)}
                      >
                        {anim}
                      </button>
                    ))
                  )}
                  {/* Reset Button */}
                  <button
                    className="anim-btn reset"
                    onClick={() => setCurrentAnimation(undefined)}
                  >
                    Stop / Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="buddy-controls-card">




          <div className="control-group">
            <label htmlFor="buddy-name">Buddy name</label>
            <input
              id="buddy-name"
              value={buddyName}
              onChange={(e) => setBuddyName(e.target.value)}
              placeholder="Give your buddy a name"
            />
          </div>

          <div className="control-group">
            <label>Persona</label>
            <div className="persona-grid">
              {personaPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`persona-card ${preset.id === selectedPersona ? 'active' : ''}`}
                  onClick={() => setSelectedPersona(preset.id)}
                >
                  <span className="persona-pill">{preset.title}</span>
                  <p>{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Color palette</label>
            <div className="palette-row">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  className={`palette-chip ${palette.id === selectedPalette ? 'selected' : ''}`}
                  style={{
                    background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[1]})`
                  }}
                  onClick={() => setSelectedPalette(palette.id)}
                >
                  {palette.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="buddy-voice">Voice profile</label>
            <select id="buddy-voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
              <option value="balanced">Balanced • warm & steady</option>
              <option value="bright">Bright • energetic mentor</option>
              <option value="calm">Calm • mindful coach</option>
            </select>
          </div>

          <div className="control-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <label>
              Outfit colors <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '4px' }}>(You cannot change the color of this character)</span>
            </label>
            <div className="color-pickers">
              {availableMaterials.top && (
                <div>
                  <span>Top</span>
                  <input
                    type="color"
                    value={topColor}
                    onChange={(e) => setTopColor(e.target.value)}
                    aria-label="Top color"
                    disabled
                  />
                </div>
              )}
              {availableMaterials.bottom && (
                <div>
                  <span>Bottom</span>
                  <input
                    type="color"
                    value={bottomColor}
                    onChange={(e) => setBottomColor(e.target.value)}
                    aria-label="Bottom color"
                    disabled
                  />
                </div>
              )}
              {availableMaterials.footwear && (
                <div>
                  <span>Footwear</span>
                  <input
                    type="color"
                    value={footwearColor}
                    onChange={(e) => setFootwearColor(e.target.value)}
                    aria-label="Footwear color"
                    disabled
                  />
                </div>
              )}
              {availableMaterials.hair && (
                <div>
                  <span>Hair</span>
                  <input
                    type="color"
                    value={hairColor}
                    onChange={(e) => setHairColor(e.target.value)}
                    aria-label="Hair color"
                    disabled
                  />
                </div>
              )}
            </div>
          </div>

          <div className="control-group">
            <label>Interactions</label>
            <div className="switch-list">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Study streak nudges</span>
              </label>
              <label>
                <input type="checkbox" />
                <span>Voice guidance</span>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Module recap summarizer</span>
              </label>
            </div>
          </div>
        </section>
      </div >

      <style>{`
        .buddy-studio {
          min-height: 100vh;
          padding: 32px;
          background: #f8fafc;
          color: #0f172a;
        }

        .buddy-studio__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .logo-image {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .eyebrow {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin: 0 0 4px 0;
          color: #64748b;
        }

        .buddy-studio__header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
          line-height: 1.2;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .ghost-btn,
        .primary-btn {
          border-radius: 999px;
          padding: 12px 20px;
          font-weight: 600;
          border: 1px solid transparent;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .ghost-btn {
          border-color: #cbd5f5;
          color: #1e3a8a;
          background: transparent;
        }

        .primary-btn {
          background: linear-gradient(120deg, #2563eb, #a855f7);
          color: #fff;
          border: none;
        }

        .studio-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: start;
        }

        .buddy-viewer-card {
          position: sticky;
          top: 32px;
          height: calc(100vh - 64px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .buddy-controls-card {
          height: auto;
          overflow-y: auto;
        }

        .buddy-viewer-card,
        .buddy-controls-card {
          background: #fff;
          border-radius: 28px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 25px 45px rgba(15, 23, 42, 0.08);
        }

        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .viewer-header h2 {
          margin: 0;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #475569;
        }

        .viewer-shell {
          position: relative;
          border-radius: 24px;
          border: 1px solid;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .control-group {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .control-group label {
          font-weight: 600;
          color: #334155;
        }

        input,
        select {
          border-radius: 16px;
          border: 1px solid #cbd5f5;
          padding: 14px 16px;
          font-size: 1rem;
          background: #f8fafc;
          color: #0f172a;
        }

        .model-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .model-card {
          border-radius: 16px;
          border: 2px solid #cbd5f5;
          padding: 14px 16px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          color: #334155;
        }

        .model-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
        }

        .model-card.active {
          border-color: #2563eb;
          background: #e0f2fe;
          color: #1e3a8a;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .persona-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .persona-card {
          border-radius: 20px;
          border: 1px solid #cbd5f5;
          padding: 16px;
          text-align: left;
          background: #f8fafc;
          cursor: pointer;
          transition: border 0.2s ease, transform 0.2s ease;
        }

        .persona-card.active {
          border-color: #2563eb;
          background: #e0f2fe;
          transform: translateY(-2px);
        }

        .persona-card p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 0.9rem;
        }

        .persona-pill {
          font-weight: 700;
          color: #0f172a;
        }

        .palette-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .color-pickers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .color-pickers span {
          font-size: 0.9rem;
          color: #475569;
          display: block;
          margin-bottom: 6px;
        }

        .color-pickers input[type="color"] {
          width: 100%;
          height: 42px;
          padding: 0;
          border-radius: 12px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .palette-chip {
          border-radius: 16px;
          border: 2px solid transparent;
          color: #fff;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 600;
        }

        .palette-chip.selected {
          border-color: #fff;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
        }

        .switch-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .switch-list label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        @media (max-width: 1100px) {
          .studio-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .buddy-studio {
            padding: 16px;
          }

          .buddy-studio__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }

        .mode-toggle {
          display: flex;
          background: #e2e8f0;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }

        .mode-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          background: #fff;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
        }
        .mode-btn.active {
          background: #fff;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(15, 23, 42, 0.05);
        }

        /* Switch Toggle Styles */
        .switch-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .switch-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 500;
          color: #334155;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input:checked + .slider {
          background-color: #2563eb;
        }

        input:checked + .slider:before {
          transform: translateX(22px);
        }

        input:focus + .slider {
          box-shadow: 0 0 1px #2563eb;
        }

        /* Animation Panel Styles */
        .animation-toggle-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-size: 1.2rem;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .animation-toggle-btn:hover {
            transform: scale(1.1);
            background: #fff;
        }

        .animation-panel {
            position: absolute;
            top: 70px;
            left: 20px;
            width: 200px;
            max-height: 400px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 10;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
        }

        .animation-panel h3 {
            margin: 0 0 12px 0;
            font-size: 1rem;
            color: #0f172a;
        }

        .animation-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .anim-btn {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #fff;
            color: #334155;
            cursor: pointer;
            text-align: left;
            font-size: 0.9rem;
            transition: all 0.2s;
        }

        .anim-btn:hover {
            border-color: #2563eb;
            color: #2563eb;
        }

        .anim-btn.active {
            background: #2563eb;
            color: #fff;
            border-color: #2563eb;
        }

        .anim-btn.reset {
            margin-top: 8px;
            border-style: dashed;
            text-align: center;
            color: #64748b;
        }
        
        .anim-btn.reset:hover {
            background: #f1f5f9;
            color: #0f172a;
        }

        .no-anims {
            font-size: 0.85rem;
            color: #64748b;
            font-style: italic;
        }
      `}</style>
    </div >
  );
};

export default BuddyStudio;



import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'arkaios_autopilot_enabled';

const AutopilotToggle: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    // 1) Try sync with server policy
    fetch('/api/autopilot')
      .then(async (res) => {
        if (!res.ok) throw new Error('no server');
        const data = await res.json();
        setEnabled(!!data.enabled);
        try { localStorage.setItem(STORAGE_KEY, String(!!data.enabled)); } catch {}
      })
      .catch(() => {
        // 2) Fallback to localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved === 'true' || saved === 'false') {
            setEnabled(saved === 'true');
          } else {
            localStorage.setItem(STORAGE_KEY, 'true');
            setEnabled(true);
          }
        } catch {}
      });
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    // Update server policy (dev) and fallback to localStorage
    fetch('/api/autopilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next })
    }).then(() => {
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    }).catch(() => {
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    });
  };

  const forceStop = () => {
    setEnabled(false);
    // Force global stop by creating STOP_AUTOPILOT file
    fetch('/api/autopilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false, forceStop: true })
    }).then(() => {
      try { localStorage.setItem(STORAGE_KEY, 'false'); } catch {}
    }).catch(() => {
      try { localStorage.setItem(STORAGE_KEY, 'false'); } catch {}
    });
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs px-2 py-1 rounded-full border ${enabled ? 'bg-green-600/20 text-green-300 border-green-500/40' : 'bg-gray-600/20 text-gray-300 border-gray-500/40'}`}>
        Autopilot {enabled ? 'ON' : 'OFF'}
      </span>
      <button
        type="button"
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${enabled ? 'bg-gemini-blue' : 'bg-gray-600'}`}
        aria-pressed={enabled}
        aria-label="Toggle Autopilot"
        title="Activa o desactiva el modo autopilot para tareas seguras"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
      <button
        type="button"
        onClick={forceStop}
        className="text-xs px-2 py-1 bg-red-600/20 text-red-300 border border-red-500/40 rounded hover:bg-red-600/30 transition-colors duration-200"
        title="Parada global de emergencia - Crea archivo STOP_AUTOPILOT"
      >
        🛑 STOP
      </button>
    </div>
  );
};

export default AutopilotToggle;
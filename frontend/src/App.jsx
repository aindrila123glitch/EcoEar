import React, { useState, useEffect } from 'react';
import { Trees, ShieldAlert, Radio, Activity, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import RecorderMap from './components/RecorderMap';
import SpectrogramViewer from './components/SpectrogramViewer';
import AlertBanner from './components/AlertBanner';
import SoundscapeChart from './components/SoundscapeChart';
import SpeciesSection from './components/SpeciesSection';
import FileUploader from './components/FileUploader';

const API_URL = 'http://localhost:8000';

export default function App() {
  const [recorders, setRecorders] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);

  // Check backend health on load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (e) {
        setServerOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBatchComplete = (newResults) => {
    setRecorders((prev) => {
      const merged = [...prev, ...newResults];
      return merged;
    });
    // Select the latest result
    setSelectedIndex(recorders.length);
  };

  const currentRecorder = recorders[selectedIndex] || null;
  const totalAlerts = recorders.reduce((acc, r) => acc + (r.alerts?.length || 0), 0);
  const totalThreatRecorders = recorders.filter((r) => r.status === 'ALERT').length;

  return (
    <div className="min-h-screen bg-[#070e0a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar */}
      <header className="border-b border-emerald-900/40 bg-[#091510]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <div className="w-full h-full bg-[#091510] rounded-[10px] flex items-center justify-center">
                <Trees className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white m-0">EcoEar</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Forest Acoustic Monitor
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Autonomous Bioacoustic Threat & Biodiversity Intelligence
              </p>
            </div>
          </div>

          {/* Quick Metrics & Server Status */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-4 bg-forest-950/80 px-3.5 py-1.5 rounded-lg border border-emerald-900/40">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Recorders:</span>
                <span className="font-mono font-bold text-white">{recorders.length}</span>
              </div>
              <div className="w-px h-3 bg-emerald-900/60" />
              <div className="flex items-center gap-1.5">
                <ShieldAlert className={`w-3.5 h-3.5 ${totalThreatRecorders > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                <span className="text-slate-400">Threat Alerts:</span>
                <span className={`font-mono font-bold ${totalThreatRecorders > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {totalAlerts}
                </span>
              </div>
            </div>

            {/* Server Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                serverOnline === true
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : serverOnline === false
                  ? 'bg-red-950/70 border-red-500/40 text-red-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline === true
                    ? 'bg-emerald-400 animate-pulse'
                    : serverOnline === false
                    ? 'bg-red-400'
                    : 'bg-slate-400'
                }`}
              />
              <span>{serverOnline === true ? 'Backend: 8000' : serverOnline === false ? 'Backend Offline' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Upload & Location Section */}
        <section>
          <FileUploader
            apiUrl={API_URL}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            onBatchComplete={handleBatchComplete}
          />
        </section>

        {/* Map Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2 m-0">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Acoustic Monitoring Sensor Network (Leaflet)</span>
            </h2>
            {recorders.length > 0 && (
              <span className="text-xs text-slate-400">
                Click any sensor pin on the map to inspect its data
              </span>
            )}
          </div>
          <RecorderMap
            recorders={recorders}
            selectedIndex={selectedIndex}
            onSelectRecorder={(idx) => setSelectedIndex(idx)}
          />
        </section>

        {/* Detailed Recorder Analysis Section */}
        {currentRecorder ? (
          <section className="space-y-5 animate-fade-in">
            {/* Recorder Selector Tabs if multiple */}
            {recorders.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-slate-400 font-semibold mr-1">Active Sensor:</span>
                {recorders.map((r, idx) => {
                  const isActive = idx === selectedIndex;
                  const isThreat = r.status === 'ALERT';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? isThreat
                            ? 'bg-red-950/80 border border-red-500 text-white shadow-lg shadow-red-950/40'
                            : 'bg-emerald-950/80 border border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                          : 'bg-forest-950/60 border border-emerald-900/40 text-slate-300 hover:bg-forest-900/60'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isThreat ? 'bg-red-400 ring-2 ring-red-500/30 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{r.name || r.filename}</span>
                      {r.alerts?.length > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] bg-red-500 text-white rounded font-mono font-bold">
                          {r.alerts.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Alert Cards Banner */}
            <div id="alert-card-container">
              <AlertBanner
                status={currentRecorder.status}
                alerts={currentRecorder.alerts}
                filename={currentRecorder.filename || currentRecorder.name}
              />
            </div>

            {/* Spectrogram View */}
            <div id="spectrogram-container">
              <SpectrogramViewer
                spectrogram={currentRecorder.spectrogram}
                alerts={currentRecorder.alerts}
                title={`Mel-Spectrogram: ${currentRecorder.name || currentRecorder.filename} (${currentRecorder.duration || 0}s)`}
              />
            </div>

            {/* Soundscape Activity & Shannon Index */}
            <div id="soundscape-container">
              <SoundscapeChart
                activity={currentRecorder.activity}
                shannon={currentRecorder.shannon}
                speciesCount={currentRecorder.species_count}
              />
            </div>

            {/* Avian Species Table & Timeline Scatter */}
            <div id="species-container">
              <SpeciesSection
                birdnetEnabled={currentRecorder.birdnet_enabled}
                species={currentRecorder.species}
                detections={currentRecorder.detections}
              />
            </div>
          </section>
        ) : (
          /* Empty State when no recording has been uploaded yet */
          <div className="bg-[#0b1712] p-8 rounded-xl border border-emerald-900/30 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-emerald-100">Ready for Field Recordings</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Drop audio files above (e.g. <code className="text-emerald-300">demo.wav</code> or <code className="text-emerald-300">birdsong.mp3</code>) to analyze acoustic threats and calculate biodiversity metrics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/30 bg-[#060c09] py-4 text-center text-xs text-emerald-800">
        EcoEar Forest Acoustic Monitor • YAMNet AudioSet & BirdNET Bioacoustic Models
      </footer>
    </div>
  );
}

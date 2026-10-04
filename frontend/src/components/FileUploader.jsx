import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Trash2, Sliders, Loader2, AlertOctagon } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.ogg', '.flac'];

export default function FileUploader({ onBatchComplete, isAnalyzing, setIsAnalyzing, apiUrl = 'http://localhost:8000' }) {
  const [fileList, setFileList] = useState([]);
  const [alertThr, setAlertThr] = useState(0.35);
  const [birdConf, setBirdConf] = useState(0.4);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilesAdded = (files) => {
    setErrorMessage(null);
    const newItems = Array.from(files)
      .filter((file) => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return ACCEPTED_EXTENSIONS.includes(ext);
      })
      .map((file, idx) => {
        const baseIndex = fileList.length + idx;
        return {
          id: `${file.name}-${Date.now()}-${idx}`,
          file,
          name: file.name.replace(/\.[^/.]+$/, ''),
          lat: parseFloat((20.0 + 0.02 * baseIndex).toFixed(4)),
          lon: parseFloat((78.0 + 0.02 * baseIndex).toFixed(4)),
        };
      });

    if (newItems.length === 0 && files.length > 0) {
      setErrorMessage('Please select supported audio formats: .wav, .mp3, .ogg, or .flac');
      return;
    }

    setFileList((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setFileList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const startAnalysis = async () => {
    if (fileList.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    const completedResults = [];

    try {
      // Process files one at a time, strictly sequentially
      for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i];
        setProgressMsg(`Analyzing ${i + 1} of ${fileList.length}: ${item.file.name}...`);

        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('alert_thr', alertThr);
        formData.append('bird_conf', birdConf);

        // DO NOT set Content-Type header manually (allows browser to set boundary)
        const response = await fetch(`${apiUrl}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Analysis failed for "${item.file.name}" (Status ${response.status}): ${errorText || response.statusText}`
          );
        }

        const data = await response.json();
        completedResults.push({
          ...data,
          recorderId: item.id,
          name: item.name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          file: item.file,
        });
      }

      setProgressMsg('Analysis complete!');
      onBatchComplete(completedResults);
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(
        err.message ||
          'Failed to connect to backend at ' + apiUrl + '. Please make sure uvicorn is running.'
      );
    } finally {
      setIsAnalyzing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="bg-[#0b1712] p-5 rounded-xl border border-emerald-900/40 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/30 pb-3">
        <div>
          <h3 className="text-base font-bold text-emerald-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <span>Audio Input & Recorders</span>
          </h3>
          <p className="text-xs text-slate-400">
            Upload field recordings (.wav, .mp3, .ogg, .flac) for sequential threat & biodiversity scan
          </p>
        </div>

        {/* Sliders for thresholds */}
        <div className="flex items-center gap-4 text-xs bg-forest-950/80 px-3 py-1.5 rounded-lg border border-emerald-900/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Alert Thr:</span>
            <input
              type="range"
              min="0.2"
              max="0.9"
              step="0.05"
              value={alertThr}
              onChange={(e) => setAlertThr(parseFloat(e.target.value))}
              disabled={isAnalyzing}
              className="w-16 accent-emerald-500 cursor-pointer"
            />
            <span className="font-mono text-emerald-300 font-bold">{alertThr}</span>
          </div>

          <div className="flex items-center gap-2 border-l border-emerald-900/50 pl-3">
            <span className="text-slate-300">Bird Conf:</span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={birdConf}
              onChange={(e) => setBirdConf(parseFloat(e.target.value))}
              disabled={isAnalyzing}
              className="w-16 accent-teal-500 cursor-pointer"
            />
            <span className="font-mono text-teal-300 font-bold">{birdConf}</span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        id="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-950/40 scale-[1.005]'
            : 'border-emerald-800/40 bg-forest-950/40 hover:border-emerald-700/60 hover:bg-forest-950/60'
        } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".wav,.mp3,.ogg,.flac"
          className="hidden"
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-emerald-200">
            Click to browse or drop audio recordings here
          </div>
          <p className="text-xs text-slate-400">Supported formats: WAV, MP3, OGG, FLAC</p>
        </div>
      </div>

      {/* Quick Load Demo Files */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-[11px] text-slate-400">Demo Presets:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-load-demo"
            disabled={isAnalyzing}
            onClick={async () => {
              try {
                const res = await fetch('/demo.wav');
                const blob = await res.blob();
                const file = new File([blob], 'demo.wav', { type: 'audio/wav' });
                handleFilesAdded([file]);
              } catch (e) {
                setErrorMessage('Failed to load demo.wav: ' + e.message);
              }
            }}
            className="px-2.5 py-1 rounded bg-forest-900 hover:bg-forest-850 text-emerald-300 border border-emerald-800/50 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Load demo.wav (Chainsaw hazard)</span>
          </button>

          <button
            type="button"
            id="btn-load-birdsong"
            disabled={isAnalyzing}
            onClick={async () => {
              try {
                const res = await fetch('/birdsong.mp3');
                const blob = await res.blob();
                const file = new File([blob], 'birdsong.mp3', { type: 'audio/mpeg' });
                handleFilesAdded([file]);
              } catch (e) {
                setErrorMessage('Failed to load birdsong.mp3: ' + e.message);
              }
            }}
            className="px-2.5 py-1 rounded bg-forest-900 hover:bg-forest-850 text-teal-300 border border-emerald-800/50 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Load birdsong.mp3 (Clean forest)</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div id="error-message" className="p-3.5 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Selected Files & Editable Metadata List */}
      {fileList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Configured Recorders ({fileList.length})</span>
            {!isAnalyzing && (
              <button
                type="button"
                onClick={() => setFileList([])}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {fileList.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 bg-forest-950/80 p-2.5 rounded-lg border border-emerald-900/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-[140px] flex-1">
                  <FileAudio className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={item.name}
                    disabled={isAnalyzing}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    placeholder="Recorder Name"
                    className="bg-[#091510] border border-emerald-900/50 rounded px-2 py-1 text-slate-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                    title="Recorder Name"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Lat:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={item.lat}
                    disabled={isAnalyzing}
                    onChange={(e) => handleUpdateItem(item.id, 'lat', parseFloat(e.target.value) || 0)}
                    className="w-20 bg-[#091510] border border-emerald-900/50 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    title="Latitude"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Lon:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={item.lon}
                    disabled={isAnalyzing}
                    onChange={(e) => handleUpdateItem(item.id, 'lon', parseFloat(e.target.value) || 0)}
                    className="w-20 bg-[#091510] border border-emerald-900/50 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    title="Longitude"
                  />
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </span>

                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-auto"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Button & Loading Spinner */}
          <div className="pt-2">
            {isAnalyzing ? (
              <div id="loading-spinner" className="flex items-center justify-center gap-3 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm font-medium">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span>{progressMsg || 'Processing recording through acoustic neural models...'}</span>
              </div>
            ) : (
              <button
                type="button"
                id="btn-analyze"
                onClick={startAnalysis}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Analyze {fileList.length} {fileList.length === 1 ? 'Recording' : 'Recordings'} (Sequential)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

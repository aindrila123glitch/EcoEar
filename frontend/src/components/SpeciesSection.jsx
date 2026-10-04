import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Bird, Info, Clock, AlertCircle } from 'lucide-react';

export default function SpeciesSection({ birdnetEnabled, species = [], detections = [] }) {
  const plotRef = useRef(null);

  useEffect(() => {
    if (!plotRef.current || !birdnetEnabled || !detections || detections.length === 0) return;

    const x = detections.map((d) => d.start_time);
    const y = detections.map((d) => d.common_name);
    const text = detections.map(
      (d) => `${d.common_name}<br>Time: ${d.start_time}s – ${d.end_time}s<br>Confidence: ${(d.confidence * 100).toFixed(1)}%`
    );
    const sizes = detections.map((d) => Math.max(10, Math.min(26, d.confidence * 24)));
    const colors = detections.map((d) => d.confidence);

    const trace = {
      x,
      y,
      text,
      hoverinfo: 'text',
      mode: 'markers',
      marker: {
        size: sizes,
        color: colors,
        colorscale: 'Viridis',
        colorbar: {
          title: 'Confidence',
          tickfont: { color: '#94a3b8', size: 9 },
          titlefont: { color: '#94a3b8', size: 10 },
          thickness: 12,
          len: 0.8,
        },
        line: {
          color: '#ffffff',
          width: 1,
        },
      },
    };

    const layout = {
      autosize: true,
      height: 300,
      margin: { l: 150, r: 25, t: 25, b: 45 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#08140f',
      xaxis: {
        title: { text: 'Detection Time (seconds)', font: { color: '#94a3b8', size: 11 } },
        tickfont: { color: '#64748b', size: 10 },
        gridcolor: 'rgba(255, 255, 255, 0.05)',
      },
      yaxis: {
        tickfont: { color: '#94a3b8', size: 11 },
        automargin: true,
        gridcolor: 'rgba(255, 255, 255, 0.05)',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.react(plotRef.current, [trace], layout, config);

    const handleResize = () => {
      if (plotRef.current) Plotly.Plots.resize(plotRef.current);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [birdnetEnabled, detections]);

  if (!birdnetEnabled) {
    return (
      <div className="bg-[#0b1712] p-6 rounded-xl border border-emerald-900/40 shadow-lg">
        <div className="flex items-center gap-2 mb-2 text-emerald-300 font-semibold text-sm">
          <Bird className="w-5 h-5 text-emerald-400" />
          <span>Species Identification (BirdNET)</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200/90 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-semibold">BirdNET is not enabled</span> on the backend. Species-level identification and timeline scatter are disabled, but acoustic hazard detection (YAMNet) remains fully operational.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1712] p-5 rounded-xl border border-emerald-900/40 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3">
        <div className="flex items-center gap-2 text-emerald-100 font-bold text-sm uppercase tracking-wider">
          <Bird className="w-5 h-5 text-emerald-400" />
          <span>Sound and Species Analysis</span>
        </div>
        <span className="text-xs text-emerald-400/80 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40 font-mono">
          BirdNET Engine Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Species Table */}
        <div className="lg:col-span-5 flex flex-col">
          <h5 className="text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Detected Sounds</span>
            <span className="text-slate-400 font-mono text-[11px]">{species.length} {species.length === 1 ? 'sound' : 'sounds'}</span>
          </h5>

          {species.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-forest-950/50 rounded-lg border border-emerald-900/20 text-center">
              <Bird className="w-8 h-8 text-emerald-700/60 mb-2" />
              <p className="text-xs text-slate-400">No sounds or species identified above the confidence threshold in this recording.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto max-h-[300px] overflow-y-auto border border-emerald-900/30 rounded-lg bg-forest-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-forest-900/80 text-emerald-300/90 font-semibold sticky top-0 border-b border-emerald-900/40 backdrop-blur-sm">
                  <tr>
                    <th className="py-2 px-3">Sound</th>
                    <th className="py-2 px-2 text-center">Calls</th>
                    <th className="py-2 px-3 text-right">Best Conf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/20 text-slate-200">
                  {species.map((sp, idx) => (
                    <tr key={idx} className="hover:bg-emerald-900/20 transition-colors">
                      <td className="py-2 px-3 font-medium text-emerald-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {sp.common_name}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-300">
                        {sp.calls}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-300 font-semibold">
                        {typeof sp.best_conf === 'number'
                          ? sp.best_conf <= 1
                            ? `${Math.round(sp.best_conf * 100)}%`
                            : `${sp.best_conf}%`
                          : sp.best_conf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Species Timeline Scatter */}
        <div className="lg:col-span-7 flex flex-col">
          <h5 className="text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Activity Timeline</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{detections.length} total calls</span>
          </h5>

          {detections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-forest-950/50 rounded-lg border border-emerald-900/20 text-center min-h-[220px]">
              <Info className="w-8 h-8 text-emerald-700/60 mb-2" />
              <p className="text-xs text-slate-400">No detection events to display on the timeline.</p>
            </div>
          ) : (
            <div ref={plotRef} className="w-full h-[300px] rounded-lg overflow-hidden border border-emerald-900/30 bg-[#08140f]" />
          )}
        </div>
      </div>
    </div>
  );
}

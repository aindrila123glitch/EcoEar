import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function SpectrogramViewer({ spectrogram, alerts = [], title = 'Mel-Spectrogram' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !spectrogram || !spectrogram.z) return;

    const shapes = (alerts || []).map((alert) => ({
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: alert.start,
      x1: alert.end,
      y0: 0,
      y1: 8000,
      fillcolor: 'rgba(239, 68, 68, 0.35)',
      line: {
        color: '#ef4444',
        width: 2,
      },
    }));

    const annotations = (alerts || []).map((alert) => ({
      x: (alert.start + alert.end) / 2,
      y: 7200,
      xref: 'x',
      yref: 'y',
      text: `<b>${alert.type}</b> (${Math.round(alert.confidence * 100)}%)`,
      showarrow: false,
      font: {
        color: '#ffffff',
        size: 11,
      },
      bgcolor: 'rgba(220, 38, 38, 0.9)',
      bordercolor: '#f87171',
      borderwidth: 1,
      borderpad: 4,
      borderRadius: 4,
    }));

    const data = [
      {
        z: spectrogram.z,
        x: spectrogram.t,
        y: spectrogram.f,
        type: 'heatmap',
        colorscale: 'Viridis',
        colorbar: {
          title: 'dB',
          titleside: 'right',
          tickfont: { color: '#94a3b8', size: 10 },
          titlefont: { color: '#94a3b8', size: 11 },
          outlinecolor: '#1b3b2f',
          thickness: 14,
        },
        hoverongaps: false,
      },
    ];

    const layout = {
      autosize: true,
      height: 320,
      margin: { l: 55, r: 25, t: 25, b: 45 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#08140f',
      shapes,
      annotations,
      xaxis: {
        title: { text: 'Time (seconds)', font: { color: '#94a3b8', size: 12 } },
        tickfont: { color: '#64748b', size: 10 },
        gridcolor: 'rgba(255, 255, 255, 0.05)',
        zerolinecolor: 'rgba(255, 255, 255, 0.08)',
      },
      yaxis: {
        title: { text: 'Frequency (Hz)', font: { color: '#94a3b8', size: 12 } },
        tickfont: { color: '#64748b', size: 10 },
        gridcolor: 'rgba(255, 255, 255, 0.05)',
        zerolinecolor: 'rgba(255, 255, 255, 0.08)',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.react(containerRef.current, data, layout, config);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [spectrogram, alerts]);

  if (!spectrogram || !spectrogram.z) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-forest-950/60 rounded-xl border border-emerald-900/30 text-emerald-600/70 text-sm">
        No spectrogram data available
      </div>
    );
  }

  return (
    <div className="bg-[#0b1712] p-4 rounded-xl border border-emerald-900/40 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-emerald-200 tracking-wide flex items-center gap-2">
          <span>{title}</span>
          {alerts && alerts.length > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
              {alerts.length} shaded threat {alerts.length === 1 ? 'region' : 'regions'}
            </span>
          )}
        </h4>
        <span className="text-xs text-slate-400">YAMNet Analysis Window</span>
      </div>
      <div ref={containerRef} className="w-full h-[320px] rounded-lg overflow-hidden" />
    </div>
  );
}

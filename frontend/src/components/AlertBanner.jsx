import React from 'react';
import { AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export default function AlertBanner({ status, alerts = [], filename }) {
  const isAlert = status === 'ALERT' && alerts && alerts.length > 0;

  if (!isAlert) {
    return (
      <div 
        id="alert-state-ok"
        className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-forest-900/50 to-emerald-950/40 p-5 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="text-lg font-bold tracking-tight text-emerald-100">
                No illegal activity detected
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-emerald-300/80">
              Acoustic monitoring scan complete for {filename || 'current file'}. No chainsaw, gunshot, or unauthorized heavy machinery signatures identified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="alert-state-threat" className="space-y-3">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/80 via-[#1f0a0a] to-red-950/60 p-5 shadow-2xl backdrop-blur-md animate-fade-in"
        >
          {/* Subtle red indicator stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600"></div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shadow-inner">
              <AlertTriangle className="h-7 w-7 animate-pulse text-red-400" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500 text-white rounded">
                    CRITICAL ALERT
                  </span>
                  <span className="text-xs font-mono text-red-300/70">
                    Timestamp: {alert.start.toFixed(1)}s – {alert.end.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono font-semibold">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>{Math.round(alert.confidence * 100)}% Confidence</span>
                </div>
              </div>

              <h3 className="mt-1 text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {alert.type} detected at {alert.start.toFixed(1)}s, {Math.round(alert.confidence * 100)}% confidence
              </h3>

              <p className="mt-1 text-xs text-red-200/80">
                Threat signature matched in {filename || 'recording'} between {alert.start.toFixed(1)}s and {alert.end.toFixed(1)}s duration. Immediate ground ranger review recommended.
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

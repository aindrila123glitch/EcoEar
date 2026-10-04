import React from 'react';
import { Activity, Sparkles, Feather } from 'lucide-react';

const CATEGORY_COLORS = {
  Birds: 'from-emerald-400 to-teal-500',
  Frogs: 'from-green-400 to-emerald-600',
  Insects: 'from-lime-400 to-green-500',
  Rain: 'from-cyan-400 to-blue-500',
  Wind: 'from-sky-400 to-teal-400',
};

export default function SoundscapeChart({ activity = {}, shannon = 0, speciesCount = 0 }) {
  const categories = ['Birds', 'Frogs', 'Insects', 'Rain', 'Wind'];

  return (
    <div className="bg-[#0b1712] p-5 rounded-xl border border-emerald-900/40 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/30 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-100">
            Soundscape Activity & Biodiversity
          </h4>
        </div>

        {/* Shannon Index KPI badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-xs text-emerald-300">Shannon Index:</span>
            <span className="text-sm font-extrabold text-white font-mono">{shannon !== undefined ? Number(shannon).toFixed(2) : '0.00'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30">
            <Feather className="w-4 h-4 text-teal-300" />
            <span className="text-xs text-teal-300">Species Count:</span>
            <span className="text-sm font-extrabold text-white font-mono">{speciesCount}</span>
          </div>
        </div>
      </div>

      {/* Activity bars */}
      <div className="space-y-3 pt-1">
        {categories.map((cat) => {
          const val = activity[cat] || 0;
          const pct = Math.round(val * 100);
          const gradient = CATEGORY_COLORS[cat] || 'from-emerald-400 to-teal-500';

          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {cat}
                </span>
                <span className="font-mono text-emerald-300 font-semibold">{pct}% of time</span>
              </div>
              <div className="w-full h-2.5 bg-forest-950/80 rounded-full overflow-hidden border border-emerald-900/30">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(pct, 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

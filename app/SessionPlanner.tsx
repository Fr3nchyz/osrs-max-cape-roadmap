"use client";

import { useState } from "react";
import { Play, MapPin, Clock, ExternalLink, Monitor, Smartphone } from "lucide-react";
import {
  planSession,
  afkLabel,
  afkBadgeClass,
  ICON_MAP,
  type Skill,
  type Platform,
  type Intensity,
} from "./skills";

const PLATFORMS: { id: Platform; label: string; icon: typeof Monitor }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];
const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: "chill", label: "Chill" },
  { id: "balanced", label: "Balanced" },
  { id: "intense", label: "Intense" },
];
const DURATIONS = [15, 30, 60, 120];

const fmtXp = (xp: number) =>
  xp >= 1_000_000 ? `${(xp / 1_000_000).toFixed(1)}M` : `${Math.round(xp / 1000)}k`;
const fmtDur = (m: number) => (m >= 60 ? `${m / 60}h` : `${m}m`);

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 border ${
        active
          ? "bg-yellow-600 text-white border-yellow-500"
          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function SessionPlanner({ skills = [] }: { skills?: Skill[] }) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [intensity, setIntensity] = useState<Intensity>("chill");
  const [sessionMins, setSessionMins] = useState(60);

  const matches = planSession(skills, { platform, intensity, sessionMins });

  return (
    <section className="space-y-6">
      {/* Context controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-[1.75rem] p-6 space-y-4">
        <h3 className="text-base font-black text-white uppercase tracking-tighter flex items-center gap-2">
          <Play className="w-4 h-4 text-yellow-600" /> Start a session
        </h3>
        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Platform</p>
            <div className="flex gap-1.5">
              {PLATFORMS.map((p) => (
                <Pill key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
                  <p.icon className="w-3.5 h-3.5" /> {p.label}
                </Pill>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Intensity</p>
            <div className="flex gap-1.5">
              {INTENSITIES.map((i) => (
                <Pill key={i.id} active={intensity === i.id} onClick={() => setIntensity(i.id)}>
                  {i.label}
                </Pill>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">I have</p>
            <div className="flex gap-1.5">
              {DURATIONS.map((d) => (
                <Pill key={d} active={sessionMins === d} onClick={() => setSessionMins(d)}>
                  {fmtDur(d)}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ranked matches */}
      <div>
        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 px-1">
          Best for {platform} · {intensity} · {fmtDur(sessionMins)} — {matches.length} match
          {matches.length === 1 ? "" : "es"}
        </p>
        {matches.length === 0 ? (
          <div className="text-center py-16 text-neutral-600">
            <Play className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold uppercase tracking-widest">No matches</p>
            <p className="text-xs mt-1">Try a different platform or intensity.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {matches.map(({ skill, method, sessionXp }, i) => (
              <div
                key={`${skill}-${method.name}`}
                className={`bg-neutral-900 border rounded-[1.5rem] p-4 ${
                  i === 0 ? "border-yellow-700/40" : "border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl shrink-0">{ICON_MAP[skill] || "❓"}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white tracking-tight">{skill}</span>
                      <span className="text-xs text-neutral-400">— {method.name}</span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${afkBadgeClass(
                          method.afk
                        )}`}
                      >
                        {afkLabel(method.afk)}
                      </span>
                    </div>
                  </div>
                  <span className="ml-auto text-sm font-mono font-black text-yellow-500 shrink-0">
                    ~{fmtXp(sessionXp)} xp
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-x-4 gap-y-1.5 flex-wrap text-[11px] text-neutral-500">
                  {method.setup && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {method.setup.location}
                      {method.setup.travelMins ? ` · ~${method.setup.travelMins} min travel` : ""}
                    </span>
                  )}
                  {method.afkTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {method.afkTime} / cycle
                    </span>
                  )}
                  <span className="font-mono text-neutral-600">{(method.rate / 1000).toFixed(0)}k xp/h</span>
                  {method.links?.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-yellow-600 hover:text-yellow-500"
                    >
                      <ExternalLink className="w-3 h-3" /> {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

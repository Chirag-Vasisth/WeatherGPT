import ReactMarkdown from "react-markdown";
import { model } from "./gemini";
import { useState, useEffect, useRef } from "react";
import ParticleText from "./ParticleText";
import HistorySidebar from "./HistorySidebar";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// ── Weather particle types ──────────────────────────────────────────────────
type Particle = { id: number; x: number; size: number; delay: number; duration: number; drift: number };
type RainDrop = { id: number; x: number; delay: number; duration: number; opacity: number };

function useParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 12,
    drift: (Math.random() - 0.5) * 60,
  }));
}

function useRain(count: number): RainDrop[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: Math.random() * 1.5 + 0.8,
    opacity: Math.random() * 0.4 + 0.1,
  }));
}

// ── Weather SVG Icons ───────────────────────────────────────────────────────
function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="12" fill="currentColor" opacity="0.9" />
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <line
          key={deg}
          x1="32" y1="32"
          x2={32 + 22 * Math.cos((deg * Math.PI) / 180)}
          y2={32 + 22 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
        />
      ))}
    </svg>
  );
}

function CloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 54" fill="none" className={className}>
      <ellipse cx="30" cy="30" rx="22" ry="16" fill="currentColor" opacity="0.8" />
      <ellipse cx="50" cy="34" rx="22" ry="14" fill="currentColor" opacity="0.9" />
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="currentColor" />
      <rect x="8" y="30" width="64" height="16" rx="8" fill="currentColor" />
    </svg>
  );
}

function RainIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <ellipse cx="32" cy="20" rx="20" ry="12" fill="currentColor" opacity="0.8" />
      <rect x="12" y="14" width="40" height="10" rx="5" fill="currentColor" />
      {[18,28,38,48,23,33,43].map((x, i) => (
        <line
          key={i}
          x1={x} y1={i % 2 === 0 ? 32 : 36}
          x2={x - 4} y2={i % 2 === 0 ? 48 : 52}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"
        />
      ))}
    </svg>
  );
}

function ThunderIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <ellipse cx="32" cy="18" rx="20" ry="11" fill="currentColor" opacity="0.8" />
      <rect x="14" y="12" width="36" height="10" rx="5" fill="currentColor" />
      <polygon points="34,30 26,46 32,44 28,60 42,38 36,42" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function WindIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" className={className}>
      {[8,20,12].map((y, i) => (
        <path
          key={i}
          d={`M4 ${y} Q${28 - i * 4} ${y - 8} ${48 + i * 4} ${y}`}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"
          opacity={1 - i * 0.2}
        />
      ))}
      <path d="M4 32 Q32 24 56 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

// ── Animated background ─────────────────────────────────────────────────────
function AtmosphericBackground() {
  const particles = useParticles(25);
  const rain = useRain(60);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,142,247,0.18) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 50% at 85% 20%, rgba(124,58,237,0.15) 0%, transparent 50%), " +
            "radial-gradient(ellipse 50% 40% at 10% 80%, rgba(14,165,233,0.1) 0%, transparent 50%), " +
            "linear-gradient(180deg, var(--bg) 0%, var(--bg) 50%, var(--bg) 100%)"
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute animate-orb"
        style={{
          width: 600, height: 600, top: "-10%", left: "30%",
          background: "radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          animationDuration: "12s",
        }}
      />
      <div
        className="absolute animate-orb"
        style={{
          width: 400, height: 400, top: "40%", right: "-5%",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          animationDuration: "9s",
          animationDelay: "-3s",
        }}
      />
      <div
        className="absolute animate-orb"
        style={{
          width: 300, height: 300, bottom: "10%", left: "5%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          animationDuration: "15s",
          animationDelay: "-6s",
        }}
      />

      {/* Rain drops */}
      {rain.map((drop) => (
        <div
          key={`${drop.id}-${tick}`}
          className="absolute top-0"
          style={{
            left: `${drop.x}%`,
            width: 1,
            height: 80,
            background: `linear-gradient(to bottom, transparent, rgba(147,197,253,${drop.opacity}))`,
            animation: `rain-drop ${drop.duration}s linear ${drop.delay}s infinite`,
          }}
        />
      ))}

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: "rgba(147,197,253,0.5)",
            "--drift": `${p.drift}px`,
            animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
            boxShadow: "0 0 4px rgba(147,197,253,0.8)",
          } as React.CSSProperties}
        />
      ))}

      {/* Lightning flash overlay */}
      <div
        className="absolute inset-0 animate-lightning"
        style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.03) 0%, rgba(79,142,247,0.05) 100%)" }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(79,142,247,1) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(79,142,247,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

// ── Search bar with animated placeholder ───────────────────────────────────
const PLACEHOLDER_QUERIES = [
  "Will it rain in Mumbai this weekend?",
  "What's the UV index in Miami today?",
  "Show me next week's forecast for Kolkata...",
  "Is there a storm warning in Texas?",
  "Best time to travel to Barcelona in March?",
];

function AnimatedSearchBar({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_QUERIES[0]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focused) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => {
        const next = (i + 1) % PLACEHOLDER_QUERIES.length;
        setPlaceholder(PLACEHOLDER_QUERIES[next]);
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [focused]);

  return (
    <div
      className="relative w-full max-w-2xl mx-auto gradient-border"
      style={{ borderRadius: 20 }}
    >
      <div
        className="flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300"
        style={{
          background: focused
            ? "var(--glass-hover)"
            : "var(--glass-bg)",
          backdropFilter: "blur(24px)",
          boxShadow: focused
            ? "0 0 0 1px rgba(79,142,247,0.5), 0 20px 60px rgba(79,142,247,0.15)"
            : "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Weather GPT orb icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--primary), #7c3aed)",
            boxShadow: "0 0 16px rgba(79,142,247,0.5)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-base"
          style={{
            color: "var(--fg)",
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
          }}
        />

        <button
          className="flex-shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--primary), #7c3aed)",
            color: "white",
            boxShadow: "0 4px 16px rgba(79,142,247,0.35)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(79,142,247,0.55)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,142,247,0.35)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        onClick={() => setCurrentPage("Dashboard")}
        >
          Ask AI
        </button>
      </div>
    </div>
  );
}

// ── Live weather cards ──────────────────────────────────────────────────────
const CITIES = [
  { city: "Delhi", country: "IN", temp: 22, feels: 20, condition: "Partly Cloudy", humidity: 58, wind: 14, icon: "cloud", high: 25, low: 16, aqi: "Good" },
  { city: "Mumbai", country: "IN", temp: 28, feels: 31, condition: "Thunderstorm", humidity: 82, wind: 22, icon: "thunder", high: 30, low: 24, aqi: "Moderate" },
  { city: "Kolkata", country: "IN", temp: 14, feels: 11, condition: "Light Rain", humidity: 74, wind: 18, icon: "rain", high: 17, low: 10, aqi: "Good" },
  { city: "Sydney", country: "AU", temp: 19, feels: 18, condition: "Sunny", humidity: 45, wind: 9, icon: "sun", high: 22, low: 15, aqi: "Excellent" },
];

function WeatherCard({ data, delay = 0 }: { data: typeof CITIES[0]; delay?: number }) {
  const [hovered, setHovered] = useState(false);

  const iconMap = {
    sun: <SunIcon className="w-12 h-12 text-amber-300" />,
    cloud: <CloudIcon className="w-14 h-10 text-blue-300" />,
    rain: <RainIcon className="w-12 h-12 text-blue-400" />,
    thunder: <ThunderIcon className="w-12 h-12 text-violet-300" />,
  };

  const conditionColor = {
    sun: "text-amber-300",
    cloud: "text-blue-300",
    rain: "text-blue-400",
    thunder: "text-violet-300",
  }[data.icon];

  return (
    <div
      className="glass rounded-2xl p-6 cursor-pointer relative overflow-hidden"
      style={{
        animation: `slide-up 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, border-color 0.3s ease",
        boxShadow: hovered ? "0 24px 64px rgba(79,142,247,0.15), 0 8px 32px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.3)",
        borderColor: hovered ? "rgba(79,142,247,0.3)" : "var(--border-color)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Subtle glow behind icon */}
      <div
        className="absolute top-4 right-4 rounded-full opacity-20"
        style={{
          width: 80, height: 80,
          background: data.icon === "sun" ? "radial-gradient(circle, #fbbf24, transparent)" :
            data.icon === "thunder" ? "radial-gradient(circle, #7c3aed, transparent)" :
            "radial-gradient(circle, var(--primary), transparent)",
        }}
      />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg leading-tight" style={{ color: "var(--fg)", fontFamily: "var(--font-body)" }}>
            {data.city}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-fg)" }}>{data.country} · AQI: {data.aqi}</p>
        </div>
        <div className="relative z-10">
          {iconMap[data.icon as keyof typeof iconMap]}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-2">
          <span
            className="font-light leading-none"
            style={{ fontSize: "3.5rem", color: "var(--fg)", fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            {data.temp}°
          </span>
          <span className="mb-2 text-sm" style={{ color: "var(--muted-fg)" }}>C</span>
        </div>
        <p className={`text-sm font-medium ${conditionColor}`}>{data.condition}</p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>Feels like {data.feels}°C</p>
      </div>

      <div className="flex gap-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div>
          <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Humidity</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--card-fg)" }}>{data.humidity}%</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Wind</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--card-fg)" }}>{data.wind} km/h</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--muted-fg)" }}>H/L</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--card-fg)" }}>{data.high}° / {data.low}°</p>
        </div>
      </div>
    </div>
  );
}

// ── Feature tiles ───────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Hyper-local Forecasts",
    desc: "Street-level accuracy powered by 50,000+ sensor networks worldwide, updated every 10 minutes.",
    color: "var(--primary)",
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    title: "7-Day AI Prediction",
    desc: "Our transformer models analyze 1M+ data points per location to give you the most accurate week-ahead outlook.",
    color: "#7c3aed",
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Conversational Queries",
    desc: "Ask anything in plain language. \"Will it be good for hiking Saturday?\" gets a real, contextual answer.",
    color: "#06b6d4",
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Climate Trend Analysis",
    desc: "Historical patterns, anomaly detection, and climate shift reports for any location on Earth.",
    color: "#10b981",
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Smart Alerts",
    desc: "Severity-ranked push notifications for severe weather events, UV spikes, and air quality warnings.",
    color: "#f59e0b",
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5"/></svg>,
    title: "Global Coverage",
    desc: "Every city, every ocean, every remote region — 15M+ worldwide locations with real-time data.",
    color: "#ec4899",
  },
];

function FeatureTile({ feature, delay = 0 }: { feature: typeof FEATURES[0]; delay?: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass rounded-2xl p-6 cursor-default"
      style={{
        animation: `slide-up 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease",
        boxShadow: hovered ? `0 20px 50px ${feature.color}18, 0 4px 20px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `${feature.color}18`,
          color: feature.color,
          boxShadow: `0 0 20px ${feature.color}20`,
          transition: "box-shadow 0.3s ease",
          ...(hovered && { boxShadow: `0 0 30px ${feature.color}40` }),
        }}
      >
        {feature.icon}
      </div>
      <h3 className="font-semibold text-base mb-2" style={{ color: "var(--fg)", fontFamily: "var(--font-body)" }}>
        {feature.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>
        {feature.desc}
      </p>
    </div>
  );
}

// ── AI chat demo ────────────────────────────────────────────────────────────
const DEMO_MESSAGES = [
  { role: "user", text: "Should I bring an umbrella to Bengaluru this Friday?" },
  { role: "ai", text: "Yes, definitely bring one! Bengaluru is expecting 12mm of rainfall this Friday between 8am–4pm, with wind gusts up to 28 km/h. Morning commute looks especially wet. Afternoon probability drops to 35% after 5pm, so you might get lucky heading home." },
  { role: "user", text: "What's the best outdoor time window?" },
  { role: "ai", text: "Your clearest window is 5:30–7:30pm — rain chance drops to 20%, winds calm to 12 km/h, and temperatures hold at 16°C. Perfect for an evening walk. Saturday morning is also excellent: sunny, 19°C, ideal outdoor conditions." },
];

function ChatDemo() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    DEMO_MESSAGES.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), 600 + i * 1400);
    });
  }, []);

  return (
    <div
      className="glass rounded-2xl p-6 overflow-hidden"
      style={{ maxHeight: 380, overflowY: "auto" }}
    >
      <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 8px rgba(74,222,128,0.8)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--muted-fg)" }}>Live AI conversation</span>
      </div>

      <div className="flex flex-col gap-4">
        {DEMO_MESSAGES.map((msg, i) => (
          visible.includes(i) && (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animation: "slide-up 0.4s ease both" }}
            >
              {msg.role === "ai" && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 mr-3 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--primary), #7c3aed)", marginTop: 2 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="white" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "linear-gradient(135deg, var(--primary), #7c3aed)", color: "white", borderBottomRightRadius: 4 }
                    : { background: "var(--glass-hover)", color: "var(--card-fg)", borderBottomLeftRadius: 4, border: "1px solid rgba(79,142,247,0.12)" }
                }
              >
                {msg.text}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ── Stat strip ──────────────────────────────────────────────────────────────
const STATS = [
  { value: "50K+", label: "Sensor stations", color: "var(--primary)" },
  { value: "15M+", label: "Locations covered", color: "#7c3aed" },
  { value: "99.2%", label: "Forecast accuracy", color: "#06b6d4" },
  { value: "< 2s", label: "Response time", color: "#10b981" },
];

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );
}

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ isDark, toggleTheme, currentPage, setCurrentPage }: { isDark: boolean; toggleTheme: () => void; currentPage: string; setCurrentPage: (page: string) => void; }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 w-[95%] max-w-6xl rounded-2xl transition-all duration-300 ${scrolled ? 'shadow-xl' : 'shadow-md'}`}
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => setCurrentPage("Home")}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--primary), #7c3aed)" }}
        >
          <SunIcon className="w-5 h-5 text-white" />
        </div>
        <span
          className="font-semibold text-lg tracking-tight"
          style={{ color: "var(--fg)", fontFamily: "var(--font-body)" }}
        >
          WeatherGPT
        </span>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {["Home", "Dashboard", "Weather Map"].map((item) => (
          <a
            key={item}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(item);
            }}
            className="text-sm transition-colors duration-200"
            style={{ 
              color: currentPage === item ? "var(--fg)" : "var(--muted-fg)", 
              fontFamily: "var(--font-body)",
              fontWeight: currentPage === item ? 600 : 400
            }}
            onMouseEnter={(e) => { if (currentPage !== item) e.currentTarget.style.color = "var(--fg)"; }}
            onMouseLeave={(e) => { if (currentPage !== item) e.currentTarget.style.color = "var(--muted-fg)"; }}
          >
            {item}
          </a>
        ))}
      </div>

      {/* CTA and Theme Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-all duration-200"
          style={{
            color: "var(--fg)",
            background: "var(--glass-bg)",
            border: "1px solid var(--border-color)"
          }}
          aria-label="Toggle Theme"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        <button
          className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: "rgba(79,142,247,0.12)",
            color: "var(--primary)",
            border: "1px solid rgba(79,142,247,0.25)",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(79,142,247,0.2)";
            e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(79,142,247,0.12)";
            e.currentTarget.style.borderColor = "rgba(79,142,247,0.25)";
          }}
        >
          Get started
        </button>
      </div>
    </nav>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
function MapEventHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMove(center.lat, center.lng);
    },
  });
  return null;
}




// ── New Dashboard Section ───────────────────────────────────────────────────
function DashboardSection() {
  const particleRef = useRef<any>(null);
  const [isFalling, setIsFalling] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    
    if (messages.length === 0 && particleRef.current) {
      particleRef.current.toggleDrop();
      setIsFalling(true);
    }
    
    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }, { role: 'model', content: "" }]);
    setIsStreaming(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(userMsg);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex].content += chunkText;
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex].content += "\n\n**Error:** Failed to connect to WeatherGPT. Please check your API key.";

        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleToggle = () => {
    if (particleRef.current) {
      particleRef.current.toggleDrop();
      setIsFalling(!isFalling);
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Particle Text Container */}
      <div 
        className={`w-full flex items-center justify-center transition-all duration-[1500ms] ${
          messages.length > 0 ? "absolute top-24 opacity-0 pointer-events-none scale-90 blur-sm" : "flex-1 opacity-100 scale-100 blur-0"
        }`}
        style={{ zIndex: 0 }}
      >
        <ParticleText ref={particleRef} text="WeatherGPT" fontSize={110} gap={5} particleSize={2.5} />
      </div>

      {/* Chat History Container */}
      {messages.length > 0 && (
        <div className="flex-1 w-full flex flex-col gap-6 overflow-y-auto pb-12 pt-8 scroll-smooth relative" style={{ fontFamily: "var(--font-body)", zIndex: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 shadow-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{ 
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--glass-bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--fg)',
                  border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {msg.role === 'model' && msg.content === "" ? (
                    <span className="animate-pulse">Thinking...</span>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      {/* Chat Input Floating */}
      <form 
        onSubmit={handleSend}
        className="absolute bottom-8 left-6 right-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[600px] rounded-full p-2 pl-6 flex items-center gap-4 shadow-lg border"
        style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", backdropFilter: "blur(24px)", zIndex: 100 }}
      >
        <span className="text-red-500">📍</span>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isStreaming}
          placeholder="Ask WeatherGPT anything about weather, travel, or alerts..." 
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
          style={{ color: "var(--fg)" }}
        />
        <div className="flex items-center gap-2 pr-1">
          <button 
            type="submit"
            onClick={(e) => {
              if (!inputText.trim() && messages.length === 0) {
                e.preventDefault();
                handleToggle();
              }
            }}
            disabled={isStreaming || (!inputText.trim() && messages.length > 0)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform ${isStreaming ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            style={{ background: (isFalling && !inputText.trim() && messages.length === 0) ? "#27272a" : "var(--primary)" }}
          >
            {(isFalling && !inputText.trim() && messages.length === 0) ? "↺" : "↗"}
          </button>
        </div>
      </form>
      <p className="absolute bottom-2 text-[10px] text-center w-full" style={{ color: "var(--muted-fg)" }}>
        WeatherGPT blends numerical forecasts, satellite radar, official alerts, and climate history.
      </p>
    </div>
  );
}

// ── Weather Map Section ───────────────────────────────────────────────────────
function WeatherMapSection() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [coords, setCoords] = useState({ lat: 20.5937, lng: 78.9629 });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cityName, setCityName] = useState("Loading...");

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m,pressure_msl&hourly=temperature_2m,relative_humidity_2m&timezone=auto`)
      .then(res => res.json())
      .then(data => setWeatherData(data));
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`)
      .then(res => res.json())
      .then(data => setCityName(data.city || data.locality || data.principalSubdivision || "Unknown Location"))
      .catch(() => setCityName("Unknown Location"));
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    fetch('/api/sachet/cap_public_website/FetchAllAlertDetails', { method: 'POST' })
      .then(res => res.json())
      .then(data => setAlerts(data || []))
      .catch(err => console.error("Error fetching alerts:", err));
  }, []);

  const current = weatherData?.current || {};
  const hourly = weatherData?.hourly || {};

  // Find current hour index to show forecast from now onwards
  const now = new Date();
  const currentHourString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;
  const startIndex = hourly.time ? Math.max(0, hourly.time.findIndex((t: string) => t >= currentHourString)) : 0;
  
  const next8Hours = hourly.time ? hourly.time.slice(startIndex, startIndex + 8) : [...Array(8)];
  const next8Temps = hourly.temperature_2m ? hourly.temperature_2m.slice(startIndex, startIndex + 8) : [...Array(8)];
  const next8Humidities = hourly.relative_humidity_2m ? hourly.relative_humidity_2m.slice(startIndex, startIndex + 8) : [...Array(8)];

  return (
    <div className="pt-32 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-center text-center mb-8 w-full">
        <h1 className="text-5xl font-bold tracking-tight w-full text-center" style={{ color: "var(--fg)", fontFamily: "var(--font-display)" }}>
          Weather Map: <span style={{ color: "var(--primary)" }}>{cityName}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content (Map & Forecast) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Map & Current Details Widget */}
          <div className="rounded-3xl p-6 shadow-sm border" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", backdropFilter: "blur(24px)" }}>
            {/* Location Info */}
            <div className="flex items-center gap-4 mb-6 border-b border-[var(--border-color)] pb-3">
              <h2 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{cityName}</h2>
              <div className="text-sm font-medium" style={{ color: "var(--muted-fg)" }}>
                Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Interactive Radar Map */}
              <div className="flex-1 h-72 rounded-2xl overflow-hidden relative shadow-inner z-10" style={{ border: "1px solid var(--border-color)", background: "var(--bg)" }}>
                <MapContainer 
                  center={[20.5937, 78.9629]} 
                  zoom={4} 
                  style={{ height: "100%", width: "100%", zIndex: 1 }} 
                  zoomControl={false}
                  scrollWheelZoom={true}
                >
                  <MapEventHandler onMove={(lat, lng) => setCoords({ lat, lng })} />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <TileLayer
                    url={`https://tilecache.rainviewer.com/v2/radar/49294a852c1a/256/{z}/{x}/{y}/2/1_1.png`}
                    opacity={0.65}
                  />
                </MapContainer>
              </div>

              {/* Current Details */}
              <div className="w-full lg:w-56 flex flex-col gap-4 justify-center">
                <div className="text-5xl font-bold mb-2 tracking-tight" style={{ color: "var(--fg)" }}>
                  {current.temperature_2m !== undefined ? current.temperature_2m : "--"}<span className="text-2xl text-[var(--muted-fg)] ml-1">°C</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2">
                    <span style={{ color: "var(--muted-fg)" }}>Feels like</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>{current.apparent_temperature !== undefined ? current.apparent_temperature : "--"} °C</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2">
                    <span style={{ color: "var(--muted-fg)" }}>Precipitation</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>{current.precipitation !== undefined ? current.precipitation : "--"} mm</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2">
                    <span style={{ color: "var(--muted-fg)" }}>Wind speed</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>{current.wind_speed_10m !== undefined ? current.wind_speed_10m : "--"} km/h</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2">
                    <span style={{ color: "var(--muted-fg)" }}>Humidity</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>{current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : "--"} %</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: "var(--muted-fg)" }}>Pressure</span>
                    <span className="font-semibold" style={{ color: "var(--fg)" }}>{current.pressure_msl !== undefined ? current.pressure_msl : "--"} hPa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 24 Hours Forecast */}
          <div className="rounded-3xl p-6 shadow-sm border overflow-x-auto" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", backdropFilter: "blur(24px)" }}>
             <div className="flex gap-6 mb-8">
               <button className="text-sm font-semibold text-[var(--primary)] flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]"></span> 24 hours forecast
               </button>
               <button className="text-sm font-medium text-[var(--muted-fg)] transition-colors hover:text-[var(--fg)]">7 days forecast</button>
               <button className="text-sm font-medium text-[var(--muted-fg)] transition-colors hover:text-[var(--fg)]">Historical 7 days</button>
             </div>

             <div className="min-w-[600px] w-full">
               {/* Table header (hours) */}
               <div className="grid grid-cols-8 gap-4 text-center mb-6 text-sm font-medium" style={{ color: "var(--muted-fg)" }}>
                 {next8Hours.map((t: string, i: number) => (
                   <div key={i}>{t ? new Date(t).getHours().toString().padStart(2, '0') + ":00" : "--:--"}</div>
                 ))}
               </div>
               {/* Weather Icons */}
               <div className="grid grid-cols-8 gap-4 text-center mb-6">
                 {[...Array(8)].map((_, i) => (
                   <div key={i} className="flex justify-center text-blue-400">
                     <SunIcon className="w-6 h-6 text-yellow-400" />
                   </div>
                 ))}
               </div>
               {/* Temp */}
               <div className="grid grid-cols-8 gap-4 text-center mb-6 text-base font-bold" style={{ color: "var(--fg)" }}>
                 {next8Temps.map((temp: number, i: number) => (
                   <div key={i}>{temp !== undefined ? Math.round(temp) : "--"}°</div>
                 ))}
               </div>
               {/* Humidity */}
               <div className="grid grid-cols-8 gap-4 text-center text-sm font-medium" style={{ color: "var(--primary)" }}>
                 {next8Humidities.map((hum: number, i: number) => (
                   <div key={i}>{hum !== undefined ? hum : "--"}%</div>
                 ))}
               </div>
             </div>
          </div>

        </div>

                {/* Right Sidebar (Alerts/Reports) */}
        <div className="rounded-3xl p-6 shadow-sm border h-full overflow-y-auto" style={{ background: "var(--glass-bg)", borderColor: "var(--border-color)", backdropFilter: "blur(24px)", maxHeight: "100%" }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-lg" style={{ color: "var(--fg)", fontFamily: "var(--font-display)" }}>NDMA Alerts</h3>
            <button className="text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors">&gt;&gt;</button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary)] text-white shadow-md">All</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-semibold border text-[var(--muted-fg)] hover:text-[var(--fg)] hover:bg-[rgba(255,255,255,0.05)] transition-all" style={{ borderColor: "var(--border-color)" }}>Alerts</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-semibold border text-[var(--muted-fg)] hover:text-[var(--fg)] hover:bg-[rgba(255,255,255,0.05)] transition-all" style={{ borderColor: "var(--border-color)" }}>Cases</button>
            <button className="px-4 py-1.5 rounded-full text-xs font-semibold border text-[var(--muted-fg)] hover:text-[var(--fg)] hover:bg-[rgba(255,255,255,0.05)] transition-all" style={{ borderColor: "var(--border-color)" }}>Reports</button>
          </div>

          <div className="flex flex-col gap-6">
            {alerts.length === 0 ? (
              <p className="text-sm text-[var(--muted-fg)]">No active alerts at this time.</p>
            ) : (
              alerts.slice(0, 5).map((alert: any, idx: number) => {
                const d = new Date(alert.effective_start_time.replace("IST", "+0530"));
                const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : alert.effective_start_time.substring(0, 10);
                const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) : "";
                
                let colorClass = "border-yellow-500";
                let dotClass = "bg-yellow-500";
                let textClass = "text-yellow-500";
                if (alert.severity_color === "red") {
                  colorClass = "border-red-500"; dotClass = "bg-red-500"; textClass = "text-red-500";
                } else if (alert.severity_color === "orange") {
                  colorClass = "border-orange-500"; dotClass = "bg-orange-500"; textClass = "text-orange-500";
                } else if (alert.severity_color === "green") {
                  colorClass = "border-emerald-500"; dotClass = "bg-emerald-500"; textClass = "text-emerald-500";
                }
                
                return (
                  <div key={idx}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted-fg)" }}>{dateStr}</p>
                    <div className={`border-l-[3px] ${colorClass} pl-4 py-1 relative`}>
                      <div className={`absolute w-2 h-2 rounded-full ${dotClass} -left-[5px] top-2`}></div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className={`${textClass} font-bold tracking-wide`}>{alert.severity} - {alert.disaster_type}</span>
                        <span style={{ color: "var(--muted-fg)", fontWeight: 500 }}>{timeStr}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--fg)" }}>
                        {alert.warning_message}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "var(--muted-fg)" }}>
                        {alert.area_description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", overflowX: "hidden" }}>
      <AtmosphericBackground />
      {currentPage === "Dashboard" && <HistorySidebar open={isSidebarOpen} setOpen={setIsSidebarOpen} />}
      
      <div 
        style={{ 
          transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: isSidebarOpen && currentPage === "Dashboard" ? '280px' : '0',
          width: isSidebarOpen && currentPage === "Dashboard" ? 'calc(100% - 280px)' : '100%',
          minHeight: '100vh',
          transform: 'translateZ(0)' 
        }}
      >
      <Navbar 
        isDark={isDark} 
        toggleTheme={() => setIsDark(!isDark)} 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {currentPage === "Home" ? (
        <>
          {/* ── Hero ── */}
      <section className="relative z-10 pt-36 pb-24 px-6 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: "rgba(79,142,247,0.08)",
            border: "1px solid rgba(79,142,247,0.2)",
            animation: "fade-in 0.5s ease both",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}>
            AI-powered · Real-time · Global coverage
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mx-auto leading-tight mb-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.8rem, 7vw, 6rem)",
            color: "var(--fg)",
            maxWidth: 900,
            fontStyle: "italic",
            animation: "slide-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both",
          }}
        >
          The weather, <span className="text-shimmer">understood</span>{" "}
          by intelligence
        </h1>

        {/* Subhead */}
        <p
          className="mx-auto text-lg mb-10 leading-relaxed"
          style={{
            color: "var(--muted-fg)",
            maxWidth: 560,
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            animation: "slide-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both",
          }}
        >
          Ask questions in plain language, get hyper-local forecasts, and understand
          climate patterns — all powered by GPT-grade atmospheric intelligence.
        </p>

        {/* Search */}
        <div style={{ animation: "slide-up 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both" }}>
          <AnimatedSearchBar setCurrentPage={setCurrentPage} />
        </div>

        {/* Hint tags */}
        <div
          className="flex flex-wrap justify-center gap-2 mt-5"
          style={{ animation: "fade-in 0.6s ease 0.6s both" }}
        >
          {["Cyclone season outlook", "Best travel month for Goa", "UV forecast Mumbai", "Cyclone tracker Odisha"].map((tag) => (
            <button
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--muted-fg)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--border-color)";
                e.currentTarget.style.borderColor = "rgba(79,142,247,0.3)";
                e.currentTarget.style.color = "#93c5fd";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#6b7299";
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="relative z-10 py-12 px-6" style={{ borderTop: "1px solid rgba(79,142,247,0.08)", borderBottom: "1px solid rgba(79,142,247,0.08)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              style={{ animation: `slide-up 0.6s ease ${0.1 + i * 0.1}s both` }}
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: s.color }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: "var(--muted-fg)", fontFamily: "var(--font-body)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live weather grid ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "var(--fg)",
                fontStyle: "italic",
                animation: "slide-up 0.6s ease both",
              }}
            >
              Live around the world
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-fg)" }}>Real-time conditions updated every 10 minutes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CITIES.map((city, i) => (
              <WeatherCard key={city.city} data={city} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI demo + Features split ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Chat demo */}
          <div style={{ animation: "slide-up 0.7s ease 0.1s both" }}>
            <div className="mb-2">
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
              >
                Conversational AI
              </span>
            </div>
            <h2
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                color: "var(--fg)",
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              Just ask, like you'd ask a friend
            </h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              No more decoding meteorological charts. WeatherGPT understands context,
              intent, and nuance — giving you answers that actually help you plan.
            </p>
            <ChatDemo />
          </div>

          {/* Right: Feature grid */}
          <div style={{ animation: "slide-up 0.7s ease 0.2s both" }}>
            <div className="mb-2">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#7c3aed", fontFamily: "var(--font-body)" }}>
                Everything you need
              </span>
            </div>
            <h2
              className="mb-8"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                color: "var(--fg)",
                fontStyle: "italic",
                
                lineHeight: 1.2,
              }}
            >
              Built for every kind of weather question
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.slice(0, 4).map((f, i) => (
                <FeatureTile key={f.title} feature={f} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Full features row ── */}
      <section className="relative z-10 py-12 px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.slice(4).map((f, i) => (
            <FeatureTile key={f.title} feature={f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 py-24 px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden gradient-border"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,142,247,0.3) 0%, transparent 70%)",
            }}
          />

          {/* Animated ring */}
          <div className="relative mx-auto mb-8" style={{ width: 80, height: 80 }}>
            <div
              className="absolute inset-0 rounded-full animate-spin-slow"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, var(--primary) 50%, transparent 100%)",
                opacity: 0.3,
              }}
            />
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--primary), #7c3aed)" }}
            >
              <SunIcon className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
          </div>

          <h2
            className="mb-4 relative z-10"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              color: "var(--fg)",
              fontStyle: "italic",
            }}
          >
            Ready to understand the weather?
          </h2>
          <p className="mb-8 relative z-10 text-base" style={{ color: "var(--muted-fg)", maxWidth: 460, margin: "0 auto 2rem" }}>
            Join 2.4 million people who get smarter weather insights every day with WeatherGPT.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 mt-8">
            <button
              className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--primary), #7c3aed)",
                color: "white",
                boxShadow: "0 8px 32px rgba(79,142,247,0.4)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 48px rgba(79,142,247,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(79,142,247,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
            onClick={() => setCurrentPage("Dashboard")}
            >
              Start for free
            </button>
            <button
              className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background: "transparent",
                color: "var(--card-fg)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(79,142,247,0.4)"; e.currentTarget.style.color = "#e8eaf6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#c5c9e0"; }}
            >
              View API docs
            </button>
          </div>
        </div>
      </section>
        </>
      ) : currentPage === "Dashboard" ? (
        <DashboardSection />
      ) : currentPage === "Weather Map" ? (
        <WeatherMapSection />

      ) : (
        <div className="pt-48 pb-24 min-h-[60vh] text-center flex flex-col items-center justify-center">
          <h2 style={{ color: "var(--fg)", fontFamily: "var(--font-display)", fontSize: "2rem" }}>
            {currentPage}
          </h2>
          <p className="mt-4 text-sm" style={{ color: "var(--muted-fg)" }}>This page is coming soon.</p>
        </div>
      )}

      {/* ── Footer ── */}
      </div>
    </div>
  );
}

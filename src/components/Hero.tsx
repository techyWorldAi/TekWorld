import React, { useEffect, useState } from "react";
import type { HomepageContent } from "../types";

const DEFAULT_CONTENT: HomepageContent = {
  eyebrow: "DIGITAL PRESENCE, REIMAGINED",
  headline: "Build an online presence that stands out.",
  description: "We create distinctive digital experiences that help your business get noticed, earn trust, and grow.",
  featuredProjectIds: [],
};

const STATS = [
  { value: "50+", label: "Businesses Served" },
  { value: "4", label: "Core Services" },
  { value: "98%", label: "Client Retention" },
  { value: "Nairobi", label: "HQ, Kenya" },
];

const HeroWaveDivider: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    style={{
      position: "absolute",
      left: 0,
      bottom: -1,
      width: "100%",
      height: "clamp(56px, 8vw, 120px)",
      display: "block",
      pointerEvents: "none",
      zIndex: 1,
    }}
  >
    <path
      d="M0 58 C205 67 365 104 555 94 C760 83 916 39 1080 28 C1218 19 1340 34 1440 24 L1440 120 L0 120 Z"
      fill="#ffffff"
    />
  </svg>
);

export const Hero: React.FC<{ content?: HomepageContent }> = ({ content = DEFAULT_CONTENT }) => {
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 900);
  const [isShort, setIsShort] = useState(() => window.innerHeight <= 680);
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const headlineWords = content.headline.trim().split(/\s+/);
  const headlineLead = headlineWords.slice(0, 3).join(" ");
  const headlineEmphasis = headlineWords.slice(3).join(" ");

  useEffect(() => {
    const onResize = () => {
      setIsCompact(window.innerWidth <= 900);
      setIsShort(window.innerHeight <= 680);
    };
    window.addEventListener("resize", onResize);
    const headlineTimer = window.setTimeout(() => setHeadlineVisible(true), 100);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(headlineTimer);
    };
  }, []);

  return (
    <section
      style={{
        height: "100svh",
        minHeight: "100svh",
        backgroundColor: "#0d0d0d",
        backgroundImage: `linear-gradient(rgba(13,13,13,0.18), rgba(13,13,13,0.18)), url('${import.meta.env.BASE_URL}Smarter%20Tools,%20Bigger%20Possibilities.png')`,
        backgroundSize: "auto, cover",
        backgroundPosition: isCompact ? "center, 80% center" : "center, center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "scroll, fixed",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        padding: isCompact ? `${isShort ? 76 : 88}px 20px ${isShort ? 16 : 68}px` : "96px 40px 104px",
      }}
    >
      <div
        className="grid-overlay"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.35 }}
      />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: "20%", width: 1, background: "rgba(255,255,255,0.055)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: "40%", width: 1, background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

      <div
        style={{
          maxWidth: 1400,
          width: "100%",
          margin: isCompact ? "0 auto auto" : "18px auto auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ maxWidth: isCompact ? 640 : 940 }}>
          <p
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 12px",
              margin: `0 0 ${isShort ? 12 : 20}px`,
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.78)",
              fontFamily: "system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "2.5px",
              lineHeight: 1.4,
            }}
          >
            <span style={{ width: 5, height: 5, background: "#168cff", borderRadius: "50%" }} />
            {content.eyebrow}
          </p>

          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: isCompact ? "clamp(30px, 6.2svh, 60px)" : "clamp(48px, 5.5vw, 88px)",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 0.98,
              letterSpacing: isCompact ? "-1.4px" : "-2px",
              margin: 0,
              textShadow: "0 3px 28px rgba(0,0,0,0.55)",
              textTransform: "uppercase",
            }}
          >
            {headlineLead}
            {headlineEmphasis && <><br /><span style={{ color: "rgba(255,255,255,0.42)" }}>{headlineEmphasis.split(" ").slice(0, -2).join(" ")}{" "}</span></>}
            <span
              style={{
                display: "inline-block",
                borderBottom: "3px solid rgba(255,255,255,0.88)",
                paddingBottom: 4,
                opacity: headlineVisible ? 1 : 0,
                transform: headlineVisible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
            >
              {headlineEmphasis ? headlineEmphasis.split(" ").slice(-2).join(" ") : ""}
            </span>
          </h1>

          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: isShort ? 13 : isCompact ? 14 : 16,
              fontWeight: 400,
              lineHeight: isShort ? 1.5 : 1.65,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 540,
              margin: `${isShort ? 12 : 20}px 0 ${isShort ? 14 : 24}px`,
            }}
          >
            {content.description}
          </p>

          <div style={{ display: "flex", flexDirection: isCompact ? "column" : "row", alignItems: "flex-start", gap: isShort ? 8 : 12, flexWrap: "wrap" }}>
            <button
              onClick={() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                background: "#ffffff",
                color: "#0d0d0d",
                border: "none",
                padding: isCompact ? `${isShort ? 8 : 11}px 24px` : "14px 30px",
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                fontSize: 11,
                letterSpacing: "2px",
                fontWeight: 700,
                transition: "background 0.2s",
                width: isCompact ? "100%" : "auto",
                maxWidth: isCompact ? 320 : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#e8e8e8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#ffffff")}
            >
              VIEW WORK
            </button>
            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                background: "transparent",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.38)",
                padding: isCompact ? `${isShort ? 8 : 11}px 24px` : "14px 30px",
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                fontSize: 11,
                letterSpacing: "2px",
                fontWeight: 500,
                transition: "border-color 0.2s",
                width: isCompact ? "100%" : "auto",
                maxWidth: isCompact ? 320 : "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.8)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.38)")}
            >
              GET IN TOUCH
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1400,
          width: "100%",
          margin: "auto auto 0",
          display: isShort ? "none" : "grid",
          paddingTop: isCompact ? 14 : 20,
          borderTop: "1px solid rgba(255,255,255,0.24)",
          gridTemplateColumns: isCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
        }}
      >
        {STATS.map(({ value, label }, index) => (
          <div
            key={label}
            style={{
              padding: isCompact ? "8px 12px 6px 0" : index === 0 ? "0 28px 0 0" : "0 28px",
              borderRight: isCompact
                ? index % 2 === 0 ? "1px solid rgba(255,255,255,0.2)" : "none"
                : index < STATS.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
              borderBottom: isCompact && index < 2 ? "1px solid rgba(255,255,255,0.16)" : "none",
              marginBottom: isCompact && index < 2 ? 6 : 0,
            }}
          >
            <div style={{ fontFamily: "Georgia, serif", fontSize: isCompact ? 20 : 28, fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>
              {value}
            </div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 9, letterSpacing: "1.5px", color: "rgba(255,255,255,0.68)", marginTop: 5 }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
      <HeroWaveDivider />
    </section>
  );
};

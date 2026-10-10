import React from "react";
import { Logo } from "./Logo";

interface FooterProps {
  onAdminClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 700);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <footer
      id="about"
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        padding: isMobile ? "24px 20px" : "36px 40px",
        display: "flex",
        justifyContent: isMobile ? "center" : "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        textAlign: isMobile ? "center" : "left",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: isMobile ? "center" : "flex-start" }}>
        <Logo size={22} light />
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "2.5px" }}>
          TEKWORLD © {new Date().getFullYear()}
        </span>
      </div>

      {/* Tagline */}
      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "2px" }}>
        WORK SMARTER · SCALE FASTER
      </span>

      {/* Hidden admin trigger */}
      <button
        onClick={onAdminClick}
        title="Admin"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#ffffff", fontSize: 18, letterSpacing: "4px",
          opacity: 0.1,
          transition: "opacity 0.3s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.45")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.1")}
      >
        ···
      </button>
    </footer>
  );
};

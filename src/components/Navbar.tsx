import React, { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { NAV_LINKS } from "../constants";

const getScrollTarget = (link: string) => {
  if (link === "Works") return "work";
  if (link === "Stories") return "stories";
  if (link === "Contact") return "contact";
  return link.toLowerCase();
};

interface NavbarProps {
  onAdminClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onAdminClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => setIsMobile(window.innerWidth <= 900);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleNavClick = (label: string) => {
    if (label === "Works") {
      scrollTo("work");
      return;
    }
    scrollTo(getScrollTarget(label));
  };

  const textColor = scrolled ? "#0d0d0d" : "#ffffff";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        padding: isMobile ? "0 16px" : "0 40px",
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        borderBottom: scrolled ? "1px solid #e8e8e8" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: isMobile ? 64 : 72,
          gap: 12,
        }}
      >
        {/* Brand */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            minWidth: 0,
          }}
        >
          <Logo size={isMobile ? 26 : 34} light={!scrolled} />
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: isMobile ? 14 : 17,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: textColor,
              transition: "color 0.4s",
            }}
          >
            TekWorld
          </span>
        </button>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 40 }}>
          <div style={{ display: isMobile ? "none" : "flex", alignItems: "center", gap: 40 }}>
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                onClick={() => handleNavClick(link)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 11, letterSpacing: "2.5px", fontWeight: 500,
                  color: textColor, opacity: 0.75,
                  transition: "color 0.4s, opacity 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
              >
                {link.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollTo("contact")}
            style={{
              background: scrolled ? "#0d0d0d" : "#ffffff",
              color: scrolled ? "#ffffff" : "#0d0d0d",
              border: "none", cursor: "pointer",
              padding: isMobile ? "8px 12px" : "10px 24px",
              fontFamily: "system-ui, sans-serif",
              fontSize: 11, letterSpacing: isMobile ? "1.5px" : "2.5px", fontWeight: 700,
              transition: "background 0.4s, color 0.4s, opacity 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.82")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            {isMobile ? "START" : "START PROJECT"}
          </button>
        </div>
      </div>
    </nav>
  );
};

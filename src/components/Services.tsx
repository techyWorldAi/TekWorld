import React, { useState } from "react";
import { ServiceItem } from "../types";
import { SERVICES } from "../constants";
import { useInView } from "../hooks/useInView";

/* ── Single service card ─────────────────────────── */
interface ServiceCardProps {
  service: ServiceItem;
  delay: number;
  inView: boolean;
  isMobile: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, delay, inView, isMobile }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#0d0d0d" : "#ffffff",
        padding: isMobile ? "28px 20px" : "48px 40px",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `
          background 0.35s ease,
          opacity 0.65s ${delay}ms ease,
          transform 0.65s ${delay}ms ease
        `,
        cursor: "default",
      }}
    >
      {/* Tag + Price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 12 }}>
        <span style={{
          fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "3px",
          color: hovered ? "rgba(255,255,255,0.4)" : "#aaaaaa",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.13)" : "#e8e8e8"}`,
          padding: "5px 10px",
          transition: "color 0.35s, border-color 0.35s",
        }}>
          {service.tag}
        </span>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "1px", color: hovered ? "rgba(255,255,255,0.33)" : "#bbbbbb", transition: "color 0.35s" }}>
            {service.priceNote}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: hovered ? "#ffffff" : "#0d0d0d", transition: "color 0.35s" }}>
            {service.price}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "Georgia, serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, lineHeight: 1.2,
        color: hovered ? "#ffffff" : "#0d0d0d", margin: "0 0 16px",
        transition: "color 0.35s",
      }}>
        {service.title}
      </h3>

      {/* Desc */}
      <p style={{
        fontFamily: "system-ui, sans-serif", fontSize: isMobile ? 13 : 14, lineHeight: 1.75,
        color: hovered ? "rgba(255,255,255,0.5)" : "#777777", margin: "0 0 32px",
        transition: "color 0.35s",
      }}>
        {service.shortDescription || service.description}
      </p>

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {service.features.map((f) => (
          <li key={f} style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "system-ui, sans-serif", fontSize: 12,
            color: hovered ? "rgba(255,255,255,0.44)" : "#999999",
            padding: "7px 0",
            borderTop: `1px solid ${hovered ? "rgba(255,255,255,0.07)" : "#f0f0f0"}`,
            transition: "color 0.35s, border-color 0.35s",
          }}>
            <span style={{ width: 4, height: 4, background: hovered ? "rgba(255,255,255,0.36)" : "#cccccc", display: "inline-block", flexShrink: 0, transition: "background 0.35s" }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Services section ────────────────────────────── */
export const Services: React.FC<{ services?: ServiceItem[] }> = ({ services = SERVICES }) => {
  const [ref, inView] = useInView();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <section id="services" style={{ background: "#ffffff", padding: isMobile ? "80px 20px" : "120px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: isMobile ? 40 : 80, flexWrap: "wrap", gap: 32 }}>
          <div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "4px", color: "#aaaaaa", fontWeight: 600, marginBottom: 16 }}>
              WHAT WE DO
            </p>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? "clamp(30px, 10vw, 42px)" : "clamp(36px, 5vw, 64px)", fontWeight: 700, color: "#0d0d0d", lineHeight: 1.1 }}>
              Services Built<br />for the AI Age.
            </h2>
          </div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#888888", maxWidth: 320, lineHeight: 1.75, textAlign: isMobile ? "left" : "right" }}>
            Every service is designed to move your business forward — not just digitally, but intelligently.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={ref}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: isMobile ? 12 : 1,
            background: "#e8e8e8",
          }}
        >
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} delay={i * 90} inView={inView} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
};

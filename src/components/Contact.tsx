import React, { useState } from "react";
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import { createEnquiry } from "../firebaseCms";

interface FormData {
  name: string;
  email: string;
  service: string;
  message: string;
}

const INITIAL_FORM: FormData = { name: "", email: "", service: "", message: "" };

const CONTACT_DETAILS = [
  { icon: <FaMapMarkerAlt />, label: "Nairobi, Kenya" },
  { icon: <FaEnvelope />, label: "hello@tekworld.co.ke" },
  { icon: <FaPhoneAlt />, label: "+254706384510" },
];

const lineInput: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.13)",
  padding: "14px 0",
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  color: "#ffffff",
  background: "transparent",
  outline: "none",
  transition: "border-color 0.2s",
};

export const Contact: React.FC = () => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createEnquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        service: form.service.trim(),
        message: form.message.trim(),
      });
      setLoading(false);
      setSent(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "We couldn't send your message. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{ background: "#0d0d0d", padding: isMobile ? "80px 20px" : "120px 40px" }}>
      <div
        style={{
          maxWidth: 1280, margin: "0 auto",
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 40 : 100, alignItems: "start",
        }}
      >
        {/* Left */}
        <div>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "4px", color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 16 }}>
            LET'S TALK
          </p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(36px, 4vw, 60px)", fontWeight: 700, color: "#ffffff", lineHeight: 1.1, marginBottom: 32 }}>
            Ready to Bridge<br />the AI Gap?
          </h2>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 300, lineHeight: 1.8, color: "rgba(255,255,255,0.42)", maxWidth: 380, marginBottom: 56 }}>
            Tell us what you're building or struggling with. We'll map out the fastest path from where you are to where AI can take you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {CONTACT_DETAILS.map(({ icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)" }}>{icon}</span>
                <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.44)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          {sent ? (
            <div style={{ paddingTop: 40 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
                Message received.
              </div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "rgba(255,255,255,0.42)" }}>
                We'll be in touch within 24 hours.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {error && <p role="alert" style={{ color: "#ff9999", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>{error}</p>}
              {(
                [
                  ["name",    "Full Name",               "text"],
                  ["email",   "Email Address",            "email"],
                  ["service", "Service Interested In",    "text"],
                ] as [keyof FormData, string, string][]
              ).map(([key, placeholder, type]) => (
                <input
                  key={key}
                  type={type}
                  placeholder={placeholder}
                  required
                  value={form[key]}
                  onChange={set(key)}
                  style={lineInput}
                  onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.5)")}
                  onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.13)")}
                />
              ))}

              <textarea
                placeholder="Tell us about your project"
                rows={4}
                required
                value={form.message}
                onChange={set("message")}
                style={{ ...lineInput, resize: "none" }}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.5)")}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(255,255,255,0.13)")}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  alignSelf: isMobile ? "stretch" : "flex-start",
                  background: "#ffffff", color: "#0d0d0d", border: "none",
                  padding: isMobile ? "16px 20px" : "16px 40px", cursor: loading ? "wait" : "pointer",
                  fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "3px", fontWeight: 700,
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                {loading ? "SENDING..." : "SEND MESSAGE"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

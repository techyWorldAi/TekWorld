import React, { useState } from "react";
import { Company, Story, CMSData, Platform } from "../types";
import {
  testConnection,
  loadCompanies,
  loadStories,
  addCompany,
  addStory,
  deleteRecord,
  CREATE_TABLES_SQL,
  SupabaseConfig,
} from "../hooks/useSupabase";
import { ADMIN_PIN } from "../constants";
import { auth, firebaseEnabled, signInAdmin } from "../firebase";

/* ── Shared sub-components ───────────────────────── */

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#555555", fontWeight: 600 }}>
      {label}
    </label>
    {children}
  </div>
);

const DarkInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="dark-input"
  />
);

const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      background: "#ffffff", color: "#000000", border: "none",
      padding: "10px 24px", cursor: "pointer",
      fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "2px", fontWeight: 700,
      transition: "opacity 0.2s",
      ...props.style,
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.82")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
  >
    {children}
  </button>
);

const BtnGhost: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      background: "transparent", color: "#666666",
      border: "1px solid #2a2a2a", padding: "10px 24px", cursor: "pointer",
      fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "2px",
      transition: "color 0.2s, border-color 0.2s",
      ...props.style,
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#aaa"; (e.currentTarget as HTMLElement).style.borderColor = "#555"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#666"; (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; }}
  >
    {children}
  </button>
);

/* ── Types ───────────────────────────────────────── */
type Tab = "config" | "companies" | "stories" | "sql";

interface AdminPanelProps {
  onClose: () => void;
  onDataSave: (data: CMSData) => void;
}

/* ── Main component ──────────────────────────────── */
export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onDataSave }) => {
  const [authed, setAuthed] = useState(Boolean(auth?.currentUser));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("config");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const [sbUrl, setSbUrl] = useState(localStorage.getItem("tw_sb_url") ?? "");
  const [sbKey, setSbKey] = useState(localStorage.getItem("tw_sb_key") ?? "");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const [newCo, setNewCo] = useState({ name: "", industry: "", logo_url: "" });
  const [newSt, setNewSt] = useState({
    title: "", company_name: "", description: "",
    platform: "linkedin" as Platform, link: "",
  });

  const cfg: SupabaseConfig = { url: sbUrl, key: sbKey };

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 5000);
  };

  const handleFirebaseLogin = async () => {
    if (!firebaseEnabled) {
      if (pin === ADMIN_PIN) {
        setAuthed(true);
        setStatus("✓ Demo access enabled");
        return;
      }

      flash("✗ Firebase not configured. Add VITE_FIREBASE_* values, or use the demo PIN.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      flash("✗ Enter your email and password");
      return;
    }

    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      setAuthed(true);
      flash("✓ Signed in successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      flash(`✗ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  /* Actions */
  const handleSaveConfig = () => {
    localStorage.setItem("tw_sb_url", sbUrl);
    localStorage.setItem("tw_sb_key", sbKey);
    flash("✓ Config saved locally");
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      await testConnection(cfg);
      setConnected(true);
      flash("✓ Connected to Supabase");
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  const handleLoad = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([loadCompanies(cfg), loadStories(cfg)]);
      setCompanies(c);
      setStories(s);
      onDataSave({ companies: c, stories: s });
      flash(`✓ Loaded ${c.length} companies, ${s.length} stories`);
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  const handleAddCompany = async () => {
    if (!newCo.name.trim()) return flash("✗ Company name is required");
    try {
      const res = await addCompany(newCo, cfg);
      const added = Array.isArray(res) ? res : [res];
      const updated = [...added, ...companies];
      setCompanies(updated);
      onDataSave({ companies: updated, stories });
      setNewCo({ name: "", industry: "", logo_url: "" });
      flash("✓ Company added");
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleAddStory = async () => {
    if (!newSt.title.trim()) return flash("✗ Title is required");
    try {
      const res = await addStory(newSt, cfg);
      const added = Array.isArray(res) ? res : [res];
      const updated = [...added, ...stories];
      setStories(updated);
      onDataSave({ companies, stories: updated });
      setNewSt({ title: "", company_name: "", description: "", platform: "linkedin", link: "" });
      flash("✓ Story added");
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteRecord("companies", id, cfg);
      const updated = companies.filter((c) => c.id !== id);
      setCompanies(updated);
      onDataSave({ companies: updated, stories });
      flash("✓ Deleted");
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDeleteStory = async (id: string) => {
    try {
      await deleteRecord("stories", id, cfg);
      const updated = stories.filter((s) => s.id !== id);
      setStories(updated);
      onDataSave({ companies, stories: updated });
      flash("✓ Deleted");
    } catch (e: unknown) {
      flash("✗ " + (e instanceof Error ? e.message : String(e)));
    }
  };

  /* ── Firebase / PIN gate ── */
  if (!authed) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#111111", border: "1px solid #222222", padding: 48, width: 340 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>Admin Access</div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#555555", marginBottom: 20 }}>
            {firebaseEnabled ? "Sign in with Firebase to continue" : "Add Firebase env vars or use the demo PIN"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="dark-input"
              autoFocus
              disabled={!firebaseEnabled && Boolean(auth)}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="dark-input"
              disabled={!firebaseEnabled && Boolean(auth)}
            />
            {!firebaseEnabled && (
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && pin === ADMIN_PIN) setAuthed(true); }}
                placeholder="Demo PIN"
                className="dark-input"
                style={{ letterSpacing: "8px", fontSize: 18 }}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <BtnPrimary
              onClick={firebaseEnabled ? handleFirebaseLogin : () => {
                if (pin === ADMIN_PIN) {
                  setAuthed(true);
                } else {
                  flash("✗ Wrong PIN");
                }
              }}
              disabled={loading}
            >
              {loading ? "SIGNING IN..." : "ENTER"}
            </BtnPrimary>
            <BtnGhost onClick={onClose}>CANCEL</BtnGhost>
          </div>

          {status && (
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#ff6666", marginTop: 12 }}>{status}</div>
          )}
        </div>
      </div>
    );
  }

  /* ── Panel ── */
  const tabBg = (t: Tab) => tab === t ? "#ffffff" : "transparent";
  const tabColor = (t: Tab) => tab === t ? "#000000" : "#555555";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.98)", zIndex: 200, overflowY: "auto" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#ffffff" }}>CMS Panel</div>
            <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, color: "#444444", letterSpacing: "3px", marginTop: 4 }}>TEKWORLD ADMIN</div>
          </div>
          <BtnGhost onClick={onClose}>✕ CLOSE</BtnGhost>
        </div>

        {/* Status */}
        {status && (
          <div style={{
            background: status.startsWith("✓") ? "#0a2a0a" : "#2a0a0a",
            border: `1px solid ${status.startsWith("✓") ? "#1a4a1a" : "#4a1a1a"}`,
            color: status.startsWith("✓") ? "#66ee66" : "#ff8888",
            padding: "12px 16px", marginBottom: 24,
            fontFamily: "system-ui, sans-serif", fontSize: 13,
          }}>
            {status}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 32, background: "#111111", padding: 4 }}>
          {(["config", "companies", "stories", "sql"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tabBg(t), color: tabColor(t), border: "none",
              padding: "10px 20px", cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: 11, letterSpacing: "2px", fontWeight: 600,
              transition: "background 0.2s, color 0.2s",
            }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── CONFIG ── */}
        {tab === "config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#666666", lineHeight: 1.7 }}>
              Connect your Supabase project. Get credentials from{" "}
              <span style={{ color: "#aaaaaa" }}>supabase.com → Project Settings → API</span>.
            </p>
            <Field label="SUPABASE URL">
              <DarkInput value={sbUrl} onChange={setSbUrl} placeholder="https://xxxx.supabase.co" />
            </Field>
            <Field label="ANON KEY">
              <DarkInput value={sbKey} onChange={setSbKey} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
            </Field>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <BtnPrimary onClick={handleSaveConfig}>SAVE CONFIG</BtnPrimary>
              <BtnGhost onClick={handleTest} disabled={loading} style={{ color: "#fff" }}>
                {loading ? "TESTING..." : "TEST CONNECTION"}
              </BtnGhost>
              {connected && (
                <BtnPrimary onClick={handleLoad} disabled={loading} style={{ background: "#1a3a1a", color: "#66ee66" }}>
                  {loading ? "LOADING..." : "LOAD DATA"}
                </BtnPrimary>
              )}
            </div>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", padding: "20px 24px", marginTop: 8 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#444444", marginBottom: 8 }}>KEYBOARD SHORTCUT</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#aaaaaa" }}>
                Press{" "}
                <code style={{ background: "#1a1a1a", padding: "2px 8px", color: "#ffffff", fontFamily: "monospace" }}>Ctrl + Shift + A</code>
                {" "}anywhere on the site.
              </div>
            </div>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", padding: "20px 24px" }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#444444", marginBottom: 8 }}>DEFAULT PIN</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "6px" }}>tw2024</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#444444", marginTop: 6 }}>
                Change <code style={{ color: "#888" }}>ADMIN_PIN</code> in <code style={{ color: "#888" }}>src/constants.ts</code>
              </div>
            </div>
          </div>
        )}

        {/* ── SQL ── */}
        {tab === "sql" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#666666", lineHeight: 1.7 }}>
              Run this in your Supabase <strong style={{ color: "#aaa" }}>SQL Editor</strong> to create the required tables:
            </p>
            <pre style={{
              background: "#0a0a0a", border: "1px solid #1a1a1a", padding: 24,
              color: "#888888", fontFamily: "monospace", fontSize: 12, lineHeight: 1.75,
              overflowX: "auto", whiteSpace: "pre-wrap",
            }}>
              {CREATE_TABLES_SQL}
            </pre>
            <BtnPrimary onClick={() => { navigator.clipboard?.writeText(CREATE_TABLES_SQL); flash("✓ Copied to clipboard"); }}>
              COPY SQL
            </BtnPrimary>
          </div>
        )}

        {/* ── COMPANIES ── */}
        {tab === "companies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", padding: 24 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#555555", fontWeight: 600, marginBottom: 20 }}>ADD COMPANY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Field label="COMPANY NAME">
                  <DarkInput value={newCo.name} onChange={(v) => setNewCo((p) => ({ ...p, name: v }))} placeholder="Acme Corp" />
                </Field>
                <Field label="INDUSTRY">
                  <DarkInput value={newCo.industry} onChange={(v) => setNewCo((p) => ({ ...p, industry: v }))} placeholder="Fintech" />
                </Field>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Field label="LOGO URL (optional)">
                  <DarkInput value={newCo.logo_url} onChange={(v) => setNewCo((p) => ({ ...p, logo_url: v }))} placeholder="https://cdn.example.com/logo.png" />
                </Field>
              </div>
              <BtnPrimary onClick={handleAddCompany}>ADD COMPANY</BtnPrimary>
            </div>

            <div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#555555", fontWeight: 600, marginBottom: 16 }}>
                EXISTING ({companies.length})
              </div>
              {companies.length === 0 && (
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#444444" }}>
                  No companies yet. Connect to Supabase and load data, or add one above.
                </div>
              )}
              {companies.map((co) => (
                <div key={co.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "#ffffff" }}>{co.name}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#555555", marginTop: 2 }}>{co.industry}</div>
                  </div>
                  <BtnGhost style={{ padding: "6px 14px" }} onClick={() => handleDeleteCompany(co.id)}>DELETE</BtnGhost>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STORIES ── */}
        {tab === "stories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", padding: 24 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#555555", fontWeight: 600, marginBottom: 20 }}>ADD SUCCESS STORY</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Field label="STORY TITLE">
                  <DarkInput value={newSt.title} onChange={(v) => setNewSt((p) => ({ ...p, title: v }))} placeholder="How we 10x'd their leads" />
                </Field>
                <Field label="COMPANY NAME">
                  <DarkInput value={newSt.company_name} onChange={(v) => setNewSt((p) => ({ ...p, company_name: v }))} placeholder="Client name" />
                </Field>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Field label="DESCRIPTION (preview shown on site)">
                  <textarea
                    value={newSt.description}
                    onChange={(e) => setNewSt((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Brief summary of what was achieved..."
                    className="dark-input"
                    style={{ resize: "vertical" }}
                  />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
                <Field label="PLATFORM">
                  <select
                    value={newSt.platform}
                    onChange={(e) => setNewSt((p) => ({ ...p, platform: e.target.value as Platform }))}
                    className="dark-input"
                  >
                    {(["linkedin","facebook","twitter","instagram","website","other"] as Platform[]).map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="POST / PAGE LINK">
                  <DarkInput value={newSt.link} onChange={(v) => setNewSt((p) => ({ ...p, link: v }))} placeholder="https://linkedin.com/posts/..." />
                </Field>
              </div>
              <BtnPrimary onClick={handleAddStory}>ADD STORY</BtnPrimary>
            </div>

            <div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "2px", color: "#555555", fontWeight: 600, marginBottom: 16 }}>
                EXISTING ({stories.length})
              </div>
              {stories.length === 0 && (
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#444444" }}>
                  No stories yet. Add one above.
                </div>
              )}
              {stories.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid #1a1a1a", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#555555", marginBottom: 6 }}>{s.company_name} · {s.platform}</div>
                    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: "#444444", lineHeight: 1.5 }}>
                      {s.description?.slice(0, 120)}{(s.description?.length ?? 0) > 120 ? "…" : ""}
                    </div>
                  </div>
                  <BtnGhost style={{ padding: "6px 14px", flexShrink: 0 }} onClick={() => handleDeleteStory(s.id)}>DELETE</BtnGhost>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

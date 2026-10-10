import React, { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firebaseEnabled, signInAdmin, signOutAdmin } from "../firebase";
import { SERVICES } from "../constants";
import {
  deleteEnquiry,
  isAuthorizedAdmin,
  listEnquiries,
  listMedia,
  listProjects,
  listServices,
  loadHomepageContent,
  removeMedia,
  removeProject,
  removeService,
  saveHomepageContent,
  saveProject,
  saveService,
  seedDefaultServices,
  updateEnquiryStatus,
  uploadMedia,
} from "../firebaseCms";
import type {
  Enquiry,
  HomepageContent,
  MediaAsset,
  Project,
  ProjectFields,
  ServiceItem,
} from "../types";

type Section = "overview" | "projects" | "services" | "homepage" | "media" | "enquiries" | "settings";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects / Our Work" },
  { id: "services", label: "Services" },
  { id: "homepage", label: "Pages & Homepage" },
  { id: "media", label: "Media Library" },
  { id: "enquiries", label: "Messages / Enquiries" },
  { id: "settings", label: "Settings" },
];

const EMPTY_PROJECT: ProjectFields = {
  title: "", slug: "", summary: "", description: "", client: "", category: "",
  services: [], technologies: [], coverImage: "", gallery: [], challenge: "",
  solution: "", results: "", externalUrl: "", seoTitle: "", seoDescription: "",
  status: "draft", featured: false, order: 0,
};

const EMPTY_SERVICE: ServiceItem = {
  id: "", slug: "", title: "", tag: "", price: "", currency: "KES", priceNote: "",
  shortDescription: "", description: "", features: [], imageUrl: "", published: false,
  order: 0, seoTitle: "", seoDescription: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px", color: "#f4f4f4", background: "#111",
  border: "1px solid #303030", font: "14px system-ui, sans-serif", outlineColor: "#168cff",
};
const buttonStyle: React.CSSProperties = {
  border: "1px solid #343434", padding: "10px 14px", color: "#ddd", background: "transparent",
  font: "600 11px system-ui, sans-serif", letterSpacing: "1px", cursor: "pointer",
};
const primaryStyle: React.CSSProperties = { ...buttonStyle, color: "#101010", borderColor: "#fff", background: "#fff" };

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const splitList = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
const friendlyError = (error: unknown) => error instanceof Error ? error.message : "An unexpected error occurred.";

const Field: React.FC<{ label: string; children: React.ReactNode; wide?: boolean }> = ({ label, children, wide }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, gridColumn: wide ? "1 / -1" : undefined }}>
    <span style={{ color: "#929292", font: "600 10px system-ui, sans-serif", letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</span>
    {children}
  </label>
);

const TextField: React.FC<{
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; wide?: boolean; type?: string;
}> = ({ label, value, onChange, multiline, wide, type }) => (
  <Field label={label} wide={wide}>
    {multiline
      ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
      : <input type={type ?? "text"} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />}
  </Field>
);

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [homepage, setHomepage] = useState<HomepageContent>({
    eyebrow: "DIGITAL PRESENCE, REIMAGINED",
    headline: "Build an online presence that stands out.",
    description: "We create distinctive digital experiences that help your business get noticed, earn trust, and grow.",
    featuredProjectIds: [],
  });
  const [projectForm, setProjectForm] = useState<ProjectFields>(EMPTY_PROJECT);
  const [projectBaseline, setProjectBaseline] = useState(JSON.stringify(EMPTY_PROJECT));
  const [editingProjectSlug, setEditingProjectSlug] = useState<string>();
  const [serviceForm, setServiceForm] = useState<ServiceItem>(EMPTY_SERVICE);
  const [serviceBaseline, setServiceBaseline] = useState(JSON.stringify(EMPTY_SERVICE));
  const [editingServiceSlug, setEditingServiceSlug] = useState<string>();
  const [uploadProgress, setUploadProgress] = useState<number>();

  const notify = useCallback((message: string) => setStatus(message), []);
  const checkAdministratorAccess = useCallback(async (currentUser: User | null) => {
    setAuthLoading(true);
    setAuthorized(false);
    if (!currentUser) {
      setAuthLoading(false);
      return;
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        if (await isAuthorizedAdmin(currentUser.uid)) {
          setAuthorized(true);
          setStatus("");
        } else {
          notify("This Firebase account does not have TekWorld administrator access. Ask the project owner to enable its UID in admins/{uid}.");
        }
        setAuthLoading(false);
        return;
      } catch (error) {
        const detail = friendlyError(error);
        const offline = /offline|unavailable|network/i.test(detail);
        if (offline && attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
          continue;
        }
        notify(offline
          ? `Firebase signed you in, but Firestore could not verify administrator access. Check your connection and confirm Cloud Firestore is enabled for this Firebase project. Details: ${detail}`
          : `Administrator authorization failed: ${detail}`);
        setAuthLoading(false);
        return;
      }
    }
  }, [notify]);
  const hasUnsavedChanges =
    JSON.stringify(projectForm) !== projectBaseline ||
    JSON.stringify(serviceForm) !== serviceBaseline;
  const requestClose = () => {
    if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return;
    onClose();
  };
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [nextProjects, nextServices, nextEnquiries, nextHomepage] = await Promise.all([
        listProjects(true), listServices(true), listEnquiries(), loadHomepageContent(),
      ]);
      setProjects(nextProjects);
      setServices(nextServices);
      setEnquiries(nextEnquiries);
      setHomepage(nextHomepage);
    } catch (error) {
      notify(`Could not load CMS data: ${friendlyError(error)}`);
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      void checkAdministratorAccess(nextUser);
    });
  }, [checkAdministratorAccess]);

  useEffect(() => {
    if (!user || authorized) return;
    const retryWhenOnline = () => void checkAdministratorAccess(user);
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [user, authorized, checkAdministratorAccess]);

  useEffect(() => {
    if (authorized) void refresh();
  }, [authorized, refresh]);

  useEffect(() => {
    if (!authorized || section !== "media") return;
    setBusy(true);
    listMedia().then(setMedia).catch((error: unknown) => notify(`Could not load media: ${friendlyError(error)}`))
      .finally(() => setBusy(false));
  }, [authorized, section, notify]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [requestClose]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await signInAdmin(email.trim(), password);
    } catch (error) {
      notify(`Sign-in failed: ${friendlyError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const updateProject = <K extends keyof ProjectFields>(key: K, value: ProjectFields[K]) =>
    setProjectForm((current) => ({ ...current, [key]: value }));
  const updateService = <K extends keyof ServiceItem>(key: K, value: ServiceItem[K]) =>
    setServiceForm((current) => ({ ...current, [key]: value }));

  const saveProjectForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = slugify(projectForm.slug || projectForm.title);
    if (!projectForm.title.trim() || !slug) return notify("Project title and a valid slug are required.");
    setBusy(true);
    try {
      await saveProject({ ...projectForm, title: projectForm.title.trim(), slug }, editingProjectSlug);
      setProjectForm(EMPTY_PROJECT);
      setProjectBaseline(JSON.stringify(EMPTY_PROJECT));
      setEditingProjectSlug(undefined);
      await refresh();
      notify("Project saved.");
    } catch (error) {
      notify(`Could not save project: ${friendlyError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const saveServiceForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = slugify(serviceForm.slug || serviceForm.title);
    if (!serviceForm.title.trim() || !slug) return notify("Service title and a valid slug are required.");
    setBusy(true);
    try {
      await saveService({ ...serviceForm, id: slug, title: serviceForm.title.trim(), slug }, editingServiceSlug);
      setServiceForm(EMPTY_SERVICE);
      setServiceBaseline(JSON.stringify(EMPTY_SERVICE));
      setEditingServiceSlug(undefined);
      await refresh();
      notify("Service saved.");
    } catch (error) {
      notify(`Could not save service: ${friendlyError(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      await saveProject({ ...project, featured: !project.featured }, project.slug);
      await refresh();
    } catch (error) {
      notify(`Could not update featured project: ${friendlyError(error)}`);
    }
  };

  const upload = async (file: File, onDone: (asset: MediaAsset) => void) => {
    if (!user) return notify("Sign in as an administrator before uploading.");
    setUploadProgress(0);
    try {
      const asset = await uploadMedia(file, user.uid, setUploadProgress);
      onDone(asset);
      if (section === "media") setMedia((current) => [asset, ...current]);
      notify("Image uploaded.");
    } catch (error) {
      notify(`Upload failed: ${friendlyError(error)}`);
    } finally {
      setUploadProgress(undefined);
    }
  };

  const projectCounts = useMemo(() => ({
    published: projects.filter((project) => project.status === "published").length,
    drafts: projects.filter((project) => project.status === "draft").length,
    services: services.length,
    enquiries: enquiries.filter((enquiry) => enquiry.status === "new").length,
  }), [projects, services, enquiries]);
  const changeSection = (nextSection: Section) => {
    if (nextSection !== section && hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return;
    setSection(nextSection);
  };

  if (!user) {
    return (
      <main className="cms-page">
        <form className="cms-login" onSubmit={signIn}>
          <a href="/" className="cms-back-link">← Back to TekWorld</a>
          <p className="cms-kicker">TEKWORLD ADMIN</p>
          <h1 id="cms-login-title">Administrator sign in</h1>
          <p className="cms-muted">Sign in with an authorized Firebase administrator account.</p>
          {!firebaseEnabled && <p className="cms-error">Firebase is not configured. Add the VITE_FIREBASE_* environment values.</p>}
          <Field label="EMAIL ADDRESS">
            <input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
          </Field>
          <Field label="PASSWORD">
            <input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
          </Field>
          <button style={primaryStyle} disabled={busy || authLoading || !firebaseEnabled} type="submit">
            {busy || authLoading ? "SIGNING IN..." : "SIGN IN"}
          </button>
          {status && <p className="cms-error" role="alert">{status}</p>}
        </form>
      </main>
    );
  }

  const renderProjectEditor = () => (
    <form className="cms-form-grid" onSubmit={saveProjectForm}>
      <TextField label="Project title" value={projectForm.title} onChange={(value) => updateProject("title", value)} />
      <TextField label="URL slug" value={projectForm.slug} onChange={(value) => updateProject("slug", slugify(value))} />
      <TextField label="Client / brand" value={projectForm.client} onChange={(value) => updateProject("client", value)} />
      <TextField label="Category" value={projectForm.category} onChange={(value) => updateProject("category", value)} />
      <TextField label="Short summary" value={projectForm.summary} onChange={(value) => updateProject("summary", value)} wide />
      <TextField label="Full description" value={projectForm.description} onChange={(value) => updateProject("description", value)} multiline wide />
      <TextField label="Services delivered (comma-separated)" value={projectForm.services.join(", ")} onChange={(value) => updateProject("services", splitList(value))} />
      <TextField label="Technologies (comma-separated)" value={projectForm.technologies.join(", ")} onChange={(value) => updateProject("technologies", splitList(value))} />
      <TextField label="Cover image URL" value={projectForm.coverImage} onChange={(value) => updateProject("coverImage", value)} wide />
      {projectForm.coverImage && <img className="cms-image-preview" src={projectForm.coverImage} alt="Project cover preview" />}
      <Field label="Upload cover image" wide><input type="file" accept="image/*" onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (file) void upload(file, (asset) => updateProject("coverImage", asset.url));
        event.currentTarget.value = "";
      }} /></Field>
      <Field label="Upload gallery images" wide><input type="file" accept="image/*" multiple onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        files.forEach((file) => void upload(file, (asset) => setProjectForm((current) => ({ ...current, gallery: [...current.gallery, asset.url] }))));
        event.currentTarget.value = "";
      }} /></Field>
      <TextField label="Gallery image URLs (one per line)" value={projectForm.gallery.join("\n")} onChange={(value) => updateProject("gallery", splitList(value))} multiline wide />
      <TextField label="Challenge" value={projectForm.challenge} onChange={(value) => updateProject("challenge", value)} multiline />
      <TextField label="Solution" value={projectForm.solution} onChange={(value) => updateProject("solution", value)} multiline />
      <TextField label="Results / outcomes" value={projectForm.results} onChange={(value) => updateProject("results", value)} multiline />
      <TextField label="External project URL" value={projectForm.externalUrl} onChange={(value) => updateProject("externalUrl", value)} />
      <TextField label="SEO title" value={projectForm.seoTitle} onChange={(value) => updateProject("seoTitle", value)} />
      <TextField label="SEO meta description" value={projectForm.seoDescription} onChange={(value) => updateProject("seoDescription", value)} wide />
      <TextField label="Display order" type="number" value={String(projectForm.order)} onChange={(value) => updateProject("order", Number(value) || 0)} />
      <Field label="Publication status"><select value={projectForm.status} onChange={(event) => updateProject("status", event.target.value as ProjectFields["status"])} style={inputStyle}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
      <label className="cms-checkbox"><input type="checkbox" checked={projectForm.featured} onChange={(event) => updateProject("featured", event.target.checked)} /> Feature on homepage</label>
      <div className="cms-form-actions"><button type="submit" style={primaryStyle} disabled={busy}>{busy ? "SAVING..." : editingProjectSlug ? "SAVE PROJECT" : "CREATE PROJECT"}</button><button type="button" style={buttonStyle} onClick={() => { if (JSON.stringify(projectForm) !== projectBaseline && !window.confirm("Discard your unsaved project changes?")) return; setProjectForm(EMPTY_PROJECT); setProjectBaseline(JSON.stringify(EMPTY_PROJECT)); setEditingProjectSlug(undefined); }}>CLEAR</button></div>
    </form>
  );

  const renderServiceEditor = () => (
    <form className="cms-form-grid" onSubmit={saveServiceForm}>
      <TextField label="Title" value={serviceForm.title} onChange={(value) => updateService("title", value)} />
      <TextField label="URL slug" value={serviceForm.slug} onChange={(value) => updateService("slug", slugify(value))} />
      <TextField label="Category label" value={serviceForm.tag} onChange={(value) => updateService("tag", value)} />
      <TextField label="Starting price" value={serviceForm.price} onChange={(value) => updateService("price", value)} />
      <TextField label="Currency" value={serviceForm.currency} onChange={(value) => updateService("currency", value)} />
      <TextField label="Price note" value={serviceForm.priceNote} onChange={(value) => updateService("priceNote", value)} />
      <TextField label="Short description" value={serviceForm.shortDescription} onChange={(value) => updateService("shortDescription", value)} wide />
      <TextField label="Full description" value={serviceForm.description} onChange={(value) => updateService("description", value)} multiline wide />
      <TextField label="Features (one per line)" value={serviceForm.features.join("\n")} onChange={(value) => updateService("features", splitList(value))} multiline wide />
      <TextField label="Image URL" value={serviceForm.imageUrl} onChange={(value) => updateService("imageUrl", value)} wide />
      <Field label="Upload service image" wide><input type="file" accept="image/*" onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (file) void upload(file, (asset) => updateService("imageUrl", asset.url));
        event.currentTarget.value = "";
      }} /></Field>
      <TextField label="Display order" type="number" value={String(serviceForm.order)} onChange={(value) => updateService("order", Number(value) || 0)} />
      <TextField label="SEO title" value={serviceForm.seoTitle} onChange={(value) => updateService("seoTitle", value)} />
      <TextField label="SEO meta description" value={serviceForm.seoDescription} onChange={(value) => updateService("seoDescription", value)} wide />
      <label className="cms-checkbox"><input type="checkbox" checked={serviceForm.published} onChange={(event) => updateService("published", event.target.checked)} /> Published</label>
      <div className="cms-form-actions"><button type="submit" style={primaryStyle} disabled={busy}>{busy ? "SAVING..." : editingServiceSlug ? "SAVE SERVICE" : "CREATE SERVICE"}</button><button type="button" style={buttonStyle} onClick={() => { if (JSON.stringify(serviceForm) !== serviceBaseline && !window.confirm("Discard your unsaved service changes?")) return; setServiceForm(EMPTY_SERVICE); setServiceBaseline(JSON.stringify(EMPTY_SERVICE)); setEditingServiceSlug(undefined); }}>CLEAR</button></div>
    </form>
  );

  return (
    <main className="cms-page">
      <div className="cms-shell">
        <header className="cms-header">
          <div><p className="cms-kicker">TEKWORLD ADMIN</p><h1>Content studio</h1></div>
          <div className="cms-header-actions"><span className="cms-muted">{user?.email}</span><button style={buttonStyle} onClick={() => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes and sign out?")) return; void signOutAdmin(); }}>SIGN OUT</button><a className="cms-back-link" href="/">VIEW WEBSITE ↗</a></div>
        </header>
        {status && <div className={status.includes("failed") || status.includes("Could not") ? "cms-notice is-error" : "cms-notice"} role="status">{status}<button onClick={() => setStatus("")} aria-label="Dismiss message">×</button></div>}
        {uploadProgress !== undefined && <progress className="cms-upload-progress" value={uploadProgress} max={100} aria-label={`Image upload ${uploadProgress}% complete`}>{uploadProgress}%</progress>}
        <div className="cms-layout">
          <nav className="cms-sidebar" aria-label="Admin sections">
            {SECTIONS.map((item) => <button key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => changeSection(item.id)}>{item.label}</button>)}
          </nav>
          <main className="cms-main">
            {!authorized ? (
              <section className="cms-access-state" role="status" aria-live="polite">
                <p className="cms-kicker">SIGNED IN</p>
                <h2>Welcome to the CMS.</h2>
                <p>{authLoading
                  ? "Checking administrator access with Firebase…"
                  : status || "The dashboard is ready. Firebase must confirm administrator access before content can be viewed or changed."}</p>
                {!authLoading && <button style={buttonStyle} onClick={() => void checkAdministratorAccess(user)}>RETRY ACCESS CHECK</button>}
              </section>
            ) : <>
            {busy && <p className="cms-muted" role="status">Loading…</p>}
            {section === "overview" && <section><p className="cms-kicker">OVERVIEW</p><h2>Welcome back.</h2><div className="cms-stat-grid">
              {[["Published projects", projectCounts.published], ["Drafts", projectCounts.drafts], ["Services", projectCounts.services], ["New enquiries", projectCounts.enquiries]].map(([label, count]) => <article className="cms-stat" key={label}><span>{label}</span><strong>{count}</strong></article>)}
            </div><h3 className="cms-subheading">Recent updates</h3>{[...projects].sort((first, second) => (second.updatedAt?.toMillis() ?? 0) - (first.updatedAt?.toMillis() ?? 0)).slice(0, 5).map((project) => <div className="cms-list-row" key={project.slug}><span>{project.title}</span><span className="cms-muted">{project.status}</span></div>)}</section>}

            {section === "projects" && <section><p className="cms-kicker">OUR WORK</p><h2>{editingProjectSlug ? "Edit project" : "Projects"}</h2>
              {renderProjectEditor()}
              <h3 className="cms-subheading">Projects ({projects.length})</h3>
              {projects.map((project) => <article className="cms-list-row cms-project-row" key={project.slug}>
                <div>{project.coverImage && <img src={project.coverImage} alt="" />}<span>{project.title}<small>{project.slug} · {project.status} · order {project.order}</small></span></div>
                <div className="cms-row-actions"><button style={buttonStyle} onClick={() => void toggleFeatured(project)}>{project.featured ? "UNFEATURE" : "FEATURE"}</button><a style={buttonStyle} href={`/work/${encodeURIComponent(project.slug)}`} target="_blank" rel="noreferrer">PREVIEW</a><button style={buttonStyle} onClick={() => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return; const next = { ...project, services: [...project.services], technologies: [...project.technologies], gallery: [...project.gallery] }; setEditingProjectSlug(project.slug); setProjectForm(next); setProjectBaseline(JSON.stringify(next)); window.scrollTo({ top: 0 }); }}>EDIT</button><button style={buttonStyle} onClick={async () => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return; if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return; try { await removeProject(project.slug); await refresh(); notify("Project deleted."); } catch (error) { notify(`Could not delete project: ${friendlyError(error)}`); } }}>DELETE</button></div>
              </article>)}
            </section>}

            {section === "services" && <section><p className="cms-kicker">OFFERINGS</p><h2>{editingServiceSlug ? "Edit service" : "Services"}</h2>
              <div className="cms-form-actions" style={{ marginBottom: 20 }}><button style={buttonStyle} onClick={async () => { setBusy(true); try { const count = await seedDefaultServices(SERVICES); await refresh(); notify(count ? `${count} starter services added. Review and publish them as needed.` : "Starter services already exist."); } catch (error) { notify(`Could not initialize services: ${friendlyError(error)}`); } finally { setBusy(false); } }}>ADD EXISTING TEKWORLD SERVICES</button></div>
              {renderServiceEditor()}
              <h3 className="cms-subheading">Services ({services.length})</h3>
              {services.map((service) => <article className="cms-list-row" key={service.slug}><span>{service.title}<small>{service.price} {service.priceNote} · {service.published ? "published" : "draft"}</small></span><div className="cms-row-actions"><button style={buttonStyle} onClick={() => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return; const next = { ...service }; setEditingServiceSlug(service.slug); setServiceForm(next); setServiceBaseline(JSON.stringify(next)); window.scrollTo({ top: 0 }); }}>EDIT</button><button style={buttonStyle} onClick={async () => { if (hasUnsavedChanges && !window.confirm("Discard your unsaved editor changes?")) return; if (!window.confirm(`Delete service "${service.title}"?`)) return; try { await removeService(service.slug); await refresh(); notify("Service deleted."); } catch (error) { notify(`Could not delete service: ${friendlyError(error)}`); } }}>DELETE</button></div></article>)}
            </section>}

            {section === "homepage" && <section><p className="cms-kicker">PAGES & HOMEPAGE</p><h2>Homepage content</h2><form className="cms-form-grid" onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { await saveHomepageContent(homepage); notify("Homepage content saved."); } catch (error) { notify(`Could not save homepage: ${friendlyError(error)}`); } finally { setBusy(false); } }}>
              <TextField label="Eyebrow" value={homepage.eyebrow} onChange={(value) => setHomepage((current) => ({ ...current, eyebrow: value }))} wide />
              <TextField label="Headline" value={homepage.headline} onChange={(value) => setHomepage((current) => ({ ...current, headline: value }))} wide />
              <TextField label="Description" value={homepage.description} onChange={(value) => setHomepage((current) => ({ ...current, description: value }))} multiline wide />
              <Field label="Featured projects" wide><div className="cms-feature-list">{projects.filter((project) => project.status === "published").map((project) => <label key={project.id}><input type="checkbox" checked={homepage.featuredProjectIds.includes(project.id)} onChange={(event) => setHomepage((current) => ({ ...current, featuredProjectIds: event.target.checked ? [...current.featuredProjectIds, project.id] : current.featuredProjectIds.filter((id) => id !== project.id) }))} /> {project.title}</label>)}</div></Field>
              <div className="cms-form-actions"><button style={primaryStyle} type="submit" disabled={busy}>SAVE HOMEPAGE</button></div>
            </form><p className="cms-muted">Homepage messaging defaults to the existing TekWorld positioning until you save changes. Service and project content remains controlled from its own sections.</p></section>}

            {section === "media" && <section><p className="cms-kicker">ASSETS</p><h2>Media library</h2><Field label="Upload images" wide><input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); files.forEach((file) => void upload(file, () => undefined)); event.currentTarget.value = ""; }} /></Field><div className="cms-media-grid">{media.map((asset) => <article key={asset.path}><img src={asset.url} alt={asset.name} /><p>{asset.name}</p><button style={buttonStyle} onClick={() => void navigator.clipboard.writeText(asset.url).then(() => notify("Media URL copied."))}>COPY URL</button><button style={buttonStyle} onClick={async () => { if (!window.confirm(`Delete ${asset.name}? References to this file will no longer work.`)) return; try { await removeMedia(asset.path); setMedia((current) => current.filter((item) => item.path !== asset.path)); notify("Media deleted."); } catch (error) { notify(`Could not delete media: ${friendlyError(error)}`); } }}>DELETE</button></article>)}</div>{!media.length && <p className="cms-muted">No uploads yet. Images up to 10 MB are accepted.</p>}</section>}

            {section === "enquiries" && <section><p className="cms-kicker">INBOX</p><h2>Messages & enquiries</h2>{enquiries.map((enquiry) => <article className="cms-enquiry" key={enquiry.id}><div className="cms-list-row"><strong>{enquiry.name}</strong><span className="cms-muted">{enquiry.status}</span></div><a href={`mailto:${encodeURIComponent(enquiry.email)}`}>{enquiry.email}</a><p>{enquiry.service}</p><p>{enquiry.message}</p><div className="cms-row-actions"><button style={buttonStyle} onClick={async () => { try { await updateEnquiryStatus(enquiry.id, enquiry.status === "new" ? "read" : "new"); await refresh(); } catch (error) { notify(friendlyError(error)); } }}>{enquiry.status === "new" ? "MARK READ" : "MARK NEW"}</button><button style={buttonStyle} onClick={async () => { try { await updateEnquiryStatus(enquiry.id, "archived"); await refresh(); } catch (error) { notify(friendlyError(error)); } }}>ARCHIVE</button><button style={buttonStyle} onClick={async () => { if (!window.confirm("Delete this enquiry?")) return; try { await deleteEnquiry(enquiry.id); await refresh(); } catch (error) { notify(friendlyError(error)); } }}>DELETE</button></div></article>)}{!enquiries.length && <p className="cms-muted">No enquiries received yet.</p>}</section>}

            {section === "settings" && <section><p className="cms-kicker">SECURITY & CONFIGURATION</p><h2>Settings</h2><p>Signed in as <strong>{user?.email}</strong></p><p className="cms-muted">Admin access is authorized by a read-only Firestore document at <code>admins/{user?.uid}</code>. Firestore and Storage security rules enforce administrator access independently from this interface.</p><p className="cms-muted">Configure Firebase Authentication Email/Password, enable Firestore and Storage, provision your admin UID from a trusted Firebase Console or server-side process, and deploy the repository security rules before using content operations.</p><p className="cms-muted">Legacy Supabase data is not deleted or modified. Export/import it separately before retiring that project.</p></section>}
            </>}
          </main>
        </div>
        <footer className="cms-footer"><span>{busy ? "Working…" : "Changes save directly to Firebase."}</span><button style={buttonStyle} onClick={() => void refresh()}>REFRESH CONTENT</button></footer>
      </div>
    </main>
  );
};

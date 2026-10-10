import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { WorkedWith } from "./components/WorkedWith";
import { Stories } from "./components/Stories";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { AdminPanel } from "./components/AdminPanel";
import { ProjectDetail } from "./components/ProjectDetail";
import type { CMSData, HomepageContent, Project, ServiceItem } from "./types";
import { loadCompanies, loadStories } from "./hooks/useSupabase";
import { firebaseEnabled } from "./firebase";
import { listProjects, listServices, loadHomepageContent } from "./firebaseCms";
import { SERVICES } from "./constants";

const DEFAULT_HOMEPAGE: HomepageContent = {
  eyebrow: "DIGITAL PRESENCE, REIMAGINED",
  headline: "Build an online presence that stands out.",
  description: "We create distinctive digital experiences that help your business get noticed, earn trust, and grow.",
  featuredProjectIds: [],
  featuredProjectsConfigured: false,
};

const getRoute = () => {
  if (window.location.pathname.replace(/\/+$/, "") === "/admin") return { type: "admin" as const };
  const match = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (match) {
    try { return { type: "project" as const, slug: decodeURIComponent(match[1]) }; }
    catch { return { type: "not-found" as const }; }
  }
  if (window.location.pathname.replace(/\/+$/, "") === "/work") return { type: "work" as const };
  return { type: "home" as const };
};

const App: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [route, setRoute] = useState(getRoute);
  const [cmsData, setCmsData] = useState<CMSData>({ companies: [], stories: [] });
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);
  const [homepage, setHomepage] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [contentError, setContentError] = useState("");
  const [legacyError, setLegacyError] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const onHistoryChange = () => setRoute(getRoute());
    window.addEventListener("popstate", onHistoryChange);
    return () => window.removeEventListener("popstate", onHistoryChange);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;
    setContentLoading(true);
    Promise.allSettled([listProjects(), listServices(), loadHomepageContent()]).then((results) => {
      if (!active) return;
      const errors: string[] = [];
      const [projectResult, serviceResult, homepageResult] = results;
      if (projectResult.status === "fulfilled") setProjects(projectResult.value);
      else errors.push(`Projects: ${projectResult.reason instanceof Error ? projectResult.reason.message : "load failed"}`);
      if (serviceResult.status === "fulfilled") {
        setServices(serviceResult.value.length ? serviceResult.value : SERVICES);
      } else errors.push(`Services: ${serviceResult.reason instanceof Error ? serviceResult.reason.message : "load failed"}`);
      if (homepageResult.status === "fulfilled") setHomepage(homepageResult.value);
      else errors.push(`Homepage: ${homepageResult.reason instanceof Error ? homepageResult.reason.message : "load failed"}`);
      setContentError(errors.join(" · "));
      setContentLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    // Keep access to existing Supabase records during migration; this read-only
    // compatibility path does not save credentials or modify the old database.
    if (!localStorage.getItem("tw_sb_url") || !localStorage.getItem("tw_sb_key")) return;
    let active = true;
    Promise.all([loadCompanies(), loadStories()])
      .then(([companies, stories]) => {
        if (active && Array.isArray(companies) && Array.isArray(stories)) setCmsData({ companies, stories });
      })
      .catch((error: unknown) => {
        if (active) setLegacyError(error instanceof Error ? error.message : "Legacy public content could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        window.history.pushState({}, "", "/admin");
        setRoute({ type: "admin" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const displayedProjects = useMemo(() => {
    if (route.type === "work") return projects;
    if (homepage.featuredProjectsConfigured) {
      return homepage.featuredProjectIds
        .map((id) => projects.find((project) => project.id === id))
        .filter((project): project is Project => project !== undefined);
    }
    return projects.filter((project) => project.featured);
  }, [homepage.featuredProjectIds, projects, route.type]);

  const projectRoute = route.type === "project";
  const workRoute = route.type === "work";

  return (
    <>
      {route.type === "admin" ? (
        <AdminPanel onClose={() => {
          window.history.pushState({}, "", "/");
          setRoute({ type: "home" });
        }} />
      ) : (
      <>
      <Navbar onAdminClick={() => {
        window.history.pushState({}, "", "/admin");
        setRoute({ type: "admin" });
      }} services={services} />
      {projectRoute ? (
        <ProjectDetail slug={route.slug} />
      ) : workRoute ? (
        <main className="work-listing-page">
          <p className="project-detail-kicker">TEKWORLD · OUR WORK</p>
          <h1>Selected projects</h1>
          <WorkedWith projects={projects} loading={contentLoading} error={contentError} />
        </main>
      ) : (
        <>
          <main>
            <Hero content={homepage} />
            <Services services={services} />
            <WorkedWith
              projects={displayedProjects}
              companies={cmsData.companies}
              loading={contentLoading}
              error={contentError
                ? `Firebase content is unavailable. Check your connection and confirm Cloud Firestore has been created and enabled for this project. Details: ${contentError}`
                : ""}
            />
            {legacyError && <p role="status" className="legacy-content-notice">Some existing client stories could not be loaded. {legacyError}</p>}
            <Stories stories={cmsData.stories} />
            <Contact />
          </main>
          <Footer onAdminClick={() => {
            window.history.pushState({}, "", "/admin");
            setRoute({ type: "admin" });
          }} />
        </>
      )}
      {projectRoute || workRoute ? <Footer onAdminClick={() => {
        window.history.pushState({}, "", "/admin");
        setRoute({ type: "admin" });
      }} /> : null}
      </>
      )}
    </>
  );
};

export default App;

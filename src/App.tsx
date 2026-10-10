import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { WorkedWith } from "./components/WorkedWith";
import { Contact } from "./components/Contact";
import { Companies } from "./components/Companies";
import { Footer } from "./components/Footer";
import { AdminPanel } from "./components/AdminPanel";
import { ProjectDetail } from "./components/ProjectDetail";
import type { Company, HomepageContent, Project, ServiceItem } from "./types";
import { HOMEPAGE_SECTION_IDS } from "./types";
import { firebaseEnabled } from "./firebase";
import { listCompanies, listProjects, listServices, loadHomepageContent } from "./firebaseCms";
import { SERVICES } from "./constants";

const DEFAULT_HOMEPAGE: HomepageContent = {
  eyebrow: "DIGITAL PRESENCE, REIMAGINED",
  headline: "Build an online presence that stands out.",
  description: "We create distinctive digital experiences that help your business get noticed, earn trust, and grow.",
  featuredProjectIds: [],
  featuredProjectsConfigured: false,
  sectionOrder: [...HOMEPAGE_SECTION_IDS],
  hiddenSections: [],
  themeColor: "#168cff",
};

const getRoute = () => {
  if (window.location.pathname.replace(/\/+$/, "") === "/admin") return { type: "admin" as const };
  const match = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (match) {
    try {
      return {
        type: "project" as const,
        slug: decodeURIComponent(match[1]),
        preview: new URLSearchParams(window.location.search).get("preview") === "1",
      };
    }
    catch { return { type: "not-found" as const }; }
  }
  if (window.location.pathname.replace(/\/+$/, "") === "/work") return { type: "work" as const };
  return { type: "home" as const };
};

const App: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [route, setRoute] = useState(getRoute);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [homepage, setHomepage] = useState<HomepageContent>(DEFAULT_HOMEPAGE);
  const [contentError, setContentError] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    const onHistoryChange = () => setRoute(getRoute());
    window.addEventListener("popstate", onHistoryChange);
    return () => window.removeEventListener("popstate", onHistoryChange);
  }, []);

  useEffect(() => {
    const onContentUpdated = () => setRefreshKey((current) => current + 1);
    window.addEventListener("tekworld:content-updated", onContentUpdated);
    return () => window.removeEventListener("tekworld:content-updated", onContentUpdated);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;
    setContentLoading(true);
    Promise.allSettled([listProjects(), listServices(), listCompanies(), loadHomepageContent()]).then((results) => {
      if (!active) return;
      const errors: string[] = [];
      const [projectResult, serviceResult, companyResult, homepageResult] = results;
      if (projectResult.status === "fulfilled") setProjects(projectResult.value);
      else errors.push(`Projects: ${projectResult.reason instanceof Error ? projectResult.reason.message : "load failed"}`);
      if (serviceResult.status === "fulfilled") {
        setServices(serviceResult.value.length ? serviceResult.value : SERVICES.filter((service) => service.published));
      } else errors.push(`Services: ${serviceResult.reason instanceof Error ? serviceResult.reason.message : "load failed"}`);
      if (companyResult.status === "fulfilled") setCompanies(companyResult.value);
      else errors.push(`Companies: ${companyResult.reason instanceof Error ? companyResult.reason.message : "load failed"}`);
      if (homepageResult.status === "fulfilled") setHomepage(homepageResult.value);
      else errors.push(`Homepage: ${homepageResult.reason instanceof Error ? homepageResult.reason.message : "load failed"}`);
      setContentError(errors.join(" · "));
      setContentLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

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
      const featuredIds = new Set(homepage.featuredProjectIds);
      return projects.filter((project) => featuredIds.has(project.id));
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
        <ProjectDetail slug={route.slug} preview={route.preview} />
      ) : workRoute ? (
        <main className="work-listing-page">
          <p className="project-detail-kicker">TEKWORLD · OUR WORK</p>
          <h1>Selected projects</h1>
          <WorkedWith projects={projects} loading={contentLoading} error={contentError} showFilters />
        </main>
      ) : (
        <>
          <main className="site-theme" style={{ "--site-accent": homepage.themeColor } as React.CSSProperties}>
            {homepage.sectionOrder
              .filter((section) => !homepage.hiddenSections.includes(section))
              .map((section) => {
                switch (section) {
                  case "hero":
                    return <Hero key={section} content={homepage} />;
                  case "services":
                    return <Services key={section} services={services} />;
                  case "work":
                    return <WorkedWith
                      key={section}
                      projects={displayedProjects}
                      loading={contentLoading}
                      error={contentError || undefined}
                    />;
                  case "companies":
                    return <Companies key={section} companies={companies} />;
                  case "contact":
                    return <Contact key={section} />;
                }
              })}
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

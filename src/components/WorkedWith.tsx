import React from "react";
import type { Project } from "../types";
import { useInView } from "../hooks/useInView";
import { ImageWithFallback } from "./ImageWithFallback";

interface WorkedWithProps {
  projects?: Project[];
  loading?: boolean;
  error?: string;
  showFilters?: boolean;
}

export const WorkedWith: React.FC<WorkedWithProps> = ({ projects = [], loading = false, error, showFilters = false }) => {
  const [workRef, workInView] = useInView();
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const publishedProjects = projects.filter((project) => project.status === "published");
  const categories = Array.from(new Set(publishedProjects.map((project) => project.category.trim()).filter(Boolean))).sort();
  const visibleProjects = selectedCategory === "All"
    ? publishedProjects
    : publishedProjects.filter((project) => project.category === selectedCategory);
  if (!publishedProjects.length && !loading && !error && !showFilters) return null;

  return (
      <section id="work" style={{ background: "#f7f7f5", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "4px", color: "var(--site-accent, #168cff)", fontWeight: 600, marginBottom: 16 }}>
          {showFilters ? "OUR WORK" : "SELECTED WORK"}
        </p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#0d0d0d", marginBottom: 40 }}>
          {showFilters ? "Selected projects." : "Projects that move business forward."}
        </h2>
        {loading && <p role="status" style={{ color: "#777" }}>Loading published content…</p>}
        {error && <p role="alert" style={{ color: "#777" }}>Content could not be loaded: {error}</p>}
        {!loading && !error && !publishedProjects.length && (
          <p style={{ color: "#777", fontFamily: "system-ui, sans-serif" }}>Our latest work will appear here soon.</p>
        )}
        {showFilters && categories.length > 1 && <div className="work-category-filters" role="group" aria-label="Filter projects by category">
          {["All", ...categories].map((category) => <button
            type="button"
            key={category}
            aria-pressed={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >{category}</button>)}
        </div>}
        {visibleProjects.length > 0 ? (
          <div ref={workRef} className="project-grid">
            {visibleProjects.map((project, index) => (
              <a className="public-project-card" href={`/work/${encodeURIComponent(project.slug)}`} key={project.id}
                style={{ opacity: workInView ? 1 : 0, transform: workInView ? "none" : "translateY(18px)", transition: `opacity .45s ${index * 60}ms ease, transform .45s ${index * 60}ms ease` }}>
                {project.coverImage
                  ? <ImageWithFallback
                    src={project.coverImage}
                    alt=""
                    loading={index === 0 && !showFilters ? "eager" : "lazy"}
                    priority={index === 0 && !showFilters}
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 420px"
                    fallback={<div className="project-image-placeholder" aria-hidden="true">TEKWORLD</div>}
                  />
                  : <div className="project-image-placeholder" aria-hidden="true">TEKWORLD</div>}
                <div className="public-project-copy">
                  <p>{project.category || "PROJECT"}{project.client ? ` · ${project.client}` : ""}</p>
                  <h3>{project.title}</h3>
                  <span>{project.summary}</span>
                  <b>VIEW PROJECT <i aria-hidden="true">↗</i></b>
                </div>
              </a>
            ))}
          </div>
        ) : publishedProjects.length > 0 ? (
          <p role="status" style={{ color: "#777", fontFamily: "system-ui, sans-serif" }}>No projects in this category yet.</p>
        ) : null}
        </div>
      </section>
  );
};

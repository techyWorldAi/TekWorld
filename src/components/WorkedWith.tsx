import React from "react";
import type { Company, Project } from "../types";
import { useInView } from "../hooks/useInView";
import { ImageWithFallback } from "./ImageWithFallback";

interface WorkedWithProps {
  projects?: Project[];
  companies?: Company[];
  loading?: boolean;
  error?: string;
}

export const WorkedWith: React.FC<WorkedWithProps> = ({ projects = [], companies = [], loading = false, error }) => {
  const [ref, inView] = useInView();
  const publishedProjects = projects.filter((project) => project.status === "published");
  if (!publishedProjects.length && !companies.length && !loading && !error) return null;

  return (
    <section id="work" style={{ background: "#f7f7f5", padding: "100px 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 10, letterSpacing: "4px", color: "#888", fontWeight: 600, marginBottom: 16 }}>
          {publishedProjects.length ? "SELECTED WORK" : "TRUSTED BY"}
        </p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "#0d0d0d", marginBottom: 40 }}>
          {publishedProjects.length ? "Projects that move business forward." : "Companies We've Worked With"}
        </h2>
        {loading && <p role="status" style={{ color: "#777" }}>Loading published projects…</p>}
        {error && <p role="alert" style={{ color: "#777" }}>Content could not be loaded: {error}</p>}
        {!loading && !error && !publishedProjects.length && !companies.length && (
          <p style={{ color: "#777", fontFamily: "system-ui, sans-serif" }}>Our latest work will appear here soon.</p>
        )}
        {publishedProjects.length > 0 ? (
          <div ref={ref} className="project-grid">
            {publishedProjects.map((project, index) => (
              <a className="public-project-card" href={`/work/${encodeURIComponent(project.slug)}`} key={project.id}
                style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(18px)", transition: `opacity .45s ${index * 60}ms ease, transform .45s ${index * 60}ms ease` }}>
                {project.coverImage
                  ? <ImageWithFallback src={project.coverImage} alt="" loading="lazy" fallback={<div className="project-image-placeholder" aria-hidden="true">TEKWORLD</div>} />
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
        ) : companies.length > 0 ? (
          <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 1, background: "#e0e0e0" }}>
            {companies.map((company, index) => (
              <div key={company.id} style={{ background: "#f7f7f5", padding: "36px 32px", opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `opacity 0.55s ${index * 60}ms ease, transform 0.55s ${index * 60}ms ease` }}>
                {company.logo_url && <ImageWithFallback src={company.logo_url} alt={`${company.name} logo`} style={{ height: 36, maxWidth: "100%", objectFit: "contain", display: "block", marginBottom: 16, filter: "grayscale(1)" }} fallback={<span className="company-logo-fallback">{company.name}</span>} />}
                <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#0d0d0d", marginBottom: 6 }}>{company.name}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: "#999", letterSpacing: "1.5px" }}>{company.industry?.toUpperCase()}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

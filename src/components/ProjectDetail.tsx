import React, { useEffect, useState } from "react";
import { getProject } from "../firebaseCms";
import type { Project } from "../types";

export const ProjectDetail: React.FC<{ slug: string }> = ({ slug }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProject(slug)
      .then((result) => { if (active) setProject(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Project could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    document.title = project.seoTitle || `${project.title} | TekWorld`;
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content = project.seoDescription || project.summary;
    let image = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (!image) {
      image = document.createElement("meta");
      image.setAttribute("property", "og:image");
      document.head.appendChild(image);
    }
    image.content = project.coverImage;
    return () => { document.title = "TekWorld"; };
  }, [project]);

  if (loading) return <main className="project-detail-state" role="status">Loading project…</main>;
  if (error || !project) return (
    <main className="project-detail-state">
      <p className="project-detail-kicker">PROJECT NOT FOUND</p>
      <h1>This project is not available.</h1>
      <p>{error ? `We couldn't load this project: ${error}` : "The project may have been unpublished or the address may be incorrect."}</p>
      <a href="/#work">Back to our work →</a>
    </main>
  );

  return (
    <main className="project-detail">
      <div className="project-detail-hero">
        <a className="project-detail-back" href="/#work">← Back to our work</a>
        <p className="project-detail-kicker">{project.category}{project.client ? ` · ${project.client}` : ""}</p>
        <h1>{project.title}</h1>
        <p>{project.summary}</p>
        {project.coverImage && <img className="project-detail-cover" src={project.coverImage} alt={`${project.title} cover`} />}
      </div>
      <div className="project-detail-content">
        <section><p className="project-detail-kicker">OVERVIEW</p><p>{project.description}</p></section>
        {(project.challenge || project.solution || project.results) && <div className="project-detail-narrative">
          {project.challenge && <section><h2>The challenge</h2><p>{project.challenge}</p></section>}
          {project.solution && <section><h2>The solution</h2><p>{project.solution}</p></section>}
          {project.results && <section><h2>The results</h2><p>{project.results}</p></section>}
        </div>}
        {(project.services.length > 0 || project.technologies.length > 0) && <section className="project-detail-specs">
          {project.services.length > 0 && <div><h2>Services</h2><ul>{project.services.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {project.technologies.length > 0 && <div><h2>Technology</h2><ul>{project.technologies.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </section>}
        {project.gallery.length > 0 && <div className="project-detail-gallery">{project.gallery.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${project.title} gallery ${index + 1}`} loading="lazy" />)}</div>}
        {project.externalUrl && <a className="project-detail-external" href={project.externalUrl} target="_blank" rel="noreferrer">Visit project ↗</a>}
      </div>
    </main>
  );
};

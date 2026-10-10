import React, { useEffect, useState } from "react";
import { getProject, isAuthorizedAdmin } from "../firebaseCms";
import type { Project } from "../types";
import { ImageWithFallback } from "./ImageWithFallback";
import { isValidImageUrl } from "../imageUrls";
import { listenForAuth } from "../firebase";
import type { User } from "firebase/auth";

export const ProjectDetail: React.FC<{ slug: string; preview?: boolean }> = ({ slug, preview = false }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewAccess, setPreviewAccess] = useState<"checking" | "allowed" | "denied">(preview ? "checking" : "allowed");
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);

  const gallery = project?.gallery ?? [];

  useEffect(() => {
    setActiveGalleryIndex(0);
    setGalleryPaused(false);
  }, [slug]);

  useEffect(() => {
    if (gallery.length < 2 || galleryPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveGalleryIndex((current) => (current + 1) % gallery.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [gallery.length, galleryPaused]);

  useEffect(() => {
    if (!preview) {
      setPreviewAccess("allowed");
      return;
    }
    setPreviewAccess("checking");
    return listenForAuth((user: User | null) => {
      if (!user) {
        setPreviewAccess("denied");
        return;
      }
      void isAuthorizedAdmin(user.uid)
        .then((allowed) => setPreviewAccess(allowed ? "allowed" : "denied"))
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : "Administrator preview authorization failed.");
          setPreviewAccess("denied");
        });
    });
  }, [preview]);

  useEffect(() => {
    if (preview && previewAccess !== "allowed") {
      if (previewAccess === "denied") setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    getProject(slug, preview)
      .then((result) => { if (active) setProject(result); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Project could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [preview, previewAccess, slug]);

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
    image.content = isValidImageUrl(project.coverImage) ? project.coverImage : "";
    return () => { document.title = "TekWorld"; };
  }, [project]);

  if (preview && previewAccess === "checking") return <main className="project-detail-state" role="status">Checking administrator preview access…</main>;
  if (preview && previewAccess === "denied") return (
    <main className="project-detail-state">
      <p className="project-detail-kicker">PREVIEW REQUIRES ADMIN ACCESS</p>
      <h1>Sign in to preview this draft.</h1>
      <p>{error || "Draft projects are only visible to authorized administrators."}</p>
      <a href="/admin">Open administrator sign in →</a>
    </main>
  );
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
        {preview && <p className="project-detail-kicker">ADMIN PREVIEW · {project.status.toUpperCase()}</p>}
        <a className="project-detail-back" href="/#work">← Back to our work</a>
        <p className="project-detail-kicker">{project.category}{project.client ? ` · ${project.client}` : ""}</p>
        <h1>{project.title}</h1>
        <p>{project.summary}</p>
        {project.coverImage && <ImageWithFallback className="project-detail-cover" src={project.coverImage} alt={`${project.title} cover`} sizes="100vw" fallback={<div className="project-detail-cover project-image-placeholder" role="img" aria-label={`${project.title} cover unavailable`}>TEKWORLD</div>} />}
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
        {gallery.length > 0 && <section
          className="project-detail-gallery"
          aria-label={`${project.title} image gallery`}
          aria-roledescription="carousel"
          onMouseEnter={() => setGalleryPaused(true)}
          onMouseLeave={() => setGalleryPaused(false)}
          onFocusCapture={() => setGalleryPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setGalleryPaused(false);
          }}
        >
          <div className="project-gallery-viewport">
            <div
              className="project-gallery-track"
              style={{ transform: `translateX(-${activeGalleryIndex * 100}%)` }}
            >
              {gallery.map((url, index) => {
                const asset = project.galleryAssets?.find((item) => item.url === url);
                return <div
                  className="project-gallery-slide"
                  key={`${url}-${index}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${gallery.length}`}
                  aria-hidden={index !== activeGalleryIndex}
                >
                  <ImageWithFallback
                    src={url}
                    alt={asset?.alt || `${project.title} gallery image ${index + 1}`}
                    loading="lazy"
                    sizes="100vw"
                    fallback={<span className="project-gallery-placeholder" role="img" aria-label={`${project.title} gallery image unavailable`}>Image unavailable</span>}
                  />
                </div>;
              })}
            </div>
          </div>
          {gallery.length > 1 && <>
            <button
              className="project-gallery-control project-gallery-previous"
              type="button"
              aria-label="Show previous project image"
              onClick={() => setActiveGalleryIndex((current) => (current - 1 + gallery.length) % gallery.length)}
            >‹</button>
            <button
              className="project-gallery-control project-gallery-next"
              type="button"
              aria-label="Show next project image"
              onClick={() => setActiveGalleryIndex((current) => (current + 1) % gallery.length)}
            >›</button>
            <div className="project-gallery-indicators" role="group" aria-label="Choose project image">
              {gallery.map((url, index) => <button
                key={`${url}-indicator-${index}`}
                type="button"
                className={index === activeGalleryIndex ? "is-active" : ""}
                aria-label={`Show image ${index + 1} of ${gallery.length}`}
                aria-current={index === activeGalleryIndex ? "true" : undefined}
                onClick={() => setActiveGalleryIndex(index)}
              />)}
            </div>
          </>}
        </section>}
        {project.externalUrl && <a className="project-detail-external" href={project.externalUrl} target="_blank" rel="noreferrer">Visit project ↗</a>}
      </div>
    </main>
  );
};

import React from "react";
import type { Company } from "../types";
import { useInView } from "../hooks/useInView";
import { ImageWithFallback } from "./ImageWithFallback";

export const Companies: React.FC<{ companies: Company[] }> = ({ companies }) => {
  const [ref, inView] = useInView();
  if (!companies.length) return null;

  return (
    <section id="companies" className="company-showcase">
      <div className="company-showcase-inner">
        <p className="company-showcase-eyebrow">TRUSTED BY</p>
        <h2>Companies we’ve worked with.</h2>
        <div ref={ref} className="company-showcase-grid">
          {companies.map((company, index) => (
            <article
              className="company-showcase-card"
              key={company.id}
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "none" : "translateY(18px)",
                transition: `opacity .45s ${index * 60}ms ease, transform .45s ${index * 60}ms ease`,
              }}
            >
              {company.logo_url
                ? <ImageWithFallback
                  src={company.logoAsset?.url || company.logo_url}
                  alt={company.logoAsset?.alt || `${company.name} logo`}
                  loading={index < 4 ? "eager" : "lazy"}
                  sizes="(max-width: 768px) 54px, 76px"
                  fallback={<span className="company-logo-fallback">{company.name}</span>}
                />
                : <span className="company-logo-fallback">{company.name}</span>}
              <div>
                <strong>{company.name}</strong>
                {company.industry && <span>{company.industry}</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

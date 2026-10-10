import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Logo } from "./Logo";
import { SERVICES as DEFAULT_SERVICES } from "../constants";
import type { ServiceItem } from "../types";

interface NavbarProps {
  onAdminClick: () => void;
  services?: ServiceItem[];
}

const NAV_ITEMS = [
  { label: "Home", target: "home" },
  { label: "Our Work", target: "work" },
  { label: "Pricing", target: "services" },
  { label: "About", target: "about" },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ services = DEFAULT_SERVICES }) => {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const navRef = useRef<HTMLElement>(null);
  const servicesItemRef = useRef<HTMLDivElement>(null);
  const servicesButtonRef = useRef<HTMLButtonElement>(null);
  const mobileServicesButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const hoverCloseTimerRef = useRef<number | undefined>(undefined);
  const pendingServicesFocusRef = useRef<"first" | "last" | null>(null);
  const isMobileRef = useRef(isMobile);
  const mobileOpenRef = useRef(mobileOpen);
  const servicesOpenRef = useRef(servicesOpen);

  isMobileRef.current = isMobile;
  mobileOpenRef.current = mobileOpen;
  servicesOpenRef.current = servicesOpen;

  const cancelHoverClose = () => {
    if (hoverCloseTimerRef.current !== undefined) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = undefined;
    }
  };

  const closeServicesAfterPointerLeaves = () => {
    cancelHoverClose();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      if (navRef.current?.querySelector("#desktop-services-panel")?.contains(document.activeElement)) {
        hoverCloseTimerRef.current = undefined;
        return;
      }
      setServicesOpen(false);
      hoverCloseTimerRef.current = undefined;
    }, 140);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const marker = window.scrollY + window.innerHeight * 0.34;
      let active = "home";
      ["services", "work", "contact", "about"].forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) active = id;
      });
      setActiveSection(active);
    };
    const onResize = () => {
      cancelHoverClose();
      const compact = window.innerWidth <= 900;
      if (compact !== isMobileRef.current) {
        setMobileOpen(false);
        setServicesOpen(false);
      }
      setIsMobile(compact);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        cancelHoverClose();
        setServicesOpen(false);
        setMobileOpen(false);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!servicesOpenRef.current || event.pointerType !== "mouse") return;
      const target = event.target;
      if (target instanceof Node && servicesItemRef.current?.contains(target)) {
        cancelHoverClose();
      } else {
        closeServicesAfterPointerLeaves();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (servicesOpenRef.current) {
          cancelHoverClose();
          setServicesOpen(false);
          (isMobileRef.current ? mobileServicesButtonRef : servicesButtonRef).current?.focus();
        } else if (mobileOpenRef.current) {
          setMobileOpen(false);
          mobileButtonRef.current?.focus();
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("keydown", onKeyDown);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("keydown", onKeyDown);
      cancelHoverClose();
    };
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobile, mobileOpen]);

  useEffect(() => {
    if (!servicesOpen || !pendingServicesFocusRef.current) return;
    const links = navRef.current?.querySelectorAll<HTMLAnchorElement>("#desktop-services-panel a");
    const target = pendingServicesFocusRef.current === "last" ? links?.[links.length - 1] : links?.[0];
    pendingServicesFocusRef.current = null;
    target?.focus();
  }, [servicesOpen]);

  const scrollTo = (target: string) => {
    if (target === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    }
    setServicesOpen(false);
    setMobileOpen(false);
  };

  const renderServicesPanel = (mobile = false) => (
    <div
      className={mobile
        ? `mobile-services-panel${servicesOpen ? " is-open" : ""}`
        : `nav-mega-menu${servicesOpen ? " is-open" : ""}`}
      id={mobile ? "mobile-services-panel" : "desktop-services-panel"}
      aria-hidden={!servicesOpen}
      onPointerEnter={!mobile ? cancelHoverClose : undefined}
      onPointerLeave={!mobile ? closeServicesAfterPointerLeaves : undefined}
    >
      <div className={mobile ? "mobile-services-content" : "nav-mega-inner"}>
        <div className="nav-mega-intro">
          <p>OUR SERVICES</p>
          <h2>Digital solutions built to move your business forward.</h2>
        </div>
        <div className="nav-mega-services">
          {services.filter((service) => service.published).map((service, index) => (
            <article className="nav-mega-service" key={service.slug}>
              <p className="nav-mega-label"><span>{String(index + 1).padStart(2, "0")}</span> — {service.tag}</p>
              <h3>{service.title}</h3>
              <p className="nav-mega-price">{service.priceNote.toLowerCase() === "starting from" ? `From ${service.price}` : `${service.price} ${service.priceNote}`}</p>
              <p className="nav-mega-description">{service.shortDescription || service.description}</p>
              <a
                className="nav-mega-link"
                href="#services"
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo("services");
                }}
              >
                Explore {({
                  WEB: "web development",
                  AUTOMATE: "automation",
                  AI: "AI solutions",
                  TRAIN: "training",
                } as Record<string, string>)[service.tag] ?? service.title.toLowerCase()} <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
        <div className="nav-mega-action">
          <span>Not sure what your business needs?</span>
          <a
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              scrollTo("contact");
            }}
          >
            Let&apos;s discuss your project <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <nav
      ref={navRef}
      className={`site-nav${scrolled || mobileOpen ? " is-scrolled" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
      aria-label="Main navigation"
    >
      <div className="site-nav-inner">
        <button className="site-brand" onClick={() => scrollTo("home")} aria-label="TekWorld home">
          <Logo size={isMobile ? 28 : 34} light={!scrolled && !mobileOpen} />
          <span>TekWorld</span>
        </button>

        {!isMobile && (
          <div className="site-nav-links">
            <button className={`site-nav-link${activeSection === "home" ? " is-current" : ""}`} aria-current={activeSection === "home" ? "location" : undefined} onClick={() => scrollTo("home")}>Home</button>
            <div
              ref={servicesItemRef}
              className="services-nav-item"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  cancelHoverClose();
                  setServicesOpen(true);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") closeServicesAfterPointerLeaves();
              }}
              onBlur={(event) => {
                if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
                  setServicesOpen(false);
                }
              }}
            >
              <button
                ref={servicesButtonRef}
                className={`site-nav-link services-toggle${servicesOpen || activeSection === "services" ? " is-active" : ""}`}
                aria-current={activeSection === "services" ? "location" : undefined}
                aria-expanded={servicesOpen}
                aria-controls="desktop-services-panel"
                onClick={() => setServicesOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const direction = event.key === "ArrowUp" ? "last" : "first";
                    if (servicesOpen) {
                      const links = navRef.current?.querySelectorAll<HTMLAnchorElement>("#desktop-services-panel a");
                      (direction === "last" ? links?.[links.length - 1] : links?.[0])?.focus();
                    } else {
                      pendingServicesFocusRef.current = direction;
                      setServicesOpen(true);
                    }
                  }
                }}
              >
                Services
                <FiChevronDown
                  className="nav-chevron"
                  aria-hidden="true"
                  focusable="false"
                  style={{ transform: servicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {renderServicesPanel()}
            </div>
            {NAV_ITEMS.slice(1).map(({ label, target }) => (
              <button
                className={`site-nav-link${(target === "work" && activeSection === "work") || (target === "about" && activeSection === "about") ? " is-current" : ""}`}
                aria-current={(target === "work" && activeSection === "work") || (target === "about" && activeSection === "about") ? "location" : undefined}
                key={label}
                onClick={() => scrollTo(target)}
              >
                {label}
              </button>
            ))}
            <button className="site-project-cta" onClick={() => scrollTo("contact")}>
              Start a Project <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-nav-actions">
            <button className="mobile-project-cta" onClick={() => scrollTo("contact")}>Start a Project</button>
            <button
              ref={mobileButtonRef}
              className="mobile-menu-toggle"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation-panel"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
          </div>
        )}
      </div>

      {isMobile && (
        <div id="mobile-navigation-panel" className={`mobile-nav-panel${mobileOpen ? " is-open" : ""}`} aria-hidden={!mobileOpen}>
          <div className="mobile-nav-content">
            <button className="mobile-nav-link" onClick={() => scrollTo("home")}>Home</button>
            <section className="mobile-services">
              <button
                ref={mobileServicesButtonRef}
                className="mobile-nav-link mobile-services-toggle"
                aria-expanded={servicesOpen}
                aria-controls="mobile-services-panel"
                onClick={() => setServicesOpen((open) => !open)}
              >
                Services
                <FiChevronDown
                  className="nav-chevron"
                  aria-hidden="true"
                  focusable="false"
                  style={{ transform: servicesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {renderServicesPanel(true)}
            </section>
            {NAV_ITEMS.slice(1).map(({ label, target }) => (
              <button className="mobile-nav-link" key={label} onClick={() => scrollTo(target)}>{label}</button>
            ))}
            <button className="mobile-panel-cta" onClick={() => scrollTo("contact")}>
              Start a Project <span aria-hidden="true">↗</span>
            </button>
          </div>
          <p className="mobile-nav-note">WEB · BRAND · GROWTH</p>
        </div>
      )}
    </nav>
  );
};

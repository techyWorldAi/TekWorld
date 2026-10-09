import { ServiceItem } from "./types";

export const ADMIN_PIN = "tw2024";

export const NAV_LINKS = ["Services", "Works", "Stories", "Contact"] as const;

export const PLATFORM_COLORS: Record<string, string> = {
  linkedin:  "#0A66C2",
  facebook:  "#1877F2",
  twitter:   "#1DA1F2",
  instagram: "#E4405F",
  website:   "#0d0d0d",
  other:     "#0d0d0d",
};

export const SERVICES: ServiceItem[] = [
  {
    id: 1,
    title: "Smart Website Builds",
    tag: "WEB",
    price: "KES 45,000",
    priceNote: "starting from",
    desc: "AI-native websites engineered for performance, automation, and intelligent user experiences. From landing pages to full platforms.",
    features: [
      "Custom AI chat integrations",
      "SEO-optimised architecture",
      "CMS & content automation",
      "Mobile-first, blazing fast",
    ],
  },
  {
    id: 2,
    title: "Business Automation",
    tag: "AUTOMATE",
    price: "KES 35,000",
    priceNote: "per workflow",
    desc: "End-to-end automation of your business operations — CRM syncs, email sequences, data pipelines, and AI-powered decision flows.",
    features: [
      "Zapier / Make / n8n builds",
      "CRM & lead automation",
      "Invoice & ops workflows",
      "WhatsApp & email bots",
    ],
  },
  {
    id: 3,
    title: "AI Strategy & Integration",
    tag: "AI",
    price: "KES 60,000",
    priceNote: "per engagement",
    desc: "Custom AI integrations, LLM deployments, and strategic consulting to embed AI into your product or business process.",
    features: [
      "GPT / Claude API integration",
      "Custom AI model fine-tuning",
      "AI audit & roadmap",
      "Vendor selection support",
    ],
  },
  {
    id: 4,
    title: "AI Training Programmes",
    tag: "TRAIN",
    price: "KES 15,000",
    priceNote: "per person",
    desc: "Hands-on workshops and training programmes for teams transitioning to AI-first workflows. Practical, not theoretical.",
    features: [
      "Team AI literacy bootcamp",
      "Prompt engineering labs",
      "Tool adoption coaching",
      "Ongoing support retainer",
    ],
  },
];

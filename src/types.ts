import type { Timestamp } from "firebase/firestore";

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  tag: string;
  price: string;
  currency: string;
  priceNote: string;
  shortDescription: string;
  description: string;
  features: string[];
  imageUrl: string;
  published: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type Platform = "linkedin" | "facebook" | "twitter" | "instagram" | "website" | "other";

export interface Company {
  id: string;
  name: string;
  industry?: string;
  logo_url?: string;
}

export interface Story {
  id: string;
  title: string;
  company_name?: string;
  description?: string;
  platform: Platform;
  link?: string;
}

export interface CMSData {
  companies: Company[];
  stories: Story[];
}

export type ProjectStatus = "draft" | "published";

export interface ProjectFields {
  title: string;
  slug: string;
  summary: string;
  description: string;
  client: string;
  category: string;
  services: string[];
  technologies: string[];
  coverImage: string;
  gallery: string[];
  challenge: string;
  solution: string;
  results: string;
  externalUrl: string;
  seoTitle: string;
  seoDescription: string;
  status: ProjectStatus;
  featured: boolean;
  order: number;
}

export interface Project extends ProjectFields {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface HomepageContent {
  eyebrow: string;
  headline: string;
  description: string;
  featuredProjectIds: string[];
  featuredProjectsConfigured?: boolean;
  updatedAt?: Timestamp;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  status: "new" | "read" | "archived";
  createdAt?: Timestamp;
}

export interface MediaAsset {
  path: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
  updatedAt?: string;
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Company,
  Enquiry,
  HomepageContent,
  Project,
  ProjectFields,
  ServiceItem,
} from "./types";

const requireDb = () => {
  if (!db) throw new Error("Firebase is not configured. Set the VITE_FIREBASE_* variables and rebuild.");
  return db;
};

const text = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "string" ? data[key] as string : "";

const strings = (data: Record<string, unknown>, key: string) =>
  Array.isArray(data[key]) ? data[key].filter((value): value is string => typeof value === "string") : [];

const number = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "number" && Number.isFinite(data[key]) ? data[key] as number : 0;

const boolean = (data: Record<string, unknown>, key: string) => data[key] === true;

const projectFromSnapshot = (id: string, data: Record<string, unknown>): Project => ({
  id,
  title: text(data, "title"),
  slug: text(data, "slug") || id,
  summary: text(data, "summary"),
  description: text(data, "description"),
  client: text(data, "client"),
  category: text(data, "category"),
  services: strings(data, "services"),
  technologies: strings(data, "technologies"),
  coverImage: text(data, "coverImage"),
  gallery: strings(data, "gallery"),
  challenge: text(data, "challenge"),
  solution: text(data, "solution"),
  results: text(data, "results"),
  externalUrl: text(data, "externalUrl"),
  seoTitle: text(data, "seoTitle"),
  seoDescription: text(data, "seoDescription"),
  status: data.status === "published" ? "published" : "draft",
  featured: boolean(data, "featured"),
  order: number(data, "order"),
  createdAt: data.createdAt as Project["createdAt"],
  updatedAt: data.updatedAt as Project["updatedAt"],
});

const serviceFromSnapshot = (id: string, data: Record<string, unknown>): ServiceItem => ({
  id,
  slug: text(data, "slug") || id,
  title: text(data, "title"),
  tag: text(data, "tag"),
  price: text(data, "price"),
  currency: text(data, "currency") || "KES",
  priceNote: text(data, "priceNote"),
  shortDescription: text(data, "shortDescription"),
  description: text(data, "description"),
  features: strings(data, "features"),
  imageUrl: text(data, "imageUrl"),
  published: boolean(data, "published"),
  order: number(data, "order"),
  seoTitle: text(data, "seoTitle"),
  seoDescription: text(data, "seoDescription"),
  createdAt: data.createdAt as ServiceItem["createdAt"],
  updatedAt: data.updatedAt as ServiceItem["updatedAt"],
});

export const isAuthorizedAdmin = async (uid: string): Promise<boolean> => {
  const database = requireDb();
  const adminSnapshot = await getDoc(doc(database, "admins", uid));
  return adminSnapshot.exists() && adminSnapshot.data().enabled === true;
};

export const listProjects = async (admin = false): Promise<Project[]> => {
  const database = requireDb();
  const base = collection(database, "projects");
  const snapshot = await getDocs(admin
    ? query(base, orderBy("order", "asc"))
    : query(base, where("status", "==", "published")));
  return snapshot.docs
    .map((item) => projectFromSnapshot(item.id, item.data()))
    .filter((project) => admin || project.status === "published")
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
};

export const getProject = async (slug: string, admin = false): Promise<Project | null> => {
  const snapshot = await getDoc(doc(requireDb(), "projects", slug));
  if (!snapshot.exists()) return null;
  const project = projectFromSnapshot(snapshot.id, snapshot.data());
  return !admin && project.status !== "published" ? null : project;
};

export const saveProject = async (
  project: ProjectFields,
  previousSlug?: string,
): Promise<void> => {
  const database = requireDb();
  const target = doc(database, "projects", project.slug);
  const previous = previousSlug && previousSlug !== project.slug
    ? doc(database, "projects", previousSlug)
    : null;

  await runTransaction(database, async (transaction) => {
    const [targetSnapshot, previousSnapshot] = await Promise.all([
      transaction.get(target),
      previous ? transaction.get(previous) : Promise.resolve(null),
    ]);
    if (targetSnapshot.exists() && project.slug !== previousSlug) {
      throw new Error("That project slug is already in use.");
    }
    const existing = previousSnapshot?.exists() ? previousSnapshot.data() : targetSnapshot.data();
    const record = {
      ...project,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(target, record);
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
};

export const removeProject = async (slug: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "projects", slug));
};

export const listServices = async (admin = false): Promise<ServiceItem[]> => {
  const database = requireDb();
  const base = collection(database, "services");
  const snapshot = await getDocs(admin
    ? query(base, orderBy("order", "asc"))
    : query(base, where("published", "==", true)));
  return snapshot.docs
    .map((item) => serviceFromSnapshot(item.id, item.data()))
    .filter((service) => admin || service.published)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
};

export const saveService = async (service: ServiceItem, previousSlug?: string): Promise<void> => {
  const database = requireDb();
  const { id: _serviceId, ...serviceData } = service;
  const target = doc(database, "services", service.slug);
  const previous = previousSlug && previousSlug !== service.slug
    ? doc(database, "services", previousSlug)
    : null;
  await runTransaction(database, async (transaction) => {
    const [targetSnapshot, previousSnapshot] = await Promise.all([
      transaction.get(target),
      previous ? transaction.get(previous) : Promise.resolve(null),
    ]);
    if (targetSnapshot.exists() && service.slug !== previousSlug) {
      throw new Error("That service slug is already in use.");
    }
    const existing = previousSnapshot?.exists() ? previousSnapshot.data() : targetSnapshot.data();
    transaction.set(target, {
      ...serviceData,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
};

export const removeService = async (slug: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "services", slug));
};

export const listCompanies = async (admin = false): Promise<Company[]> => {
  const base = collection(requireDb(), "companies");
  const snapshot = await getDocs(admin
    ? query(base, orderBy("order", "asc"))
    : query(base, where("published", "==", true)));
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: text(item.data(), "name"),
    industry: text(item.data(), "industry"),
    logo_url: text(item.data(), "logo_url"),
    published: boolean(item.data(), "published"),
    order: number(item.data(), "order"),
  })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
};

export const saveCompany = async (company: Company, previousId?: string): Promise<void> => {
  const database = requireDb();
  const target = doc(database, "companies", company.id);
  const previous = previousId && previousId !== company.id
    ? doc(database, "companies", previousId)
    : null;
  await runTransaction(database, async (transaction) => {
    const [targetSnapshot, previousSnapshot] = await Promise.all([
      transaction.get(target),
      previous ? transaction.get(previous) : Promise.resolve(null),
    ]);
    if (targetSnapshot.exists() && company.id !== previousId) {
      throw new Error("That company ID is already in use.");
    }
    transaction.set(target, {
      name: company.name.trim(),
      industry: company.industry?.trim() ?? "",
      logo_url: company.logo_url?.trim() ?? "",
      published: company.published === true,
      order: company.order ?? 0,
      createdAt: previousSnapshot?.data()?.createdAt ?? targetSnapshot.data()?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
};

export const removeCompany = async (id: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "companies", id));
};

const DEFAULT_HOMEPAGE: HomepageContent = {
  eyebrow: "DIGITAL PRESENCE, REIMAGINED",
  headline: "Build an online presence that stands out.",
  description: "We create distinctive digital experiences that help your business get noticed, earn trust, and grow.",
  featuredProjectIds: [],
  featuredProjectsConfigured: false,
};

export const loadHomepageContent = async (): Promise<HomepageContent> => {
  const snapshot = await getDoc(doc(requireDb(), "siteSettings", "homepage"));
  return snapshot.exists()
    ? { ...DEFAULT_HOMEPAGE, ...snapshot.data(), featuredProjectsConfigured: true } as HomepageContent
    : DEFAULT_HOMEPAGE;
};

export const saveHomepageContent = async (content: HomepageContent): Promise<void> => {
  await setDoc(doc(requireDb(), "siteSettings", "homepage"), {
    eyebrow: content.eyebrow.trim(),
    headline: content.headline.trim(),
    description: content.description.trim(),
    featuredProjectIds: content.featuredProjectIds,
    featuredProjectsConfigured: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const seedDefaultServices = async (services: ServiceItem[]): Promise<number> => {
  const database = requireDb();
  let created = 0;
  for (const service of services) {
    const serviceRef = doc(database, "services", service.slug);
    const wasCreated = await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(serviceRef);
      if (snapshot.exists()) return false;
      transaction.set(serviceRef, {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });
    if (wasCreated) created += 1;
  }
  return created;
};

export const createEnquiry = async (enquiry: Omit<Enquiry, "id" | "status" | "createdAt">): Promise<void> => {
  const database = requireDb();
  const enquiryRef = doc(collection(database, "enquiries"));
  await setDoc(enquiryRef, {
    ...enquiry,
    status: "new",
    createdAt: serverTimestamp(),
  });
};

export const listEnquiries = async (): Promise<Enquiry[]> => {
  const snapshot = await getDocs(query(collection(requireDb(), "enquiries"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: text(item.data(), "name"),
    email: text(item.data(), "email"),
    service: text(item.data(), "service"),
    message: text(item.data(), "message"),
    status: item.data().status === "archived" ? "archived" : item.data().status === "read" ? "read" : "new",
    createdAt: item.data().createdAt as Enquiry["createdAt"],
  }));
};

export const updateEnquiryStatus = async (id: string, status: Enquiry["status"]): Promise<void> => {
  await setDoc(doc(requireDb(), "enquiries", id), { status }, { merge: true });
};

export const deleteEnquiry = async (id: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "enquiries", id));
};

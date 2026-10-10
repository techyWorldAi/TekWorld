import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  CloudinaryAsset,
  Company,
  Enquiry,
  HomepageContent,
  Project,
  ProjectFields,
  ServiceItem,
  HomepageSectionId,
} from "./types";
import { HOMEPAGE_SECTION_IDS } from "./types";

const requireDb = () => {
  if (!db) throw new Error("Firebase is not configured. Set the VITE_FIREBASE_* variables and rebuild.");
  return db;
};

const CONTENT_CACHE_TTL_MS = 5 * 60 * 1000;
const cachePrefix = `tekworld:firestore:${import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "unknown"}:`;
let contentRefreshTimer: number | undefined;

const schedulePublicContentRefresh = (): void => {
  if (contentRefreshTimer !== undefined) return;
  contentRefreshTimer = window.setTimeout(() => {
    contentRefreshTimer = undefined;
    window.dispatchEvent(new Event("tekworld:content-updated"));
  }, 100);
};

const readCacheState = (key: string): { at: number; count: number } | null => {
  try {
    const value = window.localStorage.getItem(`${cachePrefix}${key}`);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("at" in parsed) ||
      !("count" in parsed) ||
      typeof parsed.at !== "number" ||
      typeof parsed.count !== "number"
    ) return null;
    return { at: parsed.at, count: parsed.count };
  } catch {
    return null;
  }
};

const saveCacheState = (key: string, count: number): boolean => {
  try {
    window.localStorage.setItem(`${cachePrefix}${key}`, JSON.stringify({ at: Date.now(), count }));
    return true;
  } catch (error) {
    console.warn("TekWorld could not save the Firestore cache freshness timestamp.", error);
    return false;
  }
};

const isCacheMiss = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "unavailable";

const refreshQueryInBackground = <T extends DocumentData>(
  source: Query<T>,
  cacheKey: string,
): void => {
  void getDocsFromServer(source).then((snapshot) => {
    if (saveCacheState(cacheKey, snapshot.size)) schedulePublicContentRefresh();
  }).catch((error: unknown) => {
    console.warn(`TekWorld could not refresh cached ${cacheKey} in the background.`, error);
  });
};

const refreshDocumentInBackground = <T extends DocumentData>(
  reference: DocumentReference<T>,
  cacheKey: string,
): void => {
  void getDocFromServer(reference).then((snapshot) => {
    if (saveCacheState(cacheKey, snapshot.exists() ? 1 : 0)) schedulePublicContentRefresh();
  }).catch((error: unknown) => {
    console.warn(`TekWorld could not refresh cached ${cacheKey} in the background.`, error);
  });
};

const readCachedQuery = async <T extends DocumentData>(
  source: Query<T>,
  cacheKey: string,
  forceServer = false,
): Promise<QuerySnapshot<T>> => {
  let cachedSnapshot: QuerySnapshot<T> | undefined;
  if (!forceServer) {
    try {
      cachedSnapshot = await getDocsFromCache(source);
      const cacheState = readCacheState(cacheKey);
      if (
        cacheState !== null &&
        cacheState.count === cachedSnapshot.size &&
        Date.now() - cacheState.at < CONTENT_CACHE_TTL_MS
      ) {
        return cachedSnapshot;
      }
      refreshQueryInBackground(source, cacheKey);
      return cachedSnapshot;
    } catch (error) {
      if (!isCacheMiss(error)) throw error;
    }
  }

  try {
    const snapshot = await getDocsFromServer(source);
    saveCacheState(cacheKey, snapshot.size);
    return snapshot;
  } catch (error) {
    if (cachedSnapshot) {
      console.warn(`TekWorld is showing cached ${cacheKey} because Firestore could not refresh it.`, error);
      return cachedSnapshot;
    }
    throw error;
  }
};

const readCachedDocument = async <T extends DocumentData>(
  reference: DocumentReference<T>,
  cacheKey: string,
): Promise<DocumentSnapshot<T>> => {
  let cachedSnapshot: DocumentSnapshot<T> | undefined;
  try {
    cachedSnapshot = await getDocFromCache(reference);
    const cacheState = readCacheState(cacheKey);
    if (
      cacheState !== null &&
      cacheState.count === (cachedSnapshot.exists() ? 1 : 0) &&
      Date.now() - cacheState.at < CONTENT_CACHE_TTL_MS
    ) {
      return cachedSnapshot;
    }
    refreshDocumentInBackground(reference, cacheKey);
    return cachedSnapshot;
  } catch (error) {
    if (!isCacheMiss(error)) throw error;
  }

  try {
    const snapshot = await getDocFromServer(reference);
    saveCacheState(cacheKey, snapshot.exists() ? 1 : 0);
    return snapshot;
  } catch (error) {
    if (cachedSnapshot) {
      console.warn(`TekWorld is showing cached ${cacheKey} because Firestore could not refresh it.`, error);
      return cachedSnapshot;
    }
    throw error;
  }
};

export const invalidatePublicContentCache = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(cachePrefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn("TekWorld could not invalidate local Firestore cache timestamps.", error);
  }
  window.dispatchEvent(new Event("tekworld:content-updated"));
};

const text = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "string" ? data[key] as string : "";

const strings = (data: Record<string, unknown>, key: string) =>
  Array.isArray(data[key]) ? data[key].filter((value): value is string => typeof value === "string") : [];

const number = (data: Record<string, unknown>, key: string) =>
  typeof data[key] === "number" && Number.isFinite(data[key]) ? data[key] as number : 0;

const boolean = (data: Record<string, unknown>, key: string) => data[key] === true;

const asset = (value: unknown): CloudinaryAsset | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.url !== "string" ||
    typeof candidate.publicId !== "string" ||
    typeof candidate.alt !== "string" ||
    typeof candidate.width !== "number" ||
    typeof candidate.height !== "number"
  ) return undefined;
  return {
    url: candidate.url,
    publicId: candidate.publicId,
    alt: candidate.alt,
    width: candidate.width,
    height: candidate.height,
  };
};

const assets = (value: unknown): CloudinaryAsset[] =>
  Array.isArray(value)
    ? value.map(asset).filter((item): item is CloudinaryAsset => item !== undefined)
    : [];

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
  coverImage: asset(data.coverAsset)?.url || text(data, "coverImage"),
  coverAsset: asset(data.coverAsset),
  gallery: strings(data, "gallery"),
  galleryAssets: assets(data.galleryAssets),
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
  imageUrl: asset(data.imageAsset)?.url || text(data, "imageUrl"),
  imageAsset: asset(data.imageAsset),
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
  const projectsQuery = admin
    ? query(base)
    : query(base, where("status", "==", "published"));
  const snapshot = await readCachedQuery(projectsQuery, `projects:${admin ? "admin" : "public"}`, admin);
  return snapshot.docs
    .map((item) => projectFromSnapshot(item.id, item.data()))
    .filter((project) => admin || project.status === "published")
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
};

export const getProject = async (slug: string, admin = false): Promise<Project | null> => {
  const reference = doc(requireDb(), "projects", slug);
  const snapshot = admin
    ? await getDocFromServer(reference)
    : await readCachedDocument(reference, `project:${slug}`);
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
      coverAsset: project.coverAsset ?? null,
      galleryAssets: project.galleryAssets ?? [],
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(target, record);
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
  invalidatePublicContentCache();
};

export const removeProject = async (slug: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "projects", slug));
  invalidatePublicContentCache();
};

export const listServices = async (admin = false): Promise<ServiceItem[]> => {
  const database = requireDb();
  const base = collection(database, "services");
  const servicesQuery = admin
    ? query(base)
    : query(base, where("published", "==", true));
  const snapshot = await readCachedQuery(servicesQuery, `services:${admin ? "admin" : "public"}`, admin);
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
      imageAsset: service.imageAsset ?? null,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
  invalidatePublicContentCache();
};

export const removeService = async (slug: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "services", slug));
  invalidatePublicContentCache();
};

export const listCompanies = async (admin = false): Promise<Company[]> => {
  const base = collection(requireDb(), "companies");
  const companiesQuery = admin
    ? query(base)
    : query(base, where("published", "==", true));
  const snapshot = await readCachedQuery(companiesQuery, `companies:${admin ? "admin" : "public"}`, admin);
  return snapshot.docs.map((item) => ({
    id: item.id,
    name: text(item.data(), "name"),
    industry: text(item.data(), "industry"),
    logoAsset: asset(item.data().logoAsset),
    logo_url: asset(item.data().logoAsset)?.url || text(item.data(), "logo_url"),
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
      logoAsset: company.logoAsset ?? null,
      published: company.published === true,
      order: company.order ?? 0,
      createdAt: previousSnapshot?.data()?.createdAt ?? targetSnapshot.data()?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (previous && previousSnapshot?.exists()) transaction.delete(previous);
  });
  invalidatePublicContentCache();
};

export const removeCompany = async (id: string): Promise<void> => {
  await deleteDoc(doc(requireDb(), "companies", id));
  invalidatePublicContentCache();
};

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

const validHomepageSections = (value: unknown): HomepageSectionId[] => {
  if (!Array.isArray(value)) return [...HOMEPAGE_SECTION_IDS];
  const selected = value.filter(
    (item): item is HomepageSectionId =>
      typeof item === "string" && HOMEPAGE_SECTION_IDS.includes(item as HomepageSectionId),
  );
  return [...new Set([...selected, ...HOMEPAGE_SECTION_IDS])];
};

const normalizeHomepage = (data: Record<string, unknown>, configured: boolean): HomepageContent => {
  const color = text(data, "themeColor");
  const hidden = Array.isArray(data.hiddenSections)
    ? data.hiddenSections.filter(
      (item): item is HomepageSectionId =>
        typeof item === "string" && HOMEPAGE_SECTION_IDS.includes(item as HomepageSectionId),
    )
    : [];
  return {
    ...DEFAULT_HOMEPAGE,
    eyebrow: text(data, "eyebrow") || DEFAULT_HOMEPAGE.eyebrow,
    headline: text(data, "headline") || DEFAULT_HOMEPAGE.headline,
    description: text(data, "description") || DEFAULT_HOMEPAGE.description,
    featuredProjectIds: strings(data, "featuredProjectIds"),
    featuredProjectsConfigured: configured,
    sectionOrder: validHomepageSections(data.sectionOrder),
    hiddenSections: [...new Set(hidden)],
    themeColor: /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_HOMEPAGE.themeColor,
    updatedAt: data.updatedAt as HomepageContent["updatedAt"],
  };
};

export const loadHomepageContent = async (): Promise<HomepageContent> => {
  const snapshot = await readCachedDocument(doc(requireDb(), "siteSettings", "homepage"), "homepage");
  return snapshot.exists()
    ? normalizeHomepage(snapshot.data(), true)
    : DEFAULT_HOMEPAGE;
};

export const saveHomepageContent = async (content: HomepageContent): Promise<void> => {
  await setDoc(doc(requireDb(), "siteSettings", "homepage"), {
    eyebrow: content.eyebrow.trim(),
    headline: content.headline.trim(),
    description: content.description.trim(),
    featuredProjectIds: content.featuredProjectIds,
    sectionOrder: content.sectionOrder,
    hiddenSections: content.hiddenSections,
    themeColor: /^#[0-9a-fA-F]{6}$/.test(content.themeColor) ? content.themeColor : DEFAULT_HOMEPAGE.themeColor,
    featuredProjectsConfigured: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  invalidatePublicContentCache();
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
  if (created) invalidatePublicContentCache();
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

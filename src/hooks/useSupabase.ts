import type { Company, Story } from "../types";

export interface SupabaseConfig {
  url: string;
  key: string;
}

function getStoredConfig(): SupabaseConfig {
  return {
    url: localStorage.getItem("tw_sb_url") ?? "",
    key: localStorage.getItem("tw_sb_key") ?? "",
  };
}

async function loadLegacyTable<T>(table: "companies" | "stories"): Promise<T[]> {
  const { url, key } = getStoredConfig();
  if (!url || !key) return [];
  const response = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/${table}?select=*&order=created_at.desc`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Legacy content request failed (${response.status}).`);
  }
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error(`Legacy ${table} response was not a list.`);
  return result as T[];
}

export const loadCompanies = (): Promise<Company[]> => loadLegacyTable<Company>("companies");

export const loadStories = (): Promise<Story[]> => loadLegacyTable<Story>("stories");

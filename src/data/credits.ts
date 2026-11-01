import source from "./credits.yaml?raw";
import { parse } from "yaml";

export interface CreditRecord {
  project: string;
  artist?: string;
  company?: string;
  role?: string;
  category: "music" | "theatre" | "live" | "personal" | "archive";
  work_slug: string;
  year?: number;
  external_url?: string;
  verified: boolean;
  verification?: "verified" | "needs-verification";
  source: string;
}

interface CreditsDocument {
  credits: CreditRecord[];
}

const document = parse(source) as CreditsDocument;

export const credits = document.credits;
export const verifiedCredits = credits.filter((credit) => credit.verified && credit.role);
export const publicCredits = [...new Map(
  verifiedCredits.map((credit) => [`${credit.work_slug}:${credit.role}`, credit]),
).values()];

export interface PublicProjectCredit {
  project: string;
  work_slug: string;
  category: CreditRecord["category"];
  year?: number;
  roles: string[];
  artist?: string;
  company?: string;
  external_url?: string;
}

export const publicProjects = [...publicCredits.reduce((projects, credit) => {
  const existing = projects.get(credit.work_slug);
  if (existing) {
    if (credit.role && !existing.roles.includes(credit.role)) existing.roles.push(credit.role);
  } else {
    projects.set(credit.work_slug, {
      project: credit.project,
      work_slug: credit.work_slug,
      category: credit.category,
      year: credit.year,
      artist: credit.artist,
      company: credit.company,
      external_url: credit.external_url,
      roles: credit.role ? [credit.role] : [],
    });
  }
  return projects;
}, new Map<string, PublicProjectCredit>()).values()];

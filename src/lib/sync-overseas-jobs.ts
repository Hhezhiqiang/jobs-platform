/**
 * Batch sync overseas jobs from Adzuna.
 */
import { fetchAdzunaJobs } from "@/lib/adzuna-api";
import { logger } from "@/lib/logger";

const COUNTRIES = [
  { code: "gb", name: "UK", cities: ["London", "Manchester", "Birmingham"] },
  { code: "us", name: "US", cities: ["New York", "San Francisco", "Seattle"] },
  { code: "sg", name: "Singapore", cities: ["Singapore"] },
  { code: "de", name: "Germany", cities: ["Berlin", "Munich", "Frankfurt"] },
  { code: "au", name: "Australia", cities: ["Sydney", "Melbourne"] },
];

const KEYWORDS = [
  "software engineer",
  "frontend developer",
  "backend developer",
  "fullstack developer",
  "devops engineer",
  "data scientist",
  "product manager",
  "ux designer",
];

async function syncOverseasJobs() {
  let total = 0;

  for (const country of COUNTRIES) {
    for (const keyword of KEYWORDS) {
      for (const city of country.cities) {
        try {
          const count = await fetchAdzunaJobs(keyword, city, 1, country.code);
          total += count;
          await sleep(1500);
        } catch (error: unknown) {
          logger.error(`[sync-overseas] ${keyword} in ${city}:`, getErrorMessage(error));
        }
      }
    }
  }

  return total;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

if (require.main === module) {
  syncOverseasJobs()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error(error);
      process.exit(1);
    });
}

export { syncOverseasJobs };

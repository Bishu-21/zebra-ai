import fs from "fs";
import chromium from "@sparticuz/chromium-min";

export interface BrowserLaunchConfig {
  executablePath: string;
  args: string[];
  headless: boolean | "shell";
  defaultViewport: { width: number; height: number };
}

/**
 * Discovers candidate browser executable paths across Windows, macOS, and Linux.
 */
export function getLocalBrowserCandidates(): string[] {
  const envPath = process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) {
    return [envPath];
  }

  const candidates: string[] = [];

  if (process.platform === "win32") {
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env["PROGRAMFILES(X86)"];
    const localAppData = process.env.LOCALAPPDATA;

    if (programFiles) {
      candidates.push(`${programFiles}\\Google\\Chrome\\Application\\chrome.exe`);
      candidates.push(`${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`);
    }
    if (programFilesX86) {
      candidates.push(`${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`);
      candidates.push(`${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`);
    }
    if (localAppData) {
      candidates.push(`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`);
      candidates.push(`${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`);
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else if (process.platform === "linux") {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium"
    );
  }

  return candidates;
}

/**
 * Returns the first existing local browser executable path, or null if none found.
 */
export function findLocalBrowserExecutable(): string | null {
  const candidates = getLocalBrowserCandidates();
  for (const candidatePath of candidates) {
    try {
      if (candidatePath && fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    } catch {
      // Ignore file access errors during scanning
    }
  }
  return null;
}

/**
 * Resolves full browser launch options for Puppeteer across local OS and serverless production.
 */
export async function getPdfBrowserConfig(): Promise<BrowserLaunchConfig> {
  // 1. Try local Chrome/Edge discovery
  const localExecutable = findLocalBrowserExecutable();
  if (localExecutable) {
    const isProduction = process.env.NODE_ENV === "production";
    return {
      executablePath: localExecutable,
      args: isProduction ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
      headless: true,
      defaultViewport: { width: 1920, height: 1080 },
    };
  }

  // 2. Fall back to @sparticuz/chromium-min for serverless environment
  try {
    const packUrl = process.env.CHROMIUM_PACK_URL || undefined;
    const executablePath = await chromium.executablePath(packUrl);

    if (!executablePath) {
      throw new Error("sparticuz/chromium-min returned empty executable path");
    }

    const chromiumArgs = Array.isArray(chromium.args) ? chromium.args : [];
    const isProduction = process.env.NODE_ENV === "production";

    return {
      executablePath,
      args: isProduction ? [...chromiumArgs, "--no-sandbox", "--disable-setuid-sandbox"] : chromiumArgs,
      headless: (chromium as unknown as { headless: boolean | "shell" }).headless ?? true,
      defaultViewport: (chromium as unknown as { defaultViewport: { width: number; height: number } }).defaultViewport ?? { width: 1920, height: 1080 },
    };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No valid Chromium browser executable found for PDF export. ` +
      `Please install Chrome or Edge locally, or set CHROME_EXECUTABLE_PATH or CHROMIUM_PACK_URL in your environment. ` +
      `[Details: ${detail}]`
    );
  }
}

"use client";

/**
 * Side-effect CSS loader for the public-site Volt dark theme.
 *
 * This module exists ONLY to import volt-theme.css.  It is loaded via
 * `next/dynamic()` from `header.tsx` and is rendered conditionally (skipped
 * on `/admin/*` and `/dashboard/*`).  Webpack treats it as a separate chunk,
 * so volt-theme.css is split out of the admin & dashboard CSS bundles.
 *
 * Do not import this file directly from anywhere except a dynamic() call,
 * or you will re-bundle volt-theme.css globally.
 */
import "@/styles/volt-theme.css";

export default function VoltThemeLoader(): null {
  return null;
}

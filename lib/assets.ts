/**
 * Resolve content-pack media URLs from relative keys.
 * Content JSON must never hardcode Blob hostnames — only relative keys.
 * See docs/runbooks/storage.md and docs/ARCHITECTURE.md.
 */

export type ResolveAssetOptions = {
  /** Pack version segment for Blob keys. Defaults to "latest". */
  version?: string;
};

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

/**
 * Turn a pack-relative asset key into a URL the engine can load.
 *
 * - If `CONTENT_ASSET_BASE` is set → `{base}/packs/{packId}/{version}/{key}` (Blob CDN).
 * - Otherwise → `/content/{packId}/assets/{key}` (git-shipped static files).
 */
export function resolveAssetUrl(
  packId: string,
  key: string,
  options?: ResolveAssetOptions,
): string {
  const pack = trimSlashes(packId);
  const assetKey = trimSlashes(key);
  if (!pack) {
    throw new Error("resolveAssetUrl: packId is required");
  }
  if (!assetKey) {
    throw new Error("resolveAssetUrl: key is required");
  }

  const base = process.env.CONTENT_ASSET_BASE?.replace(/\/+$/, "");
  if (base) {
    const version = trimSlashes(options?.version ?? "latest") || "latest";
    return `${base}/packs/${pack}/${version}/${assetKey}`;
  }

  return `/content/${pack}/assets/${assetKey}`;
}

/** Blob key layout for published heavy pack media. */
export function packBlobPath(
  packId: string,
  key: string,
  version = "latest",
): string {
  return `packs/${trimSlashes(packId)}/${trimSlashes(version)}/${trimSlashes(key)}`;
}

/** Blob key layout for runtime user media. */
export function userBlobPath(userId: string, key: string): string {
  return `users/${trimSlashes(userId)}/${trimSlashes(key)}`;
}

/** Blob key layout for teacher uploads. */
export function teacherBlobPath(teacherId: string, key: string): string {
  return `teachers/${trimSlashes(teacherId)}/${trimSlashes(key)}`;
}

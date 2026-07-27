import { copy, del, list, put, type PutBlobResult } from "@vercel/blob";

/**
 * Thin wrappers around @vercel/blob for server-side use.
 * Auth: BLOB_READ_WRITE_TOKEN (local / CI) or Vercel OIDC on deploy.
 * See docs/runbooks/storage.md.
 */

export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

type PutBody = Parameters<typeof put>[1];

export async function putBlob(
  pathname: string,
  body: PutBody,
  options?: { addRandomSuffix?: boolean; contentType?: string },
): Promise<PutBlobResult> {
  return put(pathname, body, {
    access: "public",
    ...options,
  });
}

export async function listBlobs(prefix?: string) {
  return list(prefix ? { prefix } : undefined);
}

export async function deleteBlobs(urlsOrPathnames: string | string[]) {
  return del(urlsOrPathnames);
}

export async function copyBlob(fromUrlOrPathname: string, toPathname: string) {
  return copy(fromUrlOrPathname, toPathname, { access: "public" });
}
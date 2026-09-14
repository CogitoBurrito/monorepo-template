/**
 * Metadata persisted alongside an artifact: the upload-time headers
 * (`x-artifact-duration`, `x-artifact-tag`, `x-artifact-sha`,
 * `x-artifact-dirty-hash`) that are echoed back on download.
 */
export type ArtifactMetadata = {
  dirtyHash?: string;
  duration?: number;
  sha?: string;
  tag?: string;
};

/**
 * Query result for a single artifact hash — the spec's
 * `ArtifactQueryResponse` entry shape, with the stored upload duration
 * reported as `taskDurationMs`.
 */
export type ArtifactQueryInfo = {
  size: number;
  tag?: string;
  taskDurationMs?: number;
};

/**
 * Full artifact record: metadata, size, and the raw body.
 */
export type ArtifactRecord = ArtifactMetadata & {
  body: Uint8Array<ArrayBuffer>;
  size: number;
};

/**
 * Input of a repo save: the artifact body plus its upload-time metadata.
 */
export type ArtifactSaveInput = {
  body: Uint8Array<ArrayBuffer>;
  metadata: ArtifactMetadata;
};

/**
 * Artifact metadata plus its size — everything needed to answer existence
 * checks and metadata queries without downloading the body.
 */
export type ArtifactSummary = Omit<ArtifactRecord, "body">;

import type {
  ArtifactMetadata,
  ArtifactQueryResult,
  ArtifactRecord,
  ArtifactRepo,
  ArtifactSummary,
} from "./repo.js";

/**
 * Response of `POST /artifacts`: each queried hash mapped onto its spec
 * `ArtifactInfo`, or `undefined` when missing — the route serializes the
 * missing entries as JSON `null`.
 */
export type ArtifactQueryResponse = Record<
  string,
  SpecArtifactInfo | undefined
>;

/**
 * Artifact domain service — the only layer combining storage queries with
 * domain rules.
 */
export type ArtifactService = {
  readonly download: (
    team: string,
    hash: string,
  ) => Promise<ArtifactRecord | undefined>;
  readonly query: (
    team: string,
    hashes: readonly string[],
  ) => Promise<ArtifactQueryResponse>;
  readonly summary: (
    team: string,
    hash: string,
  ) => Promise<ArtifactSummary | undefined>;
  readonly upload: (
    team: string,
    hash: string,
    input: ArtifactUpload,
  ) => Promise<void>;
};

/**
 * Artifact upload input — the domain shape the service accepts.
 */
export type ArtifactUpload = {
  readonly body: Uint8Array<ArrayBuffer>;
  readonly metadata: ArtifactMetadata;
};

/**
 * Spec `ArtifactInfo` entry of the `POST /artifacts` response.
 */
export type SpecArtifactInfo = {
  readonly size: number;
  readonly tag?: string;
  readonly taskDurationMs: number;
};

/**
 * Creates the artifact domain service on top of a repository.
 *
 * The service owns the query-endpoint projection rules: `taskDurationMs` is
 * required by the spec (the stored `duration` defaults to `0` when absent)
 * and internal-only metadata (`sha`, `dirtyHash`) is never exposed.
 */
export function createArtifactService(repo: ArtifactRepo): ArtifactService {
  return {
    download: repo.find,
    query: async (team, hashes) => {
      const summaries: ArtifactQueryResult = await repo.findSummaries(
        team,
        hashes,
      );

      return Object.fromEntries(
        Object.entries(summaries).map(([hash, summary]) => [
          hash,
          toSpecArtifactInfo(summary),
        ]),
      );
    },
    summary: repo.findSummary,
    upload: (team, hash, input) => repo.save(team, hash, input),
  };
}

/**
 * Maps a stored summary onto the spec's `ArtifactInfo` shape, keeping
 * missing entries as `undefined`.
 */
function toSpecArtifactInfo(summary: ArtifactSummary | undefined) {
  if (summary === undefined) {
    return;
  }

  return {
    size: summary.size,
    taskDurationMs: summary.duration ?? 0,
    ...(summary.tag !== undefined && { tag: summary.tag }),
  };
}

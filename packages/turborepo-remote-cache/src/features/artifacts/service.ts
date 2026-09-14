import type { ArtifactMetadata, ArtifactSummary } from "./types";

import { artifactRepo } from "./repo";

/**
 * Projects an artifact summary into the `POST /artifacts` response shape.
 */
function toQueryInfo(summary: ArtifactSummary) {
  return {
    ...(summary.tag !== undefined && { tag: summary.tag }),
    size: summary.size,
    taskDurationMs: summary.duration,
  };
}

/**
 * The artifacts application service, built on top of the shared
 * {@link artifactRepo}.
 */
export const artifactService = {
  download: (team: string, hash: string) => {
    return artifactRepo.find(team, hash);
  },
  query: async (team: string, hashes: readonly string[]) => {
    const summaries = await artifactRepo.findSummaries(team, hashes);
    return Object.fromEntries(
      Object.entries(summaries).map(([hash, summary]) => [
        hash,
        summary === undefined ? undefined : toQueryInfo(summary),
      ]),
    );
  },
  summary: (team: string, hash: string) => {
    return artifactRepo.findSummary(team, hash);
  },
  upload: (
    team: string,
    hash: string,
    input: { body: Uint8Array<ArrayBuffer>; metadata: ArtifactMetadata },
  ) => {
    return artifactRepo.save(team, hash, input);
  },
};

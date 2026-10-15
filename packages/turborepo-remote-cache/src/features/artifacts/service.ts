import type { ArtifactMetadata, ArtifactSummary } from "./types";

import { artifactRepository } from "./repository";

/**
Projects an artifact summary into the `POST /artifacts` response shape.
*/
function toQueryInfo(summary: ArtifactSummary) {
  return {
    ...(summary.tag !== undefined && { tag: summary.tag }),
    size: summary.size,
    taskDurationMs: summary.duration,
  };
}

/**
The artifacts application service, built on top of the shared
{@link artifactRepository}.
*/
export const artifactService = {
  download: (team: string, hash: string) => {
    return artifactRepository.get(team, hash);
  },
  query: async (team: string, hashes: readonly string[]) => {
    const summaries = await Promise.all(
      hashes.map(async (hash) => {
        return [
          hash,
          await artifactRepository.readSummary(team, hash),
        ] as const;
      }),
    );

    return Object.fromEntries(
      summaries.map(([hash, summary]) => [
        hash,
        summary === undefined ? undefined : toQueryInfo(summary),
      ]),
    );
  },
  summary: (team: string, hash: string) => {
    return artifactRepository.readSummary(team, hash);
  },
  upload: (
    team: string,
    hash: string,
    input: { body: Uint8Array<ArrayBuffer>; metadata: ArtifactMetadata },
  ) => {
    return artifactRepository.save(team, hash, input);
  },
} as const;

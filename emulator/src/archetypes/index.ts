// ── Archetype Registry ──
// Central registry of all available project archetypes.

import type { ProjectSpec } from '../types';

import { spec as greenfieldEmpty } from './greenfield/empty';
import { spec as greenfieldMinimal } from './greenfield/minimal';
import { spec as greenfieldStandard } from './greenfield/standard';
import { spec as greenfieldFull } from './greenfield/full';

import { spec as brownfieldLegacyNode } from './brownfield/legacy-node';
import { spec as brownfieldReactApp } from './brownfield/react-app';
import { spec as brownfieldMonorepo } from './brownfield/monorepo';
import { spec as brownfieldPartial } from './brownfield/partial';

import { spec as edgeMalformed } from './edge-cases/malformed';
import { spec as edgeEmptyDirs } from './edge-cases/empty-dirs';
import { spec as edgeHuge } from './edge-cases/huge';
import { spec as edgeUnicode } from './edge-cases/unicode';

export const archetypes: Map<string, ProjectSpec> = new Map([
  // Greenfield
  ['empty', greenfieldEmpty],
  ['minimal', greenfieldMinimal],
  ['standard', greenfieldStandard],
  ['full', greenfieldFull],

  // Brownfield
  ['legacy-node', brownfieldLegacyNode],
  ['react-app', brownfieldReactApp],
  ['monorepo', brownfieldMonorepo],
  ['partial', brownfieldPartial],

  // Edge cases
  ['malformed', edgeMalformed],
  ['empty-dirs', edgeEmptyDirs],
  ['huge', edgeHuge],
  ['unicode', edgeUnicode],
]);

// Also allow full archetype names
for (const [, spec] of archetypes) {
  if (!archetypes.has(spec.archetype)) {
    archetypes.set(spec.archetype, spec);
  }
}

export function getArchetype(name: string): ProjectSpec | undefined {
  return archetypes.get(name);
}

export function listArchetypes(): { name: string; archetype: string; description: string; squads: number; agents: number }[] {
  const seen = new Set<string>();
  const result: { name: string; archetype: string; description: string; squads: number; agents: number }[] = [];

  for (const [key, spec] of archetypes) {
    if (seen.has(spec.archetype)) continue;
    seen.add(spec.archetype);

    const totalAgents = spec.squads.reduce((sum, s) => sum + s.agents.length, 0)
      + (spec.aiosCore?.coreAgents?.length || 0);

    result.push({
      name: key,
      archetype: spec.archetype,
      description: spec.description,
      squads: spec.squads.length,
      agents: totalAgents,
    });
  }

  return result;
}

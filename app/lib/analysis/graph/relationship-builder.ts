import { ComponentMetadata, GraphEdge, ImportSpec, nodeId } from '@/app/lib/types';
import { ResolverConfig, resolveImport } from './import-resolver';

interface RelatableComponent extends ComponentMetadata {
  importSpecs?: ImportSpec[];
}

/**
 * Resolve import specifiers to files and fill uses/usedBy with stable node ids.
 * External packages are dropped instead of being matched by symbol name.
 */
export function buildComponentRelationships(
  components: RelatableComponent[],
  resolver: ResolverConfig
): GraphEdge[] {
  const byFile = new Map<string, RelatableComponent>();
  const byExport = new Map<string, RelatableComponent[]>();

  for (const component of components) {
    const id = nodeId(component);
    byFile.set(id, component);
    component.uses = [];
    component.usedBy = [];

    const exported = new Set([
      ...(component.exports ?? []),
      component.name,
    ]);
    for (const name of exported) {
      const list = byExport.get(name) ?? [];
      list.push(component);
      byExport.set(name, list);
    }
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const component of components) {
    const from = nodeId(component);
    const specs = component.importSpecs ?? fallbackSpecs(component);

    for (const spec of specs) {
      const resolved = resolveImport(component.file, spec.source, resolver);
      let target: RelatableComponent | undefined;

      if (resolved) {
        target = byFile.get(resolved);
      }

      if (!target && !isBareSpecifier(spec.source)) {
        target = matchByName(spec.name, component, byExport);
      }

      if (!target || nodeId(target) === from) continue;

      const to = nodeId(target);
      const edgeKey = `${from}->${to}`;
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        edges.push({
          from,
          to,
          kind: spec.source.startsWith('.') || resolved ? 'imports' : 'imports',
          specifier: spec.source,
        });
      }

      if (!component.uses!.includes(to)) {
        component.uses!.push(to);
      }
      if (!target.usedBy) target.usedBy = [];
      if (!target.usedBy.includes(from)) {
        target.usedBy.push(from);
      }
    }
  }

  return edges;
}

function fallbackSpecs(component: RelatableComponent): ImportSpec[] {
  return (component.uses ?? []).map((name) => ({
    name,
    source: name,
  }));
}

function isBareSpecifier(source: string): boolean {
  return !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@/');
}

function matchByName(
  importedName: string,
  source: RelatableComponent,
  byExport: Map<string, RelatableComponent[]>
): RelatableComponent | undefined {
  const matches = byExport.get(importedName);
  if (!matches || matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  const fromDir = source.file.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
  const sameFolder = matches.find((candidate) =>
    candidate.file.replace(/\\/g, '/').startsWith(fromDir)
  );
  return sameFolder ?? undefined;
}

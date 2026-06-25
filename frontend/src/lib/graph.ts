import type { GraphNode } from '../api/types';

export type NodeKind = 'Artist' | 'Recording' | 'Release' | 'Other';

// Classification défensive du type de nœud.
// Écart backend connu : les nœuds Artist renvoient leur type MusicBrainz
// ("Person"/"Group"/...) dans `type` au lieu de "Artist". On reclasse donc :
// un nœud n'est Recording/Release que si son `type` le dit explicitement,
// sinon (Person, Group, Artist, ...) on le considère comme un Artist.
export function nodeKind(node: GraphNode): NodeKind {
  switch (node.type) {
    case 'Recording':
      return 'Recording';
    case 'Release':
      return 'Release';
    case 'Artist':
    case 'Person':
    case 'Group':
    case 'Orchestra':
    case 'Choir':
    case 'Character':
      return 'Artist';
    default:
      // Heuristique de repli : un Artist a un `name`, un Recording/Release un `title`.
      if (typeof node.name === 'string') return 'Artist';
      return 'Other';
  }
}

// Couleurs alignées sur les tokens CSS (--node-*).
export const NODE_COLORS: Record<NodeKind, string> = {
  Artist: '#6c5ce7',
  Recording: '#00cec9',
  Release: '#fdcb6e',
  Other: '#8395a7',
};

export const NODE_LEGEND: { kind: NodeKind; label: string }[] = [
  { kind: 'Artist', label: 'Artiste' },
  { kind: 'Recording', label: 'Morceau' },
  { kind: 'Release', label: 'Sortie' },
];

export function nodeColor(node: GraphNode): string {
  return NODE_COLORS[nodeKind(node)];
}

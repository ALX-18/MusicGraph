import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '../api/types';
import { NODE_COLORS, NODE_LEGEND, nodeColor, nodeKind } from '../lib/graph';
import styles from './GraphView.module.css';

interface Props {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  height?: number;
}

// react-force-graph mute la data (remplace source/target par des refs).
// On clone donc nodes/links pour ne pas figer/abîmer la donnée typée d'origine.
function cloneData(data: GraphData) {
  return {
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  };
}

export function GraphView({ data, onNodeClick, height = 560 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  // Largeur responsive : on mesure le conteneur.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => cloneData(data), [data]);

  return (
    <div className={styles.container} ref={containerRef} style={{ height }}>
      <div className={styles.legend}>
        {NODE_LEGEND.map(({ kind, label }) => (
          <div className={styles.legendItem} key={kind}>
            <span className={styles.swatch} style={{ background: NODE_COLORS[kind] }} />
            {label}
          </div>
        ))}
      </div>
      <span className={styles.hint}>Molette : zoom · Glisser : déplacer · Clic : ouvrir</span>

      <ForceGraph2D
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="transparent"
        nodeRelSize={5}
        nodeColor={(n) => nodeColor(n as GraphNode)}
        nodeLabel={(n) => {
          const node = n as GraphNode;
          return `${node.label} (${nodeKind(node)})`;
        }}
        linkColor={() => 'rgba(154, 163, 178, 0.35)'}
        linkWidth={(l) => {
          const w = (l as { weight?: number }).weight;
          return w ? Math.min(1 + w * 0.6, 6) : 1;
        }}
        linkDirectionalParticles={0}
        onNodeClick={(n) => onNodeClick?.(n as GraphNode)}
        cooldownTicks={120}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(n, ctx, globalScale) => {
          const node = n as GraphNode & { x?: number; y?: number };
          if (node.x === undefined || node.y === undefined) return;
          // Libellé sous le nœud, lisible seulement à un zoom suffisant.
          if (globalScale < 1.2) return;
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px -apple-system, 'Segoe UI', Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#e8eaed';
          ctx.fillText(node.label, node.x, node.y + 7);
        }}
      />
    </div>
  );
}

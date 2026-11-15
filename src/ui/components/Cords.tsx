import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Call } from '../../game/types';

interface CordsProps {
  /** Connected calls; each one is drawn as cords into its two jacks. */
  calls: readonly Call[];
  /** The data-hole key of the jack a subscriber's call lands in. */
  holeOf: (call: Call, end: 'from' | 'to') => string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function centre(el: Element, origin: DOMRect): { x: number; y: number } {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2 - origin.left, y: box.top + box.height / 2 - origin.top };
}

function cordPath(className: string, d: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('class', className);
  path.setAttribute('d', d);
  return path;
}

/**
 * Draws the patch cords over the board. Positions come from the laid-out
 * jacks and plugs, so the drawing is done imperatively after each render and
 * on resize, rather than through React state.
 */
export function Cords({ calls, holeOf }: CordsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drawRef = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    drawRef.current = () => {
      const svg = svgRef.current;
      const board = svg?.parentElement;
      if (!svg || !board) return;
      const origin = board.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`);
      const paths: SVGPathElement[] = [];

      for (const call of calls) {
        const ends = (['from', 'to'] as const).map((end) =>
          board.querySelector(`[data-hole="${holeOf(call, end)}"]`),
        );
        if (call.handler === 'player' && call.cord !== null) {
          // Each plug of the pair rises from its socket on the shelf to a jack.
          ends.forEach((hole, k) => {
            const socket = board.querySelector(`[data-plug="${call.cord}-${k}"]`);
            if (!hole || !socket) return;
            const top = centre(hole, origin);
            const bottom = centre(socket, origin);
            const drop = bottom.y - top.y;
            const d = `M${top.x},${top.y} C${top.x},${top.y + drop * 0.75} ${bottom.x},${bottom.y - drop * 0.15 + 40} ${bottom.x},${bottom.y}`;
            paths.push(cordPath('cord cord--shadow', d), cordPath('cord', d));
          });
        } else {
          // Apprentices patch from their own positions: a cord hangs between the two jacks.
          const [a, b] = ends;
          if (!a || !b) continue;
          const p = centre(a, origin);
          const q = centre(b, origin);
          const sag = 40 + Math.abs(q.x - p.x) * 0.15;
          const d = `M${p.x},${p.y} C${p.x},${p.y + sag} ${q.x},${q.y + sag} ${q.x},${q.y}`;
          paths.push(cordPath('cord cord--shadow', d), cordPath('cord cord--apprentice', d));
        }
      }
      svg.replaceChildren(...paths);
    };
    drawRef.current();
  });

  useEffect(() => {
    const board = svgRef.current?.parentElement;
    if (!board) return;
    const observer = new ResizeObserver(() => {
      drawRef.current();
    });
    observer.observe(board);
    return () => {
      observer.disconnect();
    };
  }, []);

  return <svg ref={svgRef} className="cords" aria-hidden="true" />;
}

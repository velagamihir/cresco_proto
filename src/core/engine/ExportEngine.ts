import type { SceneNode, FrameNode, RectangleNode, EllipseNode, LineNode, PathNode, TextNode } from '../../types/scene';
import { Renderer } from './Renderer';

export type ExportFormat = 'png' | 'svg';
export type ExportScale = 1 | 2 | 3;

/**
 * Exports one or more SceneNodes as PNG or SVG.
 */
export class ExportEngine {
  /**
   * Generates and downloads the exported file to the client.
   */
  public static async exportNodes(
    nodes: SceneNode[],
    allNodes: SceneGraphLike,
    format: ExportFormat = 'png',
    scale: ExportScale = 1,
    customFileName?: string
  ): Promise<void> {
    if (nodes.length === 0) return;

    const fileName = customFileName || (nodes.length === 1 && nodes[0].name ? nodes[0].name : 'Export');

    if (format === 'png') {
      const blob = await this.renderToPngBlob(nodes, allNodes, scale);
      if (blob) {
        this.downloadBlob(blob, `${fileName}@${scale}x.png`);
      }
    } else if (format === 'svg') {
      const svgString = this.renderToSvg(nodes, allNodes);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      this.downloadBlob(blob, `${fileName}.svg`);
    }
  }

  /**
   * Renders selected nodes onto an offscreen canvas at given scale and returns a PNG Blob.
   */
  public static renderToPngBlob(
    nodes: SceneNode[],
    allNodes: SceneGraphLike,
    scale: ExportScale = 1
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      // 1. Calculate bounding box of targets
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const n of nodes) {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + n.width);
        maxY = Math.max(maxY, n.y + n.height);
      }

      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.scale(scale, scale);
      // Translate so target top-left is at (0, 0)
      ctx.translate(-minX, -minY);

      // Collect nodes to render: if a node is a frame, include its children
      const nodesToRender: SceneNode[] = [];
      const frameIds = new Set(nodes.filter((n) => n.type === 'frame').map((n) => n.id));

      for (const n of allNodes.getAllNodes()) {
        if (nodes.some((target) => target.id === n.id)) {
          nodesToRender.push(n);
        } else if (n.parentId && frameIds.has(n.parentId)) {
          nodesToRender.push(n);
        }
      }

      // Render scene without selection outlines, guides, or overlays
      Renderer.renderScene(
        ctx,
        nodesToRender,
        new Set<string>(), // no selection outline
        1 // normal zoom
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Generates a clean standalone SVG string from nodes.
   */
  public static renderToSvg(nodes: SceneNode[], allNodes: SceneGraphLike): string {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // Collect target nodes and nested children
    const frameIds = new Set(nodes.filter((n) => n.type === 'frame').map((n) => n.id));
    const nodesToRender = allNodes.getAllNodes().filter((n) => {
      return nodes.some((target) => target.id === n.id) || (n.parentId && frameIds.has(n.parentId));
    });

    let body = '';
    for (const node of nodesToRender) {
      // Relative coordinates
      const relX = node.x - minX;
      const relY = node.y - minY;

      if (node.type === 'rectangle' || node.type === 'frame') {
        const frameOrRect = node as RectangleNode | FrameNode;
        const rx = frameOrRect.cornerRadius || 0;
        const fill = frameOrRect.fill || (frameOrRect.type === 'frame' ? '#ffffff' : 'transparent');
        const strokeAttr = frameOrRect.stroke ? `stroke="${frameOrRect.stroke}" stroke-width="${frameOrRect.strokeWidth || 1}"` : '';
        body += `  <rect x="${relX}" y="${relY}" width="${frameOrRect.width}" height="${frameOrRect.height}" rx="${rx}" fill="${fill}" ${strokeAttr}/>\n`;
      } else if (node.type === 'ellipse') {
        const ellipse = node as EllipseNode;
        const rx = ellipse.width / 2;
        const ry = ellipse.height / 2;
        const cx = relX + rx;
        const cy = relY + ry;
        const strokeAttr = ellipse.stroke ? `stroke="${ellipse.stroke}" stroke-width="${ellipse.strokeWidth || 1}"` : '';
        body += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ellipse.fill}" ${strokeAttr}/>\n`;
      } else if (node.type === 'line') {
        const line = node as LineNode;
        const x1 = relX + line.x1;
        const y1 = relY + line.y1;
        const x2 = relX + line.x2;
        const y2 = relY + line.y2;
        body += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${line.stroke || '#ffffff'}" stroke-width="${line.strokeWidth || 2}" stroke-linecap="round"/>\n`;
      } else if (node.type === 'path') {
        const path = node as PathNode;
        if (path.anchors && path.anchors.length > 0) {
          let d = `M ${relX + path.anchors[0].x} ${relY + path.anchors[0].y}`;
          for (let i = 1; i < path.anchors.length; i++) {
            const prev = path.anchors[i - 1];
            const curr = path.anchors[i];
            if (prev.handleOut || curr.handleIn) {
              const cp1x = prev.handleOut ? relX + prev.handleOut.x : relX + prev.x;
              const cp1y = prev.handleOut ? relY + prev.handleOut.y : relY + prev.y;
              const cp2x = curr.handleIn ? relX + curr.handleIn.x : relX + curr.x;
              const cp2y = curr.handleIn ? relY + curr.handleIn.y : relY + curr.y;
              d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${relX + curr.x} ${relY + curr.y}`;
            } else {
              d += ` L ${relX + curr.x} ${relY + curr.y}`;
            }
          }
          if (path.closed) {
            d += ' Z';
          }
          const fill = path.fill && path.fill !== 'transparent' ? path.fill : 'none';
          const stroke = path.stroke ? `stroke="${path.stroke}" stroke-width="${path.strokeWidth || 1}"` : '';
          body += `  <path d="${d}" fill="${fill}" ${stroke}/>\n`;
        }
      } else if (node.type === 'text') {
        const textNode = node as TextNode;
        const fill = textNode.fill || '#ffffff';
        const fontSize = textNode.fontSize || 16;
        const fontFamily = textNode.fontFamily || 'Inter, sans-serif';
        const fontWeight = textNode.fontWeight || 400;
        const lines: string[] = (textNode.text || '').split('\n');
        const lineHeight = (textNode.lineHeight || 1.25) * fontSize;

        body += `  <text x="${relX}" y="${relY + fontSize}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">\n`;
        lines.forEach((line: string, idx: number) => {
          body += `    <tspan x="${relX}" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>\n`;
        });
        body += '  </text>\n';
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

interface SceneGraphLike {
  getAllNodes(): SceneNode[];
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

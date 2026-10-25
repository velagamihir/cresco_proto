import type { SceneNode, RectangleNode, EllipseNode } from '../../types/scene';
import { getResizeHandles } from '../../utils/math';

export class Renderer {
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    nodes: SceneNode[],
    selectedIds: Set<string>,
    zoom: number
  ): void {
    // 1. Render Shapes
    for (const node of nodes) {
      switch (node.type) {
        case 'rectangle':
          this.renderRectangle(ctx, node);
          break;
        case 'ellipse':
          this.renderEllipse(ctx, node);
          break;
      }
    }

    // 2. Render Selection Bounding Box & Handles for active nodes
    for (const node of nodes) {
      if (selectedIds.has(node.id)) {
        this.renderSelectionOutline(ctx, node, zoom);
      }
    }
  }

  private static renderRectangle(
    ctx: CanvasRenderingContext2D,
    rect: RectangleNode
  ): void {
    ctx.save();
    ctx.fillStyle = rect.fill;

    if (rect.cornerRadius && rect.cornerRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.width, rect.height, rect.cornerRadius);
      ctx.fill();
      if (rect.stroke && rect.strokeWidth) {
        ctx.strokeStyle = rect.stroke;
        ctx.lineWidth = rect.strokeWidth;
        ctx.stroke();
      }
    } else {
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      if (rect.stroke && rect.strokeWidth) {
        ctx.strokeStyle = rect.stroke;
        ctx.lineWidth = rect.strokeWidth;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
    }

    ctx.restore();
  }

  private static renderEllipse(
    ctx: CanvasRenderingContext2D,
    ellipse: EllipseNode
  ): void {
    const rx = Math.max(0, ellipse.width / 2);
    const ry = Math.max(0, ellipse.height / 2);
    if (rx === 0 || ry === 0) return;

    const cx = ellipse.x + rx;
    const cy = ellipse.y + ry;

    ctx.save();
    ctx.fillStyle = ellipse.fill;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    if (ellipse.stroke && ellipse.strokeWidth) {
      ctx.strokeStyle = ellipse.stroke;
      ctx.lineWidth = ellipse.strokeWidth;
      ctx.stroke();
    }

    ctx.restore();
  }

  private static renderSelectionOutline(
    ctx: CanvasRenderingContext2D,
    node: SceneNode,
    zoom: number
  ): void {
    ctx.save();
    const strokeWidth = 1.5 / zoom; // Maintain consistent pixel width on screen
    const handleSize = 7 / zoom;

    // Selection border
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // 8 Handles (4 corners + 4 edge midpoints)
    ctx.fillStyle = '#ffffff';
    const handles = getResizeHandles(node);

    for (const h of handles) {
      ctx.fillRect(
        h.x - handleSize / 2,
        h.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        h.x - handleSize / 2,
        h.y - handleSize / 2,
        handleSize,
        handleSize
      );
    }

    ctx.restore();
  }
}
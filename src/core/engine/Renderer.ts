import type { SceneNode, RectangleNode, EllipseNode, TextNode } from '../../types/scene';
import { getResizeHandles } from '../../utils/math';
import { getFontString, measureTextLines } from '../../utils/text';

export interface SnapGuide {
  orientation: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export class Renderer {
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    nodes: SceneNode[],
    selectedIds: Set<string>,
    zoom: number,
    editingNodeId?: string | null,
    snapGuides?: SnapGuide[]
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
        case 'text':
          // If node is currently being actively edited in HTML overlay, skip rendering text to prevent ghosting
          if (node.id !== editingNodeId) {
            this.renderText(ctx, node);
          }
          break;
      }
    }

    // 2. Render Selection Bounding Box & Handles for active nodes
    for (const node of nodes) {
      if (selectedIds.has(node.id)) {
        this.renderSelectionOutline(ctx, node, zoom);
      }
    }

    // 3. Render Snap Guides (Figma smart guides in magenta)
    if (snapGuides && snapGuides.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#ea3671'; // Figma magenta smart guide color
      ctx.lineWidth = 1 / zoom;

      for (const guide of snapGuides) {
        ctx.beginPath();
        if (guide.orientation === 'vertical') {
          ctx.moveTo(guide.position, guide.start);
          ctx.lineTo(guide.position, guide.end);
        } else {
          ctx.moveTo(guide.start, guide.position);
          ctx.lineTo(guide.end, guide.position);
        }
        ctx.stroke();
      }

      ctx.restore();
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

  private static renderText(
    ctx: CanvasRenderingContext2D,
    textNode: TextNode
  ): void {
    if (!textNode.text) return;

    ctx.save();
    ctx.fillStyle = textNode.fill || '#ffffff';
    ctx.font = getFontString(textNode.fontSize, textNode.fontFamily, textNode.fontWeight);
    ctx.textBaseline = 'top';

    const metrics = measureTextLines(
      textNode.text,
      textNode.fontSize,
      textNode.fontFamily,
      textNode.fontWeight,
      textNode.lineHeight || 1.25,
      textNode.autoWidth ? undefined : textNode.width
    );

    const textAlign = textNode.textAlign || 'left';
    ctx.textAlign = textAlign;

    let targetX = textNode.x;
    if (textAlign === 'center') {
      targetX = textNode.x + textNode.width / 2;
    } else if (textAlign === 'right') {
      targetX = textNode.x + textNode.width;
    }

    for (let i = 0; i < metrics.lines.length; i++) {
      const line = metrics.lines[i];
      const lineY = textNode.y + i * metrics.lineHeight;
      ctx.fillText(line, targetX, lineY);
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
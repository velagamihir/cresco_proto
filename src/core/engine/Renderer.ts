import type { SceneNode, RectangleNode } from '../../types/scene';

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

    // 4 Corner handles
    ctx.fillStyle = '#ffffff';
    const corners = [
      { x: node.x, y: node.y },
      { x: node.x + node.width, y: node.y },
      { x: node.x, y: node.y + node.height },
      { x: node.x + node.width, y: node.y + node.height },
    ];

    for (const corner of corners) {
      ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
    }

    ctx.restore();
  }
}
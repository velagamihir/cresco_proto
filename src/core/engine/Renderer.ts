import type { SceneNode, RectangleNode, EllipseNode, FrameNode, TextNode, PathNode, LineNode, MarkerType } from '../../types/scene';
import type { PenDrawingState } from '../tools/PenTool';
import type { MarqueeBox } from '../tools/SelectTool';
import { getResizeHandles, getBoundingBox } from '../../utils/math';
import { getFontString, measureTextLines } from '../../utils/text';

export interface SnapGuide {
  orientation: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export interface DistanceMeasurement {
  selectedBox: { x: number; y: number; width: number; height: number };
  targetBox: { x: number; y: number; width: number; height: number };
  targetNode?: SceneNode;
}

export class Renderer {
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    nodes: SceneNode[],
    selectedIds: Set<string>,
    zoom: number,
    editingNodeId?: string | null,
    snapGuides?: SnapGuide[],
    marqueeBox?: MarqueeBox | null,
    distanceMeasurement?: DistanceMeasurement | null
  ): void {
    // Map frame children
    const childMap = new Map<string, SceneNode[]>();
    for (const node of nodes) {
      if (node.parentId) {
        const list = childMap.get(node.parentId) || [];
        list.push(node);
        childMap.set(node.parentId, list);
      }
    }

    // 1. Render Shapes & Frames (top-level nodes)
    for (const node of nodes) {
      if (node.parentId) {
        // Child nodes are rendered inside their parent frame
        continue;
      }
      if (node.type === 'frame') {
        const children = childMap.get(node.id) || [];
        this.renderFrame(ctx, node, children, zoom, editingNodeId);
      } else {
        this.renderSingleNode(ctx, node, editingNodeId);
      }
    }

    // 2. Render Selection Bounding Box & Handles for active nodes
    if (selectedIds.size === 1) {
      for (const node of nodes) {
        if (selectedIds.has(node.id)) {
          this.renderSelectionOutline(ctx, node, zoom);
        }
      }
    } else if (selectedIds.size > 1) {
      // Figma multi-selection: render light borders around individual items, plus composite group bounds
      const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));
      for (const node of selectedNodes) {
        this.renderSubtleSelectionOutline(ctx, node, zoom);
      }

      const compositeBox = getBoundingBox(selectedNodes);
      if (compositeBox) {
        this.renderCompositeSelectionOutline(ctx, compositeBox, zoom);
      }
    }

    // 3. Render Marquee Drag Box (Figma blue selection area)
    if (marqueeBox && marqueeBox.width > 0 && marqueeBox.height > 0) {
      this.renderMarquee(ctx, marqueeBox, zoom);
    }

    // 4. Render Snap Guides (Figma smart guides in magenta)
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

    // 5. Render Alt/Option Distance Measurement Guides (Figma red inspection guides)
    if (distanceMeasurement) {
      this.renderDistanceMeasurement(ctx, distanceMeasurement, zoom);
    }
  }

  private static applyNodeEffects(ctx: CanvasRenderingContext2D, node: SceneNode): void {
    if (node.opacity !== undefined && node.opacity >= 0 && node.opacity <= 1) {
      ctx.globalAlpha = node.opacity;
    }

    if (node.effects && node.effects.length > 0) {
      for (const eff of node.effects) {
        if (eff.visible === false) continue;
        if (eff.type === 'drop-shadow') {
          ctx.shadowColor = eff.color || 'rgba(0, 0, 0, 0.35)';
          ctx.shadowOffsetX = eff.offsetX;
          ctx.shadowOffsetY = eff.offsetY;
          ctx.shadowBlur = eff.blur;
        } else if (eff.type === 'layer-blur' && eff.blur > 0) {
          ctx.filter = `blur(${eff.blur}px)`;
        }
      }
    }
  }

  private static renderSingleNode(
    ctx: CanvasRenderingContext2D,
    node: SceneNode,
    editingNodeId?: string | null
  ): void {
    ctx.save();
    if (node.rotation) {
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((node.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    this.applyNodeEffects(ctx, node);

    switch (node.type) {
      case 'rectangle':
        this.renderRectangle(ctx, node);
        break;
      case 'ellipse':
        this.renderEllipse(ctx, node);
        break;
      case 'text':
        if (node.id !== editingNodeId) {
          this.renderText(ctx, node);
        }
        break;
      case 'path':
        this.renderPath(ctx, node);
        break;
      case 'line':
        this.renderLine(ctx, node);
        break;
      case 'frame':
        this.renderFrame(ctx, node, [], 1, editingNodeId);
        break;
    }
    ctx.restore();
  }

  private static renderFrame(
    ctx: CanvasRenderingContext2D,
    frame: FrameNode,
    childNodes: SceneNode[],
    zoom: number,
    editingNodeId?: string | null
  ): void {
    ctx.save();
    if (frame.rotation) {
      const centerX = frame.x + frame.width / 2;
      const centerY = frame.y + frame.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((frame.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    this.applyNodeEffects(ctx, frame);

    // 1. Frame Background Fill
    ctx.fillStyle = frame.fill || '#ffffff';
    if (frame.cornerRadius && frame.cornerRadius > 0) {
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(frame.x, frame.y, frame.width, frame.height, frame.cornerRadius);
      } else {
        ctx.rect(frame.x, frame.y, frame.width, frame.height);
      }
      ctx.fill();

      if (frame.stroke && frame.strokeWidth && frame.strokeWidth > 0) {
        ctx.strokeStyle = frame.stroke;
        ctx.lineWidth = frame.strokeWidth;
        ctx.stroke();
      }
    } else {
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
      if (frame.stroke && frame.strokeWidth && frame.strokeWidth > 0) {
        ctx.strokeStyle = frame.stroke;
        ctx.lineWidth = frame.strokeWidth;
        ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      }
    }

    // 2. Render Children (with optional clipping)
    if (childNodes.length > 0) {
      ctx.save();
      if (frame.clipContent !== false) {
        ctx.beginPath();
        if (frame.cornerRadius && frame.cornerRadius > 0 && typeof ctx.roundRect === 'function') {
          ctx.roundRect(frame.x, frame.y, frame.width, frame.height, frame.cornerRadius);
        } else {
          ctx.rect(frame.x, frame.y, frame.width, frame.height);
        }
        ctx.clip();
      }

      for (const child of childNodes) {
        this.renderSingleNode(ctx, child, editingNodeId);
      }

      ctx.restore();
    }

    // 3. Render Frame Header / Title Label
    ctx.save();
    const fontSize = Math.max(10, 11 / zoom);
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#9e9e9e';
    ctx.textBaseline = 'bottom';
    ctx.fillText(frame.name || 'Frame', frame.x, frame.y - 4 / zoom);
    ctx.restore();

    ctx.restore();
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

    const totalTextHeight = metrics.lines.length * metrics.lineHeight;
    let startY = textNode.y;
    const verticalAlign = textNode.verticalAlign || 'top';
    if (verticalAlign === 'middle') {
      startY = textNode.y + Math.max(0, (textNode.height - totalTextHeight) / 2);
    } else if (verticalAlign === 'bottom') {
      startY = textNode.y + Math.max(0, textNode.height - totalTextHeight);
    }

    for (let i = 0; i < metrics.lines.length; i++) {
      const line = metrics.lines[i];
      const lineY = startY + i * metrics.lineHeight;
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
    if (node.rotation) {
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((node.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

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

  private static renderSubtleSelectionOutline(
    ctx: CanvasRenderingContext2D,
    node: SceneNode,
    zoom: number
  ): void {
    ctx.save();
    if (node.rotation) {
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((node.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    ctx.strokeStyle = 'rgba(13, 153, 255, 0.65)';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(node.x, node.y, node.width, node.height);
    ctx.restore();
  }

  private static renderCompositeSelectionOutline(
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number; width: number; height: number },
    zoom: number
  ): void {
    ctx.save();
    const strokeWidth = 1.5 / zoom;
    const handleSize = 7 / zoom;

    // Group bounding box outline
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // 4 Corner handles
    ctx.fillStyle = '#ffffff';
    const corners = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x, y: box.y + box.height },
      { x: box.x + box.width, y: box.y + box.height },
    ];

    for (const c of corners) {
      ctx.fillRect(
        c.x - handleSize / 2,
        c.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        c.x - handleSize / 2,
        c.y - handleSize / 2,
        handleSize,
        handleSize
      );
    }

    ctx.restore();
  }

  private static renderMarquee(
    ctx: CanvasRenderingContext2D,
    box: MarqueeBox,
    zoom: number
  ): void {
    ctx.save();
    // Figma marquee style: translucent sky-blue fill with clean 1px border
    ctx.fillStyle = 'rgba(13, 153, 255, 0.08)';
    ctx.fillRect(box.x, box.y, box.width, box.height);

    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }

  private static renderDistanceMeasurement(
    ctx: CanvasRenderingContext2D,
    meas: DistanceMeasurement,
    zoom: number
  ): void {
    const { selectedBox: s, targetBox: t } = meas;
    ctx.save();

    // 1. Highlight target box in bold red
    ctx.strokeStyle = '#f24822'; // Figma red inspection guide
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(t.x, t.y, t.width, t.height);

    // Also draw a light outline around selected box if not single selection
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.strokeRect(s.x, s.y, s.width, s.height);
    ctx.setLineDash([]);

    // Line helper
    const drawMeasurement = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      dist: number,
      orientation: 'horizontal' | 'vertical'
    ) => {
      if (Math.round(dist) <= 0) return;

      ctx.save();
      ctx.strokeStyle = '#f24822';
      ctx.lineWidth = 1.5 / zoom;

      // Guide line
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // End caps
      const capSize = 4 / zoom;
      ctx.beginPath();
      if (orientation === 'horizontal') {
        ctx.moveTo(p1.x, p1.y - capSize);
        ctx.lineTo(p1.x, p1.y + capSize);
        ctx.moveTo(p2.x, p2.y - capSize);
        ctx.lineTo(p2.x, p2.y + capSize);
      } else {
        ctx.moveTo(p1.x - capSize, p1.y);
        ctx.lineTo(p1.x + capSize, p1.y);
        ctx.moveTo(p2.x - capSize, p2.y);
        ctx.lineTo(p2.x + capSize, p2.y);
      }
      ctx.stroke();

      // Distance badge text
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const text = `${Math.round(dist)}`;
      const fontSize = 11 / zoom;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(text);
      const paddingX = 4 / zoom;
      const paddingY = 2 / zoom;
      const badgeW = textMetrics.width + paddingX * 2;
      const badgeH = fontSize + paddingY * 2;

      // Badge pill background
      ctx.fillStyle = '#f24822';
      ctx.beginPath();
      const r = 3 / zoom;
      const bx = midX - badgeW / 2;
      const by = midY - badgeH / 2;
      ctx.roundRect ? ctx.roundRect(bx, by, badgeW, badgeH, r) : ctx.rect(bx, by, badgeW, badgeH);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY);

      ctx.restore();
    };

    const sRight = s.x + s.width;
    const sBottom = s.y + s.height;
    const tRight = t.x + t.width;
    const tBottom = t.y + t.height;

    // Check if target contains selected (inside relationship)
    const isTargetContainer =
      t.x <= s.x && tRight >= sRight && t.y <= s.y && tBottom >= sBottom;

    if (isTargetContainer) {
      // 4 interior measurements (padding to parent)
      // Top
      const topDist = s.y - t.y;
      const midX = s.x + s.width / 2;
      drawMeasurement({ x: midX, y: t.y }, { x: midX, y: s.y }, topDist, 'vertical');

      // Bottom
      const bottomDist = tBottom - sBottom;
      drawMeasurement({ x: midX, y: sBottom }, { x: midX, y: tBottom }, bottomDist, 'vertical');

      // Left
      const leftDist = s.x - t.x;
      const midY = s.y + s.height / 2;
      drawMeasurement({ x: t.x, y: midY }, { x: s.x, y: midY }, leftDist, 'horizontal');

      // Right
      const rightDist = tRight - sRight;
      drawMeasurement({ x: sRight, y: midY }, { x: tRight, y: midY }, rightDist, 'horizontal');
    } else {
      // External or overlapping measurements
      // Horizontal separation
      const yOverlapStart = Math.max(s.y, t.y);
      const yOverlapEnd = Math.min(sBottom, tBottom);
      const hasYOverlap = yOverlapStart < yOverlapEnd;
      const measureY = hasYOverlap ? (yOverlapStart + yOverlapEnd) / 2 : s.y + s.height / 2;

      if (tRight < s.x) {
        // Target is directly to the Left
        const dist = s.x - tRight;
        drawMeasurement({ x: tRight, y: measureY }, { x: s.x, y: measureY }, dist, 'horizontal');
      } else if (t.x > sRight) {
        // Target is directly to the Right
        const dist = t.x - sRight;
        drawMeasurement({ x: sRight, y: measureY }, { x: t.x, y: measureY }, dist, 'horizontal');
      }

      // Vertical separation
      const xOverlapStart = Math.max(s.x, t.x);
      const xOverlapEnd = Math.min(sRight, tRight);
      const hasXOverlap = xOverlapStart < xOverlapEnd;
      const measureX = hasXOverlap ? (xOverlapStart + xOverlapEnd) / 2 : s.x + s.width / 2;

      if (tBottom < s.y) {
        // Target is directly Above
        const dist = s.y - tBottom;
        drawMeasurement({ x: measureX, y: tBottom }, { x: measureX, y: s.y }, dist, 'vertical');
      } else if (t.y > sBottom) {
        // Target is directly Below
        const dist = t.y - sBottom;
        drawMeasurement({ x: measureX, y: sBottom }, { x: measureX, y: t.y }, dist, 'vertical');
      }

      // When there is no overlap in either X or Y (diagonal), measure both axes
      if (!hasXOverlap && !hasYOverlap) {
        // Draw alignment projections
        ctx.save();
        ctx.strokeStyle = '#f24822';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([2 / zoom, 2 / zoom]);

        if (t.x > sRight && t.y > sBottom) {
          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(sRight, s.y + s.height / 2);
          ctx.lineTo(t.x, s.y + s.height / 2);
          ctx.moveTo(s.x + s.width / 2, sBottom);
          ctx.lineTo(s.x + s.width / 2, t.y);
          ctx.stroke();
        } else if (tRight < s.x && t.y > sBottom) {
          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(tRight, s.y + s.height / 2);
          ctx.lineTo(s.x, s.y + s.height / 2);
          ctx.moveTo(s.x + s.width / 2, sBottom);
          ctx.lineTo(s.x + s.width / 2, t.y);
          ctx.stroke();
        } else if (t.x > sRight && tBottom < s.y) {
          // Top-Right
          ctx.beginPath();
          ctx.moveTo(sRight, s.y + s.height / 2);
          ctx.lineTo(t.x, s.y + s.height / 2);
          ctx.moveTo(s.x + s.width / 2, tBottom);
          ctx.lineTo(s.x + s.width / 2, s.y);
          ctx.stroke();
        } else if (tRight < s.x && tBottom < s.y) {
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(tRight, s.y + s.height / 2);
          ctx.lineTo(s.x, s.y + s.height / 2);
          ctx.moveTo(s.x + s.width / 2, tBottom);
          ctx.lineTo(s.x + s.width / 2, s.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private static renderPath(
    ctx: CanvasRenderingContext2D,
    pathNode: PathNode
  ): void {
    if (!pathNode.anchors || pathNode.anchors.length === 0) return;

    ctx.save();
    ctx.beginPath();

    const start = pathNode.anchors[0];
    ctx.moveTo(pathNode.x + start.x, pathNode.y + start.y);

    for (let i = 1; i < pathNode.anchors.length; i++) {
      const prev = pathNode.anchors[i - 1];
      const curr = pathNode.anchors[i];

      if (prev.handleOut || curr.handleIn) {
        const cp1x = prev.handleOut ? pathNode.x + prev.handleOut.x : pathNode.x + prev.x;
        const cp1y = prev.handleOut ? pathNode.y + prev.handleOut.y : pathNode.y + prev.y;
        const cp2x = curr.handleIn ? pathNode.x + curr.handleIn.x : pathNode.x + curr.x;
        const cp2y = curr.handleIn ? pathNode.y + curr.handleIn.y : pathNode.y + curr.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pathNode.x + curr.x, pathNode.y + curr.y);
      } else {
        ctx.lineTo(pathNode.x + curr.x, pathNode.y + curr.y);
      }
    }

    if (pathNode.closed && pathNode.anchors.length >= 2) {
      const last = pathNode.anchors[pathNode.anchors.length - 1];
      const first = pathNode.anchors[0];
      if (last.handleOut || first.handleIn) {
        const cp1x = last.handleOut ? pathNode.x + last.handleOut.x : pathNode.x + last.x;
        const cp1y = last.handleOut ? pathNode.y + last.handleOut.y : pathNode.y + last.y;
        const cp2x = first.handleIn ? pathNode.x + first.handleIn.x : pathNode.x + first.x;
        const cp2y = first.handleIn ? pathNode.y + first.handleIn.y : pathNode.y + first.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pathNode.x + first.x, pathNode.y + first.y);
      } else {
        ctx.lineTo(pathNode.x + first.x, pathNode.y + first.y);
      }
      ctx.closePath();

      if (pathNode.fill && pathNode.fill !== 'transparent') {
        ctx.fillStyle = pathNode.fill;
        ctx.fill();
      }
    }

    if (pathNode.stroke && pathNode.strokeWidth && pathNode.strokeWidth > 0) {
      ctx.strokeStyle = pathNode.stroke;
      ctx.lineWidth = pathNode.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.restore();
  }

  private static renderLine(
    ctx: CanvasRenderingContext2D,
    line: LineNode
  ): void {
    const x1 = line.x + line.x1;
    const y1 = line.y + line.y1;
    const x2 = line.x + line.x2;
    const y2 = line.y + line.y2;
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length < 0.5) return;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const stroke = line.stroke || '#ffffff';
    const strokeWidth = line.strokeWidth || 2;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (line.startMarker && line.startMarker !== 'none') {
      this.renderMarker(ctx, x1, y1, angle + Math.PI, line.startMarker, stroke, strokeWidth);
    }
    if (line.endMarker && line.endMarker !== 'none') {
      this.renderMarker(ctx, x2, y2, angle, line.endMarker, stroke, strokeWidth);
    }

    ctx.restore();
  }

  private static renderMarker(
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    angle: number,
    markerType: MarkerType,
    color: string,
    strokeWidth: number
  ): void {
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(angle);

    if (markerType === 'arrow') {
      const arrowSize = Math.max(8, strokeWidth * 3.5);
      const arrowAngle = Math.PI / 6; // 30 degrees
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(-arrowSize * Math.cos(arrowAngle), -arrowSize * Math.sin(arrowAngle));
      ctx.lineTo(0, 0);
      ctx.lineTo(-arrowSize * Math.cos(arrowAngle), arrowSize * Math.sin(arrowAngle));
      ctx.stroke();
    } else if (markerType === 'triangle') {
      const arrowSize = Math.max(9, strokeWidth * 4);
      const arrowAngle = Math.PI / 6;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize * Math.cos(arrowAngle), -arrowSize * Math.sin(arrowAngle));
      ctx.lineTo(-arrowSize * Math.cos(arrowAngle), arrowSize * Math.sin(arrowAngle));
      ctx.closePath();
      ctx.fill();
    } else if (markerType === 'circle') {
      const radius = Math.max(3.5, strokeWidth * 1.5);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public static renderPenPreview(
    ctx: CanvasRenderingContext2D,
    state: PenDrawingState,
    zoom: number
  ): void {
    if (!state.isDrawing || state.anchors.length === 0) return;

    ctx.save();

    // 1. Render placed curve segments
    ctx.beginPath();
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1.5 / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const start = state.anchors[0];
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < state.anchors.length; i++) {
      const prev = state.anchors[i - 1];
      const curr = state.anchors[i];

      if (prev.handleOut || curr.handleIn) {
        const cp1x = prev.handleOut ? prev.handleOut.x : prev.x;
        const cp1y = prev.handleOut ? prev.handleOut.y : prev.y;
        const cp2x = curr.handleIn ? curr.handleIn.x : curr.x;
        const cp2y = curr.handleIn ? curr.handleIn.y : curr.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }
    }
    ctx.stroke();

    // 2. Render live preview line from last anchor to mouse cursor
    if (state.currentPointerWorld && !state.isDraggingHandle) {
      const last = state.anchors[state.anchors.length - 1];
      const target = (state.hoveringFirstAnchor && state.anchors.length >= 2)
        ? state.anchors[0]
        : state.currentPointerWorld;

      ctx.beginPath();
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.moveTo(last.x, last.y);
      if (last.handleOut) {
        ctx.bezierCurveTo(
          last.handleOut.x,
          last.handleOut.y,
          target.x,
          target.y,
          target.x,
          target.y
        );
      } else {
        ctx.lineTo(target.x, target.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Render tangent handles for anchors that have handles
    for (const anchor of state.anchors) {
      if (anchor.handleIn || anchor.handleOut) {
        ctx.strokeStyle = 'rgba(13, 153, 255, 0.6)';
        ctx.lineWidth = 1 / zoom;

        if (anchor.handleIn) {
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y);
          ctx.lineTo(anchor.handleIn.x, anchor.handleIn.y);
          ctx.stroke();

          // Handle knob
          ctx.beginPath();
          ctx.arc(anchor.handleIn.x, anchor.handleIn.y, 3 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#0d99ff';
          ctx.fill();
        }

        if (anchor.handleOut) {
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y);
          ctx.lineTo(anchor.handleOut.x, anchor.handleOut.y);
          ctx.stroke();

          // Handle knob
          ctx.beginPath();
          ctx.arc(anchor.handleOut.x, anchor.handleOut.y, 3 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#0d99ff';
          ctx.fill();
        }
      }
    }

    // 4. Render anchor point squares (white fill, blue border)
    const anchorSize = 6 / zoom;
    for (const anchor of state.anchors) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 1.5 / zoom;
      ctx.fillRect(
        anchor.x - anchorSize / 2,
        anchor.y - anchorSize / 2,
        anchorSize,
        anchorSize
      );
      ctx.strokeRect(
        anchor.x - anchorSize / 2,
        anchor.y - anchorSize / 2,
        anchorSize,
        anchorSize
      );
    }

    // 5. Closing indicator when hovering first anchor
    if (state.hoveringFirstAnchor && state.anchors.length >= 2) {
      const first = state.anchors[0];
      ctx.beginPath();
      ctx.fillStyle = 'rgba(13, 153, 255, 0.25)';
      ctx.strokeStyle = '#0d99ff';
      ctx.lineWidth = 2 / zoom;
      ctx.arc(first.x, first.y, 9 / zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
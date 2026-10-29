import type { Point } from '../../types/camera';
import type { PathNode, VectorAnchor, LineNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';
import {
  isPointInsideNode,
  hitTestResizeHandles,
  doBoxesIntersect,
} from '../../utils/math';
import type { ResizeHandleType } from '../../utils/math';
import type { SnapGuide } from '../engine/Renderer';

export interface MarqueeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragState {
  mode: 'move' | 'resize' | 'rotate' | 'marquee';
  resizeHandle?: ResizeHandleType;
  dragStartWorld: Point;
  initialRotation?: number;
  centerWorld?: Point;
  initialSelectedIds?: Set<string>;
  initialNodeBounds: Map<
    string,
    {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      anchors?: VectorAnchor[];
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
    }
  >;
}

export class SelectTool {
  private dragState: DragState | null = null;
  private hoveredHandle: ResizeHandleType | null = null;
  private activeSnapGuides: SnapGuide[] = [];
  private currentMarquee: MarqueeBox | null = null;

  public getSnapGuides(): SnapGuide[] {
    return this.activeSnapGuides;
  }

  public getMarqueeBox(): MarqueeBox | null {
    return this.currentMarquee;
  }

  public getHoveredHandle(): ResizeHandleType | null {
    return this.hoveredHandle;
  }

  public isDragging(): boolean {
    return this.dragState !== null;
  }

  /**
   * Hit test handles or edges on hover to change cursor style.
   */
  public onPointerHover(
    worldPoint: Point,
    sceneGraph: SceneGraph,
    selectedIds: Set<string>,
    zoom: number
  ): ResizeHandleType | null {
    // Check handles / edges of single selected shape first
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      const node = sceneGraph.getNode(id);
      if (node) {
        const hitHandle = hitTestResizeHandles(worldPoint, node, zoom);
        if (hitHandle) {
          this.hoveredHandle = hitHandle;
          return hitHandle;
        }
      }
    }

    this.hoveredHandle = null;
    return null;
  }

  /**
   * Pointer Down: Check handles/edges first, then nodes, or start marquee on empty canvas.
   */
  public onPointerDown(
    worldPoint: Point,
    sceneGraph: SceneGraph,
    selectedIds: Set<string>,
    setSelectedIds: (ids: Set<string>) => void,
    zoom: number,
    isShiftPressed: boolean = false
  ): boolean {
    // 1. Check if clicking on an active resize or rotation handle (single selected shape)
    if (selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const node = sceneGraph.getNode(selectedId);
      if (node) {
        const hitHandle = hitTestResizeHandles(worldPoint, node, zoom);
        if (hitHandle) {
          const initialMap = new Map();
          const line = node.type === 'line' ? (node as LineNode) : undefined;
          initialMap.set(selectedId, {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            rotation: node.rotation || 0,
            anchors: node.type === 'path' ? JSON.parse(JSON.stringify((node as PathNode).anchors)) : undefined,
            x1: line ? line.x1 : undefined,
            y1: line ? line.y1 : undefined,
            x2: line ? line.x2 : undefined,
            y2: line ? line.y2 : undefined,
          });

          if (hitHandle.startsWith('rot-')) {
            const center = { x: node.x + node.width / 2, y: node.y + node.height / 2 };
            this.dragState = {
              mode: 'rotate',
              resizeHandle: hitHandle,
              dragStartWorld: { ...worldPoint },
              initialRotation: node.rotation || 0,
              centerWorld: center,
              initialNodeBounds: initialMap,
            };
          } else {
            this.dragState = {
              mode: 'resize',
              resizeHandle: hitHandle,
              dragStartWorld: { ...worldPoint },
              initialNodeBounds: initialMap,
            };
          }
          return true;
        }
      }
    }

    // 2. Hit-test shapes in reverse order (top to bottom)
    const nodes = sceneGraph.getAllNodes();
    let hitId: string | null = null;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (isPointInsideNode(worldPoint, node)) {
        hitId = node.id;
        break;
      }
    }

    if (hitId) {
      let nextSelection: Set<string>;
      if (isShiftPressed) {
        // Toggle item into/out of selection
        nextSelection = new Set(selectedIds);
        if (nextSelection.has(hitId)) {
          nextSelection.delete(hitId);
        } else {
          nextSelection.add(hitId);
        }
      } else {
        // If clicking an already selected node in a multi-selection, preserve group for dragging
        nextSelection = selectedIds.has(hitId)
          ? selectedIds
          : new Set([hitId]);
      }

      setSelectedIds(nextSelection);

      // If selection is empty after shift-unselecting, exit
      if (nextSelection.size === 0) {
        this.dragState = null;
        return true;
      }

      const initialMap = new Map();
      for (const id of nextSelection) {
        const n = sceneGraph.getNode(id);
        if (n) {
          initialMap.set(id, {
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
          });

          // If dragging a frame, automatically move its children along with it
          if (n.type === 'frame') {
            for (const child of sceneGraph.getAllNodes()) {
              if (child.parentId === n.id && !nextSelection.has(child.id)) {
                initialMap.set(child.id, {
                  x: child.x,
                  y: child.y,
                  width: child.width,
                  height: child.height,
                });
              }
            }
          }
        }
      }

      this.dragState = {
        mode: 'move',
        dragStartWorld: { ...worldPoint },
        initialNodeBounds: initialMap,
      };
      return true;
    }

    // 3. Clicked empty space -> start Marquee Selection
    const baseSelection = isShiftPressed ? new Set(selectedIds) : new Set<string>();
    if (!isShiftPressed) {
      setSelectedIds(new Set());
    }

    this.dragState = {
      mode: 'marquee',
      dragStartWorld: { ...worldPoint },
      initialSelectedIds: baseSelection,
      initialNodeBounds: new Map(),
    };
    this.currentMarquee = {
      x: worldPoint.x,
      y: worldPoint.y,
      width: 0,
      height: 0,
    };
    return false;
  }

  /**
   * Pointer Move: Execute move, resize, or marquee selection.
   */
  public onPointerMove(
    worldPoint: Point,
    sceneGraph: SceneGraph,
    zoom: number = 1,
    setSelectedIds?: (ids: Set<string>) => void
  ): void {
    if (!this.dragState) return;

    if (this.dragState.mode === 'marquee') {
      const start = this.dragState.dragStartWorld;
      const x = Math.min(start.x, worldPoint.x);
      const y = Math.min(start.y, worldPoint.y);
      const width = Math.abs(worldPoint.x - start.x);
      const height = Math.abs(worldPoint.y - start.y);

      this.currentMarquee = { x, y, width, height };

      if (setSelectedIds) {
        const matchingIds = new Set<string>(this.dragState.initialSelectedIds || []);
        const allNodes = sceneGraph.getAllNodes();

        for (const node of allNodes) {
          // If node has a parent, let the user select it directly or via its frame
          if (doBoxesIntersect({ x, y, width, height }, node)) {
            matchingIds.add(node.id);
          }
        }
        setSelectedIds(matchingIds);
      }
      return;
    }

    if (this.dragState.mode === 'rotate') {
      const center = this.dragState.centerWorld;
      if (!center) return;

      const startAngle = Math.atan2(
        this.dragState.dragStartWorld.y - center.y,
        this.dragState.dragStartWorld.x - center.x
      );
      const currentAngle = Math.atan2(
        worldPoint.y - center.y,
        worldPoint.x - center.x
      );

      const angleDiffDeg = ((currentAngle - startAngle) * 180) / Math.PI;
      let newRotation = Math.round((this.dragState.initialRotation || 0) + angleDiffDeg);

      // Normalize to [0, 360)
      newRotation = ((newRotation % 360) + 360) % 360;

      // Snap to 0, 45, 90, 180, 270 if close
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      for (const snap of snapAngles) {
        if (Math.abs(newRotation - snap) <= 3) {
          newRotation = snap === 360 ? 0 : snap;
          break;
        }
      }

      for (const id of this.dragState.initialNodeBounds.keys()) {
        sceneGraph.updateNode(id, { rotation: newRotation });
      }
      return;
    }

    const deltaX = worldPoint.x - this.dragState.dragStartWorld.x;
    const deltaY = worldPoint.y - this.dragState.dragStartWorld.y;

    if (this.dragState.mode === 'move') {
      // Calculate combined bounding box of moving selection
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const initial of this.dragState.initialNodeBounds.values()) {
        const curX = initial.x + deltaX;
        const curY = initial.y + deltaY;
        minX = Math.min(minX, curX);
        minY = Math.min(minY, curY);
        maxX = Math.max(maxX, curX + initial.width);
        maxY = Math.max(maxY, curY + initial.height);
      }

      const selectedBounds = {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };

      // Candidates to snap against: all other non-selected nodes on canvas
      const otherNodes = sceneGraph
        .getAllNodes()
        .filter((n) => !this.dragState?.initialNodeBounds.has(n.id));

      let snapOffsetX = 0;
      let snapOffsetY = 0;
      this.activeSnapGuides = [];

      if (otherNodes.length > 0) {
        // Generous, forgiving snap threshold (at least 8px up to 10px in screen space)
        const snapThreshold = Math.max(8 / zoom, 8);

        // Collect all snap candidate targets across all other elements
        const candidateXTargets: { pos: number; top: number; bottom: number }[] = [];
        const candidateYTargets: { pos: number; left: number; right: number }[] = [];

        for (const other of otherNodes) {
          candidateXTargets.push(
            { pos: other.x, top: other.y, bottom: other.y + other.height },
            { pos: other.x + other.width / 2, top: other.y, bottom: other.y + other.height },
            { pos: other.x + other.width, top: other.y, bottom: other.y + other.height }
          );
          candidateYTargets.push(
            { pos: other.y, left: other.x, right: other.x + other.width },
            { pos: other.y + other.height / 2, left: other.x, right: other.x + other.width },
            { pos: other.y + other.height, left: other.x, right: other.x + other.width }
          );
        }

        // Element X Points: Left, Center, Right
        const elemXPoints = [
          selectedBounds.x,
          selectedBounds.x + selectedBounds.width / 2,
          selectedBounds.x + selectedBounds.width,
        ];

        let bestDiffX = snapThreshold + 1;
        let bestTargetX: { pos: number; top: number; bottom: number } | null = null;
        let bestSnapX = 0;

        for (const target of candidateXTargets) {
          for (const point of elemXPoints) {
            const diff = Math.abs(point - target.pos);
            if (diff <= snapThreshold && diff < bestDiffX) {
              bestDiffX = diff;
              bestTargetX = target;
              bestSnapX = target.pos - point;
            }
          }
        }

        if (bestTargetX !== null) {
          snapOffsetX = bestSnapX;
          this.activeSnapGuides.push({
            orientation: 'vertical',
            position: bestTargetX.pos,
            start: Math.min(bestTargetX.top, selectedBounds.y) - 16,
            end: Math.max(bestTargetX.bottom, selectedBounds.y + selectedBounds.height) + 16,
          });
        }

        // Element Y Points: Top, Center, Bottom
        const elemYPoints = [
          selectedBounds.y,
          selectedBounds.y + selectedBounds.height / 2,
          selectedBounds.y + selectedBounds.height,
        ];

        let bestDiffY = snapThreshold + 1;
        let bestTargetY: { pos: number; left: number; right: number } | null = null;
        let bestSnapY = 0;

        for (const target of candidateYTargets) {
          for (const point of elemYPoints) {
            const diff = Math.abs(point - target.pos);
            if (diff <= snapThreshold && diff < bestDiffY) {
              bestDiffY = diff;
              bestTargetY = target;
              bestSnapY = target.pos - point;
            }
          }
        }

        if (bestTargetY !== null) {
          snapOffsetY = bestSnapY;
          this.activeSnapGuides.push({
            orientation: 'horizontal',
            position: bestTargetY.pos,
            start: Math.min(bestTargetY.left, selectedBounds.x) - 16,
            end: Math.max(bestTargetY.right, selectedBounds.x + selectedBounds.width) + 16,
          });
        }
      }

      const finalDeltaX = deltaX + snapOffsetX;
      const finalDeltaY = deltaY + snapOffsetY;

      for (const [id, initial] of this.dragState.initialNodeBounds.entries()) {
        sceneGraph.updateNode(id, {
          x: initial.x + finalDeltaX,
          y: initial.y + finalDeltaY,
        });
      }
    } else if (this.dragState.mode === 'resize' && this.dragState.resizeHandle) {
      const [id, initial] = Array.from(this.dragState.initialNodeBounds.entries())[0];
      const handle = this.dragState.resizeHandle;

      let newX = initial.x;
      let newY = initial.y;
      let newWidth = initial.width;
      let newHeight = initial.height;
      const minSize = 10;

      // Adjust geometry per handle type
      if (handle === 'br') {
        newWidth = Math.max(minSize, initial.width + deltaX);
        newHeight = Math.max(minSize, initial.height + deltaY);
      } else if (handle === 'tr') {
        newWidth = Math.max(minSize, initial.width + deltaX);
        const desiredHeight = initial.height - deltaY;
        if (desiredHeight >= minSize) {
          newHeight = desiredHeight;
          newY = initial.y + deltaY;
        } else {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
      } else if (handle === 'bl') {
        const desiredWidth = initial.width - deltaX;
        if (desiredWidth >= minSize) {
          newWidth = desiredWidth;
          newX = initial.x + deltaX;
        } else {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }
        newHeight = Math.max(minSize, initial.height + deltaY);
      } else if (handle === 'tl') {
        const desiredWidth = initial.width - deltaX;
        if (desiredWidth >= minSize) {
          newWidth = desiredWidth;
          newX = initial.x + deltaX;
        } else {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }

        const desiredHeight = initial.height - deltaY;
        if (desiredHeight >= minSize) {
          newHeight = desiredHeight;
          newY = initial.y + deltaY;
        } else {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
      } else if (handle === 'r') {
        // 1D Width resize (Right edge)
        newWidth = Math.max(minSize, initial.width + deltaX);
      } else if (handle === 'l') {
        // 1D Width resize (Left edge)
        const desiredWidth = initial.width - deltaX;
        if (desiredWidth >= minSize) {
          newWidth = desiredWidth;
          newX = initial.x + deltaX;
        } else {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }
      } else if (handle === 'b') {
        // 1D Height resize (Bottom edge)
        newHeight = Math.max(minSize, initial.height + deltaY);
      } else if (handle === 't') {
        // 1D Height resize (Top edge)
        const desiredHeight = initial.height - deltaY;
        if (desiredHeight >= minSize) {
          newHeight = desiredHeight;
          newY = initial.y + deltaY;
        } else {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
      }

      // Snap to any other element during resizing
      const otherNodes = sceneGraph
        .getAllNodes()
        .filter((n) => !this.dragState?.initialNodeBounds.has(n.id));

      this.activeSnapGuides = [];

      if (otherNodes.length > 0) {
        // Generous, forgiving snap threshold (at least 8px up to 10px in screen space)
        const snapThreshold = Math.max(8 / zoom, 8);
        const candidateXTargets: { pos: number; top: number; bottom: number }[] = [];
        const candidateYTargets: { pos: number; left: number; right: number }[] = [];

        for (const other of otherNodes) {
          candidateXTargets.push(
            { pos: other.x, top: other.y, bottom: other.y + other.height },
            { pos: other.x + other.width / 2, top: other.y, bottom: other.y + other.height },
            { pos: other.x + other.width, top: other.y, bottom: other.y + other.height }
          );
          candidateYTargets.push(
            { pos: other.y, left: other.x, right: other.x + other.width },
            { pos: other.y + other.height / 2, left: other.x, right: other.x + other.width },
            { pos: other.y + other.height, left: other.x, right: other.x + other.width }
          );
        }

        // 1. Horizontal edge resizing:
        const isRightMoving = ['br', 'tr', 'r'].includes(handle);
        const isLeftMoving = ['bl', 'tl', 'l'].includes(handle);

        if (isRightMoving) {
          const currentRight = newX + newWidth;
          let bestDiff = snapThreshold + 1;
          let bestTarget: { pos: number; top: number; bottom: number } | null = null;
          for (const target of candidateXTargets) {
            const diff = Math.abs(currentRight - target.pos);
            if (diff <= snapThreshold && diff < bestDiff) {
              bestDiff = diff;
              bestTarget = target;
            }
          }
          if (bestTarget !== null && bestTarget.pos - newX >= minSize) {
            newWidth = bestTarget.pos - newX;
            this.activeSnapGuides.push({
              orientation: 'vertical',
              position: bestTarget.pos,
              start: Math.min(bestTarget.top, newY) - 16,
              end: Math.max(bestTarget.bottom, newY + newHeight) + 16,
            });
          }
        } else if (isLeftMoving) {
          const currentLeft = newX;
          let bestDiff = snapThreshold + 1;
          let bestTarget: { pos: number; top: number; bottom: number } | null = null;
          for (const target of candidateXTargets) {
            const diff = Math.abs(currentLeft - target.pos);
            if (diff <= snapThreshold && diff < bestDiff) {
              bestDiff = diff;
              bestTarget = target;
            }
          }
          const fixedRight = initial.x + initial.width;
          if (bestTarget !== null && fixedRight - bestTarget.pos >= minSize) {
            newX = bestTarget.pos;
            newWidth = fixedRight - bestTarget.pos;
            this.activeSnapGuides.push({
              orientation: 'vertical',
              position: bestTarget.pos,
              start: Math.min(bestTarget.top, newY) - 16,
              end: Math.max(bestTarget.bottom, newY + newHeight) + 16,
            });
          }
        }

        // 2. Vertical edge resizing:
        const isBottomMoving = ['br', 'bl', 'b'].includes(handle);
        const isTopMoving = ['tr', 'tl', 't'].includes(handle);

        if (isBottomMoving) {
          const currentBottom = newY + newHeight;
          let bestDiff = snapThreshold + 1;
          let bestTarget: { pos: number; left: number; right: number } | null = null;
          for (const target of candidateYTargets) {
            const diff = Math.abs(currentBottom - target.pos);
            if (diff <= snapThreshold && diff < bestDiff) {
              bestDiff = diff;
              bestTarget = target;
            }
          }
          if (bestTarget !== null && bestTarget.pos - newY >= minSize) {
            newHeight = bestTarget.pos - newY;
            this.activeSnapGuides.push({
              orientation: 'horizontal',
              position: bestTarget.pos,
              start: Math.min(bestTarget.left, newX) - 16,
              end: Math.max(bestTarget.right, newX + newWidth) + 16,
            });
          }
        } else if (isTopMoving) {
          const currentTop = newY;
          let bestDiff = snapThreshold + 1;
          let bestTarget: { pos: number; left: number; right: number } | null = null;
          for (const target of candidateYTargets) {
            const diff = Math.abs(currentTop - target.pos);
            if (diff <= snapThreshold && diff < bestDiff) {
              bestDiff = diff;
              bestTarget = target;
            }
          }
          const fixedBottom = initial.y + initial.height;
          if (bestTarget !== null && fixedBottom - bestTarget.pos >= minSize) {
            newY = bestTarget.pos;
            newHeight = fixedBottom - bestTarget.pos;
            this.activeSnapGuides.push({
              orientation: 'horizontal',
              position: bestTarget.pos,
              start: Math.min(bestTarget.left, newX) - 16,
              end: Math.max(bestTarget.right, newX + newWidth) + 16,
            });
          }
        }
      }

      const node = sceneGraph.getNode(id);
      if (node && node.type === 'text') {
        sceneGraph.updateNode(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          autoWidth: false,
        });
      } else if (node && node.type === 'path' && initial.anchors && initial.width > 0 && initial.height > 0) {
        const sx = newWidth / initial.width;
        const sy = newHeight / initial.height;
        const scaledAnchors: VectorAnchor[] = initial.anchors.map((a) => ({
          x: a.x * sx,
          y: a.y * sy,
          handleIn: a.handleIn ? { x: a.handleIn.x * sx, y: a.handleIn.y * sy } : undefined,
          handleOut: a.handleOut ? { x: a.handleOut.x * sx, y: a.handleOut.y * sy } : undefined,
        }));
        sceneGraph.updateNode(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          anchors: scaledAnchors,
        });
      } else if (node && node.type === 'line' && initial.x1 !== undefined && initial.width > 0 && initial.height > 0) {
        const sx = newWidth / initial.width;
        const sy = newHeight / initial.height;
        sceneGraph.updateNode(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          x1: (initial.x1 || 0) * sx,
          y1: (initial.y1 || 0) * sy,
          x2: (initial.x2 || 0) * sx,
          y2: (initial.y2 || 0) * sy,
        });
      } else {
        sceneGraph.updateNode(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    }
  }

  /**
   * Pointer Up: Reset active drag session and return any transformation records.
   */
  public onPointerUp(sceneGraph?: SceneGraph): {
    id: string;
    before: { x: number; y: number; width: number; height: number; rotation?: number; anchors?: VectorAnchor[]; x1?: number; y1?: number; x2?: number; y2?: number };
    after: { x: number; y: number; width: number; height: number; rotation?: number; anchors?: VectorAnchor[]; x1?: number; y1?: number; x2?: number; y2?: number };
  }[] {
    const changes: {
      id: string;
      before: { x: number; y: number; width: number; height: number; rotation?: number; anchors?: VectorAnchor[]; x1?: number; y1?: number; x2?: number; y2?: number };
      after: { x: number; y: number; width: number; height: number; rotation?: number; anchors?: VectorAnchor[]; x1?: number; y1?: number; x2?: number; y2?: number };
    }[] = [];

    if (this.dragState && sceneGraph) {
      for (const [id, initial] of this.dragState.initialNodeBounds.entries()) {
        const current = sceneGraph.getNode(id);
        if (current) {
          const hasChanged =
            current.x !== initial.x ||
            current.y !== initial.y ||
            current.width !== initial.width ||
            current.height !== initial.height ||
            (current.rotation || 0) !== (initial.rotation || 0);

          if (hasChanged) {
            changes.push({
              id,
              before: { ...initial },
              after: {
                x: current.x,
                y: current.y,
                width: current.width,
                height: current.height,
                rotation: current.rotation,
                anchors: current.type === 'path' ? (current as PathNode).anchors : undefined,
                x1: current.type === 'line' ? (current as LineNode).x1 : undefined,
                y1: current.type === 'line' ? (current as LineNode).y1 : undefined,
                x2: current.type === 'line' ? (current as LineNode).x2 : undefined,
                y2: current.type === 'line' ? (current as LineNode).y2 : undefined,
              },
            });
          }
        }
      }
      // Auto-reparent non-frame nodes if their center falls inside a frame
      for (const id of this.dragState.initialNodeBounds.keys()) {
        const node = sceneGraph.getNode(id);
        if (node && node.type !== 'frame') {
          const centerX = node.x + node.width / 2;
          const centerY = node.y + node.height / 2;
          const allNodes = sceneGraph.getAllNodes();
          let targetFrameId: string | undefined = undefined;

          for (let i = allNodes.length - 1; i >= 0; i--) {
            const candidate = allNodes[i];
            if (candidate.type === 'frame' && candidate.id !== node.id) {
              if (
                centerX >= candidate.x &&
                centerX <= candidate.x + candidate.width &&
                centerY >= candidate.y &&
                centerY <= candidate.y + candidate.height
              ) {
                targetFrameId = candidate.id;
                break;
              }
            }
          }

          if (node.parentId !== targetFrameId) {
            sceneGraph.updateNode(node.id, { parentId: targetFrameId });
          }
        }
      }
    }

    this.dragState = null;
    this.currentMarquee = null;
    this.activeSnapGuides = [];
    return changes;
  }
}


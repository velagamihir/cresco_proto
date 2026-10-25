import type { Point } from '../../types/camera';
import { SceneGraph } from '../scene/SceneGraph';
import {
  isPointInsideNode,
  hitTestResizeHandles,
} from '../../utils/math';
import type { ResizeHandleType } from '../../utils/math';
interface DragState {
  mode: 'move' | 'resize';
  resizeHandle?: ResizeHandleType;
  dragStartWorld: Point;
  initialNodeBounds: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
}

export class SelectTool {
  private dragState: DragState | null = null;
  private hoveredHandle: ResizeHandleType | null = null;

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
   * Pointer Down: Check handles/edges first, then nodes.
   */
  public onPointerDown(
    worldPoint: Point,
    sceneGraph: SceneGraph,
    selectedIds: Set<string>,
    setSelectedIds: (ids: Set<string>) => void,
    zoom: number
  ): boolean {
    // 1. Check if clicking on an active resize handle or edge
    if (selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const node = sceneGraph.getNode(selectedId);
      if (node) {
        const hitHandle = hitTestResizeHandles(worldPoint, node, zoom);
        if (hitHandle) {
          const initialMap = new Map();
          initialMap.set(selectedId, {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
          });

          this.dragState = {
            mode: 'resize',
            resizeHandle: hitHandle,
            dragStartWorld: { ...worldPoint },
            initialNodeBounds: initialMap,
          };
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
      const nextSelection = selectedIds.has(hitId)
        ? selectedIds
        : new Set([hitId]);
      setSelectedIds(nextSelection);

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
        }
      }

      this.dragState = {
        mode: 'move',
        dragStartWorld: { ...worldPoint },
        initialNodeBounds: initialMap,
      };
      return true;
    }

    // 3. Clicked empty space
    setSelectedIds(new Set());
    this.dragState = null;
    return false;
  }

  /**
   * Pointer Move: Execute move or resize computation.
   */
  public onPointerMove(worldPoint: Point, sceneGraph: SceneGraph): void {
    if (!this.dragState) return;

    const deltaX = worldPoint.x - this.dragState.dragStartWorld.x;
    const deltaY = worldPoint.y - this.dragState.dragStartWorld.y;

    if (this.dragState.mode === 'move') {
      for (const [id, initial] of this.dragState.initialNodeBounds.entries()) {
        sceneGraph.updateNode(id, {
          x: initial.x + deltaX,
          y: initial.y + deltaY,
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

      const node = sceneGraph.getNode(id);
      if (node && node.type === 'text') {
        sceneGraph.updateNode(id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
          autoWidth: false,
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
    before: { x: number; y: number; width: number; height: number };
    after: { x: number; y: number; width: number; height: number };
  }[] {
    const changes: {
      id: string;
      before: { x: number; y: number; width: number; height: number };
      after: { x: number; y: number; width: number; height: number };
    }[] = [];

    if (this.dragState && sceneGraph) {
      for (const [id, initial] of this.dragState.initialNodeBounds.entries()) {
        const current = sceneGraph.getNode(id);
        if (current) {
          const hasChanged =
            current.x !== initial.x ||
            current.y !== initial.y ||
            current.width !== initial.width ||
            current.height !== initial.height;

          if (hasChanged) {
            changes.push({
              id,
              before: { ...initial },
              after: {
                x: current.x,
                y: current.y,
                width: current.width,
                height: current.height,
              },
            });
          }
        }
      }
    }

    this.dragState = null;
    return changes;
  }
}


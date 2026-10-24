import type { Point } from '../../types/camera';
import { SceneGraph } from '../scene/SceneGraph';
import { isPointInsideBounds } from '../../utils/math';

export class SelectTool {
  private isDragging: boolean = false;
  private dragStartWorld: Point = { x: 0, y: 0 };
  private initialNodePositions: Map<string, { x: number; y: number }> = new Map();

  /**
   * Pointer Down: Hit-test top-most shape under cursor.
   */
  public onPointerDown(
    worldPoint: Point,
    sceneGraph: SceneGraph,
    selectedIds: Set<string>,
    setSelectedIds: (ids: Set<string>) => void
  ): boolean {
    const nodes = sceneGraph.getAllNodes();

    // Iterate backwards (top-most elements first)
    let hitId: string | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (isPointInsideBounds(worldPoint, node)) {
        hitId = node.id;
        break;
      }
    }

    if (hitId) {
      // If clicked element wasn't already selected, select only this element
      if (!selectedIds.has(hitId)) {
        const next = new Set<string>();
        next.add(hitId);
        setSelectedIds(next);
      }

      this.isDragging = true;
      this.dragStartWorld = { ...worldPoint };

      // Cache starting positions of all currently selected shapes
      this.initialNodePositions.clear();
      const currentSelected = selectedIds.has(hitId) ? selectedIds : new Set([hitId]);
      for (const id of currentSelected) {
        const node = sceneGraph.getNode(id);
        if (node) {
          this.initialNodePositions.set(id, { x: node.x, y: node.y });
        }
      }
      return true;
    } else {
      // Clicked on empty canvas -> clear selection
      setSelectedIds(new Set());
      this.isDragging = false;
      return false;
    }
  }

  /**
   * Pointer Move: Translate selected elements if dragging.
   */
  public onPointerMove(worldPoint: Point, sceneGraph: SceneGraph): void {
    if (!this.isDragging) return;

    const deltaX = worldPoint.x - this.dragStartWorld.x;
    const deltaY = worldPoint.y - this.dragStartWorld.y;

    for (const [id, initialPos] of this.initialNodePositions.entries()) {
      sceneGraph.updateNode(id, {
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY,
      });
    }
  }

  /**
   * Pointer Up: Finish drag operation.
   */
  public onPointerUp(): void {
    this.isDragging = false;
    this.initialNodePositions.clear();
  }
}
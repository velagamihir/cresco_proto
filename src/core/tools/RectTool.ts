import type { Point } from '../../types/camera';
import type { RectangleNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';
import { generateId } from '../../utils/id';

export class RectTool {
    private isDrawing: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private activeRectId: string | null = null;

    /**
     * Pointer Down: Record start coordinate and insert initial 0-size rectangle.
     */
    public onPointerDown(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        onCreated?: (id: string) => void
    ): void {
        this.isDrawing = true;
        this.startPoint = { ...worldPoint };
        this.activeRectId = generateId('rect');

        const newRect: RectangleNode = {
            id: this.activeRectId,
            type: 'rectangle',
            x: worldPoint.x,
            y: worldPoint.y,
            width: 0,
            height: 0,
            fill: '#d9d9d9', // Default Figma rectangle fill
            stroke: '#0d99ff',
            strokeWidth: 1,
            cornerRadius: 0,
        };

        sceneGraph.addNode(newRect);
        onCreated?.(this.activeRectId);
    }

    /**
     * Pointer Move: Calculate normalized bounding box and update the node.
     */
    public onPointerMove(worldPoint: Point, sceneGraph: SceneGraph): void {
        if (!this.isDrawing || !this.activeRectId) return;

        // Normalize coordinates so the rectangle draws correctly in all 4 quadrants
        const x = Math.min(this.startPoint.x, worldPoint.x);
        const y = Math.min(this.startPoint.y, worldPoint.y);
        const width = Math.abs(worldPoint.x - this.startPoint.x);
        const height = Math.abs(worldPoint.y - this.startPoint.y);

        sceneGraph.updateNode(this.activeRectId, {
            x,
            y,
            width,
            height,
        });
    }

    /**
     * Pointer Up: Finish drawing and discard accidental zero-size clicks.
     */
    public onPointerUp(
        sceneGraph: SceneGraph,
        onComplete?: (id: string | null) => void
    ): void {
        if (!this.isDrawing || !this.activeRectId) return;

        const node = sceneGraph.getNode(this.activeRectId);
        let finalId: string | null = this.activeRectId;

        // If mouse was merely clicked without dragging (threshold < 2px), remove the node
        if (node && (node.width < 2 || node.height < 2)) {
            sceneGraph.deleteNode(this.activeRectId);
            finalId = null;
        }

        this.isDrawing = false;
        this.activeRectId = null;
        onComplete?.(finalId);
    }
}
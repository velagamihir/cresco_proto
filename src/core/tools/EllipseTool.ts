import type { Point } from '../../types/camera';
import type { EllipseNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';
import { generateId } from '../../utils/id';

export class EllipseTool {
    private isDrawing: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private activeEllipseId: string | null = null;

    /**
     * Pointer Down: Record start coordinate and insert initial 0-size ellipse.
     */
    public onPointerDown(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        onCreated?: (id: string) => void
    ): void {
        this.isDrawing = true;
        this.startPoint = { ...worldPoint };
        this.activeEllipseId = generateId('ellipse');

        const newEllipse: EllipseNode = {
            id: this.activeEllipseId,
            type: 'ellipse',
            x: worldPoint.x,
            y: worldPoint.y,
            width: 0,
            height: 0,
            fill: '#d9d9d9', // Default Figma shape fill
            stroke: '#0d99ff',
            strokeWidth: 1,
        };

        sceneGraph.addNode(newEllipse);
        onCreated?.(this.activeEllipseId);
    }

    /**
     * Pointer Move: Calculate normalized bounding box and update the ellipse node.
     * Supports isShiftPressed to lock aspect ratio to 1:1 (Circle).
     */
    public onPointerMove(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        isShiftPressed: boolean = false
    ): void {
        if (!this.isDrawing || !this.activeEllipseId) return;

        let width = Math.abs(worldPoint.x - this.startPoint.x);
        let height = Math.abs(worldPoint.y - this.startPoint.y);

        if (isShiftPressed) {
            const side = Math.max(width, height);
            width = side;
            height = side;
        }

        const x = worldPoint.x < this.startPoint.x ? this.startPoint.x - width : this.startPoint.x;
        const y = worldPoint.y < this.startPoint.y ? this.startPoint.y - height : this.startPoint.y;

        sceneGraph.updateNode(this.activeEllipseId, {
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
        if (!this.isDrawing || !this.activeEllipseId) return;

        const node = sceneGraph.getNode(this.activeEllipseId);
        let finalId: string | null = this.activeEllipseId;

        // If mouse was merely clicked without dragging (threshold < 2px), remove the node
        if (node && (node.width < 2 || node.height < 2)) {
            sceneGraph.deleteNode(this.activeEllipseId);
            finalId = null;
        }

        this.isDrawing = false;
        this.activeEllipseId = null;
        onComplete?.(finalId);
    }
}

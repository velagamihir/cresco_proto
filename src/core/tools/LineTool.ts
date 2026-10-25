import type { Point } from '../../types/camera';
import type { LineNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';
import { generateId } from '../../utils/id';

export class LineTool {
    private isDrawing: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private activeLineId: string | null = null;

    /**
     * Pointer Down: Initialize zero-length line node in SceneGraph.
     */
    public onPointerDown(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        isArrow: boolean = false,
        onCreated?: (id: string) => void
    ): void {
        this.isDrawing = true;
        this.startPoint = { ...worldPoint };
        this.activeLineId = generateId(isArrow ? 'arrow' : 'line');

        const newLine: LineNode = {
            id: this.activeLineId,
            type: 'line',
            x: worldPoint.x,
            y: worldPoint.y,
            width: 0,
            height: 0,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: 2,
            startMarker: 'none',
            endMarker: isArrow ? 'arrow' : 'none',
        };

        sceneGraph.addNode(newLine);
        onCreated?.(this.activeLineId);
    }

    /**
     * Pointer Move: Calculate endpoint with optional 45-degree angle snap,
     * compute normalized bounding box and relative endpoints.
     */
    public onPointerMove(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        shiftKey: boolean = false
    ): void {
        if (!this.isDrawing || !this.activeLineId) return;

        let endX = worldPoint.x;
        let endY = worldPoint.y;

        if (shiftKey) {
            const dx = worldPoint.x - this.startPoint.x;
            const dy = worldPoint.y - this.startPoint.y;
            const len = Math.hypot(dx, dy);
            let angle = Math.atan2(dy, dx);
            const snap = Math.PI / 4; // 45° snap increments
            angle = Math.round(angle / snap) * snap;
            endX = this.startPoint.x + Math.cos(angle) * len;
            endY = this.startPoint.y + Math.sin(angle) * len;
        }

        const minX = Math.min(this.startPoint.x, endX);
        const minY = Math.min(this.startPoint.y, endY);
        const width = Math.max(1, Math.abs(endX - this.startPoint.x));
        const height = Math.max(1, Math.abs(endY - this.startPoint.y));

        const x1 = this.startPoint.x - minX;
        const y1 = this.startPoint.y - minY;
        const x2 = endX - minX;
        const y2 = endY - minY;

        sceneGraph.updateNode(this.activeLineId, {
            x: minX,
            y: minY,
            width,
            height,
            x1,
            y1,
            x2,
            y2,
        });
    }

    /**
     * Pointer Up: Discard accidental sub-3px clicks and finalize.
     */
    public onPointerUp(
        sceneGraph: SceneGraph,
        onComplete?: (id: string | null) => void
    ): void {
        if (!this.isDrawing || !this.activeLineId) return;

        const node = sceneGraph.getNode(this.activeLineId) as LineNode | undefined;
        let finalId: string | null = this.activeLineId;

        if (node) {
            const length = Math.hypot(node.x2 - node.x1, node.y2 - node.y1);
            if (length < 3) {
                sceneGraph.deleteNode(this.activeLineId);
                finalId = null;
            }
        }

        this.isDrawing = false;
        this.activeLineId = null;
        onComplete?.(finalId);
    }
}

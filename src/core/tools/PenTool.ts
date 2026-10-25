import type { Point } from '../../types/camera';
import type { PathNode, VectorAnchor } from '../../types/scene';
import { generateId } from '../../utils/id';

export interface PenDrawingState {
    isDrawing: boolean;
    anchors: VectorAnchor[];
    currentPointerWorld: Point | null;
    isDraggingHandle: boolean;
    hoveringFirstAnchor: boolean;
}

export class PenTool {
    private isDrawing: boolean = false;
    private anchors: VectorAnchor[] = [];
    private currentPointerWorld: Point | null = null;
    private isDraggingHandle: boolean = false;
    private hoveringFirstAnchor: boolean = false;
    private activeAnchorIndex: number = -1;

    public getDrawingState(): PenDrawingState {
        return {
            isDrawing: this.isDrawing,
            anchors: this.anchors,
            currentPointerWorld: this.currentPointerWorld,
            isDraggingHandle: this.isDraggingHandle,
            hoveringFirstAnchor: this.hoveringFirstAnchor,
        };
    }

    public getIsDrawing(): boolean {
        return this.isDrawing;
    }

    /**
     * Pointer Down:
     * - If first anchor: start drawing.
     * - If hovering first anchor and anchors >= 2: close and finalize path.
     * - Otherwise: append anchor and start handle drag.
     */
    public onPointerDown(
        worldPoint: Point,
        zoom: number
    ): { status: 'continue' | 'completed'; node?: PathNode } {
        // 1. If not currently drawing, initialize path with first anchor
        if (!this.isDrawing || this.anchors.length === 0) {
            this.isDrawing = true;
            this.anchors = [{ x: worldPoint.x, y: worldPoint.y }];
            this.activeAnchorIndex = 0;
            this.isDraggingHandle = true;
            this.currentPointerWorld = { ...worldPoint };
            return { status: 'continue' };
        }

        // 2. If clicking on the first anchor (closing loop)
        if (this.anchors.length >= 2) {
            const first = this.anchors[0];
            const dist = Math.hypot(worldPoint.x - first.x, worldPoint.y - first.y);
            if (dist <= 16 / zoom || this.hoveringFirstAnchor) {
                const node = this.finishPath(true);
                return { status: 'completed', node: node || undefined };
            }
        }

        // 3. Append new anchor point
        this.anchors.push({ x: worldPoint.x, y: worldPoint.y });
        this.activeAnchorIndex = this.anchors.length - 1;
        this.isDraggingHandle = true;
        this.currentPointerWorld = { ...worldPoint };

        return { status: 'continue' };
    }

    /**
     * Pointer Move:
     * - If dragging handle, update handleOut and symmetrical handleIn.
     * - Update hover state on first anchor for path closure indicator.
     */
    public onPointerMove(worldPoint: Point, zoom: number): void {
        this.currentPointerWorld = { ...worldPoint };

        if (!this.isDrawing) return;

        if (
            this.isDraggingHandle &&
            this.activeAnchorIndex >= 0 &&
            this.activeAnchorIndex < this.anchors.length
        ) {
            const anchor = this.anchors[this.activeAnchorIndex];
            const dx = worldPoint.x - anchor.x;
            const dy = worldPoint.y - anchor.y;

            if (Math.hypot(dx, dy) >= 2 / zoom) {
                anchor.handleOut = { x: worldPoint.x, y: worldPoint.y };
                anchor.handleIn = { x: anchor.x - dx, y: anchor.y - dy };
            }
        }

        if (this.anchors.length >= 2) {
            const first = this.anchors[0];
            const dist = Math.hypot(worldPoint.x - first.x, worldPoint.y - first.y);
            this.hoveringFirstAnchor = dist <= 16 / zoom;
        } else {
            this.hoveringFirstAnchor = false;
        }
    }

    /**
     * Pointer Up:
     * - Finish handle dragging. If drag was minimal, keep sharp corner.
     */
    public onPointerUp(zoom: number): void {
        if (
            this.isDraggingHandle &&
            this.activeAnchorIndex >= 0 &&
            this.activeAnchorIndex < this.anchors.length
        ) {
            const anchor = this.anchors[this.activeAnchorIndex];
            if (anchor.handleOut) {
                const dist = Math.hypot(
                    anchor.handleOut.x - anchor.x,
                    anchor.handleOut.y - anchor.y
                );
                if (dist < 3 / zoom) {
                    delete anchor.handleIn;
                    delete anchor.handleOut;
                }
            }
        }
        this.isDraggingHandle = false;
    }

    /**
     * Finish path creation and convert anchors to local coordinates.
     */
    public finishPath(closed: boolean = false): PathNode | null {
        if (this.anchors.length < 2) {
            this.cancel();
            return null;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const a of this.anchors) {
            minX = Math.min(minX, a.x);
            minY = Math.min(minY, a.y);
            maxX = Math.max(maxX, a.x);
            maxY = Math.max(maxY, a.y);

            if (a.handleIn) {
                minX = Math.min(minX, a.handleIn.x);
                minY = Math.min(minY, a.handleIn.y);
                maxX = Math.max(maxX, a.handleIn.x);
                maxY = Math.max(maxY, a.handleIn.y);
            }
            if (a.handleOut) {
                minX = Math.min(minX, a.handleOut.x);
                minY = Math.min(minY, a.handleOut.y);
                maxX = Math.max(maxX, a.handleOut.x);
                maxY = Math.max(maxY, a.handleOut.y);
            }
        }

        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);

        const localAnchors: VectorAnchor[] = this.anchors.map((a) => ({
            x: a.x - minX,
            y: a.y - minY,
            handleIn: a.handleIn
                ? { x: a.handleIn.x - minX, y: a.handleIn.y - minY }
                : undefined,
            handleOut: a.handleOut
                ? { x: a.handleOut.x - minX, y: a.handleOut.y - minY }
                : undefined,
        }));

        const node: PathNode = {
            id: generateId('path'),
            type: 'path',
            x: minX,
            y: minY,
            width,
            height,
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: 2,
            anchors: localAnchors,
            closed,
        };

        this.cancel();
        return node;
    }

    public cancel(): void {
        this.isDrawing = false;
        this.anchors = [];
        this.currentPointerWorld = null;
        this.isDraggingHandle = false;
        this.hoveringFirstAnchor = false;
        this.activeAnchorIndex = -1;
    }
}

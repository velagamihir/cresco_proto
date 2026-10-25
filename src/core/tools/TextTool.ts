import type { Point } from '../../types/camera';
import type { TextNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';
import { generateId } from '../../utils/id';

export class TextTool {
    private isDrawing: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private activeTextId: string | null = null;

    /**
     * Pointer Down: Prepare new text shape and add to SceneGraph.
     */
    public onPointerDown(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        onCreated?: (id: string) => void
    ): void {
        this.isDrawing = true;
        this.startPoint = { ...worldPoint };
        this.activeTextId = generateId('text');

        const defaultFontSize = 16;
        const defaultLineHeight = Math.round(defaultFontSize * 1.25);

        const newText: TextNode = {
            id: this.activeTextId,
            type: 'text',
            x: worldPoint.x,
            y: worldPoint.y,
            width: 120,
            height: defaultLineHeight,
            text: '',
            fontSize: defaultFontSize,
            fontFamily: 'Inter',
            fontWeight: 400,
            textAlign: 'left',
            lineHeight: 1.25,
            autoWidth: true,
            fill: '#ffffff',
        };

        sceneGraph.addNode(newText);
        onCreated?.(this.activeTextId);
    }

    /**
     * Pointer Move: If user drags with Text tool, switch to fixed-width mode with dragged bounds.
     */
    public onPointerMove(worldPoint: Point, sceneGraph: SceneGraph): void {
        if (!this.isDrawing || !this.activeTextId) return;

        const dx = Math.abs(worldPoint.x - this.startPoint.x);
        const dy = Math.abs(worldPoint.y - this.startPoint.y);

        if (dx > 4 || dy > 4) {
            const x = Math.min(this.startPoint.x, worldPoint.x);
            const y = Math.min(this.startPoint.y, worldPoint.y);
            const width = Math.max(40, dx);
            const height = Math.max(20, dy);

            sceneGraph.updateNode(this.activeTextId, {
                x,
                y,
                width,
                height,
                autoWidth: false,
            });
        }
    }

    /**
     * Pointer Up: Complete creation and hand off node id for inline editing.
     */
    public onPointerUp(
        _sceneGraph: SceneGraph,
        onComplete?: (id: string | null) => void
    ): void {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        const id = this.activeTextId;
        this.activeTextId = null;
        onComplete?.(id);
    }
}

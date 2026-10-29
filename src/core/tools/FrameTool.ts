import type { Point } from '../../types/camera';
import type { FrameNode } from '../../types/scene';
import type { DevicePreset } from '../../types/presets';
import { SceneGraph } from '../scene/SceneGraph';
import { generateId } from '../../utils/id';

export class FrameTool {
    private isDrawing: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private activeFrameId: string | null = null;

    /**
     * Pointer Down: Initialize frame node in SceneGraph
     */
    public onPointerDown(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        onCreated?: (id: string) => void
    ): void {
        this.isDrawing = true;
        this.startPoint = { ...worldPoint };
        this.activeFrameId = generateId('frame');

        const newFrame: FrameNode = {
            id: this.activeFrameId,
            type: 'frame',
            name: 'Frame',
            x: worldPoint.x,
            y: worldPoint.y,
            width: 0,
            height: 0,
            fill: '#ffffff',
            clipContent: true,
            cornerRadius: 0,
        };

        sceneGraph.addNode(newFrame);
        onCreated?.(this.activeFrameId);
    }

    /**
     * Pointer Move: Calculate frame bounds with optional square aspect ratio constraint
     */
    public onPointerMove(
        worldPoint: Point,
        sceneGraph: SceneGraph,
        shiftKey: boolean = false
    ): void {
        if (!this.isDrawing || !this.activeFrameId) return;

        let width = worldPoint.x - this.startPoint.x;
        let height = worldPoint.y - this.startPoint.y;

        if (shiftKey) {
            const size = Math.max(Math.abs(width), Math.abs(height));
            width = width >= 0 ? size : -size;
            height = height >= 0 ? size : -size;
        }

        const x = width >= 0 ? this.startPoint.x : this.startPoint.x + width;
        const y = height >= 0 ? this.startPoint.y : this.startPoint.y + height;

        sceneGraph.updateNode(this.activeFrameId, {
            x,
            y,
            width: Math.abs(width),
            height: Math.abs(height),
        });
    }

    /**
     * Pointer Up: Finalize frame. If dragged < 5px (single click), assign default Desktop dimensions.
     */
    public onPointerUp(
        sceneGraph: SceneGraph,
        onComplete?: (id: string | null) => void
    ): void {
        if (!this.isDrawing || !this.activeFrameId) return;

        const node = sceneGraph.getNode(this.activeFrameId) as FrameNode | undefined;
        const finalId: string | null = this.activeFrameId;

        if (node) {
            if (node.width < 5 && node.height < 5) {
                // Default to standard Desktop 1440 × 1024 on simple click
                sceneGraph.updateNode(this.activeFrameId, {
                    width: 1440,
                    height: 1024,
                    name: 'Desktop',
                });
            }
        }

        this.isDrawing = false;
        this.activeFrameId = null;
        onComplete?.(finalId);
    }

    /**
     * Create a Frame directly from a DevicePreset at given world coordinates
     */
    public static createFromPreset(
        preset: DevicePreset,
        position: Point,
        sceneGraph: SceneGraph
    ): FrameNode {
        const id = generateId('frame');
        const frame: FrameNode = {
            id,
            type: 'frame',
            name: preset.name,
            x: position.x - preset.width / 2,
            y: position.y - preset.height / 2,
            width: preset.width,
            height: preset.height,
            fill: '#ffffff',
            clipContent: true,
            cornerRadius: 0,
        };

        sceneGraph.addNode(frame);
        return frame;
    }
}

import type { CameraState, Point, ScreenBounds } from '../../types/camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { clamp, screenToWorld, worldToScreen, zoomAtFocalPoint } from '../../utils/math';

export class Camera {
    private x: number = 0;
    private y: number = 0;
    private zoom: number = 1;

    constructor(initialX = 0, initialY = 0, initialZoom = 1) {
        this.x = initialX;
        this.y = initialY;
        this.zoom = clamp(initialZoom, CANVAS_CONFIG.MIN_ZOOM, CANVAS_CONFIG.MAX_ZOOM);
    }

    public getState(): CameraState {
        return { x: this.x, y: this.y, zoom: this.zoom };
    }

    /**
     * Directly shift the camera by screen pixel offsets (panning).
     */
    public pan(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Smooth wheel zoom centered around mouse position.
     * Handles trackpad pinch-to-zoom (ctrlKey) and regular wheel scrolling.
     */
    public handleWheel(e: WheelEvent, focalPoint: Point): void {
        // If pinch zooming on trackpad or holding Ctrl/Meta, scale zoom
        if (e.ctrlKey || e.metaKey) {
            // Exponential zoom prevents negative factors and large abrupt jumps
            const zoomDelta = Math.exp(-e.deltaY * 0.005);
            const targetZoom = clamp(
                this.zoom * zoomDelta,
                CANVAS_CONFIG.MIN_ZOOM,
                CANVAS_CONFIG.MAX_ZOOM
            );

            const next = zoomAtFocalPoint(this.getState(), focalPoint, targetZoom);
            this.x = next.x;
            this.y = next.y;
            this.zoom = next.zoom;
        } else if (e.shiftKey) {
            // Shift + Scroll: map vertical wheel motion to horizontal pan
            const dx = e.deltaX !== 0 ? e.deltaX : e.deltaY;
            this.pan(-dx, 0);
        } else {
            // Normal two-finger scroll or wheel pans the canvas
            this.pan(-e.deltaX, -e.deltaY);
        }
    }

    /**
     * Zoom by fixed steps (for UI zoom buttons: + / -).
     */
    public zoomBy(factor: number, focalPoint: Point): void {
        const targetZoom = clamp(
            this.zoom * factor,
            CANVAS_CONFIG.MIN_ZOOM,
            CANVAS_CONFIG.MAX_ZOOM
        );

        const next = zoomAtFocalPoint(this.getState(), focalPoint, targetZoom);
        this.x = next.x;
        this.y = next.y;
        this.zoom = next.zoom;
    }

    public toWorld(screenPoint: Point): Point {
        return screenToWorld(screenPoint, this.getState());
    }

    public toScreen(worldPoint: Point): Point {
        return worldToScreen(worldPoint, this.getState());
    }

    /**
     * Applies camera translation and scale to the 2D canvas context.
     */
    public applyTransform(ctx: CanvasRenderingContext2D): void {
        ctx.translate(this.x, this.y);
        ctx.scale(this.zoom, this.zoom);
    }

    /**
     * Draws a Figma-style infinite dot grid scaled to the current viewport with adaptive LOD.
     */
    public renderGrid(ctx: CanvasRenderingContext2D, bounds: ScreenBounds): void {
        const topLeftWorld = this.toWorld({ x: 0, y: 0 });
        const bottomRightWorld = this.toWorld({ x: bounds.width, y: bounds.height });

        // Adaptive level of detail (LOD):
        // Ensure dots are never spaced closer than 20 screen pixels
        const minScreenStep = 20;
        let step = CANVAS_CONFIG.GRID_SIZE;
        while (step * this.zoom < minScreenStep) {
            step *= 2;
        }

        // Calculate snapped grid boundaries
        const startX = Math.floor(topLeftWorld.x / step) * step;
        const endX = Math.ceil(bottomRightWorld.x / step) * step;
        const startY = Math.floor(topLeftWorld.y / step) * step;
        const endY = Math.ceil(bottomRightWorld.y / step) * step;

        ctx.save();
        this.applyTransform(ctx);

        // Render dots as a single batched path
        ctx.fillStyle = CANVAS_CONFIG.GRID_DOT_COLOR;
        const dotRadius = Math.max(1 / this.zoom, 0.75); // Keep dot visible at high/low zoom

        ctx.beginPath();
        for (let x = startX; x <= endX; x += step) {
            for (let y = startY; y <= endY; y += step) {
                ctx.moveTo(x + dotRadius, y);
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            }
        }
        ctx.fill();

        ctx.restore();
    }
}
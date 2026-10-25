import type { Point, CameraState } from '../types/camera';

/**
 * Clamps a number between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Converts screen pixel coordinates (e.g. mouse clientX/Y) to world space.
 * World = (Screen - CameraOffset) / Zoom
 */
export function screenToWorld(point: Point, camera: CameraState): Point {
    return {
        x: (point.x - camera.x) / camera.zoom,
        y: (point.y - camera.y) / camera.zoom,
    };
}

/**
 * Converts world space coordinates to screen pixel coordinates.
 * Screen = (World * Zoom) + CameraOffset
 */
export function worldToScreen(point: Point, camera: CameraState): Point {
    return {
        x: point.x * camera.zoom + camera.x,
        y: point.y * camera.zoom + camera.y,
    };
}

/**
 * Computes camera offset such that the world point directly under
 * the mouse cursor remains stationary during zooming.
 */
export function zoomAtFocalPoint(
    camera: CameraState,
    focalScreenPoint: Point,
    nextZoom: number
): CameraState {
    const worldPoint = screenToWorld(focalScreenPoint, camera);

    return {
        zoom: nextZoom,
        x: focalScreenPoint.x - worldPoint.x * nextZoom,
        y: focalScreenPoint.y - worldPoint.y * nextZoom,
    };
}

/**
 * Checks if a point in 2D space falls inside a bounding box.
 */
export function isPointInsideBounds(
    point: Point,
    bounds: { x: number; y: number; width: number; height: number }
): boolean {
    return (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height
    );
}
export type ResizeHandleType = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

export interface HandleDescriptor {
    type: ResizeHandleType;
    x: number;
    y: number;
}

/**
 * Returns the 8 resize handle positions (4 corners + 4 edge midpoints) for a given bounding box.
 */
export function getResizeHandles(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
}): HandleDescriptor[] {
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    return [
        // Corners first (higher priority for hit testing)
        { type: 'tl', x: bounds.x, y: bounds.y },
        { type: 'tr', x: bounds.x + bounds.width, y: bounds.y },
        { type: 'bl', x: bounds.x, y: bounds.y + bounds.height },
        { type: 'br', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        // Edge midpoints
        { type: 't', x: midX, y: bounds.y },
        { type: 'b', x: midX, y: bounds.y + bounds.height },
        { type: 'l', x: bounds.x, y: midY },
        { type: 'r', x: bounds.x + bounds.width, y: midY },
    ];
}

/**
 * Backward compatibility alias for getResizeHandles.
 */
export const getCornerHandles = getResizeHandles;

/**
 * Tests if a point hits a specific handle area (centered around handle.x, handle.y).
 */
export function isPointInsideHandle(
    point: Point,
    handle: HandleDescriptor,
    handleSize: number
): boolean {
    const half = handleSize / 2;
    return (
        point.x >= handle.x - half &&
        point.x <= handle.x + half &&
        point.y >= handle.y - half &&
        point.y <= handle.y + half
    );
}
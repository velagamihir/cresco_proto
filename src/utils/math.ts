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

/**
 * Checks if a point in 2D space falls inside an ellipse.
 * Uses normalized algebraic ellipse formula: ((x - cx) / rx)^2 + ((y - cy) / ry)^2 <= 1
 */
export function isPointInsideEllipse(
    point: Point,
    ellipse: { x: number; y: number; width: number; height: number }
): boolean {
    const rx = ellipse.width / 2;
    const ry = ellipse.height / 2;
    if (rx <= 0 || ry <= 0) return false;

    const cx = ellipse.x + rx;
    const cy = ellipse.y + ry;

    const dx = point.x - cx;
    const dy = point.y - cy;

    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

/**
 * Checks if a point in 2D space falls inside a SceneNode based on its specific geometry.
 */
export function isPointInsideNode(
    point: Point,
    node: { type: string; x: number; y: number; width: number; height: number }
): boolean {
    if (node.type === 'ellipse') {
        return isPointInsideEllipse(point, node);
    }
    return isPointInsideBounds(point, node);
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

/**
 * Hit-tests a world point against a bounding box to determine if it is touching
 * a corner handle or any of the 4 full border edges (Figma-style edge resizing).
 */
export function hitTestResizeHandles(
    point: Point,
    bounds: { x: number; y: number; width: number; height: number },
    zoom: number
): ResizeHandleType | null {
    const cornerHitSize = 12 / zoom;
    const halfCorner = cornerHitSize / 2;
    const edgeTolerance = 7 / zoom;

    const minX = Math.min(bounds.x, bounds.x + bounds.width);
    const maxX = Math.max(bounds.x, bounds.x + bounds.width);
    const minY = Math.min(bounds.y, bounds.y + bounds.height);
    const maxY = Math.max(bounds.y, bounds.y + bounds.height);

    // 1. Check 4 Corners first (they take priority)
    if (Math.abs(point.x - minX) <= halfCorner && Math.abs(point.y - minY) <= halfCorner) {
        return 'tl';
    }
    if (Math.abs(point.x - maxX) <= halfCorner && Math.abs(point.y - minY) <= halfCorner) {
        return 'tr';
    }
    if (Math.abs(point.x - minX) <= halfCorner && Math.abs(point.y - maxY) <= halfCorner) {
        return 'bl';
    }
    if (Math.abs(point.x - maxX) <= halfCorner && Math.abs(point.y - maxY) <= halfCorner) {
        return 'br';
    }

    // 2. Check 4 Full Edges (along the entire border line)
    const inVerticalSpan = point.y >= minY - halfCorner && point.y <= maxY + halfCorner;
    const inHorizontalSpan = point.x >= minX - halfCorner && point.x <= maxX + halfCorner;

    // Left edge
    if (Math.abs(point.x - minX) <= edgeTolerance && inVerticalSpan) {
        return 'l';
    }
    // Right edge
    if (Math.abs(point.x - maxX) <= edgeTolerance && inVerticalSpan) {
        return 'r';
    }
    // Top edge
    if (Math.abs(point.y - minY) <= edgeTolerance && inHorizontalSpan) {
        return 't';
    }
    // Bottom edge
    if (Math.abs(point.y - maxY) <= edgeTolerance && inHorizontalSpan) {
        return 'b';
    }

    return null;
}
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
 * Computes shortest distance from point P to line segment AB.
 */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
    const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = clamp(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2, 0, 1);
    const projX = a.x + t * (b.x - a.x);
    const projY = a.y + t * (b.y - a.y);
    return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Checks if a point in 2D space falls inside a SceneNode based on its specific geometry.
 */
export function isPointInsideNode(
    point: Point,
    node: {
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
        strokeWidth?: number;
    }
): boolean {
    if (node.type === 'ellipse') {
        return isPointInsideEllipse(point, node);
    }
    if (
        node.type === 'line' &&
        node.x1 !== undefined &&
        node.y1 !== undefined &&
        node.x2 !== undefined &&
        node.y2 !== undefined
    ) {
        const a = { x: node.x + node.x1, y: node.y + node.y1 };
        const b = { x: node.x + node.x2, y: node.y + node.y2 };
        const tolerance = Math.max(7, (node.strokeWidth || 2) + 4);
        return distanceToSegment(point, a, b) <= tolerance;
    }
    if (node.type === 'frame') {
        const inBody = isPointInsideBounds(point, node);
        if (inBody) return true;
        return (
            point.x >= node.x &&
            point.x <= node.x + 140 &&
            point.y >= node.y - 18 &&
            point.y <= node.y
        );
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

/**
 * Checks whether two axis-aligned bounding boxes intersect.
 */
export function doBoxesIntersect(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
): boolean {
    const aMinX = Math.min(a.x, a.x + a.width);
    const aMaxX = Math.max(a.x, a.x + a.width);
    const aMinY = Math.min(a.y, a.y + a.height);
    const aMaxY = Math.max(a.y, a.y + a.height);

    const bMinX = Math.min(b.x, b.x + b.width);
    const bMaxX = Math.max(b.x, b.x + b.width);
    const bMinY = Math.min(b.y, b.y + b.height);
    const bMaxY = Math.max(b.y, b.y + b.height);

    return aMinX <= bMaxX && aMaxX >= bMinX && aMinY <= bMaxY && aMaxY >= bMinY;
}

/**
 * Computes the unified bounding box that encloses a collection of bounds.
 */
export function getBoundingBox(
    boundsList: { x: number; y: number; width: number; height: number }[]
): { x: number; y: number; width: number; height: number } | null {
    if (boundsList.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const b of boundsList) {
        const x1 = Math.min(b.x, b.x + b.width);
        const x2 = Math.max(b.x, b.x + b.width);
        const y1 = Math.min(b.y, b.y + b.height);
        const y2 = Math.max(b.y, b.y + b.height);

        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
    }

    return {
        x: minX,
        y: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY),
    };
}
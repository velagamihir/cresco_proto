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
export const CANVAS_CONFIG = {
    MIN_ZOOM: 0.05,        // 5%
    MAX_ZOOM: 32.0,        // 3200%
    ZOOM_FACTOR: 1.05,     // Scaling rate for step-based zoom
    GRID_SIZE: 20,         // Base unit in world space
    BACKGROUND_COLOR: '#1e1e1e',
    GRID_LINE_COLOR: '#2d2d2d',
    GRID_DOT_COLOR: '#3a3a3a',
} as const;
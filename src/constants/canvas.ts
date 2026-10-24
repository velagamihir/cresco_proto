import { THEME } from './themes/themes';

export const CANVAS_CONFIG = {
    MIN_ZOOM: 0.01,        // 1%
    MAX_ZOOM: 32.0,        // 3200%
    ZOOM_FACTOR: 1.05,     // Scaling rate for step-based zoom
    GRID_SIZE: 20,         // Base unit in world space
    BACKGROUND_COLOR: THEME.canvas.background,
    GRID_LINE_COLOR: THEME.canvas.gridLine,
    GRID_DOT_COLOR: THEME.canvas.gridDot,
} as const;
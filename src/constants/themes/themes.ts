export type ThemeMode = 'dark' | 'light';

export interface CanvasColors {
    background: string;
    gridLine: string;
    gridDot: string;
}

export interface UIColors {
    overlayBackground: string;
    overlayText: string;
}

export interface Theme {
    canvas: CanvasColors;
    ui: UIColors;
}

export const DARK_THEME = {
    canvas: {
        background: '#1e1e1e',
        gridLine: '#2d2d2d',
        gridDot: '#3a3a3a',
    },
    ui: {
        overlayBackground: '#2b2b2b',
        overlayText: '#ffffff',
    },
} as const satisfies Theme;

export const LIGHT_THEME = {
    canvas: {
        background: '#ffffff',
        gridLine: '#e0e0e0',
        gridDot: '#cccccc',
    },
    ui: {
        overlayBackground: '#f0f0f0',
        overlayText: '#1e1e1e',
    },
} as const satisfies Theme;

export const THEMES: Record<ThemeMode, Theme> = {
    dark: DARK_THEME,
    light: LIGHT_THEME,
};

export const DEFAULT_THEME: Theme = DARK_THEME;
export const THEME: Theme = DEFAULT_THEME;

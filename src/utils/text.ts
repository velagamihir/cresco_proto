let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
    if (!offscreenCtx) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCtx = offscreenCanvas.getContext('2d');
    }
    return offscreenCtx;
}

export function getFontString(
    fontSize: number,
    fontFamily: string = 'Inter, sans-serif',
    fontWeight: number | string = 400
): string {
    const family = fontFamily.includes(' ') && !fontFamily.includes(',') ? `"${fontFamily}"` : fontFamily;
    return `${fontWeight} ${fontSize}px ${family}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
}

export interface TextMetricsResult {
    width: number;
    height: number;
    lines: string[];
    lineHeight: number;
}

/**
 * Measures text and wraps lines if fixedWidth is provided (auto-width vs fixed-width).
 */
export function measureTextLines(
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: number | string,
    lineHeightRatio: number = 1.25,
    fixedWidth?: number
): TextMetricsResult {
    const ctx = getContext();
    const lineHeight = Math.round(fontSize * lineHeightRatio);
    const fontStr = getFontString(fontSize, fontFamily, fontWeight);

    if (ctx) {
        ctx.font = fontStr;
    }

    const rawLines = text.split('\n');
    const finalLines: string[] = [];
    let maxWidth = 0;

    if (fixedWidth && fixedWidth > 0 && ctx) {
        for (const rawLine of rawLines) {
            if (rawLine === '') {
                finalLines.push('');
                continue;
            }

            const words = rawLine.split(' ');
            let currentLine = '';

            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > fixedWidth && currentLine !== '') {
                    finalLines.push(currentLine);
                    const lineWidth = ctx.measureText(currentLine).width;
                    if (lineWidth > maxWidth) maxWidth = lineWidth;
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                finalLines.push(currentLine);
                const lineWidth = ctx.measureText(currentLine).width;
                if (lineWidth > maxWidth) maxWidth = lineWidth;
            }
        }
        maxWidth = Math.max(maxWidth, fixedWidth);
    } else {
        for (const line of rawLines) {
            finalLines.push(line);
            if (ctx) {
                const width = ctx.measureText(line).width;
                if (width > maxWidth) maxWidth = width;
            } else {
                maxWidth = Math.max(maxWidth, line.length * fontSize * 0.6);
            }
        }
    }

    const calculatedHeight = Math.max(lineHeight, finalLines.length * lineHeight);
    const calculatedWidth = Math.max(20, Math.ceil(maxWidth));

    return {
        width: calculatedWidth,
        height: calculatedHeight,
        lines: finalLines.length > 0 ? finalLines : [''],
        lineHeight,
    };
}

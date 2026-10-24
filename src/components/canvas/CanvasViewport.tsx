import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../../core/camera/Camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { THEME } from '../../constants/themes/themes';
import { SceneGraph } from '../../core/scene/SceneGraph';
import { Renderer } from '../../core/engine/Renderer';

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<Camera>(new Camera(window.innerWidth / 2, window.innerHeight / 2, 1));
    const sceneGraphRef = useRef<SceneGraph>(new SceneGraph());
    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const isSpacePressedRef = useRef(false);

    // Expose current zoom to UI
    const [zoomPercent, setZoomPercent] = useState(100);

    // Initialize with a test rectangle centered near origin
    useEffect(() => {
        sceneGraphRef.current.addNode({
            id: 'rect-1',
            type: 'rectangle',
            x: -100,
            y: -75,
            width: 200,
            height: 150,
            fill: '#0d99ff',
            cornerRadius: 8,
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let isDirty = true;

        const requestRender = () => {
            isDirty = true;
        };

        // HiDPI resolution handling
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            requestRender();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Render loop with dirty-flag checking
        const render = () => {
            if (isDirty) {
                isDirty = false;
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                const dpr = window.devicePixelRatio || 1;
                ctx.scale(dpr, dpr);

                // Clear background
                ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
                ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

                // 1. Draw infinite grid (camera.renderGrid handles applyTransform internally)
                cameraRef.current.renderGrid(ctx, {
                    width: window.innerWidth,
                    height: window.innerHeight,
                });

                // 2. Render shapes in world space
                ctx.save();
                cameraRef.current.applyTransform(ctx);
                Renderer.renderScene(ctx, sceneGraphRef.current.getAllNodes());
                ctx.restore();

                ctx.restore();
            }
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // Event Listeners
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const focalPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            cameraRef.current.handleWheel(e, focalPoint);
            requestRender();

            const nextPercent = Math.round(cameraRef.current.getState().zoom * 100);
            setZoomPercent((prev) => (prev !== nextPercent ? nextPercent : prev));
        };

        const onMouseDown = (e: MouseEvent) => {
            // Middle click (button 1) or Left click (button 0) with Spacebar
            if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) {
                isPanningRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;

            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };

            cameraRef.current.pan(dx, dy);
            requestRender();
        };

        const onMouseUp = () => {
            isPanningRef.current = false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                isSpacePressedRef.current = true;
                canvas.style.cursor = 'grab';
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressedRef.current = false;
                canvas.style.cursor = 'default';
            }
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            {/* Zoom indicator overlay */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    background: THEME.ui.overlayBackground,
                    color: THEME.ui.overlayText,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    userSelect: 'none',
                }}
            >
                {zoomPercent}%
            </div>
        </div>
    );
};
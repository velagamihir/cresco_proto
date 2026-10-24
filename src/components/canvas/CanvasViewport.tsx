import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../../core/camera/Camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { SceneGraph } from '../../core/scene/SceneGraph';
import { Renderer } from '../../core/engine/Renderer';
import { SelectTool } from '../../core/tools/SelectTool';
import { RectTool } from '../../core/tools/RectTool';
import type { ToolType } from '../toolbar/Toolbar';
import { Toolbar } from '../toolbar/Toolbar';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import type { RectangleNode } from '../../types/scene';

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<Camera>(new Camera(window.innerWidth / 2, window.innerHeight / 2, 1));
    const sceneGraphRef = useRef<SceneGraph>(new SceneGraph());
    const selectToolRef = useRef<SelectTool>(new SelectTool());
    const rectToolRef = useRef<RectTool>(new RectTool());

    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const activeToolRef = useRef<ToolType>('select');

    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const isSpacePressedRef = useRef(false);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const selectedIdsRef = useRef<Set<string>>(selectedIds);

    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    const [zoomPercent, setZoomPercent] = useState(100);

    // 1. Resolve currently selected shape object for the properties panel via state
    const [selectedNode, setSelectedNode] = useState<RectangleNode | null>(null);

    useEffect(() => {
        if (selectedIds.size === 1) {
            const id = Array.from(selectedIds)[0];
            setSelectedNode((sceneGraphRef.current.getNode(id) as RectangleNode) || null);
        } else {
            setSelectedNode(null);
        }
    }, [selectedIds]);

    // 2. Handlers for updating and deleting properties
    const handleUpdateSelected = (updates: Partial<RectangleNode>) => {
        if (!selectedNode) return;
        sceneGraphRef.current.updateNode(selectedNode.id, updates);
        setSelectedNode((prev) => (prev ? { ...prev, ...updates } : null));
        // Trigger React re-render of properties panel & canvas
        setSelectedIds(new Set(selectedIds));
    };

    const handleDeleteSelected = () => {
        for (const id of selectedIds) {
            sceneGraphRef.current.deleteNode(id);
        }
        selectedIdsRef.current = new Set();
        setSelectedIds(new Set());
    };

    // Setup sample shape
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

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Continuous render loop
        const render = () => {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const dpr = window.devicePixelRatio || 1;
            ctx.scale(dpr, dpr);

            // Background
            ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Grid
            cameraRef.current.renderGrid(ctx, {
                width: window.innerWidth,
                height: window.innerHeight,
            });

            // World objects & selection
            ctx.save();
            cameraRef.current.applyTransform(ctx);
            Renderer.renderScene(
                ctx,
                sceneGraphRef.current.getAllNodes(),
                selectedIdsRef.current,
                cameraRef.current.getState().zoom
            );
            ctx.restore();

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // Event Handlers
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const focalPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            cameraRef.current.handleWheel(e, focalPoint);
            setZoomPercent(Math.round(cameraRef.current.getState().zoom * 100));
        };

        const onMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPoint = cameraRef.current.toWorld(screenPoint);

            // Middle click or Space+Left click -> Pan
            if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) {
                isPanningRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                return;
            }

            if (e.button === 0) {
                if (activeToolRef.current === 'select') {
                    selectToolRef.current.onPointerDown(
                        worldPoint,
                        sceneGraphRef.current,
                        selectedIdsRef.current,
                        (newSelected) => setSelectedIds(newSelected)
                    );
                } else if (activeToolRef.current === 'rectangle') {
                    rectToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
                        setSelectedIds(new Set([id]));
                    });
                }
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPoint = cameraRef.current.toWorld(screenPoint);

            if (isPanningRef.current) {
                const dx = e.clientX - lastMousePosRef.current.x;
                const dy = e.clientY - lastMousePosRef.current.y;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                cameraRef.current.pan(dx, dy);
                return;
            }

            if (activeToolRef.current === 'select') {
                selectToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
            } else if (activeToolRef.current === 'rectangle') {
                rectToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
            }
        };

        const onMouseUp = () => {
            isPanningRef.current = false;

            if (activeToolRef.current === 'select') {
                selectToolRef.current.onPointerUp();
            } else if (activeToolRef.current === 'rectangle') {
                rectToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    // Figma UX: Automatically switch back to Select tool after drawing
                    setActiveTool('select');
                });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            // Don't intercept if user is typing in an input field
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            if (e.code === 'Space' && !e.repeat) {
                isSpacePressedRef.current = true;
                canvas.style.cursor = 'grab';
            }
            if (e.key === 'v' || e.key === 'V') {
                setActiveTool('select');
            }
            if (e.key === 'r' || e.key === 'R') {
                setActiveTool('rectangle');
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                for (const id of selectedIdsRef.current) {
                    sceneGraphRef.current.deleteNode(id);
                }
                selectedIdsRef.current = new Set();
                setSelectedIds(new Set());
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressedRef.current = false;
                canvas.style.cursor = activeToolRef.current === 'rectangle' ? 'crosshair' : 'default';
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

    // Update cursor dynamically based on active tool
    useEffect(() => {
        if (canvasRef.current && !isSpacePressedRef.current) {
            canvasRef.current.style.cursor = activeTool === 'rectangle' ? 'crosshair' : 'default';
        }
    }, [activeTool]);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />
            <PropertiesPanel
                selectedNode={selectedNode}
                onUpdate={handleUpdateSelected}
                onDelete={handleDeleteSelected}
            />
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 256, // Shift left so it clears the right sidebar
                    background: '#2b2b2b',
                    color: '#fff',
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
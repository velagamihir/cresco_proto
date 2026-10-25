import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera } from '../../core/camera/Camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { SceneGraph } from '../../core/scene/SceneGraph';
import { Renderer } from '../../core/engine/Renderer';
import { SelectTool } from '../../core/tools/SelectTool';
import { RectTool } from '../../core/tools/RectTool';
import { Toolbar } from '../toolbar/Toolbar';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { LayersPanel } from '../layers/LayersPanel';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import type { RectangleNode, SceneNode } from '../../types/scene';
import type { ToolType } from '../toolbar/Toolbar';

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<Camera>(new Camera(window.innerWidth / 2, window.innerHeight / 2, 1));
    const sceneGraphRef = useRef<SceneGraph>(new SceneGraph());
    const selectToolRef = useRef<SelectTool>(new SelectTool());
    const rectToolRef = useRef<RectTool>(new RectTool());

    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const activeToolRef = useRef<ToolType>('select');
    activeToolRef.current = activeTool;

    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const isSpacePressedRef = useRef(false);

    // Sidebar visibility state
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Selection & Node lists
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const selectedIdsRef = useRef<Set<string>>(selectedIds);
    selectedIdsRef.current = selectedIds;

    const [nodesList, setNodesList] = useState<SceneNode[]>([]);
    const [zoomPercent, setZoomPercent] = useState(100);

    // Sync React list with internal SceneGraph
    const syncNodes = useCallback(() => {
        setNodesList([...sceneGraphRef.current.getAllNodes()]);
    }, []);

    // Reset camera zoom to 100%
    const handleResetZoom = useCallback(() => {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        cameraRef.current.resetZoom(center);
        setZoomPercent(Math.round(cameraRef.current.getState().zoom * 100));
    }, []);

    // Initialize starter shape
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
        syncNodes();
    }, [syncNodes]);

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

        // Main render loop
        const render = () => {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const dpr = window.devicePixelRatio || 1;
            ctx.scale(dpr, dpr);

            // Background
            ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Infinite Grid
            cameraRef.current.renderGrid(ctx, {
                width: window.innerWidth,
                height: window.innerHeight,
            });

            // World objects & selection outlines
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

        const getHandleCursor = (handle: string | null): string => {
            if (handle === 'tl' || handle === 'br') return 'nwse-resize';
            if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
            if (handle === 't' || handle === 'b') return 'ns-resize';
            if (handle === 'l' || handle === 'r') return 'ew-resize';
            if (activeToolRef.current === 'rectangle') return 'crosshair';
            if (activeToolRef.current === 'hand') return isPanningRef.current ? 'grabbing' : 'grab';
            return 'default';
        };

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
            const currentZoom = cameraRef.current.getState().zoom;

            // Middle click, Space+Left click, or Hand tool Left click -> Pan
            if (e.button === 1 || (e.button === 0 && (isSpacePressedRef.current || activeToolRef.current === 'hand'))) {
                isPanningRef.current = true;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                canvas.style.cursor = 'grabbing';
                return;
            }

            if (e.button === 0) {
                if (activeToolRef.current === 'select') {
                    selectToolRef.current.onPointerDown(
                        worldPoint,
                        sceneGraphRef.current,
                        selectedIdsRef.current,
                        (newSelected) => setSelectedIds(newSelected),
                        currentZoom
                    );
                } else if (activeToolRef.current === 'rectangle') {
                    rectToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
                        setSelectedIds(new Set([id]));
                        syncNodes();
                    });
                }
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPoint = cameraRef.current.toWorld(screenPoint);
            const currentZoom = cameraRef.current.getState().zoom;

            if (isPanningRef.current) {
                const dx = e.clientX - lastMousePosRef.current.x;
                const dy = e.clientY - lastMousePosRef.current.y;
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                cameraRef.current.pan(dx, dy);
                return;
            }

            if (activeToolRef.current === 'select') {
                selectToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
                if (!isSpacePressedRef.current) {
                    const hoveredHandle = selectToolRef.current.onPointerHover(
                        worldPoint,
                        sceneGraphRef.current,
                        selectedIdsRef.current,
                        currentZoom
                    );
                    canvas.style.cursor = getHandleCursor(hoveredHandle);
                }
            } else if (activeToolRef.current === 'rectangle') {
                rectToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
            }
        };

        const onMouseUp = () => {
            isPanningRef.current = false;
            if (activeToolRef.current === 'hand') {
                canvas.style.cursor = 'grab';
            } else if (isSpacePressedRef.current) {
                canvas.style.cursor = 'grab';
            }

            if (activeToolRef.current === 'select') {
                selectToolRef.current.onPointerUp();
                syncNodes();
            } else if (activeToolRef.current === 'rectangle') {
                rectToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    setActiveTool('select');
                    syncNodes();
                });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
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
            if (e.key === 'h' || e.key === 'H') {
                setActiveTool('hand');
            }
            if (e.key === 'c' || e.key === 'C') {
                setActiveTool('comment');
            }
            if (e.key === 'r' || e.key === 'R') {
                setActiveTool('rectangle');
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                for (const id of selectedIdsRef.current) {
                    sceneGraphRef.current.deleteNode(id);
                }
                setSelectedIds(new Set());
                syncNodes();
            }
            if (e.key === 'l' || e.key === 'L' || e.key === '[') {
                setShowLeftSidebar((prev) => !prev);
            }
            if (e.key === 'p' || e.key === 'P' || e.key === ']') {
                setShowRightSidebar((prev) => !prev);
            }
            if (e.key === '\\') {
                setShowLeftSidebar((prev) => {
                    const next = !prev;
                    setShowRightSidebar(next);
                    return next;
                });
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '0') {
                e.preventDefault();
                handleResetZoom();
            }
            if (e.shiftKey && (e.key === '0' || e.key === ')')) {
                handleResetZoom();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressedRef.current = false;
                if (activeToolRef.current === 'hand') {
                    canvas.style.cursor = 'grab';
                } else {
                    canvas.style.cursor = activeToolRef.current === 'rectangle' ? 'crosshair' : 'default';
                }
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
    }, [syncNodes, handleResetZoom]);

    // Update cursor dynamically based on active tool
    useEffect(() => {
        if (canvasRef.current && !isSpacePressedRef.current) {
            if (activeTool === 'rectangle') {
                canvasRef.current.style.cursor = 'crosshair';
            } else if (activeTool === 'hand') {
                canvasRef.current.style.cursor = 'grab';
            } else {
                canvasRef.current.style.cursor = 'default';
            }
        }
    }, [activeTool]);

    // Handle Layer click
    const handleSelectFromLayer = (id: string, isShift: boolean) => {
        if (isShift) {
            const next = new Set(selectedIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setSelectedIds(next);
        } else {
            setSelectedIds(new Set([id]));
        }
    };

    // Node updates & deletes
    const selectedNode =
        selectedIds.size === 1
            ? (sceneGraphRef.current.getNode(Array.from(selectedIds)[0]) as RectangleNode) || null
            : null;

    const handleUpdateSelected = (updates: Partial<RectangleNode>) => {
        if (!selectedNode) return;
        sceneGraphRef.current.updateNode(selectedNode.id, updates);
        setSelectedIds(new Set(selectedIds));
        syncNodes();
    };

    const handleDeleteNode = (id: string) => {
        sceneGraphRef.current.deleteNode(id);
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
        syncNodes();
    };

    const handleDeleteSelected = () => {
        for (const id of selectedIds) {
            sceneGraphRef.current.deleteNode(id);
        }
        setSelectedIds(new Set());
        syncNodes();
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />

            {/* Left Sidebar: Layers or Expand Button */}
            {showLeftSidebar ? (
                <LayersPanel
                    nodes={nodesList}
                    selectedIds={selectedIds}
                    onSelectNode={handleSelectFromLayer}
                    onDeleteNode={handleDeleteNode}
                    onToggleCollapse={() => setShowLeftSidebar(false)}
                />
            ) : (
                <button
                    onClick={() => setShowLeftSidebar(true)}
                    title="Show Layers Panel (L)"
                    style={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        zIndex: 15,
                        backgroundColor: '#252525',
                        border: '1px solid #383838',
                        color: '#cccccc',
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        transition: 'background-color 0.12s, color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333333';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#252525';
                        e.currentTarget.style.color = '#cccccc';
                    }}
                >
                    <PanelLeftOpen size={16} />
                </button>
            )}

            {/* Right Sidebar: Properties or Expand Button */}
            {showRightSidebar ? (
                <PropertiesPanel
                    selectedNode={selectedNode}
                    onUpdate={handleUpdateSelected}
                    onDelete={handleDeleteSelected}
                    onToggleCollapse={() => setShowRightSidebar(false)}
                />
            ) : (
                <button
                    onClick={() => setShowRightSidebar(true)}
                    title="Show Properties Panel (P)"
                    style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        zIndex: 15,
                        backgroundColor: '#252525',
                        border: '1px solid #383838',
                        color: '#cccccc',
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        transition: 'background-color 0.12s, color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#333333';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#252525';
                        e.currentTarget.style.color = '#cccccc';
                    }}
                >
                    <PanelRightOpen size={16} />
                </button>
            )}

            {/* Canvas */}
            <canvas ref={canvasRef} style={{ display: 'block' }} />

            {/* Zoom indicator / Reset zoom button */}
            <button
                type="button"
                onClick={handleResetZoom}
                title="Reset zoom to 100% (Shift+0)"
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: showRightSidebar ? 256 : 16,
                    background: '#2b2b2b',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    userSelect: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'right 0.15s ease, background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#383838';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2b2b2b';
                }}
            >
                {zoomPercent}%
            </button>
        </div>
    );
};
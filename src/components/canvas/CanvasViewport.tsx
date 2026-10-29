import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera } from '../../core/camera/Camera';
import { CANVAS_CONFIG } from '../../constants/canvas';
import { SceneGraph } from '../../core/scene/SceneGraph';
import { Renderer } from '../../core/engine/Renderer';
import { SelectTool } from '../../core/tools/SelectTool';
import { RectTool } from '../../core/tools/RectTool';
import { EllipseTool } from '../../core/tools/EllipseTool';
import { TextTool } from '../../core/tools/TextTool';
import { PenTool } from '../../core/tools/PenTool';
import { LineTool } from '../../core/tools/LineTool';
import { FrameTool } from '../../core/tools/FrameTool';
import type { DevicePreset } from '../../types/presets';
import { HistoryManager } from '../../core/history/HistoryManager';
import { CreateNodeCommand } from '../../core/history/commands/CreateNodeCommand';
import { DeleteNodeCommand } from '../../core/history/commands/DeleteNodeCommand';
import type { DeletedNodeRecord } from '../../core/history/commands/DeleteNodeCommand';
import { TransformNodeCommand } from '../../core/history/commands/TransformNodeCommand';
import { ReorderNodeCommand } from '../../core/history/commands/ReorderNodeCommand';
import { Toolbar } from '../toolbar/Toolbar';
import { PropertiesPanel } from '../properties/PropertiesPanel';
import { LayersPanel } from '../layers/LayersPanel';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import type { SceneNode, TextNode } from '../../types/scene';
import type { ToolType } from '../toolbar/Toolbar';
import { isPointInsideNode } from '../../utils/math';
import { measureTextLines } from '../../utils/text';

import type { CameraState } from '../../types/camera';

interface TextOverlayProps {
    textNode: TextNode;
    cameraState: CameraState;
    viewportWidth: number;
    viewportHeight: number;
    onUpdateText: (newText: string, width: number, height: number) => void;
    onCommit: () => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({
    textNode,
    cameraState,
    viewportWidth,
    viewportHeight,
    onUpdateText,
    onCommit,
}) => {
    const zoom = cameraState.zoom;
    const screenPos = {
        x: (textNode.x - cameraState.x) * zoom + viewportWidth / 2,
        y: (textNode.y - cameraState.y) * zoom + viewportHeight / 2,
    };
    const scaledFontSize = textNode.fontSize * zoom;
    const scaledLineHeight = (textNode.lineHeight || 1.25) * scaledFontSize;
    const widthPx = textNode.autoWidth ? Math.max(60, textNode.width * zoom) : textNode.width * zoom;

    const verticalAlign = textNode.verticalAlign || 'top';
    const linesCount = (textNode.text || '').split('\n').length;
    const totalTextHeight = Math.max(scaledLineHeight, linesCount * scaledLineHeight);
    const currentHeight = Math.max(scaledLineHeight, textNode.height * zoom);
    const topPadding =
        verticalAlign === 'middle'
            ? Math.max(0, (currentHeight - totalTextHeight) / 2)
            : verticalAlign === 'bottom'
            ? Math.max(0, currentHeight - totalTextHeight)
            : 0;

    return (
        <textarea
            autoFocus
            value={textNode.text}
            placeholder={textNode.autoWidth && !textNode.text ? 'Type text...' : ''}
            onChange={(e) => {
                const newText = e.target.value;
                const metrics = measureTextLines(
                    newText,
                    textNode.fontSize,
                    textNode.fontFamily,
                    textNode.fontWeight,
                    textNode.lineHeight || 1.25,
                    textNode.autoWidth ? undefined : textNode.width
                );
                onUpdateText(
                    newText,
                    textNode.autoWidth ? metrics.width : textNode.width,
                    textNode.autoWidth ? metrics.height : textNode.height
                );
            }}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                    (e.currentTarget as HTMLTextAreaElement).blur();
                }
            }}
            onBlur={onCommit}
            style={{
                position: 'absolute',
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                width: `${widthPx}px`,
                minWidth: `${Math.max(60, textNode.fontSize * zoom)}px`,
                height: `${Math.max(scaledLineHeight, textNode.height * zoom)}px`,
                fontSize: `${scaledFontSize}px`,
                lineHeight: `${scaledLineHeight}px`,
                fontFamily: `${textNode.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
                fontWeight: textNode.fontWeight,
                textAlign: textNode.textAlign || 'left',
                color: textNode.fill || '#ffffff',
                caretColor: '#0d99ff',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                paddingTop: `${topPadding}px`,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                margin: 0,
                overflow: 'hidden',
                whiteSpace: textNode.autoWidth ? 'pre' : 'pre-wrap',
                wordBreak: 'break-word',
                boxSizing: 'border-box',
                zIndex: 25,
            }}
        />
    );
};

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<Camera>(new Camera(window.innerWidth / 2, window.innerHeight / 2, 1));
    const sceneGraphRef = useRef<SceneGraph>(new SceneGraph());
    const selectToolRef = useRef<SelectTool>(new SelectTool());
    const rectToolRef = useRef<RectTool>(new RectTool());
    const ellipseToolRef = useRef<EllipseTool>(new EllipseTool());
    const textToolRef = useRef<TextTool>(new TextTool());
    const penToolRef = useRef<PenTool>(new PenTool());
    const lineToolRef = useRef<LineTool>(new LineTool());
    const frameToolRef = useRef<FrameTool>(new FrameTool());
    const historyRef = useRef<HistoryManager>(new HistoryManager());

    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const activeToolRef = useRef<ToolType>('select');

    // Inline text editing state
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const editingTextIdRef = useRef<string | null>(null);
    const editingInitialStateRef = useRef<{ id: string; node: TextNode; isNew: boolean } | null>(null);

    const isPanningRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const isSpacePressedRef = useRef(false);

    // Sidebar visibility state
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Selection & Node lists
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const selectedIdsRef = useRef<Set<string>>(selectedIds);

    const [nodesList, setNodesList] = useState<SceneNode[]>([]);
    const [zoomPercent, setZoomPercent] = useState(100);
    const [cameraState, setCameraState] = useState<CameraState>(() => ({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
        zoom: 1,
    }));

    // Sync camera state into React state when camera changes or zoom updates
    const updateCameraState = useCallback(() => {
        setCameraState(cameraRef.current.getState());
        setZoomPercent(Math.round(cameraRef.current.getState().zoom * 100));
    }, []);

    // Keep refs in sync inside effects rather than during render
    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    useEffect(() => {
        editingTextIdRef.current = editingTextId;
    }, [editingTextId]);

    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    // Sync React list with internal SceneGraph
    const syncNodes = useCallback(() => {
        setNodesList([...sceneGraphRef.current.getAllNodes()]);
    }, []);

    const handleDeleteSelected = useCallback(() => {
        const idsToDelete = selectedIdsRef.current.size > 0 ? selectedIdsRef.current : selectedIds;
        if (idsToDelete.size === 0) return;

        const allNodes = sceneGraphRef.current.getAllNodes();
        const records: DeletedNodeRecord[] = [];

        allNodes.forEach((node, index) => {
            if (idsToDelete.has(node.id)) {
                records.push({ node: { ...node }, index });
            }
        });

        if (records.length === 0) return;

        const command = new DeleteNodeCommand(
            sceneGraphRef.current,
            records,
            (ids) => setSelectedIds(ids)
        );
        historyRef.current.execute(command);
        syncNodes();
    }, [selectedIds, syncNodes]);

    // Switch tool and finalize pending pen path if switching away
    const handleSelectTool = useCallback((tool: ToolType) => {
        if (activeToolRef.current === 'pen' && tool !== 'pen') {
            if (penToolRef.current.getIsDrawing()) {
                const node = penToolRef.current.finishPath(false);
                if (node) {
                    historyRef.current.execute(
                        new CreateNodeCommand(
                            sceneGraphRef.current,
                            { ...node },
                            (ids) => setSelectedIds(ids)
                        )
                    );
                    setSelectedIds(new Set([node.id]));
                    syncNodes();
                }
            }
        }
        setActiveTool(tool);
    }, [syncNodes]);

    const handleInsertPreset = useCallback((preset: DevicePreset) => {
        const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const centerWorld = cameraRef.current.toWorld(centerScreen);
        const frame = FrameTool.createFromPreset(preset, centerWorld, sceneGraphRef.current);
        historyRef.current.push(
            new CreateNodeCommand(
                sceneGraphRef.current,
                { ...frame },
                (ids) => setSelectedIds(ids)
            )
        );
        setSelectedIds(new Set([frame.id]));
        handleSelectTool('select');
        syncNodes();
    }, [syncNodes, handleSelectTool]);

    // Subscribe to history changes for toolbar button states
    useEffect(() => {
        const unsubscribe = historyRef.current.subscribe((undoable, redoable) => {
            setCanUndo(undoable);
            setCanRedo(redoable);
        });
        return unsubscribe;
    }, []);

    const handleUndo = useCallback(() => {
        historyRef.current.undo();
        syncNodes();
    }, [syncNodes]);

    const handleRedo = useCallback(() => {
        historyRef.current.redo();
        syncNodes();
    }, [syncNodes]);

    // Reset camera zoom to 100%
    const handleResetZoom = useCallback(() => {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        cameraRef.current.resetZoom(center);
        updateCameraState();
    }, [updateCameraState]);

    // Deselect all selected nodes
    const deselect = useCallback(() => {
        selectedIdsRef.current = new Set();
        setSelectedIds(new Set());
    }, []);

    const startEditingText = useCallback((id: string, isNew: boolean = false) => {
        const node = sceneGraphRef.current.getNode(id) as TextNode | undefined;
        if (!node) return;
        editingInitialStateRef.current = { id, node: { ...node }, isNew };
        setEditingTextId(id);
        setSelectedIds(new Set([id]));
    }, []);

    const commitEditingText = useCallback(() => {
        const initial = editingInitialStateRef.current;
        editingInitialStateRef.current = null;
        if (!initial) {
            setEditingTextId(null);
            return;
        }

        const current = sceneGraphRef.current.getNode(initial.id) as TextNode | undefined;
        if (current) {
            if (current.text.trim() === '') {
                sceneGraphRef.current.deleteNode(current.id);
                setSelectedIds(new Set());
            } else if (initial.isNew) {
                historyRef.current.push(
                    new CreateNodeCommand(
                        sceneGraphRef.current,
                        { ...current },
                        (ids) => setSelectedIds(ids)
                    )
                );
            } else if (
                current.text !== initial.node.text ||
                current.width !== initial.node.width ||
                current.height !== initial.node.height
            ) {
                historyRef.current.push(
                    new TransformNodeCommand(
                        sceneGraphRef.current,
                        [{
                            id: current.id,
                            before: { ...initial.node },
                            after: { ...current },
                        }],
                        (ids) => setSelectedIds(ids)
                    )
                );
            }
        }
        setEditingTextId(null);
        syncNodes();
    }, [syncNodes]);


    const handleUpdateEditingText = useCallback((id: string, text: string, width: number, height: number) => {
        sceneGraphRef.current.updateNode(id, {
            text,
            width,
            height,
        });
        syncNodes();
    }, [syncNodes]);

    // Subscribe to SceneGraph updates
    useEffect(() => {
        syncNodes();

        // Subscribe to all SceneGraph changes to update React state in real-time (e.g. during drag/resize)
        const unsubscribe = sceneGraphRef.current.subscribe(() => {
            syncNodes();
        });

        return () => {
            unsubscribe();
        };
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
                cameraRef.current.getState().zoom,
                editingTextIdRef.current,
                selectToolRef.current.getSnapGuides(),
                selectToolRef.current.getMarqueeBox()
            );
            Renderer.renderPenPreview(
                ctx,
                penToolRef.current.getDrawingState(),
                cameraRef.current.getState().zoom
            );
            ctx.restore();

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const getHandleCursor = (handle: string | null): string => {
            if (handle?.startsWith('rot-')) {
                // Figma curved rotation icon as an inline SVG cursor (or standard grab/alias fallback)
                return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230d99ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpath d='M21 3v5h-5'/%3E%3C/svg%3E\") 12 12, grab";
            }
            if (handle === 'tl' || handle === 'br') return 'nwse-resize';
            if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
            if (handle === 't' || handle === 'b') return 'ns-resize';
            if (handle === 'l' || handle === 'r') return 'ew-resize';
            if (activeToolRef.current === 'rectangle' || activeToolRef.current === 'ellipse' || activeToolRef.current === 'pen' || activeToolRef.current === 'line' || activeToolRef.current === 'arrow' || activeToolRef.current === 'frame') return 'crosshair';
            if (activeToolRef.current === 'text') return 'text';
            if (activeToolRef.current === 'hand') return isPanningRef.current ? 'grabbing' : 'grab';
            return 'default';
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const focalPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            cameraRef.current.handleWheel(e, focalPoint);
            updateCameraState();
        };

        const onMouseDown = (e: MouseEvent) => {
            // Prevent default browser drag-and-drop / text-selection behavior (crucial in Firefox)
            e.preventDefault();

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
                if (editingTextIdRef.current) {
                    commitEditingText();
                }

                if (activeToolRef.current === 'select') {
                    selectToolRef.current.onPointerDown(
                        worldPoint,
                        sceneGraphRef.current,
                        selectedIdsRef.current,
                        (newSelected) => setSelectedIds(newSelected),
                        currentZoom,
                        e.shiftKey
                    );
                } else if (activeToolRef.current === 'rectangle') {
                    rectToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
                        setSelectedIds(new Set([id]));
                        syncNodes();
                    });
                } else if (activeToolRef.current === 'ellipse') {
                    ellipseToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
                        setSelectedIds(new Set([id]));
                        syncNodes();
                    });
                } else if (activeToolRef.current === 'text') {
                    textToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
                        setSelectedIds(new Set([id]));
                        syncNodes();
                    });
                } else if (activeToolRef.current === 'pen') {
                    const result = penToolRef.current.onPointerDown(worldPoint, currentZoom);
                    if (result.status === 'completed' && result.node) {
                        historyRef.current.execute(
                            new CreateNodeCommand(
                                sceneGraphRef.current,
                                { ...result.node },
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        setSelectedIds(new Set([result.node.id]));
                        handleSelectTool('select');
                    }
                    syncNodes();
                } else if (activeToolRef.current === 'line' || activeToolRef.current === 'arrow') {
                    lineToolRef.current.onPointerDown(
                        worldPoint,
                        sceneGraphRef.current,
                        activeToolRef.current === 'arrow',
                        (id) => {
                            setSelectedIds(new Set([id]));
                            syncNodes();
                        }
                    );
                } else if (activeToolRef.current === 'frame') {
                    frameToolRef.current.onPointerDown(worldPoint, sceneGraphRef.current, (id) => {
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
                updateCameraState();
                return;
            }

            if (activeToolRef.current === 'select') {
                selectToolRef.current.onPointerMove(
                    worldPoint,
                    sceneGraphRef.current,
                    currentZoom,
                    (newSelected) => setSelectedIds(newSelected)
                );
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
            } else if (activeToolRef.current === 'ellipse') {
                ellipseToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current, e.shiftKey);
            } else if (activeToolRef.current === 'text') {
                textToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current);
            } else if (activeToolRef.current === 'pen') {
                penToolRef.current.onPointerMove(worldPoint, currentZoom);
            } else if (activeToolRef.current === 'line' || activeToolRef.current === 'arrow') {
                lineToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current, e.shiftKey);
            } else if (activeToolRef.current === 'frame') {
                frameToolRef.current.onPointerMove(worldPoint, sceneGraphRef.current, e.shiftKey);
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
                const changes = selectToolRef.current.onPointerUp(sceneGraphRef.current);
                if (changes.length > 0) {
                    historyRef.current.push(
                        new TransformNodeCommand(
                            sceneGraphRef.current,
                            changes,
                            (ids) => setSelectedIds(ids)
                        )
                    );
                }
                syncNodes();
            } else if (activeToolRef.current === 'rectangle') {
                rectToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        const createdNode = sceneGraphRef.current.getNode(completedId);
                        if (createdNode) {
                            historyRef.current.push(
                                new CreateNodeCommand(
                                    sceneGraphRef.current,
                                    { ...createdNode },
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                        }
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    setActiveTool('select');
                    syncNodes();
                });
            } else if (activeToolRef.current === 'ellipse') {
                ellipseToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        const createdNode = sceneGraphRef.current.getNode(completedId);
                        if (createdNode) {
                            historyRef.current.push(
                                new CreateNodeCommand(
                                    sceneGraphRef.current,
                                    { ...createdNode },
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                        }
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    setActiveTool('select');
                    syncNodes();
                });
            } else if (activeToolRef.current === 'text') {
                textToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        startEditingText(completedId, true);
                    }
                    setActiveTool('select');
                    syncNodes();
                });
            } else if (activeToolRef.current === 'pen') {
                penToolRef.current.onPointerUp(cameraRef.current.getState().zoom);
            } else if (activeToolRef.current === 'line' || activeToolRef.current === 'arrow') {
                lineToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        const createdNode = sceneGraphRef.current.getNode(completedId);
                        if (createdNode) {
                            historyRef.current.push(
                                new CreateNodeCommand(
                                    sceneGraphRef.current,
                                    { ...createdNode },
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                        }
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    handleSelectTool('select');
                    syncNodes();
                });
            } else if (activeToolRef.current === 'frame') {
                frameToolRef.current.onPointerUp(sceneGraphRef.current, (completedId) => {
                    if (completedId) {
                        const createdNode = sceneGraphRef.current.getNode(completedId);
                        if (createdNode) {
                            historyRef.current.push(
                                new CreateNodeCommand(
                                    sceneGraphRef.current,
                                    { ...createdNode },
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                        }
                        setSelectedIds(new Set([completedId]));
                    } else {
                        setSelectedIds(new Set());
                    }
                    handleSelectTool('select');
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
                handleSelectTool('select');
            }
            if (e.key === 'h' || e.key === 'H') {
                handleSelectTool('hand');
            }
            if (e.key === 'f' || e.key === 'F') {
                handleSelectTool('frame');
            }
            if (e.key === 'c' || e.key === 'C') {
                handleSelectTool('comment');
            }
            if (e.key === 'r' || e.key === 'R') {
                handleSelectTool('rectangle');
            }
            if (e.key === 'o' || e.key === 'O') {
                handleSelectTool('ellipse');
            }
            if (e.key === 'p' || e.key === 'P') {
                handleSelectTool('pen');
            }
            if (e.key === 't' || e.key === 'T') {
                handleSelectTool('text');
            }
            if (e.key === 'l' || e.key === 'L') {
                if (e.shiftKey) {
                    handleSelectTool('arrow');
                } else {
                    handleSelectTool('line');
                }
            }

            if (e.key === 'Enter' && activeToolRef.current === 'pen') {
                e.preventDefault();
                const node = penToolRef.current.finishPath(false);
                if (node) {
                    historyRef.current.execute(
                        new CreateNodeCommand(
                            sceneGraphRef.current,
                            { ...node },
                            (ids) => setSelectedIds(ids)
                        )
                    );
                    setSelectedIds(new Set([node.id]));
                }
                handleSelectTool('select');
                syncNodes();
                return;
            }

            if (e.key === 'Escape' && activeToolRef.current === 'pen') {
                e.preventDefault();
                const node = penToolRef.current.finishPath(false);
                if (node) {
                    historyRef.current.execute(
                        new CreateNodeCommand(
                            sceneGraphRef.current,
                            { ...node },
                            (ids) => setSelectedIds(ids)
                        )
                    );
                    setSelectedIds(new Set([node.id]));
                } else {
                    penToolRef.current.cancel();
                }
                handleSelectTool('select');
                syncNodes();
                return;
            }

            // Undo / Redo Shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y
            if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                handleRedo();
                return;
            }
            if (e.key === 'Backspace' || e.key === 'Escape') {
                e.preventDefault();
                deselect();
            }

            if (e.key === 'Delete') {
                e.preventDefault();
                handleDeleteSelected();
            }

            // Arrow key nudging for selected elements:
            // Shift + Arrow = move slowly (1px)
            // Regular Arrow = normal move (10px)
            if (
                selectedIdsRef.current.size > 0 &&
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
            ) {
                e.preventDefault();
                const step = e.shiftKey ? 1 : 10;
                let dx = 0;
                let dy = 0;

                if (e.key === 'ArrowUp') dy = -step;
                if (e.key === 'ArrowDown') dy = step;
                if (e.key === 'ArrowLeft') dx = -step;
                if (e.key === 'ArrowRight') dx = step;

                const changes: {
                    id: string;
                    before: { x: number; y: number; width: number; height: number };
                    after: { x: number; y: number; width: number; height: number };
                }[] = [];

                selectedIdsRef.current.forEach((id) => {
                    const node = sceneGraphRef.current.getNode(id);
                    if (node) {
                        const before = { x: node.x, y: node.y, width: node.width, height: node.height };
                        const after = { ...before, x: node.x + dx, y: node.y + dy };
                        sceneGraphRef.current.updateNode(id, { x: after.x, y: after.y });
                        changes.push({ id, before, after });
                    }
                });

                if (changes.length > 0) {
                    historyRef.current.push(
                        new TransformNodeCommand(
                            sceneGraphRef.current,
                            changes,
                            (ids) => setSelectedIds(ids)
                        )
                    );
                }
                syncNodes();
                return;
            }

            if (e.key === '\\') {
                setShowLeftSidebar((prev) => {
                    const next = !prev;
                    setShowRightSidebar(next);
                    return next;
                });
            }

            // Layer reordering shortcuts: [ (Send Backward) and ] (Bring Forward)
            if (e.key === '[' && selectedIdsRef.current.size === 1) {
                const targetId = Array.from(selectedIdsRef.current)[0];
                const before = sceneGraphRef.current.getAllNodes();
                if (e.metaKey || e.ctrlKey) {
                    sceneGraphRef.current.sendToBack(targetId);
                } else {
                    sceneGraphRef.current.moveDown(targetId);
                }
                const after = sceneGraphRef.current.getAllNodes();
                historyRef.current.push(
                    new ReorderNodeCommand(
                        sceneGraphRef.current,
                        before,
                        after,
                        selectedIdsRef.current,
                        (ids) => setSelectedIds(ids)
                    )
                );
                syncNodes();
            }
            if (e.key === ']' && selectedIdsRef.current.size === 1) {
                const targetId = Array.from(selectedIdsRef.current)[0];
                const before = sceneGraphRef.current.getAllNodes();
                if (e.metaKey || e.ctrlKey) {
                    sceneGraphRef.current.bringToFront(targetId);
                } else {
                    sceneGraphRef.current.moveUp(targetId);
                }
                const after = sceneGraphRef.current.getAllNodes();
                historyRef.current.push(
                    new ReorderNodeCommand(
                        sceneGraphRef.current,
                        before,
                        after,
                        selectedIdsRef.current,
                        (ids) => setSelectedIds(ids)
                    )
                );
                syncNodes();
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
                    canvas.style.cursor = (activeToolRef.current === 'rectangle' || activeToolRef.current === 'ellipse' || activeToolRef.current === 'pen' || activeToolRef.current === 'line' || activeToolRef.current === 'arrow' || activeToolRef.current === 'frame') ? 'crosshair' : 'default';
                }
            }
        };

        const onDoubleClick = (e: MouseEvent) => {
            if (activeToolRef.current === 'pen' && penToolRef.current.getIsDrawing()) {
                const node = penToolRef.current.finishPath(false);
                if (node) {
                    historyRef.current.execute(
                        new CreateNodeCommand(
                            sceneGraphRef.current,
                            { ...node },
                            (ids) => setSelectedIds(ids)
                        )
                    );
                    setSelectedIds(new Set([node.id]));
                }
                handleSelectTool('select');
                syncNodes();
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const worldPoint = cameraRef.current.toWorld(screenPoint);
            const allNodes = sceneGraphRef.current.getAllNodes();

            for (let i = allNodes.length - 1; i >= 0; i--) {
                const node = allNodes[i];
                if (isPointInsideNode(worldPoint, node)) {
                    if (node.type === 'text') {
                        startEditingText(node.id, false);
                    }
                    break;
                }
            }
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('dblclick', onDoubleClick);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('dblclick', onDoubleClick);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [syncNodes, handleResetZoom, deselect, startEditingText, commitEditingText, handleSelectTool, handleDeleteSelected, handleRedo, handleUndo, updateCameraState]);

    // Update cursor dynamically based on active tool
    useEffect(() => {
        if (canvasRef.current && !isSpacePressedRef.current) {
            if (activeTool === 'rectangle' || activeTool === 'ellipse' || activeTool === 'pen' || activeTool === 'line' || activeTool === 'arrow' || activeTool === 'frame') {
                canvasRef.current.style.cursor = 'crosshair';
            } else if (activeTool === 'text') {
                canvasRef.current.style.cursor = 'text';
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

    // Node updates & deletes (derived from nodesList state for real-time reactivity)
    const selectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
    const selectedNode = selectedId ? nodesList.find((n) => n.id === selectedId) || null : null;
    const editingTextNode = editingTextId ? (nodesList.find((n) => n.id === editingTextId) as TextNode | undefined) : undefined;

    const handleUpdateSelected = (updates: Partial<SceneNode>) => {
        if (!selectedNode) return;
        sceneGraphRef.current.updateNode(selectedNode.id, updates);
        setSelectedIds(new Set(selectedIds));
        syncNodes();
    };

    const handleDeleteNode = (id: string) => {
        const allNodes = sceneGraphRef.current.getAllNodes();
        const index = allNodes.findIndex((n) => n.id === id);
        const node = allNodes[index];
        if (!node) return;

        const command = new DeleteNodeCommand(
            sceneGraphRef.current,
            [{ node: { ...node }, index }],
            (ids) => setSelectedIds(ids)
        );
        historyRef.current.execute(command);
        syncNodes();
    };


    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <Toolbar
                activeTool={activeTool}
                onSelectTool={handleSelectTool}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
            />

            {/* Left Sidebar: Layers or Expand Button */}
            {showLeftSidebar ? (
                <LayersPanel
                    nodes={nodesList}
                    selectedIds={selectedIds}
                    onSelectNode={handleSelectFromLayer}
                    onDeleteNode={handleDeleteNode}
                    onReorderNodes={(fromIndex, toIndex) => {
                        const before = sceneGraphRef.current.getAllNodes();
                        sceneGraphRef.current.reorder(fromIndex, toIndex);
                        const after = sceneGraphRef.current.getAllNodes();
                        historyRef.current.push(
                            new ReorderNodeCommand(
                                sceneGraphRef.current,
                                before,
                                after,
                                selectedIdsRef.current,
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        syncNodes();
                    }}
                    onMoveUp={(id) => {
                        const before = sceneGraphRef.current.getAllNodes();
                        sceneGraphRef.current.moveUp(id);
                        const after = sceneGraphRef.current.getAllNodes();
                        historyRef.current.push(
                            new ReorderNodeCommand(
                                sceneGraphRef.current,
                                before,
                                after,
                                selectedIdsRef.current,
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        syncNodes();
                    }}
                    onMoveDown={(id) => {
                        const before = sceneGraphRef.current.getAllNodes();
                        sceneGraphRef.current.moveDown(id);
                        const after = sceneGraphRef.current.getAllNodes();
                        historyRef.current.push(
                            new ReorderNodeCommand(
                                sceneGraphRef.current,
                                before,
                                after,
                                selectedIdsRef.current,
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        syncNodes();
                    }}
                    onBringToFront={(id) => {
                        const before = sceneGraphRef.current.getAllNodes();
                        sceneGraphRef.current.bringToFront(id);
                        const after = sceneGraphRef.current.getAllNodes();
                        historyRef.current.push(
                            new ReorderNodeCommand(
                                sceneGraphRef.current,
                                before,
                                after,
                                selectedIdsRef.current,
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        syncNodes();
                    }}
                    onSendToBack={(id) => {
                        const before = sceneGraphRef.current.getAllNodes();
                        sceneGraphRef.current.sendToBack(id);
                        const after = sceneGraphRef.current.getAllNodes();
                        historyRef.current.push(
                            new ReorderNodeCommand(
                                sceneGraphRef.current,
                                before,
                                after,
                                selectedIdsRef.current,
                                (ids) => setSelectedIds(ids)
                            )
                        );
                        syncNodes();
                    }}
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
                    selectedNodes={nodesList.filter((n) => selectedIds.has(n.id))}
                    allNodes={nodesList}
                    onUpdate={handleUpdateSelected}
                    onDelete={handleDeleteSelected}
                    onMoveUp={() => {
                        if (selectedNode) {
                            const before = sceneGraphRef.current.getAllNodes();
                            sceneGraphRef.current.moveUp(selectedNode.id);
                            const after = sceneGraphRef.current.getAllNodes();
                            historyRef.current.push(
                                new ReorderNodeCommand(
                                    sceneGraphRef.current,
                                    before,
                                    after,
                                    selectedIdsRef.current,
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                            syncNodes();
                        }
                    }}
                    onMoveDown={() => {
                        if (selectedNode) {
                            const before = sceneGraphRef.current.getAllNodes();
                            sceneGraphRef.current.moveDown(selectedNode.id);
                            const after = sceneGraphRef.current.getAllNodes();
                            historyRef.current.push(
                                new ReorderNodeCommand(
                                    sceneGraphRef.current,
                                    before,
                                    after,
                                    selectedIdsRef.current,
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                            syncNodes();
                        }
                    }}
                    onBringToFront={() => {
                        if (selectedNode) {
                            const before = sceneGraphRef.current.getAllNodes();
                            sceneGraphRef.current.bringToFront(selectedNode.id);
                            const after = sceneGraphRef.current.getAllNodes();
                            historyRef.current.push(
                                new ReorderNodeCommand(
                                    sceneGraphRef.current,
                                    before,
                                    after,
                                    selectedIdsRef.current,
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                            syncNodes();
                        }
                    }}
                    onSendToBack={() => {
                        if (selectedNode) {
                            const before = sceneGraphRef.current.getAllNodes();
                            sceneGraphRef.current.sendToBack(selectedNode.id);
                            const after = sceneGraphRef.current.getAllNodes();
                            historyRef.current.push(
                                new ReorderNodeCommand(
                                    sceneGraphRef.current,
                                    before,
                                    after,
                                    selectedIdsRef.current,
                                    (ids) => setSelectedIds(ids)
                                )
                            );
                            syncNodes();
                        }
                    }}
                    onToggleCollapse={() => setShowRightSidebar(false)}
                    activeTool={activeTool}
                    onInsertPreset={handleInsertPreset}
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
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                }}
            />

            {/* Inline Text Editing Overlay (Figma style) */}
            {editingTextNode && (
                <TextOverlay
                    textNode={editingTextNode}
                    cameraState={cameraState}
                    viewportWidth={window.innerWidth}
                    viewportHeight={window.innerHeight}
                    onUpdateText={(newText, width, height) => {
                        handleUpdateEditingText(editingTextNode.id, newText, width, height);
                    }}
                    onCommit={commitEditingText}
                />
            )}

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
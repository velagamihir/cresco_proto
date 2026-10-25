import React, { useState } from 'react';
import type { SceneNode } from '../../types/scene';
import {
    Square,
    Circle,
    Type,
    Trash2,
    Layers,
    PanelLeftClose,
    GripVertical,
    ChevronUp,
    ChevronDown,
    ChevronsUp,
    ChevronsDown,
} from 'lucide-react';

interface LayersPanelProps {
    nodes: SceneNode[];
    selectedIds: Set<string>;
    onSelectNode: (id: string, isShift: boolean) => void;
    onDeleteNode: (id: string) => void;
    onReorderNodes: (fromIndex: number, toIndex: number) => void;
    onMoveUp?: (id: string) => void;
    onMoveDown?: (id: string) => void;
    onBringToFront?: (id: string) => void;
    onSendToBack?: (id: string) => void;
    onToggleCollapse?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
    nodes,
    selectedIds,
    onSelectNode,
    onDeleteNode,
    onReorderNodes,
    onMoveUp,
    onMoveDown,
    onBringToFront,
    onSendToBack,
    onToggleCollapse,
}) => {
    // In graphic tools, top-most z-index renders at the top of the layer list
    const reversedNodes = [...nodes].reverse();

    // Drag-and-drop state
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedNodeId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedNodeId === targetId) {
            setDragOverNodeId(null);
            setDropPosition(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const pos = e.clientY < midY ? 'above' : 'below';

        setDragOverNodeId(targetId);
        setDropPosition(pos);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Clear indicator if leaving to an outside container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverNodeId(null);
            setDropPosition(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedNodeId || draggedNodeId === targetId) {
            setDraggedNodeId(null);
            setDragOverNodeId(null);
            setDropPosition(null);
            return;
        }

        const sourceIndex = nodes.findIndex((n) => n.id === draggedNodeId);
        const targetIndex = nodes.findIndex((n) => n.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) {
            setDraggedNodeId(null);
            setDragOverNodeId(null);
            setDropPosition(null);
            return;
        }

        // In reversedNodes:
        // 'above' target in the UI means HIGHER z-index in nodes array (so after target in nodes)
        // 'below' target in the UI means LOWER z-index in nodes array (so before target in nodes)
        let newTargetIndex = targetIndex;
        if (dropPosition === 'above') {
            // Placing above target in reversed list -> targetIndex + 1 in nodes array
            newTargetIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
        } else {
            // Placing below target in reversed list -> targetIndex in nodes array
            newTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        }

        newTargetIndex = Math.max(0, Math.min(nodes.length - 1, newTargetIndex));

        onReorderNodes(sourceIndex, newTargetIndex);
        setDraggedNodeId(null);
        setDragOverNodeId(null);
        setDropPosition(null);
    };

    return (
        <aside
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 240,
                height: '100%',
                backgroundColor: '#252525',
                borderRight: '1px solid #333333',
                display: 'flex',
                flexDirection: 'column',
                color: '#ffffff',
                fontFamily: 'sans-serif',
                fontSize: 12,
                userSelect: 'none',
                zIndex: 10,
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #333333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#e0e0e0',
                }}
            >
                <Layers size={16} />
                <span>Layers</span>
                <span
                    style={{
                        background: '#333333',
                        color: '#aaaaaa',
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontSize: 11,
                    }}
                >
                    {nodes.length}
                </span>

                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        title="Hide Layers (L)"
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: '#888888',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.12s, background 0.12s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.backgroundColor = '#333333';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#888888';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <PanelLeftClose size={16} />
                    </button>
                )}
            </div>

            {/* Layer List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                {reversedNodes.length === 0 ? (
                    <div
                        style={{
                            padding: 24,
                            textAlign: 'center',
                            color: '#777777',
                            fontSize: 12,
                        }}
                    >
                        No layers created yet.
                        <br />
                        Press <strong style={{ color: '#aaa' }}>R</strong>, <strong style={{ color: '#aaa' }}>O</strong>, or <strong style={{ color: '#aaa' }}>T</strong> to draw.
                    </div>
                ) : (
                    reversedNodes.map((node, index) => {
                        const isSelected = selectedIds.has(node.id);
                        const isDragging = draggedNodeId === node.id;
                        const isOver = dragOverNodeId === node.id;
                        const isText = node.type === 'text';
                        const layerName = isText
                            ? (node.text.trim() || 'Text')
                            : `${node.type === 'ellipse' ? 'Ellipse' : 'Rectangle'} ${nodes.length - index}`;

                        return (
                            <div
                                key={node.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, node.id)}
                                onDragOver={(e) => handleDragOver(e, node.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, node.id)}
                                onDragEnd={() => {
                                    setDraggedNodeId(null);
                                    setDragOverNodeId(null);
                                    setDropPosition(null);
                                }}
                                onClick={(e) => onSelectNode(node.id, e.shiftKey)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '7px 12px',
                                    position: 'relative',
                                    backgroundColor: isSelected ? '#0d99ff' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#cccccc',
                                    cursor: 'grab',
                                    gap: 6,
                                    opacity: isDragging ? 0.35 : 1,
                                    transition: 'background-color 0.1s ease',
                                    borderTop: isOver && dropPosition === 'above' ? '2px solid #0d99ff' : '2px solid transparent',
                                    borderBottom: isOver && dropPosition === 'below' ? '2px solid #0d99ff' : '2px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected && !isDragging) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e2e';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected && !isDragging) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {/* Drag Handle */}
                                <GripVertical
                                    size={13}
                                    style={{
                                        color: isSelected ? 'rgba(255,255,255,0.7)' : '#555555',
                                        flexShrink: 0,
                                        cursor: 'grab',
                                    }}
                                />

                                {/* Node Type Icon */}
                                {node.type === 'ellipse' ? (
                                    <Circle
                                        size={14}
                                        style={{
                                            color: isSelected ? '#ffffff' : '#888888',
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : node.type === 'text' ? (
                                    <Type
                                        size={14}
                                        style={{
                                            color: isSelected ? '#ffffff' : '#888888',
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <Square
                                        size={14}
                                        style={{
                                            color: isSelected ? '#ffffff' : '#888888',
                                            flexShrink: 0,
                                        }}
                                    />
                                )}

                                {/* Layer Name */}
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: 12,
                                    }}
                                >
                                    {layerName}
                                </span>

                                {/* Color preview badge */}
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        backgroundColor: node.fill,
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        flexShrink: 0,
                                    }}
                                />

                                {/* Layer Reordering Buttons */}
                                {onBringToFront && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onBringToFront(node.id);
                                        }}
                                        title="Bring to Front (Ctrl+])"
                                        disabled={index === 0}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isSelected ? '#ffffff' : '#888888',
                                            cursor: index === 0 ? 'default' : 'pointer',
                                            padding: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: index === 0 ? 0.2 : (isSelected ? 1 : 0.6),
                                        }}
                                    >
                                        <ChevronsUp size={13} />
                                    </button>
                                )}

                                {onMoveUp && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveUp(node.id);
                                        }}
                                        title="Bring Forward (])"
                                        disabled={index === 0}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isSelected ? '#ffffff' : '#888888',
                                            cursor: index === 0 ? 'default' : 'pointer',
                                            padding: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: index === 0 ? 0.2 : (isSelected ? 1 : 0.6),
                                        }}
                                    >
                                        <ChevronUp size={13} />
                                    </button>
                                )}

                                {onMoveDown && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveDown(node.id);
                                        }}
                                        title="Send Backward ([)"
                                        disabled={index === reversedNodes.length - 1}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isSelected ? '#ffffff' : '#888888',
                                            cursor: index === reversedNodes.length - 1 ? 'default' : 'pointer',
                                            padding: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: index === reversedNodes.length - 1 ? 0.2 : (isSelected ? 1 : 0.6),
                                        }}
                                    >
                                        <ChevronDown size={13} />
                                    </button>
                                )}

                                {onSendToBack && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSendToBack(node.id);
                                        }}
                                        title="Send to Back (Ctrl+[)"
                                        disabled={index === reversedNodes.length - 1}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isSelected ? '#ffffff' : '#888888',
                                            cursor: index === reversedNodes.length - 1 ? 'default' : 'pointer',
                                            padding: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: index === reversedNodes.length - 1 ? 0.2 : (isSelected ? 1 : 0.6),
                                        }}
                                    >
                                        <ChevronsDown size={13} />
                                    </button>
                                )}

                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNode(node.id);
                                    }}
                                    title="Delete Layer"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: isSelected ? '#ffffff' : '#888888',
                                        cursor: 'pointer',
                                        padding: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: isSelected ? 1 : 0.6,
                                    }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
};



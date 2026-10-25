import React from 'react';
import type { SceneNode } from '../../types/scene';
import { Square, Trash2, Layers, PanelLeftClose } from 'lucide-react';

interface LayersPanelProps {
    nodes: SceneNode[];
    selectedIds: Set<string>;
    onSelectNode: (id: string, isShift: boolean) => void;
    onDeleteNode: (id: string) => void;
    onToggleCollapse?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
    nodes,
    selectedIds,
    onSelectNode,
    onDeleteNode,
    onToggleCollapse,
}) => {
    // In graphic tools, top-most z-index renders at the top of the layer list
    const reversedNodes = [...nodes].reverse();

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
                        Press <strong style={{ color: '#aaa' }}>R</strong> to draw one.
                    </div>
                ) : (
                    reversedNodes.map((node, index) => {
                        const isSelected = selectedIds.has(node.id);
                        // Default friendly name based on node type
                        const layerName = `Rectangle ${nodes.length - index}`;

                        return (
                            <div
                                key={node.id}
                                onClick={(e) => onSelectNode(node.id, e.shiftKey)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 16px',
                                    backgroundColor: isSelected ? '#0d99ff' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#cccccc',
                                    cursor: 'pointer',
                                    gap: 8,
                                    transition: 'background-color 0.1s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e2e';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {/* Node Type Icon */}
                                <Square
                                    size={14}
                                    style={{
                                        color: isSelected ? '#ffffff' : '#888888',
                                        flexShrink: 0,
                                    }}
                                />

                                {/* Layer Name */}
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
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


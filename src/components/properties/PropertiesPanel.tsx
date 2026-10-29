import React, { useState } from 'react';
import type { SceneNode, FrameNode, TextNode, PathNode, LineNode, MarkerType, HorizontalConstraint, VerticalConstraint } from '../../types/scene';
import { DEVICE_PRESETS, type DevicePreset } from '../../types/presets';
import type { ToolType } from '../toolbar/Toolbar';
import {
    Trash2,
    PanelRightClose,
    ChevronUp,
    ChevronDown,
    ChevronsUp,
    ChevronsDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    AlignHorizontalSpaceBetween,
    AlignVerticalSpaceBetween,
    Download,
    Plus,
    Eye,
    EyeOff,
} from 'lucide-react';
import type { AlignmentType, DistributionType } from '../../core/engine/AlignmentEngine';
import { measureTextLines } from '../../utils/text';
import { ExportEngine, type ExportFormat } from '../../core/engine/ExportEngine';

interface PropertiesPanelProps {
    selectedNode: SceneNode | null;
    selectedNodes?: SceneNode[];
    allNodes?: SceneNode[];
    onUpdate: (updates: Partial<SceneNode>) => void;
    onDelete: () => void;
    onAlign?: (alignment: AlignmentType) => void;
    onDistribute?: (distribution: DistributionType) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    onToggleCollapse?: () => void;
    activeTool?: ToolType;
    onInsertPreset?: (preset: DevicePreset) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    selectedNodes = [],
    allNodes = [],
    onUpdate,
    onDelete,
    onAlign,
    onDistribute,
    onMoveUp,
    onMoveDown,
    onBringToFront,
    onSendToBack,
    onToggleCollapse,
    activeTool,
    onInsertPreset,
}) => {
    const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        const targets = selectedNodes.length > 0 ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (targets.length === 0) return;

        setIsExporting(true);
        try {
            await ExportEngine.exportNodes(
                targets,
                { getAllNodes: () => allNodes },
                exportFormat,
                1
            );
        } finally {
            setIsExporting(false);
        }
    };
    if (!selectedNode) {
        return (
            <aside
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 240,
                    height: '100%',
                    backgroundColor: '#252525',
                    borderLeft: '1px solid #333333',
                    padding: 16,
                    color: '#888888',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0' }}>Properties</span>
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            title="Hide Properties (P)"
                            style={{
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
                            <PanelRightClose size={16} />
                        </button>
                    )}
                </div>
                {activeTool === 'frame' ? (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 600, color: '#e0e0e0', marginBottom: 4 }}>
                            Device Presets
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                            Click a preset to insert a frame, or drag on the canvas.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
                            {(['Desktop', 'Tablet', 'Mobile'] as const).map((cat) => (
                                <div key={cat}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                        {cat}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {DEVICE_PRESETS.filter(p => p.category === cat).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => onInsertPreset?.(p)}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: '#1e1e1e',
                                                    border: '1px solid #333',
                                                    borderRadius: 6,
                                                    padding: '8px 10px',
                                                    color: '#fff',
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = '#0d99ff';
                                                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = '#333';
                                                    e.currentTarget.style.backgroundColor = '#1e1e1e';
                                                }}
                                            >
                                                <span style={{ fontWeight: 500 }}>{p.name}</span>
                                                <span style={{ color: '#888', fontSize: 11 }}>{p.width} × {p.height}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p style={{ marginTop: 32, textAlign: 'center' }}>No layer selected</p>
                )}
            </aside>
        );
    }

    return (
        <aside
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 240,
                height: '100%',
                backgroundColor: '#252525',
                borderLeft: '1px solid #333333',
                padding: 16,
                color: '#ffffff',
                fontSize: 12,
                fontFamily: 'sans-serif',
                userSelect: 'none',
                boxSizing: 'border-box',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                    {selectedNodes.length > 1
                        ? `${selectedNodes.length} Layers Selected`
                        : selectedNode.type === 'path'
                        ? 'Vector'
                        : selectedNode.type === 'line'
                        ? ((selectedNode as LineNode).endMarker === 'arrow' ? 'Arrow' : 'Line')
                        : selectedNode.type === 'frame'
                        ? (selectedNode.name || 'Frame')
                        : selectedNode.type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {onBringToFront && (
                        <button
                            onClick={onBringToFront}
                            title="Bring to Front (Ctrl+])"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                padding: 3,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
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
                            <ChevronsUp size={14} />
                        </button>
                    )}

                    {onMoveUp && (
                        <button
                            onClick={onMoveUp}
                            title="Bring Forward (])"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                padding: 3,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
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
                            <ChevronUp size={14} />
                        </button>
                    )}

                    {onMoveDown && (
                        <button
                            onClick={onMoveDown}
                            title="Send Backward ([)"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                padding: 3,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
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
                            <ChevronDown size={14} />
                        </button>
                    )}

                    {onSendToBack && (
                        <button
                            onClick={onSendToBack}
                            title="Send to Back (Ctrl+[)"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                padding: 3,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
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
                            <ChevronsDown size={14} />
                        </button>
                    )}

                    <button
                        onClick={onDelete}
                        title="Delete Shape"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff5c5c',
                            cursor: 'pointer',
                            padding: 3,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 92, 92, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <Trash2 size={15} />
                    </button>
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            title="Hide Properties (P)"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888888',
                                cursor: 'pointer',
                                padding: 3,
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
                            <PanelRightClose size={16} />
                        </button>
                    )}
                </div>
            </div>


            <hr style={{ borderColor: '#333333', borderTop: 'none' }} />

            {/* Figma-style Alignment Bar (when multiple items or an item inside a parent frame is selected) */}
            {selectedNodes.length >= 2 && onAlign && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e1e1e', padding: '3px 4px', borderRadius: 4, border: '1px solid #333' }}>
                        <button
                            type="button"
                            title="Align Left (Option+A)"
                            onClick={() => onAlign('left')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignStartHorizontal size={14} />
                        </button>
                        <button
                            type="button"
                            title="Align Horizontal Center (Option+H)"
                            onClick={() => onAlign('center-horizontal')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignCenterHorizontal size={14} />
                        </button>
                        <button
                            type="button"
                            title="Align Right (Option+D)"
                            onClick={() => onAlign('right')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignEndHorizontal size={14} />
                        </button>
                        <div style={{ width: 1, height: 14, background: '#383838', margin: '0 1px' }} />
                        <button
                            type="button"
                            title="Align Top (Option+W)"
                            onClick={() => onAlign('top')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignStartVertical size={14} />
                        </button>
                        <button
                            type="button"
                            title="Align Vertical Center (Option+V)"
                            onClick={() => onAlign('center-vertical')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignCenterVertical size={14} />
                        </button>
                        <button
                            type="button"
                            title="Align Bottom (Option+S)"
                            onClick={() => onAlign('bottom')}
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                            <AlignEndVertical size={14} />
                        </button>

                        {/* Distribution buttons if 3 or more items are selected */}
                        {selectedNodes.length >= 3 && onDistribute && (
                            <>
                                <div style={{ width: 1, height: 14, background: '#383838', margin: '0 1px' }} />
                                <button
                                    type="button"
                                    title="Distribute Horizontal Spacing"
                                    onClick={() => onDistribute('horizontal')}
                                    style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                >
                                    <AlignHorizontalSpaceBetween size={14} />
                                </button>
                                <button
                                    type="button"
                                    title="Distribute Vertical Spacing"
                                    onClick={() => onDistribute('vertical')}
                                    style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                >
                                    <AlignVerticalSpaceBetween size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Position & Size Grid */}
            <div>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>Layout</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#888' }}>X</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.x)}
                            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#888' }}>Y</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.y)}
                            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#888' }}>W</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.width)}
                            onChange={(e) =>
                                onUpdate({
                                    width: Math.max(1, Number(e.target.value)),
                                    ...(selectedNode.type === 'text' ? { autoWidth: false } : {}),
                                })
                            }
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#888' }}>H</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.height)}
                            onChange={(e) =>
                                onUpdate({
                                    height: Math.max(1, Number(e.target.value)),
                                    ...(selectedNode.type === 'text' ? { autoWidth: false } : {}),
                                })
                            }
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4, gridColumn: 'span 2' }}>
                        <span style={{ color: '#888' }}>°</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.rotation || 0)}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                const normalized = ((val % 360) + 360) % 360;
                                onUpdate({ rotation: normalized });
                            }}
                            placeholder="0"
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                        <span style={{ color: '#666', fontSize: 11 }}>deg</span>
                    </label>
                </div>

                {/* Constraints (Visible when selected node is inside a frame) */}
                {selectedNode.parentId && (() => {
                    const parent = allNodes.find((n) => n.id === selectedNode.parentId);
                    if (parent && parent.type === 'frame') {
                        const currentConstraints = selectedNode.constraints || { horizontal: 'left', vertical: 'top' };
                        return (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #333' }}>
                                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>Constraints</div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {/* Visual 3x3 Pin Diagram */}
                                    <div
                                        style={{
                                            width: 52,
                                            height: 52,
                                            background: '#1e1e1e',
                                            border: '1px solid #383838',
                                            borderRadius: 4,
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {/* Center child mockup */}
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                background: '#2b2b2b',
                                                border: '1px dashed #555',
                                                borderRadius: 2,
                                            }}
                                        />

                                        {/* Active constraint pin indicator lines */}
                                        {/* Top Pin */}
                                        {(currentConstraints.vertical === 'top' || currentConstraints.vertical === 'top-bottom') && (
                                            <div style={{ position: 'absolute', top: 3, width: 2, height: 13, background: '#0d99ff' }} />
                                        )}
                                        {/* Bottom Pin */}
                                        {(currentConstraints.vertical === 'bottom' || currentConstraints.vertical === 'top-bottom') && (
                                            <div style={{ position: 'absolute', bottom: 3, width: 2, height: 13, background: '#0d99ff' }} />
                                        )}
                                        {/* Left Pin */}
                                        {(currentConstraints.horizontal === 'left' || currentConstraints.horizontal === 'left-right') && (
                                            <div style={{ position: 'absolute', left: 3, height: 2, width: 13, background: '#0d99ff' }} />
                                        )}
                                        {/* Right Pin */}
                                        {(currentConstraints.horizontal === 'right' || currentConstraints.horizontal === 'left-right') && (
                                            <div style={{ position: 'absolute', right: 3, height: 2, width: 13, background: '#0d99ff' }} />
                                        )}
                                        {/* Center Crosshairs */}
                                        {currentConstraints.horizontal === 'center' && (
                                            <div style={{ position: 'absolute', width: 28, height: 1, background: '#0d99ff', opacity: 0.8 }} />
                                        )}
                                        {currentConstraints.vertical === 'center' && (
                                            <div style={{ position: 'absolute', height: 28, width: 1, background: '#0d99ff', opacity: 0.8 }} />
                                        )}
                                    </div>

                                    {/* Select Dropdowns */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                        <select
                                            value={currentConstraints.horizontal}
                                            onChange={(e) => {
                                                onUpdate({
                                                    constraints: {
                                                        ...currentConstraints,
                                                        horizontal: e.target.value as HorizontalConstraint,
                                                    },
                                                });
                                            }}
                                            style={{
                                                background: '#1e1e1e',
                                                border: '1px solid #333',
                                                color: '#fff',
                                                padding: '4px 6px',
                                                borderRadius: 4,
                                                fontSize: 11,
                                                outline: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                            <option value="left-right">Left & Right</option>
                                            <option value="center">Center</option>
                                            <option value="scale">Scale</option>
                                        </select>

                                        <select
                                            value={currentConstraints.vertical}
                                            onChange={(e) => {
                                                onUpdate({
                                                    constraints: {
                                                        ...currentConstraints,
                                                        vertical: e.target.value as VerticalConstraint,
                                                    },
                                                });
                                            }}
                                            style={{
                                                background: '#1e1e1e',
                                                border: '1px solid #333',
                                                color: '#fff',
                                                padding: '4px 6px',
                                                borderRadius: 4,
                                                fontSize: 11,
                                                outline: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="top">Top</option>
                                            <option value="bottom">Bottom</option>
                                            <option value="top-bottom">Top & Bottom</option>
                                            <option value="center">Center</option>
                                            <option value="scale">Scale</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Frame Properties */}
            {selectedNode.type === 'frame' && (() => {
                const frameNode = selectedNode as FrameNode;
                return (
                    <div>
                        <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>Frame</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Frame Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={frameNode.name || 'Frame'}
                                    onChange={(e) => onUpdate({ name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: '#1e1e1e',
                                        border: '1px solid #333',
                                        color: '#fff',
                                        padding: '5px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Preset Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    Device Preset
                                </label>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const preset = DEVICE_PRESETS.find((p) => p.id === e.target.value);
                                        if (preset) {
                                            onUpdate({
                                                width: preset.width,
                                                height: preset.height,
                                                name: preset.name,
                                            });
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        background: '#1e1e1e',
                                        border: '1px solid #333',
                                        color: '#fff',
                                        padding: '5px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="" disabled>Choose preset...</option>
                                    <optgroup label="Desktop">
                                        {DEVICE_PRESETS.filter(p => p.category === 'Desktop').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.width} × {p.height})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Tablet">
                                        {DEVICE_PRESETS.filter(p => p.category === 'Tablet').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.width} × {p.height})</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Mobile">
                                        {DEVICE_PRESETS.filter(p => p.category === 'Mobile').map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.width} × {p.height})</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Clip Content Toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                                <input
                                    type="checkbox"
                                    checked={frameNode.clipContent !== false}
                                    onChange={(e) => onUpdate({ clipContent: e.target.checked })}
                                    style={{ accentColor: '#0d99ff', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 12, color: '#e0e0e0' }}>Clip content</span>
                            </label>
                        </div>
                    </div>
                );
            })()}

            {/* Corner Radius (Applicable for rectangles and frames) */}
            {(selectedNode.type === 'rectangle' || selectedNode.type === 'frame') && (
                <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#aaaaaa' }}>Corner Radius</span>
                        <input
                            type="number"
                            min={0}
                            value={selectedNode.cornerRadius || 0}
                            onChange={(e) => onUpdate({ cornerRadius: Math.max(0, Number(e.target.value)) })}
                            style={{ width: 60, background: '#1e1e1e', border: '1px solid #333', color: '#fff', padding: '4px 6px', borderRadius: 4, outline: 'none' }}
                        />
                    </label>
                </div>
            )}

            {/* Text Properties (Only applicable for text) */}
            {selectedNode.type === 'text' && (() => {
                const textNode = selectedNode as TextNode;
                const updateTextProperty = (updates: Partial<TextNode>) => {
                    const nextText = updates.text !== undefined ? updates.text : textNode.text;
                    const nextSize = updates.fontSize !== undefined ? updates.fontSize : textNode.fontSize;
                    const nextFamily = updates.fontFamily !== undefined ? updates.fontFamily : textNode.fontFamily;
                    const nextWeight = updates.fontWeight !== undefined ? updates.fontWeight : textNode.fontWeight;
                    const metrics = measureTextLines(
                        nextText,
                        nextSize,
                        nextFamily,
                        nextWeight,
                        textNode.lineHeight,
                        textNode.autoWidth ? undefined : textNode.width
                    );
                    onUpdate({
                        ...updates,
                        width: textNode.autoWidth ? metrics.width : textNode.width,
                        height: textNode.autoWidth ? metrics.height : textNode.height,
                    });
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontWeight: 500, color: '#aaaaaa' }}>Typography</div>

                        {/* Font Family */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                                value={textNode.fontFamily || 'Inter'}
                                onChange={(e) => updateTextProperty({ fontFamily: e.target.value })}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid #333',
                                    color: '#ffffff',
                                    padding: '5px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Courier New">Courier New</option>
                                <option value="Times New Roman">Times New Roman</option>
                            </select>
                        </div>

                        {/* Font Weight and Size */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                            <select
                                value={String(textNode.fontWeight || 400)}
                                onChange={(e) => updateTextProperty({ fontWeight: Number(e.target.value) })}
                                style={{
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid #333',
                                    color: '#ffffff',
                                    padding: '5px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="400">Regular</option>
                                <option value="500">Medium</option>
                                <option value="600">SemiBold</option>
                                <option value="700">Bold</option>
                            </select>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4, border: '1px solid #333' }}>
                                <input
                                    type="number"
                                    min={8}
                                    max={256}
                                    value={textNode.fontSize || 16}
                                    onChange={(e) => updateTextProperty({ fontSize: Math.max(8, Number(e.target.value)) })}
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 12 }}
                                />
                                <span style={{ color: '#888', fontSize: 11 }}>px</span>
                            </label>
                        </div>

                        {/* Text Alignment: Horizontal & Vertical */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            {/* Horizontal Alignment */}
                            <div style={{ display: 'flex', background: '#1e1e1e', borderRadius: 4, border: '1px solid #333', overflow: 'hidden' }}>
                                <button
                                    onClick={() => updateTextProperty({ textAlign: 'left' })}
                                    title="Align Left"
                                    style={{
                                        background: (textNode.textAlign || 'left') === 'left' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: (textNode.textAlign || 'left') === 'left' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignLeft size={13} />
                                </button>
                                <button
                                    onClick={() => updateTextProperty({ textAlign: 'center' })}
                                    title="Align Center"
                                    style={{
                                        background: textNode.textAlign === 'center' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: textNode.textAlign === 'center' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignCenter size={13} />
                                </button>
                                <button
                                    onClick={() => updateTextProperty({ textAlign: 'right' })}
                                    title="Align Right"
                                    style={{
                                        background: textNode.textAlign === 'right' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: textNode.textAlign === 'right' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignRight size={13} />
                                </button>
                            </div>

                            {/* Vertical Alignment */}
                            <div style={{ display: 'flex', background: '#1e1e1e', borderRadius: 4, border: '1px solid #333', overflow: 'hidden' }}>
                                <button
                                    onClick={() => updateTextProperty({ verticalAlign: 'top' })}
                                    title="Align Top"
                                    style={{
                                        background: (textNode.verticalAlign || 'top') === 'top' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: (textNode.verticalAlign || 'top') === 'top' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignVerticalJustifyStart size={13} />
                                </button>
                                <button
                                    onClick={() => updateTextProperty({ verticalAlign: 'middle' })}
                                    title="Align Middle"
                                    style={{
                                        background: textNode.verticalAlign === 'middle' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: textNode.verticalAlign === 'middle' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignVerticalJustifyCenter size={13} />
                                </button>
                                <button
                                    onClick={() => updateTextProperty({ verticalAlign: 'bottom' })}
                                    title="Align Bottom"
                                    style={{
                                        background: textNode.verticalAlign === 'bottom' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: textNode.verticalAlign === 'bottom' ? '#ffffff' : '#888888',
                                        padding: '5px 7px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignVerticalJustifyEnd size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Vector Path Details (Anchor count, Closed/Open toggle) */}
            {selectedNode.type === 'path' && (() => {
                const pathNode = selectedNode as PathNode;
                return (
                    <div>
                        <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Path</span>
                            <span style={{ fontSize: 11, color: '#888' }}>
                                {pathNode.anchors?.length || 0} points
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                onClick={() => onUpdate({ closed: !pathNode.closed })}
                                style={{
                                    flex: 1,
                                    background: pathNode.closed ? '#0d99ff' : '#1e1e1e',
                                    color: pathNode.closed ? '#ffffff' : '#aaaaaa',
                                    border: '1px solid #333',
                                    borderRadius: 4,
                                    padding: '5px 8px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                {pathNode.closed ? 'Closed Path' : 'Open Path'}
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Line / Arrow Details */}
            {selectedNode.type === 'line' && (() => {
                const lineNode = selectedNode as LineNode;
                const length = Math.round(Math.hypot(lineNode.x2 - lineNode.x1, lineNode.y2 - lineNode.y1));
                const angle = Math.round((Math.atan2(lineNode.y2 - lineNode.y1, lineNode.x2 - lineNode.x1) * 180) / Math.PI);

                const handleAngleChange = (newAngleDeg: number) => {
                    const curLen = Math.max(1, Math.hypot(lineNode.x2 - lineNode.x1, lineNode.y2 - lineNode.y1));
                    const startX = lineNode.x + lineNode.x1;
                    const startY = lineNode.y + lineNode.y1;
                    const rad = (newAngleDeg * Math.PI) / 180;
                    const endX = startX + Math.cos(rad) * curLen;
                    const endY = startY + Math.sin(rad) * curLen;

                    const minX = Math.min(startX, endX);
                    const minY = Math.min(startY, endY);
                    const width = Math.max(1, Math.abs(endX - startX));
                    const height = Math.max(1, Math.abs(endY - startY));

                    onUpdate({
                        x: minX,
                        y: minY,
                        width,
                        height,
                        x1: startX - minX,
                        y1: startY - minY,
                        x2: endX - minX,
                        y2: endY - minY,
                    });
                };

                const handleLengthChange = (newLength: number) => {
                    const validLength = Math.max(1, newLength);
                    const startX = lineNode.x + lineNode.x1;
                    const startY = lineNode.y + lineNode.y1;
                    const rad = Math.atan2(lineNode.y2 - lineNode.y1, lineNode.x2 - lineNode.x1);
                    const endX = startX + Math.cos(rad) * validLength;
                    const endY = startY + Math.sin(rad) * validLength;

                    const minX = Math.min(startX, endX);
                    const minY = Math.min(startY, endY);
                    const width = Math.max(1, Math.abs(endX - startX));
                    const height = Math.max(1, Math.abs(endY - startY));

                    onUpdate({
                        x: minX,
                        y: minY,
                        width,
                        height,
                        x1: startX - minX,
                        y1: startY - minY,
                        x2: endX - minX,
                        y2: endY - minY,
                    });
                };

                return (
                    <div>
                        <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>
                            Line Geometry
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    Length (px)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4, border: '1px solid #333' }}>
                                    <span style={{ color: '#888', fontSize: 11 }}>L</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={length}
                                        onChange={(e) => handleLengthChange(Number(e.target.value))}
                                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 12 }}
                                    />
                                </label>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    Angle (°)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4, border: '1px solid #333' }}>
                                    <span style={{ color: '#888', fontSize: 11 }}>°</span>
                                    <input
                                        type="number"
                                        value={angle}
                                        onChange={(e) => handleAngleChange(Number(e.target.value))}
                                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 12 }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>
                            Endpoints
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    Start Point
                                </label>
                                <select
                                    value={lineNode.startMarker || 'none'}
                                    onChange={(e) => onUpdate({ startMarker: e.target.value as MarkerType })}
                                    style={{
                                        width: '100%',
                                        background: '#1e1e1e',
                                        border: '1px solid #333',
                                        color: '#fff',
                                        padding: '4px 6px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="none">None</option>
                                    <option value="arrow">Arrow</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="circle">Circle</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, color: '#888888', marginBottom: 4 }}>
                                    End Point
                                </label>
                                <select
                                    value={lineNode.endMarker || 'none'}
                                    onChange={(e) => onUpdate({ endMarker: e.target.value as MarkerType })}
                                    style={{
                                        width: '100%',
                                        background: '#1e1e1e',
                                        border: '1px solid #333',
                                        color: '#fff',
                                        padding: '4px 6px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        outline: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="none">None</option>
                                    <option value="arrow">Arrow</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="circle">Circle</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <hr style={{ borderColor: '#333333', borderTop: 'none' }} />

            {/* Stroke */}
            <div>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Stroke</span>
                    {selectedNode.stroke && (
                        <button
                            onClick={() => onUpdate({ stroke: undefined, strokeWidth: 0 })}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                fontSize: 11,
                                padding: 0,
                            }}
                            title="Remove stroke"
                        >
                            Remove
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="color"
                        value={selectedNode.stroke || '#ffffff'}
                        onChange={(e) => onUpdate({ stroke: e.target.value, strokeWidth: selectedNode.strokeWidth || 1 })}
                        style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: 'transparent',
                        }}
                    />
                    <input
                        type="text"
                        value={(selectedNode.stroke || '#FFFFFF').toUpperCase()}
                        onChange={(e) => onUpdate({ stroke: e.target.value, strokeWidth: selectedNode.strokeWidth || 1 })}
                        style={{
                            flex: 1,
                            background: '#1e1e1e',
                            border: '1px solid #333',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                            outline: 'none',
                            fontSize: 12,
                        }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4, border: '1px solid #333', width: 62 }}>
                        <input
                            type="number"
                            min={1}
                            max={64}
                            value={selectedNode.strokeWidth || 1}
                            onChange={(e) => onUpdate({ strokeWidth: Math.max(1, Number(e.target.value)), stroke: selectedNode.stroke || '#ffffff' })}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: 12 }}
                        />
                        <span style={{ color: '#888', fontSize: 11 }}>px</span>
                    </label>
                </div>
            </div>

            {/* Fill Color (not applicable for lines) */}
            {selectedNode.type !== 'line' && (
                <>
                    <hr style={{ borderColor: '#333333', borderTop: 'none' }} />
                    <div>
                        <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Fill</span>
                            {selectedNode.type === 'path' && (
                                <button
                                    onClick={() => onUpdate({ fill: selectedNode.fill === 'transparent' ? '#ffffff' : 'transparent' })}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#0d99ff',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        padding: 0,
                                    }}
                                >
                                    {selectedNode.fill === 'transparent' ? 'Add fill' : 'Remove fill'}
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="color"
                                value={selectedNode.fill === 'transparent' ? '#000000' : selectedNode.fill}
                                onChange={(e) => onUpdate({ fill: e.target.value })}
                                style={{
                                    width: 28,
                                    height: 28,
                                    padding: 0,
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    background: 'transparent',
                                }}
                            />
                            <input
                                type="text"
                                value={selectedNode.fill.toUpperCase()}
                                onChange={(e) => onUpdate({ fill: e.target.value })}
                                style={{
                                    flex: 1,
                                    background: '#1e1e1e',
                                    border: '1px solid #333',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                    fontSize: 12,
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Effects Section (Figma style Drop Shadow & Layer Blur) */}
            <hr style={{ borderColor: '#333333', borderTop: 'none' }} />
            <div>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Effects</span>
                    <button
                        type="button"
                        onClick={() => {
                            const currentEffects = selectedNode.effects ? [...selectedNode.effects] : [];
                            currentEffects.push({
                                type: 'drop-shadow',
                                color: 'rgba(0, 0, 0, 0.25)',
                                offsetX: 0,
                                offsetY: 4,
                                blur: 8,
                                visible: true,
                            });
                            onUpdate({ effects: currentEffects });
                        }}
                        title="Add Effect"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0d99ff',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 4,
                        }}
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {(!selectedNode.effects || selectedNode.effects.length === 0) ? (
                    <div style={{ fontSize: 11, color: '#666' }}>No effects applied</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedNode.effects.map((effect, idx) => (
                            <div key={idx} style={{ background: '#1e1e1e', padding: 8, borderRadius: 4, border: '1px solid #333' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <select
                                        value={effect.type}
                                        onChange={(e) => {
                                            const nextEffects = [...(selectedNode.effects || [])];
                                            const nextType = e.target.value as 'drop-shadow' | 'layer-blur';
                                            if (nextType === 'layer-blur') {
                                                nextEffects[idx] = { type: 'layer-blur', blur: 4, visible: true };
                                            } else {
                                                nextEffects[idx] = { type: 'drop-shadow', color: 'rgba(0,0,0,0.25)', offsetX: 0, offsetY: 4, blur: 8, visible: true };
                                            }
                                            onUpdate({ effects: nextEffects });
                                        }}
                                        style={{
                                            background: '#2b2b2b',
                                            color: '#fff',
                                            border: '1px solid #444',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            padding: '2px 4px',
                                            outline: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="drop-shadow">Drop Shadow</option>
                                        <option value="layer-blur">Layer Blur</option>
                                    </select>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextEffects = [...(selectedNode.effects || [])];
                                                nextEffects[idx] = { ...effect, visible: effect.visible === false ? true : false };
                                                onUpdate({ effects: nextEffects });
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: effect.visible === false ? '#666' : '#fff', cursor: 'pointer', padding: 2 }}
                                        >
                                            {effect.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextEffects = (selectedNode.effects || []).filter((_, i) => i !== idx);
                                                onUpdate({ effects: nextEffects });
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 2 }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {effect.type === 'drop-shadow' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888' }}>
                                            X
                                            <input
                                                type="number"
                                                value={effect.offsetX}
                                                onChange={(e) => {
                                                    const nextEffects = [...(selectedNode.effects || [])];
                                                    nextEffects[idx] = { ...effect, offsetX: Number(e.target.value) };
                                                    onUpdate({ effects: nextEffects });
                                                }}
                                                style={{ width: '100%', background: '#2b2b2b', border: '1px solid #444', borderRadius: 3, color: '#fff', padding: '2px 4px', fontSize: 11, outline: 'none' }}
                                            />
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888' }}>
                                            Y
                                            <input
                                                type="number"
                                                value={effect.offsetY}
                                                onChange={(e) => {
                                                    const nextEffects = [...(selectedNode.effects || [])];
                                                    nextEffects[idx] = { ...effect, offsetY: Number(e.target.value) };
                                                    onUpdate({ effects: nextEffects });
                                                }}
                                                style={{ width: '100%', background: '#2b2b2b', border: '1px solid #444', borderRadius: 3, color: '#fff', padding: '2px 4px', fontSize: 11, outline: 'none' }}
                                            />
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888' }}>
                                            Blur
                                            <input
                                                type="number"
                                                value={effect.blur}
                                                min={0}
                                                onChange={(e) => {
                                                    const nextEffects = [...(selectedNode.effects || [])];
                                                    nextEffects[idx] = { ...effect, blur: Math.max(0, Number(e.target.value)) };
                                                    onUpdate({ effects: nextEffects });
                                                }}
                                                style={{ width: '100%', background: '#2b2b2b', border: '1px solid #444', borderRadius: 3, color: '#fff', padding: '2px 4px', fontSize: 11, outline: 'none' }}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888' }}>
                                            Blur Radius
                                            <input
                                                type="number"
                                                value={effect.blur}
                                                min={0}
                                                onChange={(e) => {
                                                    const nextEffects = [...(selectedNode.effects || [])];
                                                    nextEffects[idx] = { ...effect, blur: Math.max(0, Number(e.target.value)) };
                                                    onUpdate({ effects: nextEffects });
                                                }}
                                                style={{ width: '100%', background: '#2b2b2b', border: '1px solid #444', borderRadius: 3, color: '#fff', padding: '2px 4px', fontSize: 11, outline: 'none' }}
                                            />
                                            <span style={{ fontSize: 10 }}>px</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Export Section (Figma style) */}
            <hr style={{ borderColor: '#333333', borderTop: 'none', margin: '16px 0 12px 0' }} />
            <div>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Export</span>
                    <span style={{ fontSize: 11, color: '#666' }}>
                        {selectedNodes.length > 1 ? `${selectedNodes.length} items` : selectedNode.type}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {/* Format Selector */}
                    <div style={{ flex: 1, display: 'flex', background: '#1e1e1e', borderRadius: 4, border: '1px solid #333' }}>
                        {(['png', 'svg'] as ExportFormat[]).map((fmt) => (
                            <button
                                key={fmt}
                                type="button"
                                onClick={() => setExportFormat(fmt)}
                                style={{
                                    flex: 1,
                                    background: exportFormat === fmt ? '#0d99ff' : 'transparent',
                                    color: exportFormat === fmt ? '#ffffff' : '#888888',
                                    border: 'none',
                                    borderRadius: 3,
                                    padding: '5px 0',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Export Action Button */}
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: '#2e2e2e',
                        border: '1px solid #444',
                        borderRadius: 4,
                        color: '#ffffff',
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isExporting ? 'wait' : 'pointer',
                        transition: 'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#383838';
                        e.currentTarget.style.borderColor = '#0d99ff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2e2e2e';
                        e.currentTarget.style.borderColor = '#444';
                    }}
                >
                    <Download size={14} />
                    <span>{isExporting ? 'Exporting...' : `Export ${selectedNodes.length > 1 ? 'Selection' : selectedNode.name || selectedNode.type}`}</span>
                </button>
            </div>
        </aside>
    );
};
import React from 'react';
import type { SceneNode } from '../../types/scene';
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
} from 'lucide-react';
import { measureTextLines } from '../../utils/text';
import type { TextNode } from '../../types/scene';

interface PropertiesPanelProps {
    selectedNode: SceneNode | null;
    onUpdate: (updates: Partial<SceneNode>) => void;
    onDelete: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    onToggleCollapse?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onBringToFront,
    onSendToBack,
    onToggleCollapse,
}) => {
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
                <p style={{ marginTop: 32, textAlign: 'center' }}>No layer selected</p>
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
                    {selectedNode.type}
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
                            onChange={(e) => onUpdate({ width: Math.max(1, Number(e.target.value)) })}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e1e1e', padding: '4px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#888' }}>H</span>
                        <input
                            type="number"
                            value={Math.round(selectedNode.height)}
                            onChange={(e) => onUpdate({ height: Math.max(1, Number(e.target.value)) })}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {/* Corner Radius (Only applicable for rectangles) */}
            {selectedNode.type === 'rectangle' && (
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
                        height: metrics.height,
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

                        {/* Text Alignment */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888', fontSize: 11 }}>Alignment</span>
                            <div style={{ display: 'flex', background: '#1e1e1e', borderRadius: 4, border: '1px solid #333', overflow: 'hidden' }}>
                                <button
                                    onClick={() => updateTextProperty({ textAlign: 'left' })}
                                    title="Align Left"
                                    style={{
                                        background: (textNode.textAlign || 'left') === 'left' ? '#0d99ff' : 'transparent',
                                        border: 'none',
                                        color: (textNode.textAlign || 'left') === 'left' ? '#ffffff' : '#888888',
                                        padding: '5px 8px',
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
                                        padding: '5px 8px',
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
                                        padding: '5px 8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AlignRight size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <hr style={{ borderColor: '#333333', borderTop: 'none' }} />

            {/* Fill Color */}
            <div>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#aaaaaa' }}>Fill</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="color"
                        value={selectedNode.fill}
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
                        }}
                    />
                </div>
            </div>
        </aside>
    );
};
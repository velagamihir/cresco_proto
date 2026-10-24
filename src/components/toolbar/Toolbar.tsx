import React, { useState } from 'react';
import { MousePointer2, Hand, MessageCircle, Square } from 'lucide-react';

export type ToolType = 'select' | 'hand' | 'comment' | 'rectangle';

interface ToolbarProps {
    activeTool: ToolType;
    onSelectTool: (tool: ToolType) => void;
}

interface ToolItem {
    id: ToolType;
    label: string;
    shortcut: string;
    icon: React.ReactNode;
}

const TOOLS: ToolItem[] = [
    {
        id: 'select',
        label: 'Move',
        shortcut: 'V',
        icon: <MousePointer2 size={15} strokeWidth={1.8} />,
    },
    {
        id: 'hand',
        label: 'Hand tool',
        shortcut: 'H',
        icon: <Hand size={15} strokeWidth={1.8} />,
    },
    {
        id: 'comment',
        label: 'Comment',
        shortcut: 'C',
        icon: <MessageCircle size={15} strokeWidth={1.8} />,
    },
    {
        id: 'rectangle',
        label: 'Rectangle',
        shortcut: 'R',
        icon: <Square size={15} strokeWidth={1.8} />,
    },
];

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool }) => {
    const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#222222',
                borderRadius: 10,
                padding: 3,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                zIndex: 20,
                userSelect: 'none',
            }}
        >
            {TOOLS.map((tool) => {
                const isActive = activeTool === tool.id;
                const isHovered = hoveredTool === tool.id;

                return (
                    <button
                        key={tool.id}
                        type="button"
                        onClick={() => onSelectTool(tool.id)}
                        onMouseEnter={() => setHoveredTool(tool.id)}
                        onMouseLeave={() => setHoveredTool(null)}
                        aria-label={`${tool.label} (${tool.shortcut})`}
                        style={{
                            position: 'relative',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isActive
                                ? '#0d99ff'
                                : isHovered
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'background 0.12s ease',
                            outline: 'none',
                        }}
                    >
                        {tool.icon}

                        {/* Figma-style Tooltip: floats above bottom toolbar */}
                        {isHovered && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 'calc(100% + 6px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: '#181818',
                                    color: '#ffffff',
                                    fontSize: 10.5,
                                    fontWeight: 500,
                                    padding: '4px 7px',
                                    borderRadius: 5,
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 100,
                                }}
                            >
                                <span>{tool.label}</span>
                                <kbd
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        padding: '1px 4px',
                                        borderRadius: 3,
                                        color: '#d1d1d1',
                                        fontSize: 9.5,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {tool.shortcut}
                                </kbd>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
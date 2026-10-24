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
        icon: <MousePointer2 size={18} strokeWidth={2} />,
    },
    {
        id: 'hand',
        label: 'Hand tool',
        shortcut: 'H',
        icon: <Hand size={18} strokeWidth={2} />,
    },
    {
        id: 'comment',
        label: 'Comment',
        shortcut: 'C',
        icon: <MessageCircle size={18} strokeWidth={2} />,
    },
    {
        id: 'rectangle',
        label: 'Rectangle',
        shortcut: 'R',
        icon: <Square size={18} strokeWidth={2} />,
    },
];

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool }) => {
    const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);

    return (
        <div
            style={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#242424',
                borderRadius: 12,
                padding: 4,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
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
                            width: 34,
                            height: 34,
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
                            borderRadius: 8,
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'background 0.12s ease',
                            outline: 'none',
                        }}
                    >
                        {tool.icon}

                        {/* Figma-style Tooltip */}
                        {isHovered && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: '#181818',
                                    color: '#ffffff',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 100,
                                }}
                            >
                                <span>{tool.label}</span>
                                <kbd
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        padding: '1px 5px',
                                        borderRadius: 3,
                                        color: '#d1d1d1',
                                        fontSize: 10,
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
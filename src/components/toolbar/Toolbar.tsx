import React from 'react';
import { MousePointer, Square } from 'lucide-react';

export type ToolType = 'select' | 'rectangle';

interface ToolbarProps {
    activeTool: ToolType;
    onSelectTool: (tool: ToolType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool }) => {
    return (
        <div
            style={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2c2c2c',
                borderRadius: 8,
                padding: '4px 6px',
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                zIndex: 10,
                userSelect: 'none',
            }}
        >
            <button
                onClick={() => onSelectTool('select')}
                title="Move Tool (V)"
                style={{
                    background: activeTool === 'select' ? '#0d99ff' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 500,
                }}
            >
                <MousePointer size={16} />
                <span>V</span>
            </button>

            <button
                onClick={() => onSelectTool('rectangle')}
                title="Rectangle Tool (R)"
                style={{
                    background: activeTool === 'rectangle' ? '#0d99ff' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 500,
                }}
            >
                <Square size={16} />
                <span>R</span>
            </button>
        </div>
    );
};
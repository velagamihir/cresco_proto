import type { Point } from './camera';

export type NodeType = 'rectangle' | 'ellipse' | 'frame' | 'text' | 'path' | 'line';

export interface DropShadowEffect {
    type: 'drop-shadow';
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread?: number;
    visible?: boolean;
}

export interface LayerBlurEffect {
    type: 'layer-blur';
    blur: number;
    visible?: boolean;
}

export type LayerEffect = DropShadowEffect | LayerBlurEffect;

export interface BaseNode {
    id: string;
    type: NodeType;
    name?: string;
    parentId?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number; // In degrees (-180 to 180 or 0 to 360)
    opacity?: number; // 0 to 1
    effects?: LayerEffect[];
}

export interface RectangleNode extends BaseNode {
    type: 'rectangle';
    cornerRadius?: number;
}

export interface EllipseNode extends BaseNode {
    type: 'ellipse';
}

export type LayoutMode = 'none' | 'horizontal' | 'vertical';
export type LayoutAlign = 'start' | 'center' | 'end';

export interface FrameNode extends BaseNode {
    type: 'frame';
    cornerRadius?: number;
    clipContent?: boolean;
    layoutMode?: LayoutMode;
    itemSpacing?: number;
    padding?: number;
    alignItems?: LayoutAlign;
}

export interface TextNode extends BaseNode {
    type: 'text';
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number | string;
    textAlign: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    lineHeight?: number;
    autoWidth?: boolean;
}

export interface VectorAnchor {
    x: number;
    y: number;
    handleIn?: Point;
    handleOut?: Point;
}

export interface PathNode extends BaseNode {
    type: 'path';
    anchors: VectorAnchor[];
    closed: boolean;
}

export type MarkerType = 'none' | 'arrow' | 'triangle' | 'circle';

export interface LineNode extends BaseNode {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    startMarker?: MarkerType;
    endMarker?: MarkerType;
}

export type SceneNode = RectangleNode | EllipseNode | FrameNode | TextNode | PathNode | LineNode;
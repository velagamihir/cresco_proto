import type { FrameNode, SceneNode } from '../../types/scene';
import { SceneGraph } from '../scene/SceneGraph';

/**
 * Computes and applies flexbox-like Auto Layout positioning for children inside frames.
 */
export class AutoLayoutEngine {
  /**
   * Re-evaluates Auto Layout for a specific frame or all frames across the SceneGraph.
   */
  public static compute(sceneGraph: SceneGraph, targetFrameId?: string): void {
    const allNodes = sceneGraph.getAllNodes();
    const frames = allNodes.filter(
      (n): n is FrameNode => n.type === 'frame' && (!targetFrameId || n.id === targetFrameId)
    );

    for (const frame of frames) {
      if (!frame.layoutMode || frame.layoutMode === 'none') {
        continue;
      }

      // Collect direct child elements in layer order
      const children = allNodes.filter((n) => n.parentId === frame.id);
      if (children.length === 0) continue;

      const padding = frame.padding ?? 16;
      const spacing = frame.itemSpacing ?? 12;
      const align = frame.alignItems ?? 'start';

      if (frame.layoutMode === 'horizontal') {
        let cursorX = frame.x + padding;
        let maxHeight = 0;

        for (const child of children) {
          let childY = frame.y + padding;
          if (align === 'center') {
            childY = frame.y + (frame.height - child.height) / 2;
          } else if (align === 'end') {
            childY = frame.y + frame.height - padding - child.height;
          }

          if (child.x !== cursorX || child.y !== childY) {
            sceneGraph.updateNode(child.id, {
              x: cursorX,
              y: childY,
            });
          }

          cursorX += child.width + spacing;
          maxHeight = Math.max(maxHeight, child.height);
        }
      } else if (frame.layoutMode === 'vertical') {
        let cursorY = frame.y + padding;
        let maxWidth = 0;

        for (const child of children) {
          let childX = frame.x + padding;
          if (align === 'center') {
            childX = frame.x + (frame.width - child.width) / 2;
          } else if (align === 'end') {
            childX = frame.x + frame.width - padding - child.width;
          }

          if (child.x !== childX || child.y !== cursorY) {
            sceneGraph.updateNode(child.id, {
              x: childX,
              y: cursorY,
            });
          }

          cursorY += child.height + spacing;
          maxWidth = Math.max(maxWidth, child.width);
        }
      }
    }
  }

  /**
   * Resizes a frame to hug its children based on padding and item spacing.
   */
  public static hugContents(frame: FrameNode, children: SceneNode[]): { width: number; height: number } {
    if (children.length === 0) return { width: frame.width, height: frame.height };

    const padding = frame.padding ?? 16;
    const spacing = frame.itemSpacing ?? 12;

    if (frame.layoutMode === 'horizontal') {
      const totalWidth = children.reduce((acc, c) => acc + c.width, 0) + (children.length - 1) * spacing + padding * 2;
      const maxHeight = Math.max(...children.map((c) => c.height)) + padding * 2;
      return { width: Math.max(50, totalWidth), height: Math.max(30, maxHeight) };
    } else if (frame.layoutMode === 'vertical') {
      const totalHeight = children.reduce((acc, c) => acc + c.height, 0) + (children.length - 1) * spacing + padding * 2;
      const maxWidth = Math.max(...children.map((c) => c.width)) + padding * 2;
      return { width: Math.max(50, maxWidth), height: Math.max(30, totalHeight) };
    }

    return { width: frame.width, height: frame.height };
  }
}

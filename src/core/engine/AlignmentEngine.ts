import { SceneGraph } from '../scene/SceneGraph';
import type { SceneNode } from '../../types/scene';
import type { TransformRecord } from '../history/commands/TransformNodeCommand';

export type AlignmentType =
  | 'left'
  | 'center-horizontal'
  | 'right'
  | 'top'
  | 'center-vertical'
  | 'bottom';

export type DistributionType = 'horizontal' | 'vertical';

export class AlignmentEngine {
  /**
   * Aligns selected nodes relative to their collective bounding box.
   */
  public static alignNodes(
    sceneGraph: SceneGraph,
    selectedNodes: SceneNode[],
    alignment: AlignmentType
  ): TransformRecord[] {
    if (selectedNodes.length <= 1) return [];

    // 1. Calculate collective bounding box of all selected nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of selectedNodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const centerX = minX + boundsWidth / 2;
    const centerY = minY + boundsHeight / 2;

    const records: TransformRecord[] = [];

    // 2. Reposition each node based on target alignment
    for (const node of selectedNodes) {
      let targetX = node.x;
      let targetY = node.y;

      switch (alignment) {
        case 'left':
          targetX = minX;
          break;
        case 'center-horizontal':
          targetX = centerX - node.width / 2;
          break;
        case 'right':
          targetX = maxX - node.width;
          break;
        case 'top':
          targetY = minY;
          break;
        case 'center-vertical':
          targetY = centerY - node.height / 2;
          break;
        case 'bottom':
          targetY = maxY - node.height;
          break;
      }

      if (targetX !== node.x || targetY !== node.y) {
        records.push({
          id: node.id,
          before: {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            rotation: node.rotation,
          },
          after: {
            x: targetX,
            y: targetY,
            width: node.width,
            height: node.height,
            rotation: node.rotation,
          },
        });
        sceneGraph.updateNode(node.id, { x: targetX, y: targetY });
      }
    }

    return records;
  }

  /**
   * Distributes spacing evenly between 3 or more selected nodes along an axis.
   */
  public static distributeNodes(
    sceneGraph: SceneGraph,
    selectedNodes: SceneNode[],
    distribution: DistributionType
  ): TransformRecord[] {
    if (selectedNodes.length < 3) return [];

    const records: TransformRecord[] = [];

    if (distribution === 'horizontal') {
      // Sort nodes from left to right by their starting X
      const sorted = [...selectedNodes].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      // Total span between first node's left edge and last node's right edge
      const totalSpan = (last.x + last.width) - first.x;
      const totalItemWidth = sorted.reduce((sum, n) => sum + n.width, 0);
      const totalGap = totalSpan - totalItemWidth;
      const spacing = totalGap / (sorted.length - 1);

      let currentX = first.x + first.width + spacing;
      for (let i = 1; i < sorted.length - 1; i++) {
        const node = sorted[i];
        if (Math.abs(node.x - currentX) > 0.001) {
          records.push({
            id: node.id,
            before: {
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
              rotation: node.rotation,
            },
            after: {
              x: currentX,
              y: node.y,
              width: node.width,
              height: node.height,
              rotation: node.rotation,
            },
          });
          sceneGraph.updateNode(node.id, { x: currentX });
        }
        currentX += node.width + spacing;
      }
    } else {
      // Sort nodes from top to bottom by their starting Y
      const sorted = [...selectedNodes].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const totalSpan = (last.y + last.height) - first.y;
      const totalItemHeight = sorted.reduce((sum, n) => sum + n.height, 0);
      const totalGap = totalSpan - totalItemHeight;
      const spacing = totalGap / (sorted.length - 1);

      let currentY = first.y + first.height + spacing;
      for (let i = 1; i < sorted.length - 1; i++) {
        const node = sorted[i];
        if (Math.abs(node.y - currentY) > 0.001) {
          records.push({
            id: node.id,
            before: {
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
              rotation: node.rotation,
            },
            after: {
              x: node.x,
              y: currentY,
              width: node.width,
              height: node.height,
              rotation: node.rotation,
            },
          });
          sceneGraph.updateNode(node.id, { y: currentY });
        }
        currentY += node.height + spacing;
      }
    }

    return records;
  }
}

import type { SceneNode, Constraints } from '../../types/scene';

export interface ChildBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ConstraintsEngine {
  /**
   * Computes the new position and dimension for a child element when its parent frame is resized.
   *
   * @param child The child node inside the parent frame
   * @param initialChild Initial bounds of the child before parent resizing began
   * @param initialParent Initial bounds of the parent frame
   * @param currentParent Current bounds of the parent frame
   */
  public static calculateChildBounds(
    child: SceneNode,
    initialChild: ChildBounds,
    initialParent: { width: number; height: number; x: number; y: number },
    currentParent: { width: number; height: number; x: number; y: number }
  ): ChildBounds {
    const constraints: Constraints = child.constraints || {
      horizontal: 'left',
      vertical: 'top',
    };

    // Relatives positions inside the initial parent frame:
    const relLeft = initialChild.x - initialParent.x;
    const relTop = initialChild.y - initialParent.y;
    const relRight = initialParent.width - (relLeft + initialChild.width);
    const relBottom = initialParent.height - (relTop + initialChild.height);

    let newX = currentParent.x + relLeft;
    let newWidth = initialChild.width;

    // --- Horizontal Constraints ---
    switch (constraints.horizontal) {
      case 'left':
        // Anchored to left edge: X follows parent.x + relLeft, Width remains unchanged
        newX = currentParent.x + relLeft;
        newWidth = initialChild.width;
        break;

      case 'right':
        // Anchored to right edge: Distance from right edge stays constant
        newX = currentParent.x + currentParent.width - relRight - initialChild.width;
        newWidth = initialChild.width;
        break;

      case 'left-right':
        // Stretches across both edges: Both left and right margins stay fixed
        newX = currentParent.x + relLeft;
        newWidth = Math.max(1, currentParent.width - relLeft - relRight);
        break;

      case 'center': {
        // Keeps center relative to parent center
        const initialCenterX = initialParent.width / 2;
        const childOffsetFromCenter = (relLeft + initialChild.width / 2) - initialCenterX;
        const currentCenterX = currentParent.width / 2;
        newX = currentParent.x + currentCenterX + childOffsetFromCenter - initialChild.width / 2;
        newWidth = initialChild.width;
        break;
      }

      case 'scale': {
        // Proportional scale relative to parent frame width
        const scaleX = initialParent.width > 0 ? currentParent.width / initialParent.width : 1;
        newX = currentParent.x + relLeft * scaleX;
        newWidth = Math.max(1, initialChild.width * scaleX);
        break;
      }
    }

    let newY = currentParent.y + relTop;
    let newHeight = initialChild.height;

    // --- Vertical Constraints ---
    switch (constraints.vertical) {
      case 'top':
        // Anchored to top edge: Y follows parent.y + relTop, Height remains unchanged
        newY = currentParent.y + relTop;
        newHeight = initialChild.height;
        break;

      case 'bottom':
        // Anchored to bottom edge: Distance from bottom edge stays constant
        newY = currentParent.y + currentParent.height - relBottom - initialChild.height;
        newHeight = initialChild.height;
        break;

      case 'top-bottom':
        // Stretches across both top and bottom edges
        newY = currentParent.y + relTop;
        newHeight = Math.max(1, currentParent.height - relTop - relBottom);
        break;

      case 'center': {
        // Keeps center relative to parent center
        const initialCenterY = initialParent.height / 2;
        const childOffsetFromCenter = (relTop + initialChild.height / 2) - initialCenterY;
        const currentCenterY = currentParent.height / 2;
        newY = currentParent.y + currentCenterY + childOffsetFromCenter - initialChild.height / 2;
        newHeight = initialChild.height;
        break;
      }

      case 'scale': {
        // Proportional scale relative to parent frame height
        const scaleY = initialParent.height > 0 ? currentParent.height / initialParent.height : 1;
        newY = currentParent.y + relTop * scaleY;
        newHeight = Math.max(1, initialChild.height * scaleY);
        break;
      }
    }

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  }
}

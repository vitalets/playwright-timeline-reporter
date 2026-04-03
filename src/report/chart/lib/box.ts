/** Defines a mutable layout box with helpers for padding and resizing operations. */
export class Box {
  left: number;
  top: number;
  width: number;
  height: number;

  get x1() {
    return this.left;
  }
  get x2() {
    return this.left + this.width;
  }
  get y1() {
    return this.top;
  }
  get y2() {
    return this.top + this.height;
  }

  constructor({
    left = 0,
    top = 0,
    width,
    height,
  }: {
    left?: number;
    top?: number;
    width: number;
    height: number;
  }) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }

  padding(padding: { left?: number; top?: number; right?: number; bottom?: number }) {
    const { left = 0, top = 0, right = 0, bottom = 0 } = padding;
    const newWidth = this.width - left - right;
    const newHeight = this.height - top - bottom;

    return new Box({
      left: this.left + left,
      top: this.top + top,
      width: Math.max(0, newWidth),
      height: Math.max(0, newHeight),
    });
  }

  resizeWidthTo(width: number) {
    return new Box({ ...this, width });
  }

  resizeHeightTo(height: number) {
    return new Box({ ...this, height });
  }

  resizeLeftBy(delta: number) {
    return new Box({ ...this, left: this.left + delta, width: this.width - delta });
  }

  resizeTopBy(delta: number) {
    return new Box({ ...this, top: this.top + delta, height: this.height - delta });
  }
}

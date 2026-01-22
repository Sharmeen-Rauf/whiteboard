declare module 'fabric' {
  export interface IEvent {
    e: MouseEvent | TouchEvent
    target?: FabricObject
    path?: Path
  }

  export interface IObjectOptions {
    left?: number
    top?: number
    width?: number
    height?: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    selectable?: boolean
    evented?: boolean
    id?: string
    originX?: string
    originY?: string
    angle?: number
    [key: string]: any
  }

  export interface ITextOptions extends IObjectOptions {
    text?: string
    fontSize?: number
    fontFamily?: string
  }

  export interface ICanvasOptions {
    width?: number
    height?: number
    backgroundColor?: string
    [key: string]: any
  }

  export class FabricObject {
    left: number
    top: number
    width: number
    height: number
    selectable: boolean
    evented: boolean
    id?: string

    constructor(options?: IObjectOptions)
    
    set(key: string | object, value?: any): this
    toObject(propertiesToInclude?: string[]): any
    toJSON(propertiesToInclude?: string[]): string
  }

  export class Object extends FabricObject {}

  export class Rect extends Object {
    constructor(options?: IObjectOptions)
  }

  export class Circle extends Object {
    radius: number
    constructor(options?: IObjectOptions)
  }

  export class Triangle extends Object {
    constructor(options?: IObjectOptions)
  }

  export class Line extends Object {
    x1: number
    y1: number
    x2: number
    y2: number
    constructor(points: number[], options?: IObjectOptions)
  }

  export class IText extends Object {
    text: string
    fontSize: number
    fontFamily: string
    constructor(text: string, options?: ITextOptions)
  }

  export class Path extends Object {
    path: string | any[]
    constructor(path?: string | any[], options?: IObjectOptions)
  }

  export class Polygon extends Object {
    points: Array<{ x: number; y: number }>
    constructor(points: Array<{ x: number; y: number }>, options?: IObjectOptions)
  }

  export class PencilBrush {
    width: number
    color: string
    constructor(canvas: Canvas)
  }

  export class Canvas {
    width: number
    height: number
    backgroundColor: string
    isDrawingMode: boolean
    freeDrawingBrush?: PencilBrush
    selection: boolean
    defaultCursor: string

    constructor(element: HTMLCanvasElement | string, options?: ICanvasOptions)
    
    add(...objects: Object[]): Canvas
    remove(...objects: Object[]): Canvas
    clear(): Canvas
    renderAll(): Canvas
    dispose(): void
    getObjects(type?: string): Object[]
    getPointer(e: MouseEvent | TouchEvent): { x: number; y: number }
    forEachObject(callback: (object: Object) => void): void
    setWidth(value: number): Canvas
    setHeight(value: number): Canvas
    
    on(eventName: string, handler: (e: IEvent) => void): Canvas
    off(eventName: string, handler?: (e: IEvent) => void): Canvas
  }

  export namespace util {
    export function enlivenObjects(
      objects: any[],
      callback: (objects: Object[]) => void
    ): void
  }

  export interface FabricNamespace {
    Canvas: typeof Canvas
    Rect: typeof Rect
    Circle: typeof Circle
    Triangle: typeof Triangle
    Line: typeof Line
    IText: typeof IText
    Path: typeof Path
    Polygon: typeof Polygon
    PencilBrush: typeof PencilBrush
    util: typeof util
    Object: typeof Object
  }

  const fabric: FabricNamespace

  // Export types for use in other files
  export type { Canvas, Object, Rect, Circle, Triangle, Line, IText, Path, Polygon, PencilBrush, IEvent, IObjectOptions, ITextOptions, ICanvasOptions }

  export default fabric
}

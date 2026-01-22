import fabric from 'fabric'
import type { Canvas as FabricCanvas, Object as FabricObject } from 'fabric'

export type DrawingTool = 
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand'
  | 'eraser'

export interface DrawingState {
  tool: DrawingTool
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
}

export const createCanvas = (element: HTMLCanvasElement): FabricCanvas => {
  return new fabric.Canvas(element, {
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 60 : 800,
    backgroundColor: '#ffffff',
  })
}

export const setupTool = (
  canvas: FabricCanvas,
  tool: DrawingTool,
  state: DrawingState
) => {
  canvas.isDrawingMode = tool === 'freehand'
  canvas.freeDrawingBrush = tool === 'freehand' 
    ? new fabric.PencilBrush(canvas)
    : undefined

  if (tool === 'freehand' && canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.width = state.strokeWidth
    canvas.freeDrawingBrush.color = state.strokeColor
  }

  canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair'
  canvas.selection = tool === 'select'
  canvas.forEachObject((obj) => {
    obj.selectable = tool === 'select'
    obj.evented = tool === 'select'
  })
}

export const drawShape = (
  canvas: FabricCanvas,
  tool: DrawingTool,
  state: DrawingState,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  let shape: FabricObject | null = null

  const left = Math.min(startX, endX)
  const top = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  switch (tool) {
    case 'rectangle':
      shape = new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: state.fillColor,
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      })
      break
    case 'circle':
      const radius = Math.sqrt(width * width + height * height) / 2
      shape = new fabric.Circle({
        left: startX - radius,
        top: startY - radius,
        radius,
        fill: state.fillColor,
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      })
      break
    case 'triangle':
      shape = new fabric.Triangle({
        left,
        top,
        width,
        height,
        fill: state.fillColor,
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      })
      break
    case 'line':
      shape = new fabric.Line([startX, startY, endX, endY], {
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      })
      break
    case 'arrow':
      // Create arrow using line and triangle
      const angle = Math.atan2(endY - startY, endX - startX)
      const arrowLength = 20
      const arrowAngle = Math.PI / 6
      
      const arrowHead = new fabric.Polygon([
        { x: 0, y: 0 },
        { x: -arrowLength, y: -arrowLength * Math.tan(arrowAngle) },
        { x: -arrowLength, y: arrowLength * Math.tan(arrowAngle) },
      ], {
        left: endX,
        top: endY,
        fill: state.strokeColor,
        originX: 'center',
        originY: 'center',
        angle: (angle * 180) / Math.PI,
      })
      
      const line = new fabric.Line([startX, startY, endX, endY], {
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      })
      
      canvas.add(line)
      canvas.add(arrowHead)
      return
    case 'text':
      shape = new fabric.IText('Double click to edit', {
        left: startX,
        top: startY,
        fontSize: state.fontSize,
        fill: state.strokeColor,
        fontFamily: 'Arial',
      })
      break
  }

  if (shape) {
    canvas.add(shape)
    canvas.renderAll()
  }
}

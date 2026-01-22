'use client'

import { DrawingTool, DrawingState } from '@/lib/drawing'

interface DrawingToolbarProps {
  tool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  drawingState: DrawingState
  onStateChange: (state: Partial<DrawingState>) => void
  onClear: () => void
  onExport: () => void
}

export default function DrawingToolbar({
  tool,
  onToolChange,
  drawingState,
  onStateChange,
  onClear,
  onExport,
}: DrawingToolbarProps) {
  const tools: { id: DrawingTool; icon: string; label: string }[] = [
    { id: 'select', icon: '↖️', label: 'Select' },
    { id: 'rectangle', icon: '▭', label: 'Rectangle' },
    { id: 'circle', icon: '○', label: 'Circle' },
    { id: 'triangle', icon: '△', label: 'Triangle' },
    { id: 'line', icon: '─', label: 'Line' },
    { id: 'arrow', icon: '→', label: 'Arrow' },
    { id: 'text', icon: 'A', label: 'Text' },
    { id: 'freehand', icon: '✎', label: 'Draw' },
  ]

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-wrap">
      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-4">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              tool === t.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
        <label className="text-xs text-gray-600">Stroke:</label>
        <input
          type="color"
          value={drawingState.strokeColor}
          onChange={(e) => onStateChange({ strokeColor: e.target.value })}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
        <label className="text-xs text-gray-600">Fill:</label>
        <input
          type="color"
          value={drawingState.fillColor}
          onChange={(e) => onStateChange({ fillColor: e.target.value })}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {/* Stroke Width */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
        <label className="text-xs text-gray-600">Width:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={drawingState.strokeWidth}
          onChange={(e) => onStateChange({ strokeWidth: parseInt(e.target.value) })}
          className="w-20"
        />
        <span className="text-xs text-gray-600 w-6">{drawingState.strokeWidth}</span>
      </div>

      {/* Font Size (for text) */}
      {tool === 'text' && (
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          <label className="text-xs text-gray-600">Size:</label>
          <input
            type="number"
            min="12"
            max="72"
            value={drawingState.fontSize}
            onChange={(e) => onStateChange({ fontSize: parseInt(e.target.value) })}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="Export"
        >
          💾 Export
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors text-red-600"
          title="Clear All"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  )
}

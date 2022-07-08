import {
  TLBoundsCorner,
  TLBoundsEdge,
  TLBoundsEventHandler,
  TLBoundsHandleEventHandler,
  TLCanvasEventHandler,
  TLPointerEventHandler,
  TLKeyboardEventHandler,
  TLShapeCloneHandler,
  Utils,
} from '@tldraw/core'
import { SessionType, TDShapeType } from '~types'
import { BaseTool } from '../BaseTool'
import Vec from '@tldraw/vec'
import { TLDR } from '~state/TLDR'
import { CLONING_DISTANCE, DEAD_ZONE } from '~constants'

enum Status {
  Idle = 'idle',
  Creating = 'creating',
  Pinching = 'pinching',
  PointingCanvas = 'pointingCanvas',
  PointingHandle = 'pointingHandle',
  PointingBounds = 'pointingBounds',
  PointingClone = 'pointingClone',
  TranslatingClone = 'translatingClone',
  PointingBoundsHandle = 'pointingBoundsHandle',
  TranslatingHandle = 'translatingHandle',
  Translating = 'translating',
  Transforming = 'transforming',
  Rotating = 'rotating',
  Brushing = 'brushing',
  GridCloning = 'gridCloning',
  ClonePainting = 'clonePainting',
}

export class TextSelectTool extends BaseTool<Status> {
  type = 'textSelect' as const

  pointedId?: string

  selectedGroupId?: string

  pointedHandleId?: 'start' | 'end' | 'bend'

  pointedBoundsHandle?: TLBoundsCorner | TLBoundsEdge | 'rotate' | 'center' | 'left' | 'right'

  pointedLinkHandleId?: 'left' | 'center' | 'right'

  /* --------------------- Methods -------------------- */

  onEnter = () => {
    console.log("hello")
    this.setStatus(Status.Idle)
  }

  onExit = () => {
    this.setStatus(Status.Idle)
  }

  clonePaint = (point: number[]) => {
    if (this.app.selectedIds.length === 0) return

    const shapes = this.app.selectedIds.map((id) => this.app.getShape(id))

    const bounds = Utils.expandBounds(Utils.getCommonBounds(shapes.map(TLDR.getBounds)), 16)

    const center = Utils.getBoundsCenter(bounds)

    const size = [bounds.width, bounds.height]

    const gridPoint = [
      center[0] + size[0] * Math.floor((point[0] + size[0] / 2 - center[0]) / size[0]),
      center[1] + size[1] * Math.floor((point[1] + size[1] / 2 - center[1]) / size[1]),
    ]

    const centeredBounds = Utils.centerBounds(bounds, gridPoint)

    const hit = this.app.shapes.some((shape) =>
      TLDR.getShapeUtil(shape).hitTestBounds(shape, centeredBounds)
    )

    if (!hit) {
      this.app.duplicate(this.app.selectedIds, gridPoint)
    }
  }

  getShapeClone = (
    id: string,
    side:
      | 'top'
      | 'right'
      | 'bottom'
      | 'left'
      | 'topLeft'
      | 'topRight'
      | 'bottomRight'
      | 'bottomLeft'
  ) => {
    const shape = this.app.getShape(id)

    const utils = TLDR.getShapeUtil(shape)

    if (utils.canClone) {
      const bounds = utils.getBounds(shape)

      const center = utils.getCenter(shape)

      let point = {
        top: [bounds.minX, bounds.minY - (bounds.height + CLONING_DISTANCE)],
        right: [bounds.maxX + CLONING_DISTANCE, bounds.minY],
        bottom: [bounds.minX, bounds.maxY + CLONING_DISTANCE],
        left: [bounds.minX - (bounds.width + CLONING_DISTANCE), bounds.minY],
        topLeft: [
          bounds.minX - (bounds.width + CLONING_DISTANCE),
          bounds.minY - (bounds.height + CLONING_DISTANCE),
        ],
        topRight: [
          bounds.maxX + CLONING_DISTANCE,
          bounds.minY - (bounds.height + CLONING_DISTANCE),
        ],
        bottomLeft: [
          bounds.minX - (bounds.width + CLONING_DISTANCE),
          bounds.maxY + CLONING_DISTANCE,
        ],
        bottomRight: [bounds.maxX + CLONING_DISTANCE, bounds.maxY + CLONING_DISTANCE],
      }[side]

      if (shape.rotation !== 0) {
        const newCenter = Vec.add(point, [bounds.width / 2, bounds.height / 2])

        const rotatedCenter = Vec.rotWith(newCenter, center, shape.rotation || 0)

        point = Vec.sub(rotatedCenter, [bounds.width / 2, bounds.height / 2])
      }

      const id = Utils.uniqueId()

      const clone = {
        ...shape,
        id,
        point,
      }

      if (clone.type === TDShapeType.Sticky) {
        clone.text = ''
      }

      return clone
    }

    return
  }

  /* ----------------- Event Handlers ----------------- */

  onCancel = () => {
  }

  onKeyDown: TLKeyboardEventHandler = (key, info, e) => {

  }

  onKeyUp: TLKeyboardEventHandler = (key, info) => {

  }

  // Keyup is handled on BaseTool

  // Pointer Events (generic)

  onPointerMove: TLPointerEventHandler = () => {

  }

  onPointerDown: TLPointerEventHandler = (info, e) => {

  }

  onPointerUp: TLPointerEventHandler = (info) => {

  }

  // Canvas

  onDoubleClickCanvas: TLCanvasEventHandler = () => {

  }

  // Shape

  onPointShape: TLPointerEventHandler = (info, e) => {

  }

  onDoubleClickShape: TLPointerEventHandler = (info) => {

  }

  onRightPointShape: TLPointerEventHandler = (info) => {

  }

  onHoverShape: TLPointerEventHandler = (info) => {

  }

  onUnhoverShape: TLPointerEventHandler = (info) => {

  }

  /* --------------------- Bounds --------------------- */

  onPointBounds: TLBoundsEventHandler = (info) => {

  }

  onRightPointBounds: TLPointerEventHandler = (info, e) => {

  }

  onReleaseBounds: TLBoundsEventHandler = () => {

  }

  /* ----------------- Bounds Handles ----------------- */

  onPointBoundsHandle: TLBoundsHandleEventHandler = (info) => {

  }

  onDoubleClickBoundsHandle: TLBoundsHandleEventHandler = (info) => {

  }

  onReleaseBoundsHandle: TLBoundsHandleEventHandler = () => {

  }

  /* --------------------- Handles -------------------- */

  onPointHandle: TLPointerEventHandler = (info) => {

  }

  onDoubleClickHandle: TLPointerEventHandler = (info) => {

  }

  onReleaseHandle: TLPointerEventHandler = () => {

  }

  /* ---------------------- Misc ---------------------- */

  onShapeClone: TLShapeCloneHandler = (info) => {

  }
}

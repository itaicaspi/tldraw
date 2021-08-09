import * as React from 'react'
import {
  TLBounds,
  Utils,
  Vec,
  TLTransformInfo,
  TLRenderInfo,
  Intersect,
  TLHandle,
  TLPointerInfo,
} from '@tldraw/core'
import getStroke from 'perfect-freehand'
import { defaultStyle, getPerfectDashProps, getShapeStyle } from '../../shape-styles'
import {
  ArrowShape,
  Decoration,
  TLDrawShapeUtil,
  TLDrawShapeType,
  TLDrawToolType,
  DashStyle,
} from '../../shape-types'

export class Arrow extends TLDrawShapeUtil<ArrowShape> {
  type = TLDrawShapeType.Arrow as const
  toolType = TLDrawToolType.Handle
  canStyleFill = false
  simplePathCache = new WeakMap<ArrowShape, string>()
  pathCache = new WeakMap<ArrowShape, string>()

  defaultProps = {
    id: 'id',
    type: TLDrawShapeType.Arrow as const,
    name: 'Arrow',
    parentId: 'page',
    childIndex: 1,
    point: [0, 0],
    rotation: 0,
    bend: 0,
    handles: {
      start: {
        id: 'start',
        index: 0,
        point: [0, 0],
        canBind: true,
      },
      end: {
        id: 'end',
        index: 1,
        point: [1, 1],
        canBind: true,
      },
      bend: {
        id: 'bend',
        index: 2,
        point: [0.5, 0.5],
      },
    },
    decorations: {
      end: Decoration.Arrow,
    },
    style: {
      ...defaultStyle,
      isFilled: false,
    },
  }

  shouldRender = (prev: ArrowShape, next: ArrowShape) => {
    return next.handles !== prev.handles || next.style !== prev.style
  }

  render = (shape: ArrowShape, { isDarkMode }: TLRenderInfo) => {
    const { bend, handles, style } = shape
    const { start, end, bend: _bend } = handles

    const isStraightLine = Vec.dist(_bend.point, Vec.round(Vec.med(start.point, end.point))) < 1

    const isDraw = shape.style.dash === DashStyle.Draw

    const styles = getShapeStyle(style, isDarkMode)

    const { strokeWidth } = styles

    const arrowDist = Vec.dist(start.point, end.point)

    const arrowHeadlength = Math.min(arrowDist / 3, strokeWidth * 8)

    let shaftPath: JSX.Element
    let insetStart: number[]
    let insetEnd: number[]

    if (isStraightLine) {
      const sw = strokeWidth * (isDraw ? 0.618 : 1.618)

      const path = Utils.getFromCache(this.pathCache, shape, () =>
        isDraw
          ? renderFreehandArrowShaft(shape)
          : 'M' + Vec.round(start.point) + 'L' + Vec.round(end.point)
      )

      const { strokeDasharray, strokeDashoffset } = getPerfectDashProps(
        arrowDist,
        sw,
        shape.style.dash,
        2
      )

      insetStart = Vec.nudge(start.point, end.point, arrowHeadlength)
      insetEnd = Vec.nudge(end.point, start.point, arrowHeadlength)

      // Straight arrow path
      shaftPath = (
        <>
          <path
            d={path}
            fill="none"
            strokeWidth={Math.max(8, strokeWidth * 2)}
            strokeDasharray="none"
            strokeDashoffset="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill={styles.stroke}
            stroke={styles.stroke}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )
    } else {
      const circle = getCtp(shape)

      const sw = strokeWidth * (isDraw ? 0.618 : 1.618)

      const path = Utils.getFromCache(this.pathCache, shape, () =>
        isDraw
          ? renderCurvedFreehandArrowShaft(shape, circle)
          : getArrowArcPath(start, end, circle, bend)
      )

      const arcLength = Utils.getArcLength(
        [circle[0], circle[1]],
        circle[2],
        start.point,
        end.point
      )

      const { strokeDasharray, strokeDashoffset } = getPerfectDashProps(
        arcLength - 1,
        sw,
        shape.style.dash,
        2
      )

      const center = [circle[0], circle[1]]
      const radius = circle[2]
      const sa = Vec.angle(center, start.point)
      const ea = Vec.angle(center, end.point)
      const t = arrowHeadlength / Math.abs(arcLength)

      insetStart = Vec.nudgeAtAngle(center, Utils.lerpAngles(sa, ea, t), radius)
      insetEnd = Vec.nudgeAtAngle(center, Utils.lerpAngles(ea, sa, t), radius)

      // Curved arrow path
      shaftPath = (
        <>
          <path
            d={path}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(8, strokeWidth * 2)}
            strokeDasharray="none"
            strokeDashoffset="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill={isDraw ? styles.stroke : 'none'}
            stroke={styles.stroke}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )
    }

    const sw = strokeWidth * 1.618

    return (
      <g pointerEvents="all">
        {shaftPath}
        {shape.decorations?.start === Decoration.Arrow && (
          <path
            d={getArrowHeadPath(shape, start.point, insetStart)}
            fill="none"
            stroke={styles.stroke}
            strokeWidth={sw}
            strokeDashoffset="none"
            strokeDasharray="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="stroke"
          />
        )}
        {shape.decorations?.end === Decoration.Arrow && (
          <path
            d={getArrowHeadPath(shape, end.point, insetEnd)}
            fill="none"
            stroke={styles.stroke}
            strokeWidth={sw}
            strokeDashoffset="none"
            strokeDasharray="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="stroke"
          />
        )}
      </g>
    )
  }

  renderIndicator(shape: ArrowShape) {
    const {
      handles: { start, end },
      bend,
      style,
    } = shape

    const circle = getCtp(shape)

    const path = Utils.getFromCache(this.simplePathCache, shape, () =>
      getArrowArcPath(start, end, getCtp(shape), bend)
    )
    const styles = getShapeStyle(style, false)

    const { strokeWidth } = styles

    const arrowDist = Vec.dist(start.point, end.point)

    const arrowHeadlength = Math.min(arrowDist / 3, strokeWidth * 8)

    const arcLength = Utils.getArcLength([circle[0], circle[1]], circle[2], start.point, end.point)

    const center = [circle[0], circle[1]]
    const radius = circle[2]
    const sa = Vec.angle(center, start.point)
    const ea = Vec.angle(center, end.point)
    const t = arrowHeadlength / Math.abs(arcLength)

    const insetStart = Vec.nudgeAtAngle(center, Utils.lerpAngles(sa, ea, t), radius)
    const insetEnd = Vec.nudgeAtAngle(center, Utils.lerpAngles(ea, sa, t), radius)

    return (
      <g>
        <path d={path} />
        {shape.decorations?.start === Decoration.Arrow && (
          <path d={getArrowHeadPath(shape, start.point, insetStart)} />
        )}
        {shape.decorations?.end === Decoration.Arrow && (
          <path d={getArrowHeadPath(shape, end.point, insetEnd)} />
        )}
      </g>
    )
  }

  // rotateBy(shape, delta) {
  //   const { start, end, bend } = shape.handles
  //   const mp = Vec.med(start.point, end.point)
  //   start.point = Vec.rotWith(start.point, mp, delta)
  //   end.point = Vec.rotWith(end.point, mp, delta)
  //   bend.point = Vec.rotWith(bend.point, mp, delta)

  //   this.onHandleChange(shape, shape.handles, {
  //     delta: [0, 0],
  //     shiftKey: false,
  //   })

  //   return this
  // }

  // rotateTo(shape, rotation, delta) {
  //   const { start, end, bend } = shape.handles
  //   const mp = Vec.med(start.point, end.point)
  //   start.point = Vec.rotWith(start.point, mp, delta)
  //   end.point = Vec.rotWith(end.point, mp, delta)
  //   bend.point = Vec.rotWith(bend.point, mp, delta)

  //   this.onHandleChange(shape, shape.handles, {
  //     delta: [0, 0],
  //     shiftKey: false,
  //   })

  //   return this
  // }

  getBounds = (shape: ArrowShape) => {
    const bounds = Utils.getFromCache(this.boundsCache, shape, () => {
      const { start, bend, end } = shape.handles
      return Utils.getBoundsFromPoints([start.point, bend.point, end.point])
    })

    return Utils.translateBounds(bounds, shape.point)
  }

  getRotatedBounds = (shape: ArrowShape) => {
    const { start, bend, end } = shape.handles

    return Utils.translateBounds(
      Utils.getBoundsFromPoints([start.point, bend.point, end.point], shape.rotation),
      shape.point
    )
  }

  getCenter = (shape: ArrowShape) => {
    const { start, end } = shape.handles
    return Vec.add(shape.point, Vec.med(start.point, end.point))
  }

  hitTest = () => {
    return true
  }

  hitTestBounds = (shape: ArrowShape, brushBounds: TLBounds) => {
    const { start, end, bend } = shape.handles

    const sp = Vec.add(shape.point, start.point)
    const ep = Vec.add(shape.point, end.point)

    if (Utils.pointInBounds(sp, brushBounds) || Utils.pointInBounds(ep, brushBounds)) {
      return true
    }

    if (Vec.isEqual(Vec.med(start.point, end.point), bend.point)) {
      return Intersect.lineSegment.bounds(sp, ep, brushBounds).length > 0
    } else {
      const [cx, cy, r] = getCtp(shape)
      const cp = Vec.add(shape.point, [cx, cy])

      return Intersect.arc.bounds(cp, r, sp, ep, brushBounds).length > 0
    }
  }

  transform = (
    _shape: ArrowShape,
    bounds: TLBounds,
    { initialShape, scaleX, scaleY }: TLTransformInfo<ArrowShape>
  ): Partial<ArrowShape> => {
    const initialShapeBounds = this.getBounds(initialShape)

    const handles: (keyof ArrowShape['handles'])[] = ['start', 'end']

    const nextHandles = { ...initialShape.handles }

    handles.forEach(handle => {
      const [x, y] = nextHandles[handle].point
      const nw = x / initialShapeBounds.width
      const nh = y / initialShapeBounds.height

      nextHandles[handle] = {
        ...nextHandles[handle],
        point: [
          bounds.width * (scaleX < 0 ? 1 - nw : nw),
          bounds.height * (scaleY < 0 ? 1 - nh : nh),
        ],
      }
    })

    const { start, bend, end } = nextHandles

    const dist = Vec.dist(start.point, end.point)

    const midPoint = Vec.med(start.point, end.point)

    const bendDist = (dist / 2) * initialShape.bend

    const u = Vec.uni(Vec.vec(start.point, end.point))

    const point = Vec.add(midPoint, Vec.mul(Vec.per(u), bendDist))

    nextHandles['bend'] = {
      ...bend,
      point: Math.abs(bendDist) < 10 ? midPoint : point,
    }

    return {
      point: [bounds.minX, bounds.minY],
      handles: nextHandles,
    }
  }

  onDoubleClickHandle = (shape: ArrowShape, handle: Partial<ArrowShape['handles']>) => {
    switch (handle) {
      case 'bend': {
        return {
          bend: 0,
          handles: {
            ...shape.handles,
            bend: {
              ...shape.handles.bend,
              point: getBendPoint(shape.handles, shape.bend),
            },
          },
        }
      }
      case 'start': {
        return {
          decorations: {
            ...shape.decorations,
            start: shape.decorations?.start ? undefined : Decoration.Arrow,
          },
        }
      }
      case 'end': {
        return {
          decorations: {
            ...shape.decorations,
            end: shape.decorations?.end ? undefined : Decoration.Arrow,
          },
        }
      }
    }

    return this
  }

  // onBindingChange(shape, binding, target, bounds, expandDistance) {
  //   const handle = shape.handles[binding.fromHandleId]

  //   if (!handle) {
  //     throw Error('Could not find a handle with the binding id: ' + binding.fromHandleId)
  //   }

  //   const expandedBounds = expandBounds(bounds, expandDistance)

  //   const anchor = Vec.sub(
  //     Vec.add(
  //       [expandedBounds.minX, expandedBounds.minY],
  //       Vec.mulV([expandedBounds.width, expandedBounds.height], binding.point)
  //     ),
  //     shape.point
  //   )

  //   let point: number[]

  //   if (binding.distance) {
  //     const origin = Vec.add(
  //       shape.point,
  //       shape.handles[binding.fromHandleId === 'start' ? 'end' : 'start'].point
  //     )

  //     const direction = Vec.uni(Vec.sub(Vec.add(anchor, shape.point), origin))

  //     // TODO: Abstract this part onto individual shape utils

  //     switch (target.type) {
  //       case ShapeType.Text:
  //       case ShapeType.Rectangle: {
  //         const intersectBounds = expandBounds(bounds, binding.distance)

  //         let hits = Intersect.ray
  //           .bounds(origin, direction, intersectBounds)
  //           .filter(int => int.didIntersect)
  //           .map(int => int.points[0])
  //           .sort((a, b) => Vec.dist(a, origin) - Vec.dist(b, origin))

  //         if (hits.length < 2) {
  //           hits = Intersect.ray
  //             .bounds(origin, Vec.neg(direction), intersectBounds)
  //             .filter(int => int.didIntersect)
  //             .map(int => int.points[0])
  //             .sort((a, b) => Vec.dist(a, origin) - Vec.dist(b, origin))
  //         }

  //         if (!hits[0]) {
  //           console.warn('No intersection.')
  //           return
  //         }

  //         point = Vec.sub(hits[0], shape.point)

  //         break
  //       }
  //       case ShapeType.Ellipse: {
  //         const center = getShapeUtils(target).getCenter(target)

  //         point = Vec.nudge(
  //           Vec.sub(
  //             Intersect.ray
  //               .ellipse(origin, direction, center, target.radiusX, target.radiusY, target.rotation)
  //               .points.sort((a, b) => Vec.dist(a, origin) - Vec.dist(b, origin))[0],
  //             shape.point
  //           ),
  //           origin,
  //           binding.distance
  //         )
  //       }
  //     }
  //   } else {
  //     point = anchor
  //   }

  //   this.onHandleChange(
  //     shape,
  //     {
  //       [handle.id]: {
  //         ...shape.handles[handle.id],
  //         point: Vec.round(point),
  //       },
  //     },
  //     { shiftKey: false }
  //   )

  //   return this
  // }

  onHandleChange = (
    shape: ArrowShape,
    handles: ArrowShape['handles'],
    { shiftKey }: Partial<TLPointerInfo>
  ) => {
    let nextHandles = Utils.deepMerge(shape.handles, handles)
    let nextBend = shape.bend

    // If the user is holding shift, we want to snap the handles to angles
    for (const id in handles) {
      if ((id === 'start' || id === 'end') && shiftKey) {
        const point = handles[id].point
        const other = id === 'start' ? shape.handles.end : shape.handles.start
        const angle = Vec.angle(other.point, point)
        const distance = Vec.dist(other.point, point)
        const newAngle = Utils.clampToRotationToSegments(angle, 24)

        nextHandles = {
          ...nextHandles,
          [id]: {
            ...nextHandles[id],
            point: Vec.nudgeAtAngle(other.point, newAngle, distance),
          },
        }
      }
    }

    // If the user is moving the bend handle, we want to move the bend point
    if ('bend' in handles) {
      const { start, end, bend } = nextHandles

      const distance = Vec.dist(start.point, end.point)
      const midPoint = Vec.med(start.point, end.point)
      const angle = Vec.angle(start.point, end.point)
      const u = Vec.uni(Vec.vec(start.point, end.point))

      // Create a line segment perendicular to the line between the start and end points
      const ap = Vec.add(midPoint, Vec.mul(Vec.per(u), distance / 2))
      const bp = Vec.sub(midPoint, Vec.mul(Vec.per(u), distance / 2))

      const bendPoint = Vec.nearestPointOnLineSegment(ap, bp, bend.point, true)

      // Find the distance between the midpoint and the nearest point on the
      // line segment to the bend handle's dragged point
      const bendDist = Vec.dist(midPoint, bendPoint)

      // The shape's "bend" is the ratio of the bend to the distance between
      // the start and end points. If the bend is below a certain amount, the
      // bend should be zero.
      nextBend = Utils.clamp(bendDist / (distance / 2), -0.99, 0.99)

      // If the point is to the left of the line segment, we make the bend
      // negative, otherwise it's positive.
      const angleToBend = Vec.angle(start.point, bendPoint)

      if (Utils.isAngleBetween(angle, angle + Math.PI, angleToBend)) {
        nextBend *= -1
      }
    }

    nextHandles = {
      ...nextHandles,
      start: {
        ...nextHandles.start,
        point: Vec.round(nextHandles.start.point),
      },
      end: {
        ...nextHandles.end,
        point: Vec.round(nextHandles.end.point),
      },
    }

    return {
      bend: nextBend,
      handles: {
        ...nextHandles,
        bend: {
          ...nextHandles.bend,
          point: getBendPoint(nextHandles, nextBend),
        },
      },
    }
  }

  onSessionComplete = (shape: ArrowShape) => {
    const bounds = this.getBounds(shape)
    const offset = Vec.sub([bounds.minX, bounds.minY], shape.point)
    const { start, end, bend } = shape.handles

    return {
      point: Vec.round(Vec.add(shape.point, offset)),
      handles: {
        start: {
          ...start,
          point: Vec.round(Vec.sub(start.point, offset)),
        },
        end: {
          ...end,
          point: Vec.round(Vec.sub(end.point, offset)),
        },
        bend: {
          ...bend,
          point: Vec.round(Vec.sub(bend.point, offset)),
        },
      },
    }
  }
}

function getArrowArcPath(start: TLHandle, end: TLHandle, circle: number[], bend: number) {
  return [
    'M',
    start.point[0],
    start.point[1],
    'A',
    circle[2],
    circle[2],
    0,
    0,
    bend < 0 ? 0 : 1,
    end.point[0],
    end.point[1],
  ].join(' ')
}

function getBendPoint(handles: ArrowShape['handles'], bend: number) {
  const { start, end } = handles

  const dist = Vec.dist(start.point, end.point)
  const midPoint = Vec.med(start.point, end.point)
  const bendDist = (dist / 2) * bend
  const u = Vec.uni(Vec.vec(start.point, end.point))

  const point = Vec.round(
    Math.abs(bendDist) < 10 ? midPoint : Vec.add(midPoint, Vec.mul(Vec.per(u), bendDist))
  )

  return point
}

function renderFreehandArrowShaft(shape: ArrowShape) {
  const { style, id } = shape
  const { start, end } = shape.handles

  const getRandom = Utils.rng(id)

  const strokeWidth = +getShapeStyle(style).strokeWidth * 2

  const st = Math.abs(getRandom())

  const stroke = getStroke(
    [...Vec.pointsBetween(start.point, end.point), end.point, end.point, end.point, end.point],
    {
      size: strokeWidth / 2,
      thinning: 0.5 + getRandom() * 0.3,
      easing: t => t * t,
      end: { taper: 1 },
      start: { taper: 1 + 32 * (st * st * st) },
      simulatePressure: true,
      last: true,
    }
  )

  const path = Utils.getSvgPathFromStroke(stroke)

  return path
}

function renderCurvedFreehandArrowShaft(shape: ArrowShape, circle: number[]) {
  const { style, id } = shape
  const { start, end } = shape.handles

  const getRandom = Utils.rng(id)

  const strokeWidth = +getShapeStyle(style).strokeWidth * 2

  const st = Math.abs(getRandom())

  const center = [circle[0], circle[1]]
  const radius = circle[2]

  const startAngle = Vec.angle(center, start.point)

  const endAngle = Vec.angle(center, end.point)

  const points: number[][] = []

  for (let i = 0; i < 21; i++) {
    const t = i / 20
    const angle = Utils.lerpAngles(startAngle, endAngle, t)
    points.push(Vec.round(Vec.nudgeAtAngle(center, angle, radius)))
  }

  const stroke = getStroke([...points, end.point, end.point], {
    size: strokeWidth / 2,
    thinning: 0.5 + getRandom() * 0.3,
    easing: t => t * t,
    end: {
      taper: shape.decorations?.end ? 1 : 1 + strokeWidth * 5 * (st * st * st),
    },
    start: {
      taper: shape.decorations?.start ? 1 : 1 + strokeWidth * 5 * (st * st * st),
    },
    simulatePressure: true,
    streamline: 0.01,
    last: true,
  })

  const path = Utils.getSvgPathFromStroke(stroke)

  return path
}

function getArrowHeadPath(shape: ArrowShape, point: number[], inset: number[]) {
  const { left, right } = getArrowHeadPoints(shape, point, inset)
  return ['M', left, 'L', point, right].join(' ')
}

function getArrowHeadPoints(shape: ArrowShape, point: number[], inset: number[]) {
  // Use the shape's random seed to create minor offsets for the angles
  const getRandom = Utils.rng(shape.id)

  return {
    left: Vec.rotWith(inset, point, Math.PI / 6 + (Math.PI / 12) * getRandom()),
    right: Vec.rotWith(inset, point, -Math.PI / 6 + (Math.PI / 12) * getRandom()),
  }
}

function getCtp(shape: ArrowShape) {
  const { start, end, bend } = shape.handles
  return Utils.circleFromThreePoints(start.point, end.point, bend.point)
}
import * as React from 'react'
import { useIntl } from 'react-intl'
import {
  ArrowTopRightIcon,
  CursorArrowIcon,
  CursorTextIcon,
  Pencil1Icon,
  Pencil2Icon,
  TextIcon,
} from '@radix-ui/react-icons'
import { TDSnapshot, TDShapeType } from '~types'
import { useTldrawApp } from '~hooks'
import { ToolButtonWithTooltip } from '~components/Primitives/ToolButton'
import { Panel } from '~components/Primitives/Panel'
import { ShapesMenu } from './ShapesMenu'
import { EraserIcon } from '~components/Primitives/icons'

const activeToolSelector = (s: TDSnapshot) => s.appState.activeTool
const toolLockedSelector = (s: TDSnapshot) => s.appState.isToolLocked
const dockPositionState = (s: TDSnapshot) => s.settings.dockPosition

export const PrimaryTools = React.memo(function PrimaryTools() {
  const app = useTldrawApp()
  const intl = useIntl()

  const activeTool = app.useStore(activeToolSelector)

  const isToolLocked = app.useStore(toolLockedSelector)
  const dockPosition = app.useStore(dockPositionState)

  const selectTextSelectTool = React.useCallback(() => {
    app.selectTool('textSelect')
  }, [app])

  const selectSelectTool = React.useCallback(() => {
    app.selectTool('select')
  }, [app])

  const selectEraseTool = React.useCallback(() => {
    app.selectTool('erase')
  }, [app])

  const selectDrawTool = React.useCallback(() => {
    app.selectTool(TDShapeType.Draw)
  }, [app])

  const selectArrowTool = React.useCallback(() => {
    app.selectTool(TDShapeType.Arrow)
  }, [app])

  const selectTextTool = React.useCallback(() => {
    app.selectTool(TDShapeType.Text)
  }, [app])

  const selectStickyTool = React.useCallback(() => {
    app.selectTool(TDShapeType.Sticky)
  }, [app])

  const panelStyle = dockPosition === 'bottom' || dockPosition === 'top' ? 'row' : 'column'
  console.log(activeTool)
  return (
    <Panel side="center" id="TD-PrimaryTools" style={{ flexDirection: panelStyle }}>
      <ToolButtonWithTooltip
        kbd={'0'}
        label={intl.formatMessage({ id: 'textSelect' })}
        onClick={selectTextSelectTool}
        isActive={activeTool === 'textSelect'}
        id="TD-PrimaryTools-TextSelect"
      >
        <CursorTextIcon />
      </ToolButtonWithTooltip>
      <ToolButtonWithTooltip
        kbd={'1'}
        label={intl.formatMessage({ id: 'select' })}
        onClick={selectSelectTool}
        isActive={activeTool === 'select'}
        id="TD-PrimaryTools-CursorArrow"
      >
        <CursorArrowIcon />
      </ToolButtonWithTooltip>
      <ToolButtonWithTooltip
        kbd={'2'}
        label={intl.formatMessage({ id: 'draw' })}
        onClick={selectDrawTool}
        isActive={activeTool === TDShapeType.Draw}
        id="TD-PrimaryTools-Pencil"
      >
        <Pencil1Icon />
      </ToolButtonWithTooltip>
      <ToolButtonWithTooltip
        kbd={'3'}
        label={intl.formatMessage({ id: 'eraser' })}
        onClick={selectEraseTool}
        isActive={activeTool === 'erase'}
        id="TD-PrimaryTools-Eraser"
      >
        <EraserIcon />
      </ToolButtonWithTooltip>
      <ShapesMenu activeTool={activeTool} isToolLocked={isToolLocked} />
      <ToolButtonWithTooltip
        kbd={'8'}
        label={intl.formatMessage({ id: 'arrow' })}
        onClick={selectArrowTool}
        isLocked={isToolLocked}
        isActive={activeTool === TDShapeType.Arrow}
        id="TD-PrimaryTools-ArrowTopRight"
      >
        <ArrowTopRightIcon />
      </ToolButtonWithTooltip>
      <ToolButtonWithTooltip
        kbd={'9'}
        label={intl.formatMessage({ id: 'text' })}
        onClick={selectTextTool}
        isLocked={isToolLocked}
        isActive={activeTool === TDShapeType.Text}
        id="TD-PrimaryTools-Text"
      >
        <TextIcon />
      </ToolButtonWithTooltip>
      {/*<ToolButtonWithTooltip*/}
      {/*  kbd={'0'}*/}
      {/*  label={intl.formatMessage({ id: 'sticky' })}*/}
      {/*  onClick={selectStickyTool}*/}
      {/*  isActive={activeTool === TDShapeType.Sticky}*/}
      {/*  id="TD-PrimaryTools-Pencil2"*/}
      {/*>*/}
      {/*  <Pencil2Icon />*/}
      {/*</ToolButtonWithTooltip>*/}
    </Panel>
  )
})

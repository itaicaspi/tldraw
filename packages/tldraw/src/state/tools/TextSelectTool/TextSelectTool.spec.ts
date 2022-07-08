import { TldrawTestApp } from '~test'
import { TextSelectTool } from '.'

describe('TextSelectTool', () => {
  it('creates tool', () => {
    const app = new TldrawTestApp()
    new TextSelectTool(app)
  })
})

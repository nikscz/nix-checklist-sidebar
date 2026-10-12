import { expect, mock, test } from 'claude-code/testing'

// Only the body's height matters to this mod's drawing.
const PANE = {
  component: 'Pane',
  requestId: 'nix-checklist-sidebar',
  props: { scroll: { offset: 0, bodyRows: 20 } } as never,
} as const
const TOOL = 'mcp__nix-checklist-sidebar__checkliste'
const SURFACES = ['terminal', 'desktop'] as const
// 7 Oct 2026, 18:53 local time.
const NOW = new Date(2026, 9, 7, 18, 53).getTime()

test('done steps keep their time and stay as a log under a new plan', async ($, on) => {
  mock.clock(on, { now: NOW })
  const steps = (kreis: string, quadrat: string) => [
    { text: 'Kreis zeichnen', status: kreis },
    { text: 'Quadrat zeichnen', status: quadrat },
  ]
  await $.tool.call({ tool: TOOL, items: steps('completed', 'in_progress') })
  await $.tool.call({ tool: TOOL, items: steps('completed', 'completed') })
  await $.tool.call({ tool: TOOL, items: steps('in_progress', 'pending') })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'nix-checklist-sidebar', surface, ...PANE })
    // Done steps of the earlier plan stay with their time; the new plan is on step 1 of 3 (with the closing step).
    expect(await ui.find({ type: 'Text', text: /18:53/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^1\/3$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Quadrat zeichnen/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /█|fertig/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('Leeren empties the log', async ($, on) => {
  mock.clock(on, { now: NOW })
  await $.tool.call({ tool: TOOL, items: [{ text: 'Seite bauen', status: 'completed' }] })
  const ui = await $.ui.mount({ plugin: 'nix-checklist-sidebar', surface: 'desktop', ...PANE })
  await ui.press({ key: 'leeren' })
  expect(await ui.find({ type: 'Text', text: /Noch kein Plan/ })).toBeDefined()
})

test('TaskCreate and TaskUpdate fill the log too', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('tool.call', { tool: 'TaskCreate' }, (_, e) => ({ result: { task: { id: '1', subject: e.subject } } }))
  on('tool.call', { tool: 'TaskUpdate' }, (_, e) => ({
    result: { success: true, taskId: e.taskId, updatedFields: ['status'] },
  }))
  await $.tool.call({ tool: 'TaskCreate', subject: 'Server anlegen', description: '-' })
  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' })
  const ui = await $.ui.mount({ plugin: 'nix-checklist-sidebar', surface: 'terminal', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Server anlegen/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^\d\d:\d\d$|  \d\d:\d\d$/ })).toBeDefined()
})

test('no plan: a reminder after two tool calls; open plan: after five', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false } }) as never)
  on('tool.call', { tool: 'ToolSearch' }, () => ({ result: { matches: [], query: '', total_deferred_tools: 0 } }) as never)
  const bash = async () => ((await $.tool.call({ tool: 'Bash', command: 'ls' } as never)).context ?? []).join()
  const lookup = () => $.tool.call({ tool: 'ToolSearch', query: 'select:WebSearch', max_results: 1 } as never)

  await lookup()
  expect(await bash()).toBe('')
  await lookup()
  expect(await bash()).toContain('Lege jetzt eine an')

  await $.tool.call({ tool: TOOL, items: [{ text: 'Seite bauen', status: 'in_progress' }] })
  for (let i = 0; i < 4; i += 1) expect(await bash()).toBe('')
  expect(await bash()).toContain('Hake Erledigtes ab')
})

test('every plan ends with "Ergebnis ausgeben", ticked off when the answer is out', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('turn.complete', () => ({ text: '' }))
  await $.tool.call({ tool: TOOL, items: [{ text: 'Witze suchen', status: 'completed' }] })
  const ui = await $.ui.mount({ plugin: 'nix-checklist-sidebar', surface: 'desktop', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Ergebnis ausgeben/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^2\/2$/ })).toBeDefined()

  await $.turn.complete({ answer: 'ok', durationMs: 9000, isAborted: false, turnId: 't', reason: 'answer' })
  expect(await ui.find({ type: 'Text', text: /^2\/2$/ })).toBeDefined()
  const lines = await ui.findAll({ type: 'Text', text: /18:53/ })
  expect(lines.length).toBe(2)
})

test('the thank-you comes once, in the first chat after installing', async ($, on) => {
  mock.store(on)
  on('prompt.context', () => ({ blocks: [] }))
  const names = async () => (await $.prompt.context({ blocks: [] } as never)).blocks.map(b => b.name)
  expect(await names()).toContain('nix-checklist-sidebar-danke')
  expect(await names()).not.toContain('nix-checklist-sidebar-danke')
})

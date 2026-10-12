import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Item, Status } from '../types'

import { ASK_LANG, SWITCHED, chosenLang, langOf } from './lang'
import type { Lang } from './lang'

const PANE = 'nix-checklist-sidebar'
// All tools of this set start with /nix- so typing /nix lists them.
const COMMAND = 'nix-checklist-sidebar'
const items = atom({ plugin: 'nix-checklist-sidebar', key: 'items' } as const, [])

// Written for Claude, in English; Claude writes the steps in the user's own language.
const INSTRUCTIONS = [
  '# Checklist for the user',
  'For every task that needs more than one tool (building, coding, searching the web, writing, tidying up, ' +
    'debugging; even when it looks small, e.g. "find me two jokes"; not for answers straight from your head), ' +
    'first create a checklist before you start, with the tool mcp__nix-checklist-sidebar__checkliste ' +
    '(always send the whole list, also each time you tick something off). If it is missing, use TaskCreate/TaskUpdate or TodoWrite.',
  'The user may not be a programmer and reads this list in a narrow side panel. So:',
  "- Each step in plain everyday words in the user's language, short (about 2–6 words).",
  '- No jargon, no file names, no commands, no library names.',
  '- Examples: "Set up the server", "Adjust the design", "Build the contact form", "Test that everything works".',
  '- Exactly one step is in progress; tick each step off right when it is done, not all at the end.',
  '- If something new comes up, add it as its own step.',
  '- The tool adds the last step ("deliver the result") itself; do not put it in the list.',
].join('\n')

const TOOL = 'mcp__nix-checklist-sidebar__checkliste'
const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'The whole checklist, in order',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: "One step in plain words in the user's language, 2–6 words" },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
        },
        required: ['text', 'status'],
      },
    },
  },
  required: ['items'],
}
const STATUSES: readonly Status[] = ['pending', 'in_progress', 'completed']

// Tool calls without a checklist before Claude is reminded: soon when there is
// no plan at all, later when a plan exists but has not been ticked off.
const NUDGE_NO_PLAN = 2
const NUDGE_STALE_PLAN = 5
const PLAN_TOOLS = new Set([TOOL, 'TodoWrite', 'TaskCreate', 'TaskUpdate'])
// Looking up a tool is not work: it neither counts nor resets.
const IGNORED_TOOLS = new Set(['ToolSearch', 'TaskList', 'TaskGet'])
const REMIND_UPDATE =
  'Reminder (checklist): you have worked for a while without updating the checklist. ' +
  'Tick off what is done and set the current step to in progress.'
const REMIND_CREATE =
  'Reminder (checklist): these are several steps without a checklist. ' +
  'Create one now (plain words, in the user\'s language) or add this step to the existing one.'

const change = ($: EngineInterface, fn: (list: Item[]) => Item[]) => update($, items, fn)
// A plan with steps still to do; done steps of earlier plans don't count.
const isBusy = (list: Item[]) => list.some(one => !one.isPast && one.status !== 'completed')

type Step = { text: string; status: Status }

// Every plan ends with this step; it is done once Claude's answer is out.
const FINAL_TEXTS: Record<Lang, string> = { de: 'Ergebnis ausgeben', en: 'Deliver the result' }
const isFinalText = (text: string) =>
  Object.values(FINAL_TEXTS).some(one => one.toLowerCase() === text.trim().toLowerCase())

// The panel's own words, in the system's language.
const WORDS = {
  de: { title: 'Checkliste', empty: 'Noch kein Plan.', clear: 'Leeren', opened: 'Checkliste geöffnet.', open: 'Checkliste mit Claudes Arbeitsschritten öffnen', status: { completed: 'erledigt', in_progress: 'in Arbeit', pending: 'offen' } },
  en: { title: 'Checklist', empty: 'No plan yet.', clear: 'Clear', opened: 'Checklist opened.', open: "Open the checklist of Claude's steps", status: { completed: 'done', in_progress: 'in progress', pending: 'to do' } },
} as const
// Asked when a text is first needed, then kept; a reload asks again.
let asked: Promise<Lang> | null = null

// A new plan keeps the times of steps already done; steps of an earlier
// plan that were done stay above it as the log, unfinished ones go.
const merge = (prev: Item[], steps: Step[], now: number, finalText: string): Item[] => {
  const past = prev.filter(one => one.isPast)
  const done = prev.filter(one => !one.isPast && !one.isFinal && one.status === 'completed')
  const own = steps.filter(step => !isFinalText(step.text))
  const plan = own.map((step, i): Item => {
    if (step.status !== 'completed') return { id: `${now}-${i}`, ...step }
    const k = done.findIndex(one => one.text === step.text)
    const was = k >= 0 ? done.splice(k, 1)[0] : undefined
    return { id: was?.id ?? `${now}-${i}`, ...step, doneAt: was?.doneAt ?? now }
  })
  // A closing step already done belongs to the log: that answer is out.
  const answered = prev.filter(one => !one.isPast && one.isFinal && one.status === 'completed')
  const log = [...past, ...[...done, ...answered].map(one => ({ ...one, isPast: true as const }))]
  if (plan.length === 0) return log
  const isAllDone = plan.every(one => one.status === 'completed')
  const final: Item = { id: `${now}-final`, text: finalText, status: isAllDone ? 'in_progress' : 'pending', isFinal: true }
  return [...log, ...plan, final]
}

// The answer is out: the closing step of the running plan is done.
const finish = (list: Item[], now: number): Item[] =>
  list.map(one => (!one.isPast && one.isFinal && one.status !== 'completed' ? { ...one, status: 'completed', doneAt: now } : one))

const clock = (ms: number) => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// As narrow as the steps allow beside the chat; long steps wrap.
const show = ($: EngineInterface, lang: Lang) => $.ui.open({ id: PANE, title: WORDS[lang].title, columns: 22, rows: 8 })
// Opened unasked: a narrow terminal may hold it back, which is fine.
const offer = ($: EngineInterface, lang: Lang) => void show($, lang).catch(() => undefined)

// Drawing, in the colours of Claude's dark theme.
const GREEN = '#5a9e6f'
const ORANGE = '#d98b6a'
const GREY = '#5c5b56'
const ICON_SIZE = 14
const PILL_W = 14
const PILL_GAP = 4
const PILL_H = 4
type Icon = 'done' | 'past' | 'now' | 'open'
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 14 14">${body}</svg>`
const CHECK = '<path d="M4.2 7.3l1.9 1.9 3.8-4.2" fill="none" stroke="#1f1e1d" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
const ICON: Record<Icon, string> = {
  done: svg(`<circle cx="7" cy="7" r="6.5" fill="${GREEN}"/>${CHECK}`),
  past: svg(`<circle cx="7" cy="7" r="6.5" fill="${GREEN}" fill-opacity="0.45"/>${CHECK}`),
  now: svg(`<circle cx="7" cy="7" r="5.7" fill="none" stroke="${ORANGE}" stroke-width="1.6"/><circle cx="7" cy="7" r="2.6" fill="${ORANGE}"/>`),
  open: svg(`<circle cx="7" cy="7" r="5.7" fill="none" stroke="${GREY}" stroke-width="1.4"/>`),
}
const iconOf = (one: Item): Icon =>
  one.status === 'completed' ? (one.isPast ? 'past' : 'done') : one.status === 'in_progress' ? 'now' : 'open'

// One rounded segment per step: green done, orange now, grey still to do.
const pills = (plan: readonly Item[]) => {
  const n = Math.min(plan.length, 12)
  const w = plan.length > 12 ? 8 : PILL_W
  const width = n * w + (n - 1) * PILL_GAP
  const body = plan.slice(0, n).map((one, i) => {
    const fill = one.status === 'completed' ? GREEN : one.status === 'in_progress' ? ORANGE : GREY
    return `<rect x="${i * (w + PILL_GAP)}" y="0" width="${w}" height="${PILL_H}" rx="2" fill="${fill}"/>`
  })
  return {
    width,
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${PILL_H}" viewBox="0 0 ${width} ${PILL_H}">${body.join('')}</svg>`,
  }
}

// Once after installing, Claude passes on a short thank-you from the author.
const THANKED_KEY = 'thanked'
const THANKS =
  'At the start of your next reply, once, in one short warm sentence and in the language the user ' +
  'writes to you in: tell them that nikscz says thank you for using nix-checklist-sidebar. Do not repeat it later.'

// Asked once when a chat starts; English when nothing answers.
const systemLang = async ($: EngineInterface): Promise<Lang> => {
  for (const argv of ASK_LANG) {
    try {
      const ran = await $.process.run(argv, { timeoutMs: 3_000 })
      const found = ran.exitCode === 0 ? langOf(ran.stdout) : null
      if (found) return found
    } catch {
      // not this system
    }
  }
  const env = (await $.env.get('LC_ALL').catch(() => undefined)) || (await $.env.get('LANG').catch(() => undefined))
  return (env && langOf(env)) || 'en'
}

// A language picked with the command wins over the system's.
const LANG_KEY = 'language'
const langOf$ = async ($: EngineInterface): Promise<Lang> => {
  const picked = await $.store.get(LANG_KEY).catch(() => undefined)
  return picked === 'de' || picked === 'en' ? picked : (asked ??= systemLang($))
}

export const register: Register = on => {
  // Tool calls of the main loop since the checklist last changed; a reload starts it over.
  let quietCalls = 0

  on('turn.start', ($, e, next) => {
    quietCalls = 0

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (PLAN_TOOLS.has(e.tool)) {
      quietCalls = 0
      return next(e)
    }
    const ran = await next(e)
    if (IGNORED_TOOLS.has(e.tool) || e.agentId !== undefined || ran.deny !== undefined) return ran
    quietCalls += 1
    const hasOpenPlan = isBusy(await read($, items))
    if (quietCalls < (hasOpenPlan ? NUDGE_STALE_PLAN : NUDGE_NO_PLAN)) return ran
    quietCalls = 0

    return { ...ran, context: [...(ran.context ?? []), hasOpenPlan ? REMIND_UPDATE : REMIND_CREATE] }
  })

  on('session.start', async ($, e, next) => {
    const lang = await systemLang($)
    await $.tool.register({
      name: 'checkliste',
      description:
        'Shows the user your work plan as a checklist in a side panel. ' +
        "Send the whole list on every change; steps in plain words in the user's language.",
      inputSchema: SCHEMA,
    })
    await $.command.register({
      name: COMMAND,
      description: WORDS[lang].open,
      argumentHint: '[english | deutsch | auto]',
      immediate: true,
    })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const picked = chosenLang(e.args)
    if (picked === 'auto') await $.store.delete(LANG_KEY)
    else if (picked !== null) await $.store.set(LANG_KEY, picked)
    const lang = await langOf$($)
    await show($, lang)

    return { text: picked === null ? WORDS[lang].opened : SWITCHED[picked][lang] }
  })

  on('turn.complete', async ($, e, next) => {
    const ended = await next(e)
    if (e.agentId === undefined && e.reason === 'answer') {
      const now = await $.clock.now()
      await change($, list => finish(list, now))
    }

    return ended
  })

  on('prompt.context', async ($, e, next) => {
    const context = await next(e)

    const isThanked = (await $.store.get(THANKED_KEY)) === true
    if (!isThanked) await $.store.set(THANKED_KEY, true)
    const thanks = isThanked ? [] : [{ name: 'nix-checklist-sidebar-danke', text: THANKS }]

    return { ...context, blocks: [...context.blocks, { name: 'nix-checklist-sidebar', text: INSTRUCTIONS }, ...thanks] }
  })

  // The mod's own tool, for sessions without TaskCreate or TodoWrite.
  on('tool.call', { tool: TOOL }, async ($, e) => {
    const raw: unknown = (e as { items?: unknown }).items
    if (!Array.isArray(raw)) {
      return { deny: 'items muss eine Liste sein.' }
    }
    const steps: Step[] = raw.flatMap((one: unknown) => {
      const { text, status } = (one ?? {}) as { text?: unknown; status?: unknown }
      return typeof text === 'string' && STATUSES.includes(status as Status)
        ? [{ text, status: status as Status }]
        : []
    })
    const now = await $.clock.now()
    const lang = await langOf$($)
    const wasIdle = !isBusy(await read($, items))
    await change($, list => merge(list, steps, now, FINAL_TEXTS[lang]))
    if (wasIdle && steps.length > 0) offer($, lang)
    const done = steps.filter(one => one.status === 'completed').length

    return { result: `Checklist updated: ${done} of ${steps.length} done.` }
  })

  // Older sessions: the whole list arrives at once.
  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) {
      const now = await $.clock.now()
      const lang = await langOf$($)
      const wasIdle = !isBusy(await read($, items))
      const steps = e.todos.map(todo => ({ text: todo.content, status: todo.status }))
      await change($, list => merge(list, steps, now, FINAL_TEXTS[lang]))
      if (wasIdle && steps.length > 0) offer($, lang)
    }

    return ran
  })

  // Newer sessions: one task at a time.
  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError && ran.result?.task) {
      const item: Item = { id: ran.result.task.id, text: e.subject, status: 'pending' }
      const lang = await langOf$($)
      const wasIdle = !isBusy(await read($, items))
      await change($, list => [...list.filter(one => one.id !== item.id), item])
      if (wasIdle) offer($, lang)
    }

    return ran
  })

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) {
      const status = e.status
      const now = await $.clock.now()
      await change($, list =>
        status === 'deleted'
          ? list.filter(one => one.id !== e.taskId)
          : list.map(one =>
              one.id === e.taskId
                ? {
                    ...one,
                    text: e.subject ?? one.text,
                    status: status ?? one.status,
                    doneAt: status === 'completed' ? (one.doneAt ?? now) : one.doneAt,
                  }
                : one,
            ),
      )
    }

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const lang = await langOf$($)
    const list = await read($, items)
    // The body's height, so the button can sit on its last row.
    const rows = Math.max(3, e.props.scroll.bodyRows)
    const plan = list.filter(one => !one.isPast)
    const done = plan.filter(one => one.status === 'completed').length
    // Like "3/6": the step being worked on, or how many are done once none is.
    const position = plan.some(one => one.status === 'in_progress') ? done + 1 : done
    const shown = list.slice(-(rows - 3))

    if (e.surface === 'desktop' || e.surface === 'vscode' || e.surface === 'mobile') {
      const { Box, Text, Button, Svg } = $.ui.resolve(e)
      const bar = plan.length === 0 ? null : pills(plan)

      return (
        <Box flexDirection="column" height={rows}>
          {bar ? (
            <Box flexDirection="row" alignItems="center" gap={1}>
              <Svg source={bar.source} alt={`${position}/${plan.length}`} width={bar.width} height={PILL_H} />
              <Text dimColor>
                {position}/{plan.length}
              </Text>
            </Box>
          ) : null}
          <Box flexDirection="column" flexGrow={1} overflow="hidden" gap={0}>
            {list.length === 0 && <Text dimColor>{WORDS[lang].empty}</Text>}
            {shown.map(one => (
              <Box key={one.id} flexDirection="row" alignItems="center" gap={1}>
                <Svg source={ICON[iconOf(one)]} alt={WORDS[lang].status[one.status]} width={ICON_SIZE} height={ICON_SIZE} />
                <Box flexGrow={1} flexShrink={1} minWidth={0}>
                  <Text
                    wrap="truncate-end"
                    bold={one.status === 'in_progress'}
                    dimColor={one.status === 'completed'}
                  >
                    {one.text}
                  </Text>
                </Box>
                {one.doneAt === undefined ? null : <Text dimColor>{clock(one.doneAt)}</Text>}
              </Box>
            ))}
          </Box>
          <Button key="leeren" plain dimColor label={WORDS[lang].clear} onPress={() => change($, () => [])} />
        </Box>
      )
    }

    // Terminal: the same list in characters.
    const { Box, Text, Button } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" height={rows}>
        {plan.length === 0 ? null : (
          <Text dimColor>
            {position}/{plan.length}
          </Text>
        )}
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          {list.length === 0 && <Text dimColor>{WORDS[lang].empty}</Text>}
          {shown.map(one =>
            one.status === 'completed' ? (
              <Text key={one.id} dimColor>
                <Text color="green">✓</Text> {one.text}
                {one.doneAt === undefined ? '' : `  ${clock(one.doneAt)}`}
              </Text>
            ) : one.status === 'in_progress' ? (
              <Text key={one.id} bold>
                <Text color="#d98b6a">◉</Text> {one.text}
              </Text>
            ) : (
              <Text key={one.id}>
                <Text dimColor>○</Text> {one.text}
              </Text>
            ),
          )}
        </Box>
        <Button key="leeren" label={WORDS[lang].clear} onPress={() => change($, () => [])} />
      </Box>
    )
  })
}

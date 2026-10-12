export type Status = 'pending' | 'in_progress' | 'completed'
// doneAt: when the step was ticked off (ms); isPast: from an earlier plan, kept as the log;
// isFinal: the closing step the mod adds itself, done when Claude's answer is out.
export type Item = { id: string; text: string; status: Status; doneAt?: number; isPast?: true; isFinal?: true }

declare module 'claude-code' {
  interface PluginState {
    'nix-checklist-sidebar': { items: Item[] }
  }
}

🇩🇪 [Deutsch](README.de.md)

# nix checklist-sidebar

**Claude's plan as a checklist – in plain words, in a narrow sidebar.**

## The problem

Claude often works for minutes: reading files, writing code, searching the web. What it is about to do and what is already done hides somewhere in the chat – in jargon, between commands and code. If you don't code, you lose track fast.

## The solution

A narrow sidebar on the right shows Claude's plan as a checklist in everyday words – ticked off live, with times. Designed to blend into Claude: its own colours, dark mode, no loud colours – clean and minimal.

## Install

1. Open Claude Code (desktop app or terminal).
2. Type this into the message box and press Enter:
   ```
   /plugin marketplace add nikscz/nix-checklist-sidebar
   ```
3. Then:
   ```
   /plugin install nix-checklist-sidebar@nix-checklist-sidebar
   ```
4. Restart Claude Code once (or type `/reload-plugins`). Done.

No GitHub account needed.

## How to

- From two work steps on, Claude **always** creates the checklist. If it forgets, it is reminded.
- Done: green check and the **time**. Working on it: orange ring. To do: grey circle.
  Small pills at the top show where you are, e.g. 3/6.
- The last step is always **"Deliver the result"** – ticked once the answer is out.
- Earlier tasks stay as a log until you press **Clear**.
- **No files:** the list lives in its chat only.
- The panel follows your system language (German or English); Claude writes the steps in your language.

| Command | What happens |
|---|---|
| `/nix-checklist-sidebar` | opens the sidebar again any time |

### Add-on: nix-progress-bar

With [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) the bar above the message box
shows the steps as pills too – and estimates how long Claude still needs.

> [!WARNING]
> **Early version – updates will come.** This kind of extension is still brand new in Claude Code.
> After an update from Anthropic something may stop working until a fix lands here.
> With automatic updates on (below) you get the fix by itself.

## Updates

Turn it on once and forget it: type `/plugin` → **Marketplaces** → **nix-checklist-sidebar** → turn on
automatic updates.

Or by hand, whenever you like:
```
/plugin marketplace update nix-checklist-sidebar
```

### What's new

**2.2.0 – German and English.** The tool's own labels now follow your system language: German
on a German system, English everywhere else. Other languages (e.g. Spanish) get the English labels –
but everything Claude writes itself (the steps, the thank-you, its answers) comes in your language
anyway.

## Uninstall

```
/plugin uninstall nix-checklist-sidebar@nix-checklist-sidebar
```

## More from nix

- [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) – progress bar with a time estimate
- [nix-note](https://github.com/nikscz/nix-note) – project notes on the side with /note
- [nix-done-sound](https://github.com/nikscz/nix-done-sound) – your own alert sound when Claude is done

## License

[MIT](LICENSE) – use it, change it, pass it on, no warranty.

Made with Claudius, for Claudius. Found a bug or have an idea?
Open an [issue](https://github.com/nikscz/nix-checklist-sidebar/issues).

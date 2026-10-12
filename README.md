🇩🇪 [Deutsch](README.de.md)

# nix checklist-sidebar

**Claude's plan as a checklist – in plain words, in a narrow sidebar.**

<img src="docs/overview-sidebar.png" alt="The checklist in a narrow sidebar on the right of Claude" width="100%">

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
- The panel follows your system language (German or English) – or one you pick; Claude writes the steps in your language.

| Command | What happens |
|---|---|
| `/nix-checklist-sidebar` | opens the sidebar again any time |
| `/nix-checklist-sidebar english` / `deutsch` | fixed language for the panel |
| `/nix-checklist-sidebar auto` | follows the system language again |

### Add-on: nix-progress-bar

With [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) the bar above the message box
shows the steps as pills too – and estimates how long Claude still needs.

## Screenshots

<img src="docs/sidebar-done.png" alt="All steps done, each with its time" width="320">

Together with the add-on [nix-progress-bar](https://github.com/nikscz/nix-progress-bar):

<img src="docs/overview-both.png" alt="Checklist on the right, progress bar above the message box" width="100%">

## Privacy & security

Everything stays on your computer:

| Reads | Stores |
|---|---|
| Names of the tools Claude uses, and how many (for the reminder) | nothing |
| The checklist steps Claude sends | in the chat's memory only – gone when the chat ends |
| – | your language choice and whether the thank-you was said, in Claude Code's plugin storage |

**Sends nothing anywhere.** No internet connection, no tracking, no analytics. The code is open –
you can check it yourself.

**Language check:** so the labels show up in your language, it reads your system language once per chat
with one harmless system command – `defaults read -g AppleLanguages` on a Mac,
`(Get-Culture).TwoLetterISOLanguageName` in PowerShell on Windows. Nothing else is read.

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

**2.2 – German and English.** The tool's own labels follow your system language: German on a
German system, English everywhere else – or pick it yourself with `/nix-checklist-sidebar english`, `deutsch` or
`auto`. Other languages (e.g. Spanish) get the English labels – but everything Claude writes itself
(the steps, the thank-you, its answers) comes in your language anyway.

## Uninstall

```
/plugin uninstall nix-checklist-sidebar@nix-checklist-sidebar
```

## More from nikscz

- [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) – progress bar with a time estimate
- [nix-note](https://github.com/nikscz/nix-note) – project notes on the side with /note
- [nix-done-sound](https://github.com/nikscz/nix-done-sound) – your own alert sound when Claude is done

## License

[MIT](LICENSE) – use it, change it, pass it on, no warranty.

Made with Claudius, for Claudius. Found a bug or have an idea?
Open an [issue](https://github.com/nikscz/nix-checklist-sidebar/issues).

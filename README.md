# nix checklist-sidebar

**Claudes Plan als Checkliste – in einfacher Sprache, in einer schmalen Leiste rechts.**

> [!WARNING]
> **Frühe Version – Updates kommen.** Diese Art Erweiterung ist bei Claude Code noch ganz neu.
> Nach einem Update von Anthropic kann etwas nicht mehr funktionieren, bis hier ein Fix kommt.
> Mit Updates eingeschaltet (siehe unten) bekommst du ihn automatisch.

## Das Problem

Claude arbeitet oft minutenlang: liest Dateien, schreibt Code, sucht im Netz. Was es gerade
vorhat und was schon fertig ist, steckt irgendwo im Chat – in Fachsprache, zwischen
Befehlen und Code. Wer nicht programmiert, verliert schnell den Überblick.

## Die Lösung

Eine schmale Leiste rechts zeigt Claudes Plan als Checkliste, in Alltagssprache:
„Server anlegen“, „Design anpassen“, „Testen, ob alles läuft“.

- Ab zwei Arbeitsschritten legt Claude die Liste **immer** an. Vergisst es das, wird es erinnert.
- Erledigt: grüner Haken und **Uhrzeit**. Gerade dran: oranger Ring. Offen: grauer Kreis.
  Oben zeigen kleine Pills den Stand, z. B. 3/6.
- Letzter Schritt ist immer **„Ergebnis ausgeben“** – abgehakt, sobald die Antwort fertig ist.
- Frühere Aufgaben bleiben als Protokoll stehen, bis du **Leeren** drückst.
- **Keine Dateien:** Die Liste lebt nur im jeweiligen Chat.

**Befehl:** `/nix-checklist-sidebar` öffnet die Leiste jederzeit wieder.

### Add-on: nix-progress-bar

Mit [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) dazu zeigt auch der Balken
über dem Eingabefeld die Schritte als Pills – und schätzt, wie lange Claude noch braucht.

## Design

Fügt sich in Claude ein, statt aufzufallen: die Farben und Schriften der Claude-App, Dark Mode,
keine wilden Farben – clean und minimal. Funktioniert in der Desktop-App und im Terminal.

## Installieren

1. Claude Code öffnen (Desktop-App oder Terminal).
2. Ins Eingabefeld schreiben und Enter drücken:
   ```
   /plugin marketplace add nikscz/nix-checklist-sidebar
   ```
3. Dann:
   ```
   /plugin install nix-checklist-sidebar@nix-checklist-sidebar
   ```
4. Claude Code einmal neu starten (oder `/reload-plugins` eingeben). Fertig.

## Updates

Einmal einschalten und vergessen: `/plugin` eingeben → **Marketplaces** → **nix-checklist-sidebar** →
automatische Updates an.

Oder von Hand, wann immer du willst:
```
/plugin marketplace update nix-checklist-sidebar
```

## Deinstallieren

```
/plugin uninstall nix-checklist-sidebar@nix-checklist-sidebar
```

## Mehr von nix

- [nix-progress-bar](https://github.com/nikscz/nix-progress-bar) – Fortschrittsleiste mit Zeitschätzung
- [nix-note](https://github.com/nikscz/nix-note) – Notizen nebenbei mit /note
- [nix-done-sound](https://github.com/nikscz/nix-done-sound) – dein eigener Sound, wenn Claude fertig ist

## Lizenz

[MIT](LICENSE) – nutzen, ändern, weitergeben erlaubt, ohne Gewähr.

Mit Claude gebaut, für Claude. Fehler gefunden oder eine Idee?
Gern ein [Issue](https://github.com/nikscz/nix-checklist-sidebar/issues) aufmachen.

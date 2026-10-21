---
title: Passagework
kind: project
status: current
order: 1
period: Jul–Aug 2026
role: Sole developer
stack: [TypeScript, Vite, AudioWorklet]
links:
  live: https://passagework.us
  source: https://github.com/mackfound/passagework
summary: "A local-first browser tool that loops a short passage of a recording against its score, at any tempo, hands-free. Built for orchestral audition prep, with no need for accounts, uploads, or runtime dependencies."
---

## Problem

Audition prep is mostly repetition, specifically of the same seven bars, over and over, against a real recording. A DAW loops perfectly but needs a mouse and both hands. A media player is one keystroke away but can’t loop a passage, and its slow-down turns an orchestra to sludge. And heaven forbid you want to read the sheet music while doing all of this.

## What I built

Passagework holds a set of excerpts, each with its own loop points, recording, key, and score images. Pressing a number key loops that passage, with a short pre-roll so you hear the approach. You set the loop edges by tapping `I` and `O` as the recording plays, then nudge them by 10 ms. Tempo runs from 0.50× to 1.00× with pitch preserved. I wrote the time-stretcher myself, a WSOLA implementation running in an AudioWorklet, so the loop wraps on the audio thread with no gap. The page is static and nothing leaves your machine, with recordings decoding in the tab, and projects living in IndexedDB.

## Stack

TypeScript and Vite, with zero runtime dependencies. Web Audio and AudioWorklet for playback, IndexedDB and the File System Access API for storage, Vitest for tests, and Cloudflare Pages for hosting. The code is split into four layers (pure core, audio, storage, UI) with imports pointing inward only, and a test scans every import to enforce it. I built it with Claude Code against a written architecture spec, working through the milestones in order.

## Result

Shipped and live at passagework.us, with 93 unit tests passing. I use it for my own audition practice, and the whole app, including the time-stretcher, favicon, and fonts, ships without a single third-party runtime dependency.

## Links

* Live: [passagework.us](https://passagework.us)
* Source: [github.com/mackfound/passagework](https://github.com/mackfound/passagework)

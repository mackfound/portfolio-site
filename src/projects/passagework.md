---
title: Passagework
status: current
lead: true
order: 1
period: Jul–Aug 2026
role: Product, design, and review
stack: [TypeScript, Vite, AudioWorklet]
links:
  live: https://passagework.us
  source: https://github.com/mackfound/passagework
summary: "A browser tool for practicing musicians that loops a short passage of a recording while the sheet music stays on screen, at anything from half speed to full, all hands-free. Everything runs in your browser, with no account and no uploads."
description: "Passagework loops a passage of a recording while the sheet music stays on screen, from half speed to full, hands-free, for audition practice."
---

{% set caption %}Brahms, Symphony No. 4, III, recorded by Musopen (CC0). Drag the loop’s edges, or click the waveform and use Space, I and O as in Passagework. Below 100%, this demo uses the browser’s playback and can leave a seam that Passagework doesn’t.{% endset %}
{% include "passagework-figure.njk" %}

## Problem

I’m a violinist preparing for orchestral auditions, and most of that prep is repetition: the same seven bars, over and over, against a real recording. A digital audio workstation (DAW) loops perfectly but wants a mouse and both hands. A media player is one keystroke away but can’t loop a passage, and slowing it down turns an orchestra to mud. I wanted to open a page, press one key, and have the passage loop while I kept playing.

## What I built

Passagework holds a set of excerpts, each with its own loop points, recording, score images, and number-key shortcut. Pressing a number loops that passage, with a short pre-roll so you hear the approach. You tap I and O as the recording plays to set the loop edges, then adjust them in 10 ms steps. Tempo runs from half speed to full with the pitch preserved. The sheet music takes up most of the screen, and you switch between your part and the full score with one keypress.

The loop restarts without a click or a gap, which is the thing a musician would notice. That’s because the audio is decoded up front and the loop wraps inside an AudioWorklet on the audio thread, so there’s no seek at the loop point. Slowing it down without changing the pitch is a separate piece, a time-stretcher using a technique called WSOLA. The page is static. Recordings decode in the tab and projects are stored in IndexedDB, so nothing leaves the machine.

## Stack

The code is split into four layers (pure core, audio, storage, UI) with imports pointing inward only, and a test fails the build on any import that points the wrong way. It’s TypeScript and Vite with zero runtime dependencies, using Web Audio and AudioWorklet, IndexedDB and the File System Access API, Vitest, and Cloudflare Pages. I wrote the requirements and the milestone order, made the design calls, and reviewed and tested each milestone. Claude Code wrote the implementation, including the time-stretcher.

## Result

I built it for my own audition prep for the Notre Dame Symphony Orchestra and used it to learn the assigned excerpts, looping each passage slowly and then bringing it up to tempo. I made the orchestra again. It’s live at passagework.us, the source is public, and 93 unit tests pass.

## Links

* Live: [passagework.us](https://passagework.us)
* Source: [github.com/mackfound/passagework](https://github.com/mackfound/passagework)

---
layout: base.njk
title: Resume
pageClass: resume
description: "Resume of Michael Doyle, Notre Dame computer engineering student: attestation research on Intel TDX, FPGA workflows, and software projects."
---
# Resume

{% if assets.resumePdf %}<p class="actions"><a href="/assets/media/michael-doyle-resume.pdf">PDF version →</a></p>{% else %}TODO-COPY(resume-pdf){% endif %}

{% include "contact.njk" %}

## Education

### University of Notre Dame · Notre Dame, IN

*Bachelor of Science* · May 2029

Computer Engineering · Minor: Philosophy, Politics, and Economics

## Research and Technical Experience

### Data Security and Privacy Lab · Notre Dame, IN

*Research Assistant* · August 2026 – Present

- Built a quote-collection pipeline on Google Cloud confidential VMs, parsing DER-encoded X.509 platform certificates to inventory identifying fields in Intel TDX attestation
- Measured attestation credential stability across new quotes and reboots, establishing platform identifier persistence

### Engineering Leadership Council · Notre Dame, IN

*Website Manager* · April 2026 – Present

- Maintain and deploy the council's public website through a Git-based Netlify pipeline
- Diagnosed a broken Netlify build on the council's Jekyll site, downgrading the pinned Ruby version to restore gem compatibility and unblock automated deploys

### Wireless Institute · Notre Dame, IN

*Research Assistant* · January 2026 – November 2026

- Established an end-to-end FPGA development workflow for the RadioHound SDR project, enabling HDL module authoring in Python and the high-level generation of synthesizable Verilog code; published as an open-source repo and technical paper for incoming undergraduate research assistants
- Instantiated a Python-generated module into an AMD Vivado project; validated signal output on a Zynq-7000 SoC against a 40 MHz clock using oscilloscope capture and MATLAB waveform reconstruction

## Projects

### Passagework · Personal Project

*Creator* · July 2026 – August 2026

- Built and shipped a local-first browser tool (TypeScript, Vite) that loops short passages of a recording with the sheet music on screen, for hands-free instrument practice
- Designed a gapless loop on the audio thread and a pitch-preserving WSOLA time-stretcher down to 0.5× speed
- Wrote the architecture spec and milestone plan that Claude Code implemented: four layers (pure core, audio, storage, UI) enforced by an import-scanning test, with 93 unit tests

### Machine Learning for Engineers · Dublin, Ireland – Engineering Study Abroad

*Project Team Member* · June 2026 – July 2026

- Built and evaluated kNN, ridge, and random-forest models to predict residential energy loads from architectural features, achieving an R² of 0.72 on heating load
- Deployed the model for interactive inference via both a Gradio app within Google Colab and a self-hosted instance

## Leadership and Activities

### The Observer · Notre Dame, IN

*Opinion Columnist* · September 2025 – Present

- Write a biweekly column focusing on faith, compassion, and intersectionality on college campuses; work has also appeared in The Wall Street Journal's Future View

### Model United Nations · Notre Dame, IN

*Treasurer, Secretary-General of General Assemblies* · September 2025 – Present

- Administer and oversee 2 general committees, each with 40+ delegates, for the team's annual high school conference

### Eagle Scout · Boy Scouts of America

Haddonfield, NJ · 2025

## Skills and Certifications

<dl class="facts">
  <dt>Languages</dt><dd>Python, C/C++, TypeScript, Verilog, SQL, HTML/CSS</dd>
  <dt>Security</dt><dd>Intel SGX, Intel TDX, remote attestation, X.509 certificate parsing</dd>
  <dt>Tools</dt><dd>Claude Code, Git, Linux, Google Cloud Platform, Netlify, Vite, Gradio</dd>
  <dt>Certifications</dt><dd>ISC2 Certified in Cybersecurity (CC) – March 2026</dd>
</dl>

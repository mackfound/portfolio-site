---
title: Remote attestation on Intel TDX confidential VMs
status: current
order: 1
period: Aug 2026 – present
role: Undergraduate research assistant, Data Security and Privacy Lab (Prof. Taeho Jung)
stack: [Intel TDX, Google Cloud Platform, OpenSSL]
summary: "I built a pipeline that collects Intel TDX attestation quotes from confidential VMs on Google Cloud, to study what they reveal."
detail: high-level
pi_signoff: false
---

## Problem

A confidential VM (CVM) runs on hardware that encrypts its memory, meaning even the cloud provider can’t read it. Owners of these CVMs don’t trust one with secrets blindly, so they ask the hardware for an attestation quote, a signed statement of what’s running. These quotes are meant for the owner, and prove that a given VM is genuine, but they also carry certificates from the machine they came from. My research asks what exactly those certificates reveal about where a VM is running and who else can learn this information.

## What I built

I wrote a Bash pipeline that launches a CVM on Google Cloud, has the VM produce a fresh quote, copies it out, then deletes the VM. It times every step and cleans up leftover instances even when a run fails, so a long batch doesn’t leave paid resources running. A second mode reboots a running VM to compare quotes from the same instance. Every run checks two things: that the quote arrived intact, and that it’s fresh rather than replayed. Each cycle becomes one row in a CSV file, so I can compare quotes across many launches and reboots.

## Stack

Bash and Google Cloud’s CLI tools drive the pipeline. Within the VM, the quote comes from the Linux kernel’s standard subsystem for attestation reports, with no vendor SDK. OpenSSL parses the certificates into the fields each CSV row records.

## Result

This research is ongoing, with results and formal write-ups not yet published.

## Links

The pipeline is in a private repository for now.

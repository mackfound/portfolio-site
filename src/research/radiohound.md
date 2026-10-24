---
title: RadioHound
status: past
order: 1
period: Mar–Oct 2026
role: Undergraduate researcher, Notre Dame Wireless Institute (STRAND)
stack: [Python, Amaranth HDL, Verilog, NumPy, Zynq-7000]
summary: "Research on RadioHound, a receiver that computes power spectra on a Zynq FPGA. I learned to write FPGA hardware in Python, then built a harness for checking the FPGA's spectrum math against a software reference."
description: "RadioHound: verifying an FPGA spectrum receiver's math against a software reference, plus building FPGA hardware in Python with Amaranth HDL."
detail: high-level
pi_signoff: false
---

## Problem

RadioHound's FPGA computes power spectra continuously and discards the raw samples behind them, so nothing checks its arithmetic end to end. A wrong scaling constant or averaging count would still produce plausible spectra. I wanted to know whether a spectrum could be traced to a saved block of samples, so software could redo the calculation and compare.

## What I built

In the spring I learned Amaranth HDL, a Python library for describing hardware, on the ADALM-PLUTO, a Zynq-7010 software-defined radio. My blinker design generates Verilog for the board and simulates itself to a waveform file. I checked the waveform in Surfer and compiled the Verilog with Icarus Verilog.

In the fall I built rh-twin, a Python harness for the lab's research receiver. It decides whether a spectrum came entirely from a saved block of raw samples, compares it bin by bin with a software reference, and attributes any difference to a processing stage. With no way yet to capture samples and spectra together, I tested it against an emulator of the hardware with deliberate faults injected.

## Stack

Python, Amaranth HDL, Icarus Verilog and Surfer in the spring. Python and NumPy in the fall, with a float64 Welch reference, a fault-injecting emulator and unit tests. Every hardware assumption is a named constant in one config file, so an answer from the lab is a one-line change.

## Result

The harness caught and correctly attributed all three injected faults on 100 of 100 random seeds, and on clean data it matched the reference to within 3e-8 dB. Checking against the lab's code showed three of my starting assumptions were wrong, each of which would have looked like a hardware fault, and I fixed them. The main finding is a hardware requirement: the receiver can't yet save raw samples and their spectra from the same capture. I handed the next step, comparison against the lab's bit-accurate model and RTL simulation, to the lab with a written guide.

## Links

* Final paper (spring): {% if assets.radiohoundPaper %}[AmaranthHDL in RadioHound: Optimizing Module Development Workflows Utilizing a Pythonic Hardware Description Language](/assets/media/pythonic-hdl-workflows-paper.pdf) (PDF){% else %}TODO-COPY(radiohound-paper-pdf){% endif %}
* Amaranth HDL blinky (spring): [github.com/mackfound/amaranthHDL-blinky](https://github.com/mackfound/amaranthHDL-blinky)
* The fall harness is in my private repository.

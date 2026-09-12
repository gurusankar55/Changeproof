# ChangeProof

On-chain proof of meaningful changes in public information.

## Overview

ChangeProof is a GenLayer Intelligent Contract that detects and records meaningful changes in publicly accessible web information.

Public documentation, API policies, pricing pages, terms, and protocol information can change without an obvious historical record. ChangeProof creates an on-chain record of what changed.

## Problem

Important public information can change silently.

Examples:

- API rate limits
- Pricing rules
- Authentication requirements
- Protocol parameters
- Terms and policies
- Public documentation

A normal webpage lookup can tell a user what exists now, but it does not provide a persistent, verifiable record of whether the information changed.

## How It Works

```text
OLD EVIDENCE
     ↓
NEW EVIDENCE
     ↓
CONTENT NORMALIZATION
     ↓
DETERMINISTIC CHANGE CHECK
     ↓
GENLAYER VERIFICATION
     ↓
ON-CHAIN RESULT
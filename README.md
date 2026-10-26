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

## Milestone v1: AI Severity Rating + On-Chain Change History

### What changed
- **AI severity rating:** when a change is detected, GenLayer validators use an LLM to rate how important it is for users: LOW, MEDIUM, HIGH or CRITICAL. Validators must agree on the label (strict equivalence).
- **On-chain change history:** every check is stored permanently as `number|source|status|severity`. The previous version only kept the latest result.
- **Cost saving:** the AI is called only when a change is detected. NO_CHANGE checks are recorded without an LLM call.
- **Audit trail:** source registrations and unavailable sources are also logged in history.

### New functions
- `get_severity()` - latest severity label
- `get_history()` - full history
- `get_history_count()` - number of entries
- `get_history_entry(index)` - one entry

### Live test (GenLayer Studionet)
Contract: `0xd0FB5A2a41dc7De2DB26968445b409625688b16F`

Test source: `demo/pricing.txt` (price raised 10 to 49 USD, rate limit cut 100 to 20, free trial removed, API key required)

    1|GenLayer Docs|SNAPSHOT_CAPTURED|NONE
    2|Demo Pricing|SOURCE_REGISTERED|NONE
    3|Demo Pricing|SNAPSHOT_CAPTURED|NONE
    4|Demo Pricing|NO_CHANGE|NONE
    5|Demo Pricing|MATERIAL_CHANGE|HIGH

### Why it matters
Before, ChangeProof could only say *that* a page changed. Now it says *how serious* the change is and keeps a permanent, verifiable timeline. Developers can see when pricing, limits or rules changed and which changes could break their integration.

---
title: Agent skills
description: Install the Intuition skills so that a coding agent produces correct protocol transactions and ERC-8004 integration plans.
---

A general-purpose language model does not reliably know the details of the
Intuition protocol. The Intuition agent skills supply those details as
verified reference material that an agent loads when a task needs it. They
follow the [Agent Skills specification](https://agentskills.io/specification)
and work with Claude Code, Codex, and other compatible agents.

## What the skills prevent

Agents that work without the skills tend to make the same mistakes:

- They cannot discover the contract ABIs, because general block explorers do
  not index the Intuition network.
- They treat term identifiers as integers. Identifiers are `bytes32` values.
- They try to create a single term. Creation is batch-only: `createAtoms` and
  `createTriples` take arrays.
- They omit or miscalculate the value a transaction must carry.

## Available skills

| Skill                 | Purpose                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `intuition`           | The reference for protocol transactions: ABIs, encoding, addresses, and value calculations |
| `erc8004-agent-layer` | Plans an ERC-8004 trust-provider integration. See [ERC-8004 agent layer](./erc-8004.md)    |

The skills are published in the
[0xintuition/agent-skills](https://github.com/0xintuition/agent-skills)
repository.

## Install

You need Node.js and a package manager. The examples use `pnpm`.

1. Install every skill:

   ```bash
   pnpm dlx skills add 0xintuition/agent-skills
   ```

   To install one skill, name it:

   ```bash
   pnpm dlx skills add 0xintuition/agent-skills --skill intuition
   ```

2. Start a new agent session. The installed skills are available in it.

Invoke a skill by name, for example `/intuition`. Agents that support skills
also invoke one on their own when a task matches it.

## What the `intuition` skill produces

The `intuition` skill reads current costs from the contract, builds the
calldata and value, and simulates the transaction. It then outputs one
unsigned transaction as JSON:

```json
{
  "to": "0x<multivault-address>",
  "data": "0x<calldata>",
  "value": "<amount in wei, as a base-10 string>",
  "chainId": "<chain ID, as a base-10 string>"
}
```

The skill does not hold keys and does not send transactions. Your
application, wallet, or backend remains responsible for:

- choosing the signer,
- presenting the transaction for approval,
- broadcasting it, and
- handling the receipt.

This boundary is deliberate. An agent can prepare a correct transaction
without ever being in a position to authorize one.

### Approval policy for unattended agents

An agent that runs unattended reads its approval policy from
`./.intuition/autonomous-policy.json`, or from the path in
`INTUITION_POLICY_PATH`. Without a policy file, the skill uses
`manual-review` mode. When the policy requires review, the skill outputs an
approval request with `"status": "approval_required"` instead of an
executable transaction. Enforce the policy in your signer as well. The skill
does not include signing middleware.

## Pin a version

The repository's `main` branch is an integration branch, not a stable
channel. For production agent workflows, install from a release tag or a
commit, and upgrade deliberately. Release tags are named after the skill and
its version, in the form `<skill>-v<version>`. The repository's
`CHANGELOG.md` lists the changes in each release.

## Related

- [Publish onchain](../build/publish-onchain.md) describes the transactions
  the skill prepares.
- [ERC-8004 agent layer](./erc-8004.md) uses the second skill.
- [Machine-readable documentation](./machine-readable-docs.md) gives an agent
  this documentation in one file.

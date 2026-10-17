---
title: Vaults and signals
description: Every term has a vault. Deposits into it are the protocol's measure of how much a term or a claim matters.
---

Registering a term records that it exists. It says nothing about whether
anyone considers it important or true. That information comes from vaults.

## Vaults

Every registered atom, triple, and counter-triple has a vault in the
`MultiVault` contract. Anyone can deposit TRUST, the network's native
currency, into a vault and receive shares in return. Redeeming shares returns
TRUST, minus fees.

A deposit is a **signal**: a public, costly statement that the depositor
stands behind the term.

- A deposit on an atom signals that the thing it identifies matters.
- A deposit on a triple signals agreement with its claim.
- A deposit on a counter-triple signals disagreement.

Redeeming shares withdraws the signal. Because a signal costs something to
make, it carries more weight than a free rating.

You cannot hold shares in a triple and in its counter-triple on the same
bonding curve. To change sides, redeem your shares on one side first.

## Bonding curves

A bonding curve sets the price of a vault's shares. A term has a separate
vault on each curve, and each curve has a numeric curve ID. The
`BondingCurveRegistry` contract lists the available curves. On mainnet, they
are:

| Curve ID | Curve                    | How the share price moves                  |
| -------- | ------------------------ | ------------------------------------------ |
| 1        | Linear Curve (default)   | Rises only as fees accumulate in the vault |
| 2        | Offset Progressive Curve | Rises as more shares are issued            |

The vault on the default curve is created together with the term. A vault on
any other curve is created by its first deposit.

On a curve whose price rises with supply, earlier depositors receive more
shares for the same amount than later ones. To preview the outcome of a
deposit, use `@0xintuition/curves`, which needs no network call, or call the
contract's `previewDeposit` and `previewRedeem` functions.

## Fees

Deposits and redemptions can incur the following fees. The rates are
contract configuration, so read them from the chain with `getVaultFees`,
`getAtomConfig`, and `getTripleConfig` rather than hard-coding them.

| Fee                     | Charged on                             | Goes to                                                |
| ----------------------- | -------------------------------------- | ------------------------------------------------------ |
| Protocol fee            | Deposits and redemptions               | The protocol                                           |
| Entry fee               | Deposits                               | The term's vault on the default curve                  |
| Exit fee                | Redemptions                            | The term's vault on the default curve                  |
| Atom wallet deposit fee | Deposits on an atom                    | The atom's wallet                                      |
| Atom deposit fraction   | Deposits on a triple or counter-triple | The vaults of the triple's three terms, in equal parts |

Each atom has an atom wallet, a smart contract account linked to the atom.
The fees it collects are paid to the wallet's owner when claimed.

Entry and exit fees apply only while the term's vault on the default curve
holds at least a threshold number of shares (`feeThreshold` in the contract's
general configuration), so the first deposits into a new vault do not pay
them. The atom deposit fraction applies only when the default-curve vaults of
all three of the triple's terms meet the same threshold.

Two consequences follow. Holding shares in a vault that others later deposit
into increases the value of those shares. And activity on a triple rewards
the holders of the terms it is built from.

## The cost of creating a term

Creating a term requires a minimum payment. It covers a fixed creation fee
and a small number of initial shares, which the contract issues to a burn
address so that a new vault is never empty. The minimum for a triple covers
initial shares for both the triple and its counter-triple. Any amount above
the minimum is deposited into the new vault on your behalf, minus fees.

Read the current amounts from the contract rather than hard-coding them. In
this example, `address` is the `MultiVault` address and `publicClient` is a
viem public client, set up as in [Read the chain](../build/read-the-chain.md):

```ts
import {
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
} from '@0xintuition/protocol';

const atomCost = await multiVaultGetAtomCost({ address, publicClient });
const tripleCost = await multiVaultGetTripleCost({ address, publicClient });
```

## Collecting fees in your application

An application that routes deposits through its own contract can add a fee of
its own. See [Fee proxy](../build/fee-proxy.md).

## Signals in Intuition Core

When a node indexes the chain, its projections maintain read models for
vaults, positions, share prices, and signals. Core records every deposit and
redemption as a signal for the account, term, and curve involved. See the
[Data model](../reference/data-model.md#event-store-tables).

## Related

- [Publish onchain](../build/publish-onchain.md)
- [Read the chain](../build/read-the-chain.md)

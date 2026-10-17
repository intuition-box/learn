---
title: Fee proxy
description: Collect a fee on the deposits your application sends, by routing them through a proxy contract you own.
---

A fee proxy is a contract that sits between your application and
`MultiVault`. Users deposit through it. It takes your fee, forwards the rest
of each deposit to `MultiVault`, and the shares go directly to the user.

Intuition provides a Hardhat template for this contract, the Intuition Fee
Proxy template. This page describes how the template behaves and how to
deploy it.

## Fees

The proxy charges two fees on each deposit, on top of the amount the user
deposits:

| Fee            | Template default | Applies to           |
| -------------- | ---------------- | -------------------- |
| Fixed fee      | 0.1 TRUST        | Each deposit         |
| Percentage fee | 5%               | The deposited amount |

Fees apply to `deposit`, `depositBatch`, and the deposits made as part of
`createAtoms` and `createTriples`. The cost of creating a term is passed
through to `MultiVault` without a fee.

```text
fee = (fixedFee × numberOfDeposits) + (totalDeposited × percentageFee / 10000)
```

For `createAtoms` and `createTriples`, `numberOfDeposits` counts only the
non-zero amounts. For `depositBatch`, it counts every entry.

| Action                                      | Fee                         | User sends   |
| ------------------------------------------- | --------------------------- | ------------ |
| One deposit of 10 TRUST                     | 0.1 + 0.5 = 0.6 TRUST       | 10.6 TRUST   |
| One deposit of 0.05 TRUST                   | 0.1 + 0.0025 = 0.1025 TRUST | 0.1525 TRUST |
| Three deposits of 0.01, 0.05, and 0.1 TRUST | 0.3 + 0.008 = 0.308 TRUST   | 0.468 TRUST  |

`MultiVault` then applies its own fees to the forwarded deposit. See
[Vaults and signals](../concepts/vaults-and-signals.md#fees).

## Call the proxy

The proxy's functions take the user's address as `receiver`, the account
that receives the shares.

| Function                                                                        | Value to send                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `deposit(receiver, termId, curveId, minShares)`                                 | The deposit plus its fee: `getTotalDepositCost(amount)`                   |
| `depositBatch(receiver, termIds, curveIds, assets, minShares)`                  | The sum of `assets` plus the fee                                          |
| `createAtoms(receiver, data, assets, curveId)`                                  | The creation cost, the deposits, and the fee: `getTotalCreationCost(...)` |
| `createTriples(receiver, subjectIds, predicateIds, objectIds, assets, curveId)` | The creation cost, the deposits, and the fee: `getTotalCreationCost(...)` |

`deposit` and `depositBatch` take the same arguments as on `MultiVault`.
`createAtoms` and `createTriples` differ: each amount in `assets` is the
deposit on top of the creation cost, not the total, and `curveId` names the
curve those deposits go to.

`getTotalDepositCost(depositAmount)` returns what to send for one deposit.
`getTotalCreationCost(depositCount, totalDeposit, multiVaultCost)` returns
what to send for a creation, where `multiVaultCost` is the creation cost
times the number of terms, plus the total deposit. `calculateDepositFee`
returns the fee alone.

> [!NOTE]
> Terms created through the proxy record the proxy, not the user, as their
> creator onchain.

## User approval

Because the proxy deposits on the user's behalf, each user must approve it on
`MultiVault` once, with the deposit approval type:

```ts
import { multiVaultApprove } from '@0xintuition/protocol';

const hash = await multiVaultApprove(config, {
  args: [proxyAddress, 1],
});
```

`config` is a configuration with the user's wallet client, as in
[Deposit and redeem](./deposit-and-redeem.md#deposit-on-behalf-of-another-account).
`proxyAddress` is your deployed proxy, and `1` is the deposit approval.

## Configure

The template reads its configuration from environment variables when it
deploys. Copy `.env.example` to `.env` and set:

| Variable             | Meaning                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `PRIVATE_KEY`        | The key of the deploying account, which pays for the deployment                                |
| `FEE_RECIPIENT`      | The address that receives the fees. It must be an address you control on the Intuition network |
| `ADMIN_1`, `ADMIN_2` | Addresses permitted to change the fees and settings. `ADMIN_2` is optional                     |
| `DEPOSIT_FEE`        | The fixed fee, in TRUST                                                                        |
| `DEPOSIT_PERCENTAGE` | The percentage fee, in basis points. `500` is 5%                                               |

After deployment, an administrator can change the fees with
`setDepositFixedFee` and `setDepositPercentageFee`, change the recipient with
`setFeeRecipient`, and add or remove administrators with
`setWhitelistedAdmin`.

## Deploy

1. Check the `MultiVault` addresses in `scripts/deploy.ts`. They must match
   the addresses in [Networks and contracts](./networks-and-contracts.md).
   Correct them if they differ.

2. Install the dependencies, compile the contract, and run the test suite:

   ```bash
   pnpm install
   pnpm run compile
   pnpm test
   ```

3. Deploy to the testnet, and confirm the behavior with a small deposit:

   ```bash
   pnpm run deploy:testnet
   ```

4. Deploy to mainnet:

   ```bash
   pnpm run deploy:mainnet
   ```

The script prints the proxy's address and verifies the contract on the
explorer. The proxy is not upgradeable. To change its code, deploy a new
proxy.

## Considerations

- State your fee clearly in your interface. Users see the total they send,
  and the difference from the amount deposited should not surprise them.
- Read through `MultiVault` directly. The proxy passes some reads through,
  but its `calculateAtomId` does not apply the protocol's derivation and
  returns a different identifier. Use `@0xintuition/ids` instead.
- A proxy holds administrative power over its fees. Protect the
  administrator keys accordingly.

## Related

- [Deposit and redeem](./deposit-and-redeem.md)
- [Publish onchain](./publish-onchain.md)
- [Vaults and signals](../concepts/vaults-and-signals.md)

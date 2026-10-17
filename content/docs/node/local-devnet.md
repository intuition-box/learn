---
title: Local devnet
description: Run a local chain with the production contracts, create terms onchain, and watch your node index them.
---

The `devnet` Compose profile runs the whole system on your machine: a local
[Anvil](https://getfoundry.sh) chain, the Intuition contracts deployed to it,
and your node indexing that chain. After the first image download, it works
offline.

The contracts come from the published
[`@0xintuition/contracts-v2`](https://www.npmjs.com/package/@0xintuition/contracts-v2)
package. Core V2 pins its version, 1.1.0-alpha.0, so the devnet runs that
version of the contracts.

## Before you begin

- A running node. See [Run a node](./run-a-node.md).
- Local port 8545 free, for the chain's RPC endpoint.
- To create atoms onchain from your terminal, also install
  [Foundry](https://getfoundry.sh), which provides `cast`, and
  [jq](https://jqlang.github.io/jq/).

## Start the chain and deploy the contracts

1. Start Anvil and run the deployment job:

   ```bash
   docker compose --profile devnet up -d anvil devnet-deploy
   ```

   `make devnet` runs the same command.

2. Follow the deployment:

   ```bash
   docker compose logs -f devnet-deploy
   ```

   The job deploys the full system, creates a test atom to confirm that events
   are emitted, and writes the contract addresses to
   `devnet/deployments-devnet.json`. It ends by printing the `.env` values that
   point your indexer at the new chain.

Running the job again detects the existing deployment and verifies it instead
of deploying a second copy.

## Point the indexer at your chain

1. Read the `MultiVault` address and its deployment block from the
   deployments file:

   ```bash
   jq -r '.MultiVault, .deployBlock' devnet/deployments-devnet.json
   ```

2. Set the following in `.env`, using those two values:

   ```bash
   INTUITION_RPC_URL=http://anvil:8545
   CHAIN_ID=31337
   MULTIVAULT_CONTRACT_ADDRESS=0x...
   MULTIVAULT_START_BLOCK=...
   MULTIVAULT_END_BLOCK=
   USE_TYPED_READER=true
   ```

   `anvil` is the chain's name on the Compose network, so this RPC address
   works for the containers. From your own terminal, the chain is at
   `http://localhost:8545`.

3. Start the chain and the indexing profile together:

   ```bash
   docker compose --profile devnet --profile indexing up -d
   ```

Treat `devnet/deployments-devnet.json` as the source of truth. Chain state
persists in the `anvil_data` volume across restarts, so the address and the
deployment block can differ from those of a fresh deployment.

To stop everything, including the chain, and keep its state:

```bash
docker compose --profile devnet --profile indexing down
```

## Create an atom onchain

Anvil's first account is funded. Its private key is Foundry's standard
development key: it is public, and you must only ever use it on a local chain.

```bash
MV=$(jq -r .MultiVault devnet/deployments-devnet.json)
COST=$(cast call $MV "getAtomCost()(uint256)" --rpc-url http://localhost:8545 | awk '{print $1}')

cast send $MV "createAtoms(bytes[],uint256[])" \
  "[$(cast from-utf8 'https://github.com/oven-sh/bun')]" "[$COST]" \
  --value $COST \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

`MV` holds the `MultiVault` address and `COST` holds the minimum amount, in
wei, needed to create one atom. Two rules apply to `createAtoms`:

- The transaction value must equal the sum of the amounts array, and each
  amount must be at least `getAtomCost()`.
- Atom data must be new. Creating the same data twice reverts with
  `MultiVault_AtomExists`.

Confirm that your node indexed the atom. Within seconds, the atom count rises
by one and the new atom appears first in the list:

```bash
curl http://localhost:3000/api/stats
curl "http://localhost:3000/api/atoms?limit=1"
```

## Run without Docker

With Foundry installed, you can run the chain and the deployer as local
processes:

```bash
anvil --disable-code-size-limit &
bun run devnet:deploy
```

To run the whole stack as local processes, including the chain, install
[Process Compose](https://f1bonacc1.github.io/process-compose/installation/),
Rust, and `envsubst`, then run:

```bash
bun run dev:local -- indexing --devnet
```

For local processes, use `http://localhost:8545` as `INTUITION_RPC_URL`.

## Deploy your own instance to the testnet

The same deployer creates a separate protocol deployment on the Intuition
testnet (chain 13579), isolated from the canonical one:

```bash
PRIVATE_KEY=0x... bun run testnet:deploy
```

Replace `0x...` with the private key of an account you control on the
testnet. The account pays gas for about 40 transactions, in testnet TRUST from
the faucet at [testnet.hub.intuition.systems](https://testnet.hub.intuition.systems).
The command writes `devnet/deployments-testnet.json` and prints the `.env`
values that point your indexer at the new deployment.

> [!CAUTION]
> Never pass a key that holds mainnet funds. Prefer a fresh account funded
> only from the faucet.

## Notes

- Anvil must run with `--disable-code-size-limit`, because the `MultiVault`
  implementation exceeds the default contract size limit. The Compose profile
  sets this flag for you.
- The deployment block is not deterministic. Read it from the deployments
  file.
- The contract version is pinned in `packages/contracts/package.json`. After
  you change it, run `bun run abis:sync` to regenerate the ABI the indexer
  reads.

## Related

- [Index the chain](./index-the-chain.md)
- [Publish onchain](../build/publish-onchain.md)

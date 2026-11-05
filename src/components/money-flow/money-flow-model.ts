/**
 * Where a deposit on an existing triple goes, as `MultiVault` splits it. All
 * three fees are taken from the deposit at once, and the atom deposit
 * fraction reaches only the triple's own three terms: on a nested triple, the
 * inner triple keeps its part, and its atoms get nothing.
 *
 * It holds when the triple's vault and those of its three terms each have at
 * least the fee threshold of shares. Under it, the entry fee or the fraction
 * is waived. Rates read from mainnet; governance can change them.
 */

/** Basis points in a whole: 1 is 0.01%. */
const WHOLE = 10_000;

/** `MultiVault`'s rates, in basis points of the deposit. */
export const RATES = {
  protocol: 125,
  entry: 50,
  atomFraction: 90,
} as const;

/**
 * What a builder's fee proxy adds on top of a deposit: a percentage of it, in
 * basis points, and a flat fee in TRUST. Optional, and the builder's to set;
 * these bring what the user sends to a round 360 on a deposit of 350.
 */
export const BUILDER_RATE = 200;
export const BUILDER_FLAT = 3;

/** The terms of a triple the fraction is shared between. */
const TERMS = 3;

export interface DepositFlow {
  /** All the user sends: the deposit and the builder's fee. */
  sent: number;
  builderFee: number;
  deposit: number;
  /** What buys the depositor's shares. */
  position: number;
  protocol: number;
  /** Stays in the triple's vault, without buying shares. */
  entry: number;
  atomFraction: number;
  /** The fraction's part for each of the three terms. */
  perTerm: number;
  /** All `MultiVault` takes from the deposit: the protocol's, entry and fraction. */
  fees: number;
}

export function depositFlow(deposit: number): DepositFlow {
  const share = (rate: number): number => (deposit * rate) / WHOLE;
  const builderFee = share(BUILDER_RATE) + BUILDER_FLAT;
  const protocol = share(RATES.protocol);
  const entry = share(RATES.entry);
  const atomFraction = share(RATES.atomFraction);
  const position = deposit - protocol - entry - atomFraction;

  return {
    sent: deposit + builderFee,
    builderFee,
    deposit,
    position,
    protocol,
    entry,
    atomFraction,
    perTerm: atomFraction / TERMS,
    fees: protocol + entry + atomFraction,
  };
}

export interface FeesByKind {
  /** What the atoms among its terms receive. */
  atoms: number;
  /** What triples receive: the triple's entry fee, and any triple among its terms. */
  triples: number;
  protocol: number;
}

/**
 * A deposit's fees by what receives them, on a triple with `atomTerms` atoms
 * among its three terms. They reach those terms' vaults and stop there.
 */
export function feesByKind(flow: DepositFlow, atomTerms: number): FeesByKind {
  return {
    atoms: flow.perTerm * atomTerms,
    triples: flow.entry + flow.perTerm * (TERMS - atomTerms),
    protocol: flow.protocol,
  };
}

import { describe, expect, it } from 'vitest';

import { depositFlow, feesByKind, sentFlow } from './money-flow-model';

describe('depositFlow', () => {
  it('splits 2,000 in whole numbers, as the mainnet fork did', () => {
    expect(depositFlow(2000)).toEqual({
      sent: 2000,
      builderFee: 0,
      deposit: 2000,
      position: 1947,
      protocol: 25,
      entry: 10,
      atomFraction: 18,
      perTerm: 6,
      fees: 53,
    });
  });

  it('matches the fork on another amount', () => {
    const { position, protocol, entry, perTerm } = depositFlow(8000);

    expect([position, protocol, entry, perTerm]).toEqual([7788, 100, 40, 24]);
  });

  it('takes the builder fee from all that is sent, and adds up to two decimals on 100', () => {
    const flow = sentFlow(100);
    const cents = (value: number): number => Math.round(value * 100);
    const { builderFee, deposit, position, fees } = flow;
    const { protocol, entry, atomFraction, perTerm } = flow;
    const { atoms, triples } = feesByKind(flow, 2);

    expect(builderFee).toBeCloseTo(0.5);
    expect(deposit).toBeCloseTo(99.5);
    expect(cents(perTerm)).toBe(30);
    expect(cents(position) + cents(fees)).toBe(cents(deposit));
    expect(cents(protocol) + cents(entry) + cents(atomFraction)).toBe(
      cents(fees),
    );
    expect(cents(perTerm) * 3).toBe(cents(atomFraction));
    expect(cents(atoms) + cents(triples) + cents(protocol)).toBe(cents(fees));
  });

  it('accounts for all of the deposit', () => {
    const { deposit, position, protocol, entry, perTerm } = depositFlow(2000);

    expect(position + protocol + entry + perTerm * 3).toBe(deposit);
  });
});

describe('feesByKind', () => {
  const flow = depositFlow(2000);

  it('splits the fees of a deposit on the outer triple, with two atoms and a triple as its terms', () => {
    expect(feesByKind(flow, 2)).toEqual({
      atoms: 12,
      triples: 16,
      protocol: 25,
    });
  });

  it('splits the fees of a deposit on the inner triple, with three atoms as its terms', () => {
    expect(feesByKind(flow, 3)).toEqual({
      atoms: 18,
      triples: 10,
      protocol: 25,
    });
  });

  it('accounts for all of the fees either way', () => {
    for (const atomTerms of [2, 3]) {
      const { atoms, triples, protocol } = feesByKind(flow, atomTerms);

      expect(atoms + triples + protocol).toBe(flow.fees);
    }
  });
});

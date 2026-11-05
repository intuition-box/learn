import { describe, expect, it } from 'vitest';

import { depositFlow, feesByKind } from './money-flow-model';

describe('depositFlow', () => {
  it('splits 2,000 in whole numbers, as the mainnet fork did', () => {
    expect(depositFlow(2000)).toEqual({
      sent: 2043,
      builderFee: 43,
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

  it('adds up in whole TRUST on 350, with a round total sent', () => {
    const flow = depositFlow(350);
    const { sent, builderFee, deposit, position, fees } = flow;
    const { protocol, entry, atomFraction, perTerm } = flow;

    expect([sent, builderFee]).toEqual([360, 10]);
    expect(Math.round(perTerm)).toBe(1);
    expect(Math.round(position) + Math.round(fees)).toBe(deposit);
    expect(
      Math.round(protocol) + Math.round(entry) + Math.round(atomFraction),
    ).toBe(Math.round(fees));
    expect(Math.round(perTerm) * 3).toBe(Math.round(atomFraction));

    const { atoms, triples } = feesByKind(flow, 2);

    expect(Math.round(atoms) + Math.round(triples) + Math.round(protocol)).toBe(
      Math.round(fees),
    );
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

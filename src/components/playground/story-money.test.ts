import { describe, expect, it } from 'vitest';

import {
  alongPoints,
  type MoneyFlowAnchors,
  moneyPicture,
} from './story-money';

const ANCHORS: MoneyFlowAnchors = {
  line: [
    { x: 100, y: 200 },
    { x: 100, y: 100 },
    { x: 0, y: 50 },
  ],
  vault: { x: 0, y: 40 },
  inner: { x: 40, width: 100, bottom: 10 },
  spacex: -200,
  willBeWorth: -100,
  innerAtoms: [50, 90, 130],
};

const amounts = (view: 'deposit' | 'fees'): Record<string, string> =>
  Object.fromEntries(
    moneyPicture(view, ANCHORS).stops.map(({ id, amount }) => [id, amount]),
  );

describe('moneyPicture', () => {
  it('shows the deposit from what is sent to the position', () => {
    expect(amounts('deposit')).toEqual({
      sent: '100',
      builder: '0.5',
      enters: '99.5',
      fees: '2.64',
      position: '96.86',
    });
  });

  it('rises along the depositor’s own line, and ends at the vault', () => {
    const [first, ...rest] = moneyPicture('deposit', ANCHORS).runs;

    expect(first?.points[0]).toEqual(ANCHORS.line[0]);
    expect(rest.at(-1)?.points.at(-1)).toEqual(ANCHORS.line[2]);
  });

  it('sends the fees to the protocol, the vault and its three terms', () => {
    expect(amounts('fees')).toMatchObject({
      protocol: '1.24',
      vault: '+0.5',
      spacex: '+0.3',
      willBeWorth: '+0.3',
      inner: '+0.3',
    });
  });

  it('leaves the inner atoms’ vaults empty, and no one else’s', () => {
    const { vaults } = moneyPicture('fees', ANCHORS);

    expect(vaults.filter((vault) => vault.isEmpty).map(({ id }) => id)).toEqual(
      ['inner:0', 'inner:1', 'inner:2'],
    );
  });

  it('keeps what the deposit left behind the fees, the fees themselves in full', () => {
    const stops = moneyPicture('fees', ANCHORS).stops;

    expect(stops.find(({ id }) => id === 'fees')?.held).toBe(1);
    expect(stops.find(({ id }) => id === 'sent')?.held).toBeLessThan(1);
    expect(stops.some(({ id }) => id === 'position')).toBe(false);
  });
});

describe('alongPoints', () => {
  it('goes by length, over every stretch', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 30 },
    ];

    expect(alongPoints(points, 0.25)).toEqual({ x: 10, y: 0 });
    expect(alongPoints(points, 1)).toEqual({ x: 10, y: 30 });
  });
});

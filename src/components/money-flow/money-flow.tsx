'use client';

import { type ReactNode, useState } from 'react';

import { DepositView } from './deposit-view';
import { FeesView } from './fees-view';
import { sentFlow } from './money-flow-model';

/** What the user sends: about 1 TRUST reaches each term, and rounded, every figure still adds up. */
const SENT = 360;

const VIEWS = [
  { id: 'deposit', label: 'Deposit split' },
  { id: 'fees', label: 'Fees split' },
] as const;

type View = (typeof VIEWS)[number]['id'];

/**
 * A deposit on the nested triple, in two views, one at a time: the money, from
 * what the user sends to the position, then the fees, from what is taken to
 * where each part lands.
 */
export function MoneyFlow(): ReactNode {
  const [view, setView] = useState<View>('deposit');
  const flow = sentFlow(SENT);

  return (
    <figure className="w-full max-w-7xl min-w-0">
      <div className="mb-4 flex justify-center gap-2">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => {
              setView(id);
            }}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-fg-muted outline-offset-2 outline-accent hover:text-fg focus-visible:outline-2 aria-pressed:bg-fg aria-pressed:text-bg"
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'deposit' ? (
        <DepositView flow={flow} />
      ) : (
        <FeesView flow={flow} />
      )}
      <figcaption className="mt-4 text-center text-sm text-fg-muted">
        A deposit on an existing triple, on the side for it, when its vault and
        those of its three terms each hold at least 1 share. In TRUST, at
        mainnet's current rates, rounded to whole TRUST.
      </figcaption>
    </figure>
  );
}

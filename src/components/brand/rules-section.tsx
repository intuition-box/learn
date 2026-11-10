import type { ReactNode } from 'react';

import type { BrandConfig, SectionMeta } from './brand-config';
import { SPAN, SUBGRID } from '../layout/grid';
import { BrandSection } from './brand-section';

export interface RulesSectionProps {
  config: BrandConfig;
  section: SectionMeta;
}

function RuleCard({
  title,
  mark,
  rules,
  className,
}: {
  title: string;
  mark: string;
  rules: readonly string[];
  className: string;
}): ReactNode {
  return (
    <div className={`${SPAN[6]} panel p-6 ${className}`}>
      <h3 className="text-xl font-medium">{title}</h3>
      <ul className="mt-4 grid list-none gap-3">
        {rules.map((rule) => (
          <li key={rule} className="grid grid-cols-[1.25rem_1fr] gap-2">
            <span aria-hidden className="text-graphite-500">
              {mark}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The short version of everything above. The Don't card stands forward in
 * the ink's border: following the rules is the quiet default, and the list
 * to notice is the one that says what breaks.
 */
export function RulesSection({
  config,
  section,
}: RulesSectionProps): ReactNode {
  const rules = config.rules;
  if (rules === undefined) {
    return null;
  }
  return (
    <BrandSection section={section} lead={rules.lead}>
      <div className={`${SUBGRID} gap-y-3`}>
        {rules.dos.length === 0 ? null : (
          <RuleCard title="Do" mark="✓" rules={rules.dos} className="" />
        )}
        {rules.donts.length === 0 ? null : (
          <RuleCard
            title="Don't"
            mark="✕"
            rules={rules.donts}
            className="border-graphite-900"
          />
        )}
      </div>
    </BrandSection>
  );
}

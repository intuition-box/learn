import { describe, expect, it } from 'vitest';

import { brandFileParams, brandFileResponse } from './asset-response';
import { brandFixture } from './brand-fixture';

describe('brandFileResponse', () => {
  const brand = brandFixture();

  it('serves an SVG as written', async () => {
    const response = brandFileResponse(brand, 'acme-x-banner-1500x500.svg');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(await response.text()).toBe(brand.social?.assets[0]?.svg);
  });

  it('serves a PNG rendered from it', async () => {
    const response = brandFileResponse(brand, 'acme-x-banner-1500x500.png');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    const body = new Uint8Array(await response.arrayBuffer());
    expect([...body.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
  });

  it('answers a name it does not know with a 404', () => {
    expect(brandFileResponse(brand, 'acme-x-banner-1500x500.gif').status).toBe(
      404,
    );
  });
});

describe('brandFileParams', () => {
  it('lists every file name', () => {
    expect(brandFileParams(brandFixture())).toHaveLength(4);
  });

  it('refuses a broken brand, listing its issues', () => {
    expect(() => brandFileParams({ ...brandFixture(), slug: 'Acme' })).toThrow(
      /slug "Acme" is not kebab-case/,
    );
  });
});

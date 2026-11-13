import { describe, expect, it } from 'vitest';

import { seenFaces } from './brand-observed';
import {
  MOLECULE_PARTS,
  moleculeBonds,
  moleculeGroup,
  moleculePlacement,
  moleculeSolid,
  moleculeSvg,
} from './brand-molecule';

// Each picture draws a dithered backdrop the size of its frame: seconds, not milliseconds.
const DRAWING = 60_000;

describe('moleculeSvg', () => {
  const frame = { width: 2560, height: 1440 };

  it(
    'draws the same picture every time',
    () => {
      expect(moleculeSvg(frame)).toBe(moleculeSvg(frame));
    },
    DRAWING,
  );

  it(
    'glows in the triple roles, with no hexagon',
    () => {
      const svg = moleculeSvg(frame);
      for (const color of ['#7a86ff', '#2fe08b', '#ff4f5e']) {
        expect(svg).toContain(color);
      }
      expect(svg).not.toContain('#ff5fd2');
    },
    DRAWING,
  );

  it(
    'lays the reference backdrop over the whole frame as one dithered image',
    () => {
      for (const size of [
        frame,
        { width: 1179, height: 2556 },
        { width: 1500, height: 500 },
      ]) {
        expect(moleculeSvg(size)).toContain(
          `x="0" y="0" width="${size.width}" height="${size.height}" preserveAspectRatio="none"/>`,
        );
      }
    },
    DRAWING,
  );

  it(
    "draws its bonds as the skill's bond, held at three times the film's, with no glow",
    () => {
      const hairlines = moleculeSvg(frame).match(
        /<path d="M[^"]+Q[^"]+" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="3" stroke-linecap="round"\/>/g,
      );
      expect(hairlines).toHaveLength(5);
    },
    DRAWING,
  );

  it(
    'draws each bond just after the farther of its two shapes: over it, under the nearer',
    () => {
      const svg = moleculeSvg(frame);
      const starts = [...MOLECULE_PARTS.keys(), MOLECULE_PARTS.length].map(
        (index) => {
          const at = svg.indexOf(`molecule-${index}-bloom-1)`);
          return at === -1 ? svg.length : at;
        },
      );
      const bondsAfter = MOLECULE_PARTS.map(
        (_, index) =>
          svg
            .slice(starts[index], starts[index + 1])
            .match(/stroke-opacity="0.12" stroke-width="3"/g)?.length ?? 0,
      );
      // The squares and the far-left circle are behind the triangle; the right circle in front of it.
      expect(bondsAfter).toEqual([1, 1, 1, 1, 1, 0]);
    },
    DRAWING,
  );
  it(
    'leaves out the far glow, its exception',
    () => {
      expect(moleculeSvg(frame)).not.toContain('-bloom-2');
    },
    DRAWING,
  );

  it(
    "draws each shape's shadow as a dithered image, after its middle glow and before its hot edge",
    () => {
      const svg = moleculeSvg(frame);
      for (const index of MOLECULE_PARTS.keys()) {
        expect(svg).toMatch(
          new RegExp(
            `molecule-${index}-bloom-1\\)[^>]*>[^<]*(?:<(?!image)[^>]*>[^<]*)*<image href="data:image/png;base64,[^"]+"[^>]*/><g opacity="0.3" filter="url\\(#molecule-${index}-bloom-0\\)`,
          ),
        );
      }
    },
    DRAWING,
  );
});

describe("the molecule's atoms", () => {
  const solids = MOLECULE_PARTS.map(moleculeSolid);

  it('shows the nearest circle biggest, and the triangle no bigger than it', () => {
    const nearest = [...MOLECULE_PARTS].sort((a, b) => b.z - a.z)[0];
    expect(nearest?.role).toBe('identity');
    for (const part of MOLECULE_PARTS) {
      expect(part.unit).toBeLessThanOrEqual(nearest?.unit ?? 0);
    }
  });

  it('shows each one smaller the further back it stands', () => {
    const byDepth = [...MOLECULE_PARTS].sort((a, b) => b.z - a.z);
    for (const [index, part] of byDepth.entries()) {
      expect(part.unit).toBeLessThanOrEqual(
        byDepth[index - 1]?.unit ?? Infinity,
      );
    }
  });

  it('stands no prism straight: each turned about 45° and rolled', () => {
    for (const solid of solids.filter((each) => each.role !== 'identity')) {
      const yaw = (solid.yaw * Math.PI) / 180;
      const pitch = (solid.pitch * Math.PI) / 180;
      const turned = Math.hypot(Math.sin(yaw), Math.cos(yaw) * Math.sin(pitch));
      expect(turned).toBeGreaterThan(0.6);
      expect(Math.abs(solid.roll ?? 0)).toBeGreaterThanOrEqual(15);
    }
  });

  it('leaves every bond from the middle of the face that looks most toward its other atom', () => {
    const hub = solids.find((each) => each.role === 'predicate');
    const bonds = moleculeBonds();
    expect(bonds).toHaveLength(5);
    for (const bond of bonds) {
      const solid = solids[bond.part];
      if (solid === undefined || hub === undefined) {
        continue;
      }
      const facing = (normal: readonly number[]) =>
        (normal[0] ?? 0) * (hub.x - solid.x) +
        (normal[1] ?? 0) * (hub.y - solid.y);
      for (const face of seenFaces(solid)) {
        expect(facing(bond.own.normal)).toBeGreaterThanOrEqual(
          facing(face.normal),
        );
      }
    }
  });

  it("hits each square's front face in its middle", () => {
    const toSquares = moleculeBonds().filter(
      (bond) => solids[bond.part]?.role === 'object',
    );
    expect(toSquares.map((bond) => bond.own.isCap)).toEqual([true, true, true]);
  });

  it("leaves a sphere's bonds from its center", () => {
    const fromSpheres = moleculeBonds().filter(
      (bond) => solids[bond.part]?.role === 'identity',
    );
    expect(fromSpheres.map((bond) => [bond.own.x, bond.own.y])).toEqual(
      fromSpheres.map((bond) => [solids[bond.part]?.x, solids[bond.part]?.y]),
    );
  });

  it('centers the six shapes, as a group, in every frame', () => {
    const group = moleculeGroup();
    for (const frame of [
      { width: 2560, height: 1440 },
      { width: 1179, height: 2556 },
      { width: 1500, height: 500 },
      { width: 1584, height: 396 },
    ]) {
      const { x, y, scale } = moleculePlacement(frame);
      expect(x + ((group.left + group.right) / 2) * scale).toBeCloseTo(
        frame.width / 2,
        6,
      );
      expect(y + ((group.top + group.bottom) / 2) * scale).toBeCloseTo(
        frame.height / 2,
        6,
      );
      // The group, its glow too, inside the frame.
      expect(x + (group.left - 60) * scale).toBeGreaterThanOrEqual(0);
      expect(y + (group.top - 60) * scale).toBeGreaterThanOrEqual(0);
    }
  });
});

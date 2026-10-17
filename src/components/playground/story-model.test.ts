import { describe, expect, it } from 'vitest';

import {
  type AtomId,
  BEATS,
  beatAt,
  captionText,
  CHAPTER_SPANS,
  chapterAt,
  describeScene,
  DURATION,
  MIN_RADIUS_PX,
  RADIUS_SHARE,
  type Scene,
  sceneAt,
  stepFrom,
  turnToFace,
  viewOf,
} from './story-model';
import { rotate } from '@/lib/sphere';

function beat(id: string): (typeof BEATS)[number] {
  const found = BEATS.find((candidate) => candidate.id === id);
  if (found === undefined) {
    throw new Error(`No beat ${id}`);
  }

  return found;
}

/** The scene once a beat's motion is done. */
function settled(id: string): Scene {
  const { start, motionMs } = beat(id);

  return sceneAt(start + motionMs);
}

function atom(scene: Scene, id: AtomId): Scene['atoms'][number] {
  const found = scene.atoms.find((drawn) => drawn.id === id);
  if (found === undefined) {
    throw new Error(`${id} is not in the scene`);
  }

  return found;
}

const present = (scene: Scene): AtomId[] =>
  scene.atoms.filter((drawn) => drawn.presence === 1).map((drawn) => drawn.id);

describe('the timeline', () => {
  it('runs the beats back to back, from 0 to the end', () => {
    expect(BEATS[0]?.start).toBe(0);
    BEATS.slice(1).forEach((current, index) => {
      expect(current.start).toBe(BEATS[index]?.end);
    });
    expect(DURATION).toBe(BEATS.at(-1)?.end);
  });

  it('holds each beat long enough to read its caption after the motion', () => {
    for (const { caption, start, end, motionMs } of BEATS) {
      const readMs = end - start - motionMs;
      // At most 20 characters a second.
      expect(readMs).toBeGreaterThanOrEqual(
        (captionText(caption).length / 20) * 1000,
      );
    }
  });

  it('divides into chapters that cover it, in order', () => {
    expect(CHAPTER_SPANS[0]?.start).toBe(0);
    expect(CHAPTER_SPANS.at(-1)?.end).toBe(DURATION);
    CHAPTER_SPANS.slice(1).forEach((span, index) => {
      expect(span.start).toBe(CHAPTER_SPANS[index]?.end);
    });
    expect(chapterAt(0).title).toBe('Atoms');
    expect(chapterAt(beat('triple').start).title).toBe('Triples');
  });

  it('gives the last beat past the end', () => {
    expect(beatAt(DURATION + 1000).id).toBe(BEATS.at(-1)?.id);
  });

  it('writes its captions without em dashes', () => {
    for (const { caption } of BEATS) {
      expect(captionText(caption)).not.toContain('—');
    }
  });
});

describe('the first chapters', () => {
  it('opens on an empty stage, and brings Elon Musk to the middle', () => {
    expect(sceneAt(0).atoms.every((drawn) => drawn.presence === 0)).toBe(true);

    const scene = settled('atom');
    expect(present(scene)).toEqual(['elonMusk']);
    // At the front of the cloud, facing the viewer.
    expect(atom(scene, 'elonMusk').at).toEqual([0, 0, 1]);
    expect(atom(scene, 'elonMusk').role.to).toBe('identity');
  });

  it('moves Elon Musk left to make room for SpaceX, both plain atoms', () => {
    const scene = settled('second-atom');

    expect(present(scene)).toEqual(['elonMusk', 'spacex']);
    expect(atom(scene, 'elonMusk').at[0]).toBeLessThan(0);
    expect(atom(scene, 'spacex').at[0]).toBeGreaterThan(0);
    expect(scene.triples).toEqual([]);
  });

  it('brings in Founder of between them, and pulls the camera back', () => {
    const scene = settled('third-atom');
    const [left] = atom(scene, 'elonMusk').at;
    const [middle] = atom(scene, 'founderOf').at;
    const [right] = atom(scene, 'spacex').at;

    expect(left).toBeLessThan(middle);
    expect(middle).toBeLessThan(right);
    expect(atom(scene, 'founderOf').role.to).toBe('identity');
    expect(scene.camera.zoom).toBeLessThan(settled('atom').camera.zoom);
  });

  it('connects the three into a triple, each taking its role', () => {
    const scene = settled('triple');

    expect(scene.triples).toHaveLength(1);
    expect(scene.triples[0]?.progress).toBe(1);
    expect(atom(scene, 'elonMusk').role.to).toBe('identity');
    expect(atom(scene, 'founderOf').role).toMatchObject({
      to: 'predicate',
      progress: 1,
    });
    expect(atom(scene, 'spacex').role).toMatchObject({
      from: 'identity',
      to: 'object',
      progress: 1,
    });
  });

  it('draws the line before SpaceX becomes the object', () => {
    const { start, motionMs } = beat('triple');
    const early = sceneAt(start + motionMs * 0.35);

    expect(early.triples[0]?.progress).toBeGreaterThan(0);
    expect(atom(early, 'spacex').role.progress).toBe(0);
  });
});

describe('an object as a subject', () => {
  it('brings owns and xAI in to the right of SpaceX', () => {
    const scene = settled('object-as-subject');
    const x = (id: AtomId): number => atom(scene, id).at[0];

    expect(present(scene)).toEqual([
      'elonMusk',
      'spacex',
      'founderOf',
      'owns',
      'xai',
    ]);
    expect(x('spacex')).toBeLessThan(x('owns'));
    expect(x('owns')).toBeLessThan(x('xai'));
  });

  it('connects SpaceX owns xAI, and keeps the first triple', () => {
    const scene = settled('object-as-subject');

    expect(scene.triples.map((triple) => [triple.id, triple.progress])).toEqual(
      [
        ['elonFoundedSpacex', 1],
        ['spacexOwnsXai', 1],
      ],
    );
  });

  it('draws SpaceX, object of one triple and subject of the next, as both: a hexagon', () => {
    const scene = settled('object-as-subject');

    expect(atom(scene, 'spacex').role).toMatchObject({
      from: 'object',
      to: 'subjectAndObject',
    });
    expect(atom(scene, 'owns').role.to).toBe('predicate');
    expect(atom(scene, 'xai').role.to).toBe('object');
  });

  it('brings the new atoms in plain, to take their roles as the line reaches them', () => {
    const { start, motionMs } = beat('object-as-subject');
    const arrived = sceneAt(start + motionMs * 0.5);

    expect(atom(arrived, 'owns').presence).toBe(1);
    expect(atom(arrived, 'owns').role).toMatchObject({
      from: 'identity',
      progress: 0,
    });
    expect(atom(arrived, 'xai').role.progress).toBe(0);
  });
});

describe('a graph', () => {
  it('brings best and AI company in to the right of xAI, and closes the chapter of triples', () => {
    const scene = settled('graph');
    // How far round to the right, as the chain runs on round the cloud.
    const longitude = (id: AtomId): number => {
      const [x, , z] = atom(scene, id).at;

      return Math.atan2(x, z);
    };

    expect(longitude('xai')).toBeLessThan(longitude('best'));
    expect(longitude('best')).toBeLessThan(longitude('aiCompany'));
    expect(beat('graph').chapter).toBe('triples');
    // The last beat of its chapter.
    expect(BEATS[beat('graph').index + 1]?.chapter).not.toBe('triples');
  });

  it('draws xAI as both a subject and an object, and every triple whole', () => {
    const scene = settled('graph');

    expect(atom(scene, 'xai').role).toMatchObject({
      from: 'object',
      to: 'subjectAndObject',
    });
    expect(atom(scene, 'best').role.to).toBe('predicate');
    expect(atom(scene, 'aiCompany').role.to).toBe('object');
    expect(scene.triples.map((triple) => triple.progress)).toEqual([1, 1, 1]);
  });

  it('raises the camera to look down on the cloud, so the chain curves round it', () => {
    expect(settled('graph').camera.facing[1]).toBeGreaterThan(0.2);
    expect(settled('object-as-subject').camera.facing[1]).toBe(0);
  });
});

describe('turnToFace', () => {
  it('brings what the camera faces to the front', () => {
    const facing = settled('graph').camera.facing;
    const [x, y, z] = rotate(turnToFace(facing), facing);

    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(1, 9);
  });

  it('keeps the equator level: its points either side of the front stay at one height', () => {
    const turn = turnToFace(settled('graph').camera.facing);
    const longitude = 1.2;
    const left = rotate(turn, [
      Math.sin(longitude - 0.5),
      0,
      Math.cos(longitude - 0.5),
    ]);
    const right = rotate(turn, [
      Math.sin(longitude + 0.5),
      0,
      Math.cos(longitude + 0.5),
    ]);

    expect(left[1]).toBeCloseTo(right[1], 9);
  });
});

describe('viewOf, pulled back to the whole cloud', () => {
  it('fits all of it in the shorter side, facing what the camera faces, on any screen', () => {
    const camera = {
      facing: [0, 0, 1] as const,
      zoom: 0.35,
      focus: [1, 0, 0] as const,
      whole: 1,
    };

    expect(viewOf(camera, 340, 340).radius).toBeCloseTo(340 * 0.42, 9);
    expect(viewOf(camera, 900, 360).radius).toBeCloseTo(360 * 0.42, 9);
    expect(viewOf(camera, 340, 340).facing).toEqual([0, 0, 1]);
  });
});

describe('viewOf', () => {
  const camera = settled('graph').camera;

  it('shows what the camera asks on a wide screen', () => {
    const view = viewOf(camera, 846);

    expect(view.facing).toEqual(camera.facing);
    expect(view.radius).toBeCloseTo(846 * RADIUS_SHARE * camera.zoom, 9);
  });

  it('grows no smaller than the names allow on a phone, and turns to the focus', () => {
    const view = viewOf(camera, 292);

    expect(view.radius).toBe(MIN_RADIUS_PX);
    const [x, y, z] = camera.focus ?? camera.facing;
    expect(view.facing[0]).toBeCloseTo(x, 9);
    expect(view.facing[1]).toBeCloseTo(y, 9);
    expect(view.facing[2]).toBeCloseTo(z, 9);
  });

  it('turns to the focus gradually as the screen narrows', () => {
    // How far round to the right the cloud faces, at each width.
    const turns = [600, 520, 470, 430, 390].map((width) => {
      const [x, , z] = viewOf(camera, width).facing;

      return Math.atan2(x, z);
    });

    expect(turns).toEqual([...turns].sort((a, b) => a - b));
    for (const [index, turn] of turns.slice(1).entries()) {
      expect(turn - (turns[index] ?? turn)).toBeLessThan(0.25);
    }
  });
});

describe('moving through the film', () => {
  it('shows the same scene at a moment however it was reached', () => {
    const moment = beat('third-atom').start + 500;

    expect(sceneAt(moment)).toEqual(sceneAt(moment));
    // A beat starts where the one before it was left.
    const start = sceneAt(beat('third-atom').start);
    const before = sceneAt(beat('third-atom').start - 1);
    expect(present(start)).toEqual(present(before));
    expect(atom(start, 'elonMusk').at).toEqual(atom(before, 'elonMusk').at);
  });

  it('shows each beat as it is left when motion is reduced', () => {
    const { start } = beat('second-atom');

    expect(present(sceneAt(start, true))).toEqual(['elonMusk', 'spacex']);
    expect(present(sceneAt(0, true))).toEqual(['elonMusk']);
  });

  it('steps forward to the next beat, and to the end after the last', () => {
    const second = beat('second-atom');

    expect(stepFrom(0, 1, 'start')).toBe(second.start);
    expect(stepFrom(0, 1, 'settled')).toBe(second.start + second.motionMs);
    expect(stepFrom(BEATS.at(-1)?.start ?? 0, 1, 'start')).toBe(DURATION);
  });

  it('steps back to the start of this beat, or the one before near its start', () => {
    const second = beat('second-atom');
    const third = beat('third-atom');

    expect(stepFrom(third.start + 4000, -1, 'start')).toBe(third.start);
    expect(stepFrom(third.start + 100, -1, 'start')).toBe(second.start);
    expect(stepFrom(100, -1, 'start')).toBe(0);
  });

  it('never steps back, paused, onto the empty stage before the first beat', () => {
    const first = beat('atom');
    const settledFirst = first.start + first.motionMs;

    expect(stepFrom(100, -1, 'settled')).toBe(settledFirst);
    expect(stepFrom(DURATION, -1, 'settled', 'film')).toBe(settledFirst);
    expect(present(sceneAt(settledFirst))).toEqual(['elonMusk']);
  });

  it('jumps to either end of the film', () => {
    expect(stepFrom(5000, 1, 'start', 'film')).toBe(DURATION);
    expect(stepFrom(DURATION, -1, 'start', 'film')).toBe(0);
  });
});

describe('nested triples', () => {
  it('opens a plane up close on Elon Musk, with the cloud behind out of focus', () => {
    const scene = settled('look-closer');

    expect(scene.depth).toBe(1);
    expect(scene.plane.to?.focus).toBe('believes');
    expect(settled('graph').depth).toBe(0);
    expect(settled('graph').plane.to).toBeNull();
  });

  it('goes out of focus gradually, as the camera dives', () => {
    const { start, motionMs } = beat('look-closer');

    expect(sceneAt(start + motionMs * 0.35).depth).toBeGreaterThan(0);
    expect(sceneAt(start + motionMs * 0.35).depth).toBeLessThan(1);
  });

  it('opens on what Elon Musk believes, still words, then breaks it apart, then makes it a triple', () => {
    const inWords =
      'A triple, still in words: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)).';

    expect(describeScene(settled('look-closer'))).toBe(inWords);
    expect(describeScene(settled('divide'))).toBe(inWords);
    expect(describeScene(settled('nested'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)).',
    );
  });

  it('frames the whole triple, and grows a triple about it: its source', () => {
    expect(describeScene(settled('sourced'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). And a triple of its own: current Earth economy estimated at $100+ trillion. And a triple of its own: the whole triple sourced by Tweet.',
    );
  });

  it("frames the whole triple in the subject's tint, the subject it is, and keeps it so through its vaults", () => {
    for (const id of ['sourced', 'vaults', 'positions']) {
      expect(settled(id).plane.to?.frame).toBe('identity');
    }
  });

  it('grows a triple of its own from the current Earth economy', () => {
    expect(describeScene(settled('estimated'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). And a triple of its own: current Earth economy estimated at $100+ trillion.',
    );
  });
});

describe('vaults', () => {
  it('takes away what rose from the whole triple, and hangs its two vaults below it', () => {
    expect(describeScene(settled('vaults'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). 6 people have a position in its two vaults: 3 against it, and 3 for it.',
    );
  });

  it('then shows each position: 400, 200 and 20 against, 200, 150 and 80 for', () => {
    expect(describeScene(settled('positions'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). 6 people have a position in its two vaults: 3 against it, with 400, 200 and 20, and 3 for it, with 200, 150 and 80.',
    );
  });

  it('takes the cloud away behind it as the triple rises, and keeps it away', () => {
    const { start, motionMs } = beat('vaults');

    expect(settled('sourced').cloud).toBe(1);
    expect(sceneAt(start).cloud).toBe(1);
    expect(sceneAt(start + motionMs * 0.2).cloud).toBeGreaterThan(0);
    expect(sceneAt(start + motionMs * 0.2).cloud).toBeLessThan(1);
    expect(sceneAt(start + motionMs * 0.35).cloud).toBe(0);
    expect(settled('vaults').cloud).toBe(0);
    expect(settled('positions').cloud).toBe(0);
  });

  it('keeps the plane where the triple stands, on the same frame, from chapter to chapter', () => {
    const sourced = settled('sourced');
    const vaults = sceneAt(beat('vaults').start);

    expect(vaults.plane.from).toEqual(sourced.plane.to);
    expect(vaults.plane.to?.focus).toBe(sourced.plane.to?.focus);
    expect(vaults.depth).toBe(sourced.depth);
  });
});

describe('lists', () => {
  it('closes the plane, and brings the cloud back into focus on xAI best AI company', () => {
    const back = settled('list-back');

    expect(back.plane.to).toBeNull();
    expect(back.depth).toBe(0);
    expect(back.cloud).toBe(1);
    expect(describeScene(back)).toContain(
      'A triple: xAI, the subject; best, the predicate; AI company, the object.',
    );
    // As it closes, it keeps its size.
    expect(sceneAt(beat('list-back').start + 200).plane.fit).toEqual(
      settled('positions').plane.fit,
    );
  });

  it('brings OpenAI and Anthropic in, then joins each to the same best and AI company', () => {
    const { start, motionMs } = beat('list-grows');
    const growing = sceneAt(start + motionMs * 0.5);
    const triple = (scene: Scene, id: string) =>
      scene.triples.find((drawn) => drawn.id === id);

    expect(atom(growing, 'openai').presence).toBe(1);
    expect(atom(growing, 'anthropic').presence).toBe(1);
    expect(triple(growing, 'openaiBestAiCompany')?.progress).toBe(0);
    expect(
      triple(settled('list-grows'), 'anthropicBestAiCompany')?.progress,
    ).toBe(1);
    expect(describeScene(settled('list-grows'))).toContain(
      'A triple: Anthropic, the subject; best, the predicate; AI company, the object.',
    );
  });

  it('takes the list onto the plane with each weight, then ranks it', () => {
    expect(describeScene(settled('list'))).toBe(
      'A list of triples, each best AI company: xAI, with 780, Anthropic, with 910 and OpenAI, with 640.',
    );
    expect(describeScene(settled('ranked'))).toBe(
      'A list of triples, each best AI company: Anthropic, with 910, xAI, with 780 and OpenAI, with 640, ranked by weight.',
    );
  });

  it("holds the cloud's dots still behind a claim, and lets them flow behind a list", () => {
    const flowAt = (id: string, share: number) => {
      const { start, motionMs } = beat(id);

      return sceneAt(start + motionMs * share).cloudFlow;
    };

    expect(flowAt('positions', 1)).toBe(flowAt('look-closer', 0));
    expect(flowAt('list-back', 0)).toBe(flowAt('look-closer', 0));
    expect(flowAt('list-back', 0.5)).toBeGreaterThan(flowAt('list-back', 0));
    expect(flowAt('ranked', 1)).toBeGreaterThan(flowAt('list', 0));
  });
});

describe('perspectives', () => {
  it("closes the list, pulls back to the whole cloud, then brings the plane's atoms onto it and joins them", () => {
    const { start, motionMs } = beat('one-graph');
    const at = (share: number) => sceneAt(start + motionMs * share);
    const nested = atom(settled('one-graph'), 'believes');

    expect(at(0.45).plane.to).toBeNull();
    expect(atom(at(0.45), 'believes').presence).toBe(0);
    expect(at(0.6).camera.whole).toBe(1);
    expect(atom(at(0.68), 'believes').presence).toBe(1);
    expect(
      at(0.68).triples.find((triple) => triple.id === 'elonBelieves')?.progress,
    ).toBe(0);
    expect(nested.role.to).toBe('predicate');
    expect(present(settled('one-graph'))).toHaveLength(18);
    expect(
      settled('one-graph').triples.every((triple) => triple.progress === 1),
    ).toBe(true);
  });

  it("moves the cloud aside, then flies its atoms to the map, then grows the map's lines", () => {
    const { start, motionMs } = beat('flat');
    const flatAt = (share: number) => sceneAt(start + motionMs * share).flat;

    expect(settled('one-graph').flat).toBeNull();
    expect(flatAt(0.3)).toMatchObject({ aside: expect.any(Number), arrive: 0 });
    expect(flatAt(0.35)?.aside).toBe(1);
    expect(flatAt(0.7)?.arrive).toBe(1);
    expect(flatAt(0.7)?.triples.every((triple) => triple.progress === 0)).toBe(
      true,
    );
    expect(flatAt(1)?.triples.every((triple) => triple.progress === 1)).toBe(
      true,
    );
  });

  it('puts every atom on the map, inside its square, each keeping its neighbours', () => {
    const places = settled('flat').flat?.places;
    const spots = [...(places?.values() ?? [])];

    expect(places?.size).toBe(18);
    expect(
      spots.every(({ x, y }) => x >= 0 && x <= 1 && y >= 0 && y <= 1),
    ).toBe(true);
    // Left to right as round the cloud, the chain on one line across.
    const x = (id: AtomId) => places?.get(id)?.x ?? Number.NaN;
    const y = (id: AtomId) => places?.get(id)?.y ?? Number.NaN;
    expect(x('elonMusk')).toBeLessThan(x('spacex'));
    expect(x('spacex')).toBeLessThan(x('aiCompany'));
    expect(y('elonMusk')).toBeCloseTo(y('aiCompany'), 9);
    expect(y('ordersOfMagnitude')).toBeLessThan(y('spacex'));
  });

  it('leaves out, on the flat map alone, the triples it does not trust', () => {
    const scene = settled('perspectives');
    const onMap = (id: string) =>
      scene.flat?.triples.find((triple) => triple.id === id)?.progress;

    expect(onMap('elonBelieves')).toBe(0);
    expect(onMap('beliefSourced')).toBe(0);
    expect(onMap('spacexWorth')).toBe(0);
    expect(onMap('openaiBestAiCompany')).toBe(0);
    expect(onMap('xaiBestAiCompany')).toBe(1);
    expect(scene.triples.every((triple) => triple.progress === 1)).toBe(true);
    expect(scene.flat?.namedFirst).toEqual(['anthropic']);
    expect(scene.flat?.namedLeft).toEqual(['anthropic']);
    expect(scene.flat?.unnamed).toEqual([
      'openai',
      'believes',
      'tweet',
      'sourcedBy',
      'willBeWorth',
    ]);
  });
});

describe('stepping by chapter', () => {
  it('jumps chapter to chapter, landing as a beat step does', () => {
    const triple = beat('triple');

    expect(stepFrom(0, 1, 'start', 'chapter')).toBe(triple.start);
    expect(stepFrom(0, 1, 'settled', 'chapter')).toBe(
      triple.start + triple.motionMs,
    );
    expect(stepFrom(triple.start + 100, 1, 'start', 'chapter')).toBe(
      beat('look-closer').start,
    );
    expect(
      stepFrom(beat('look-closer').start + 100, 1, 'start', 'chapter'),
    ).toBe(beat('vaults').start);
    expect(stepFrom(beat('vaults').start + 100, 1, 'start', 'chapter')).toBe(
      beat('list-back').start,
    );
    expect(stepFrom(beat('list-back').start + 100, 1, 'start', 'chapter')).toBe(
      beat('one-graph').start,
    );
    expect(stepFrom(beat('one-graph').start + 100, 1, 'start', 'chapter')).toBe(
      DURATION,
    );
    expect(stepFrom(triple.start + 4000, -1, 'start', 'chapter')).toBe(
      triple.start,
    );
    expect(stepFrom(triple.start + 100, -1, 'start', 'chapter')).toBe(0);
  });
});

describe('describeScene', () => {
  it('says what is on the stage', () => {
    expect(describeScene(sceneAt(0))).toBe('An empty scene.');
    expect(describeScene(settled('atom'))).toBe('An atom: Elon Musk.');
    expect(describeScene(settled('second-atom'))).toBe(
      'Atoms: Elon Musk and SpaceX.',
    );
    expect(describeScene(settled('third-atom'))).toBe(
      'Atoms: Elon Musk, founder of and SpaceX.',
    );
    expect(describeScene(settled('triple'))).toBe(
      'A triple: Elon Musk, the subject; founder of, the predicate; SpaceX, the object.',
    );
  });
});

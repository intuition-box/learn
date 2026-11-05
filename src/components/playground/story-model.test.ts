import { describe, expect, it } from 'vitest';

import {
  type AtomId,
  BEATS,
  beatAt,
  captionText,
  CHAPTER_SPANS,
  chapterAt,
  moneyFlowAt,
  CROWD,
  describeScene,
  DURATION,
  MIN_RADIUS_PX,
  RADIUS_SHARE,
  type Scene,
  sceneAt,
  stepFrom,
  THE_WAY_ON,
  TRIPLES,
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
    expect(scene.vault).toBeNull();
  });

  it('brings in Elon Musk’s vault under his name with people under it, then their lines up to it and its own on to him, as he stands still', () => {
    const { start, motionMs } = beat('atom-vault');
    const at = (share: number) => sceneAt(start + motionMs * share).vault;

    expect(at(0)).toEqual({
      atom: 'elonMusk',
      shown: 0,
      deposits: 0,
      onward: 0,
    });
    expect(settled('atom-vault').vault).toEqual({
      atom: 'elonMusk',
      shown: 1,
      deposits: 1,
      onward: 1,
    });
    expect(atom(settled('atom-vault'), 'elonMusk').at).toEqual(
      atom(settled('atom'), 'elonMusk').at,
    );
    // The vault and the people, then the people's lines, then the vault's.
    expect(at(0.25)?.shown).toBeGreaterThan(0);
    expect(at(0.25)?.deposits).toBe(0);
    expect(at(0.6)).toMatchObject({ shown: 1, onward: 0 });
    expect(at(0.6)?.deposits).toBeGreaterThan(0);
    expect(at(0.6)?.deposits).toBeLessThan(1);
    expect(at(0.9)).toMatchObject({ shown: 1, deposits: 1 });
    expect(at(0.9)?.onward).toBeGreaterThan(0);
    expect(at(0.9)?.onward).toBeLessThan(1);
  });

  it('takes the vault, the people and their lines away as SpaceX arrives', () => {
    const { start, motionMs } = beat('second-atom');

    expect(sceneAt(start).vault).toEqual({
      atom: 'elonMusk',
      shown: 1,
      deposits: 1,
      onward: 1,
    });
    expect(sceneAt(start + motionMs * 0.2).vault?.shown).toBeLessThan(1);
    expect(sceneAt(start + motionMs * 0.4).vault?.shown).toBe(0);
    expect(settled('third-atom').vault).toBeNull();
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
    const second = beat('atom-vault');

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
  it('takes away what rose from the whole triple, and hangs the vaults of what he believes below it', () => {
    expect(describeScene(settled('vaults'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). 6 people have a position in the vault of SpaceX will be worth (orders of magnitude more than current Earth economy): 3 against it, and 3 for it.',
    );
  });

  it('then shows each position: 400, 200 and 20 against, 200, 150 and 80 for', () => {
    expect(describeScene(settled('positions'))).toBe(
      'A triple: Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy)). 6 people have a position in the vault of SpaceX will be worth (orders of magnitude more than current Earth economy): 3 against it, with 400, 200 and 20 (620 in all), and 3 for it, with 200, 150 and 80 (430 in all).',
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

  it('keeps the plane where the triple stands from chapter to chapter, and follows what he believes, whose vaults they are', () => {
    const sourced = settled('sourced');
    const vaults = sceneAt(beat('vaults').start);

    expect(vaults.plane.from).toEqual(sourced.plane.to);
    expect(vaults.plane.to?.focus).toBe('worth');
    expect(vaults.plane.to?.vaults?.frame).toBe('worth');
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
      'A list of triples, each best AI company: xAI, with 910, Anthropic, with 780 and OpenAI, with 640.',
    );
    expect(describeScene(settled('ranked'))).toBe(
      'A list of triples, each best AI company: xAI, with 910, Anthropic, with 780 and OpenAI, with 640, ranked by weight.',
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
  it('starts from the ranked list, and shows above it whose perspective it is: Elon Musk’s', () => {
    const start = sceneAt(beat('perspective').start);

    expect(start.plane.from).toEqual(settled('ranked').plane.to);
    expect(describeScene(settled('perspective'))).toBe(
      'A list of triples, each best AI company, through Elon Musk’s perspective: xAI, with 910, Anthropic, with 780 and OpenAI, with 640, ranked by weight.',
    );
  });

  it('through Sam Altman’s, puts OpenAI first; through my developer friends’, Anthropic', () => {
    expect(describeScene(settled('sam-altman'))).toBe(
      'A list of triples, each best AI company, through Sam Altman’s perspective: OpenAI, with 960, xAI, with 910 and Anthropic, with 780, ranked by weight.',
    );
    expect(describeScene(settled('developer-friends'))).toBe(
      'A list of triples, each best AI company, through My developer friends’ perspective: Anthropic, with 990, OpenAI, with 960 and xAI, with 910, ranked by weight.',
    );
  });

  it('stays up close on the list to the end: the camera, the cloud and its depth hold', () => {
    const ranked = settled('ranked');
    for (const id of ['perspective', 'sam-altman', 'developer-friends']) {
      const { start, motionMs } = beat(id);
      for (const share of [0, 0.5, 1]) {
        const scene = sceneAt(start + motionMs * share);
        expect(scene.camera).toEqual(ranked.camera);
        expect(scene.depth).toBe(ranked.depth);
        expect(scene.cloud).toBe(ranked.cloud);
      }
    }
  });
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
    // Every atom, the non-believers' among them, set back from the start.
    expect(present(settled('one-graph'))).toHaveLength(26);
    expect(settled('one-graph').setBack.get('ai')).toBe(1);
    expect(settled('one-graph').setBack.has('spacex')).toBe(false);
    expect(
      settled('one-graph').triples.every((triple) => triple.progress === 1),
    ).toBe(true);
  });

  it('moves the cloud aside as its copy splits off, the atoms only the copy uses fading in on both; then, on the copy alone, the triples it does not trust draw back, and its own grow', () => {
    const { start, motionMs } = beat('another-perspective');
    const at = (share: number) => sceneAt(start + motionMs * share);
    const onCopy = (share: number, id: string) =>
      at(share).other?.triples.find((triple) => triple.id === id)?.progress;
    const ai = (share: number) =>
      at(share).atoms.find((atom) => atom.id === 'ai')?.presence;

    expect(settled('one-graph').other).toBeNull();
    // A copy at first, its atoms the cloud's, where they stand on it, those
    // only the copy's triples use already there, set back on both.
    expect(at(0).other?.aside).toBe(0);
    expect(at(0.3).other?.aside).toBe(1);
    expect(ai(0)).toBe(1);
    expect(
      at(0.5).other?.atoms.map(({ id, at: where }) => ({ id, where })),
    ).toEqual(at(0.5).atoms.map(({ id, at: where }) => ({ id, where })));
    expect(at(0.5).setBack.get('ai')).toBe(1);
    expect(at(0.5).setBack.has('spacex')).toBe(false);
    expect(at(0.3).other?.setBack.get('ai')).toBe(1);
    expect(at(0.3).other?.setBack.get('spacex')).toBe(0);
    // Then what it does not trust draws back, and its own triples grow.
    expect(onCopy(0.3, 'elonBelieves')).toBe(1);
    expect(onCopy(0.46, 'elonBelieves')).toBeGreaterThan(0);
    expect(onCopy(0.46, 'elonBelieves')).toBeLessThan(1);
    expect(onCopy(0.56, 'anthropicBestAiCompany')).toBe(0);
    expect(at(0.56).other?.setBack.get('spacex')).toBe(1);
    expect(onCopy(0.6, 'aiThreatensPeace')).toBe(0);
    // As its own triples grow, the atoms they join come forward on it.
    expect(at(0.9).other?.setBack.get('ai')).toBe(0);
    expect(at(0.9).setBack.get('ai')).toBe(1);
    for (const id of [
      'aiIsDangerous',
      'aiIsOutOfControl',
      'aiRemovesJobs',
      'aiThreatensPeace',
    ]) {
      expect(onCopy(0.9, id)).toBe(1);
    }
  });

  it('keeps every triple on the cloud: the other perspective is the copy’s alone, and sets back the atoms in none of the triples it trusts', () => {
    const scene = settled('another-perspective');
    const onCopy = (id: string) =>
      scene.other?.triples.find((triple) => triple.id === id)?.progress;

    expect(scene.triples.every((triple) => triple.progress === 1)).toBe(true);
    expect(scene.triples.some((triple) => triple.id === 'aiIsDangerous')).toBe(
      false,
    );
    // None of the cloud's triples: each one draws back on the copy.
    expect(scene.triples.every((triple) => onCopy(triple.id) === 0)).toBe(true);
    // Every atom stays; those in none of its triples are set back.
    expect(
      scene.other?.atoms.map(({ id, at: where }) => ({ id, where })),
    ).toEqual(scene.atoms.map(({ id, at: where }) => ({ id, where })));
    // The current Earth economy, in none of its triples there, the same
    // atom in the same shape on both, set back on the copy.
    const economy = (atoms: readonly Scene['atoms'][number][] | undefined) =>
      atoms?.find((atom) => atom.id === 'currentEarthEconomy')?.role.to;
    expect(economy(scene.atoms)).toBe('subjectAndObject');
    expect(economy(scene.other?.atoms)).toBe('subjectAndObject');
    // Is, the predicate of two of its triples, AI is dangerous and out of
    // control: one atom.
    expect(scene.other?.setBack.get('is')).toBe(0);
    for (const id of [
      'elonMusk',
      'spacex',
      'xai',
      'believes',
      'anthropic',
    ] as const) {
      expect(scene.other?.setBack.get(id)).toBe(1);
    }
    expect(scene.other?.setBack.get('currentEarthEconomy')).toBe(1);
    // Whose perspectives the two are, above them.
    expect(scene.other?.viewers).toEqual(['AI Optimists', 'AI Pessimists']);
    expect(scene.other?.setBack.get('ai')).toBe(0);
  });
});

describe('enrichment', () => {
  const at = (id: string, share: number): Scene => {
    const { start, motionMs } = beat(id);

    return sceneAt(start + motionMs * share);
  };
  const isWholeGraph = (scene: Scene): boolean =>
    scene.atoms.every((drawn) => drawn.presence === 1) &&
    scene.triples.every((triple) => triple.progress === 1);
  const none = {
    out: 0,
    graph: 0,
    small: 0,
    page: 0,
    data: 0,
    close: 0,
    home: 0,
    room: 0,
  };

  it('closes the other perspective back onto the cloud, and nothing more: the rest of the chapter is yet to come', () => {
    // The copy's own triples draw back, and it slides back onto the cloud.
    expect(at('one-atom', 0).other?.aside).toBe(1);
    expect(
      at('one-atom', 0.3).other?.triples.find(
        (triple) => triple.id === 'aiThreatensPeace',
      )?.progress,
    ).toBe(0);
    expect(at('one-atom', 0.2).other?.aside).toBe(1);
    expect(at('one-atom', 0.8).other?.aside).toBe(0);
    // The copy, closed, is the cloud itself.
    expect(settled('one-atom').other?.aside).toBe(0);
    expect(settled('one-atom').enrichment).toEqual(none);
  });

  it('keeps the whole graph until the film closes in on Elon Musk', () => {
    for (const id of ['one-atom', 'from-the-graph', 'enrichment']) {
      expect(isWholeGraph(settled(id))).toBe(true);
      expect(settled(id).setBack.get('jobs')).toBe(1);
    }
  });

  it('brings Elon Musk out of the graph, and as he goes, flows his name and the data of his triples to the card', () => {
    expect(at('from-the-graph', 0).enrichment).toEqual(none);
    expect(at('from-the-graph', 0.15).enrichment?.graph).toBe(0);
    // The data flowing while he is still on his way.
    const moving = at('from-the-graph', 0.35).enrichment;
    expect(moving?.graph).toBeGreaterThan(0);
    expect(moving?.out).toBeGreaterThan(0);
    expect(moving?.out).toBeLessThan(1);
    expect(at('from-the-graph', 0.45).enrichment?.out).toBe(1);
    expect(settled('from-the-graph').enrichment).toEqual({
      ...none,
      out: 1,
      graph: 1,
    });
  });

  it('shrinks the graph to a sketch, brings the page in under it, then flows the page’s data into the card', () => {
    expect(at('enrichment', 0).enrichment).toEqual(
      settled('from-the-graph').enrichment,
    );
    expect(at('enrichment', 0.3).enrichment?.small).toBe(1);
    expect(at('enrichment', 0.38).enrichment?.data).toBe(0);
    expect(at('enrichment', 0.4).enrichment?.page).toBe(1);
    expect(settled('enrichment').enrichment).toEqual({
      ...none,
      out: 1,
      graph: 1,
      small: 1,
      page: 1,
      data: 1,
    });
    // Without motion, each beat shows as it is left.
    expect(sceneAt(beat('enrichment').start, true).enrichment).toEqual(
      settled('enrichment').enrichment,
    );
  });

  it('lets the card and the page go, brings the graph home, sets the story back among the wider graph, and brings the last triple’s subject to its front', () => {
    expect(at('atom-again', 0.45).enrichment?.close).toBe(1);
    expect(at('atom-again', 0.4).enrichment?.home).toBe(0);
    expect(at('atom-again', 0.8).enrichment?.home).toBe(1);
    // The story's triples draw back as the graph comes home; its atoms stay,
    // set back, every one.
    expect(
      at('atom-again', 0.7).triples.every((triple) => triple.progress === 0),
    ).toBe(true);
    const end = settled('atom-again');
    expect(
      end.atoms
        .filter(({ id }) => id !== 'civilization')
        .every(
          (drawn) => drawn.presence === 1 && end.setBack.get(drawn.id) === 1,
        ),
    ).toBe(true);
    // The story steps back together, Elon Musk with it, done before he is
    // back in the graph.
    expect(at('atom-again', 0.75).setBack.get('elonMusk')).toBe(1);
    expect(at('atom-again', 0.75).setBack.get('tweet')).toBe(1);
    expect(at('atom-again', 0.75).enrichment?.home).toBeLessThan(1);
    // The wider graph comes, and the last triple's subject arrives last, at
    // the front.
    expect(at('atom-again', 0.55).crowd).toBe(0);
    expect(end.crowd).toBe(1);
    expect(
      at('atom-again', 0.75).atoms.some(({ id }) => id === 'civilization'),
    ).toBe(true);
    expect(atom(at('atom-again', 0.75), 'civilization').presence).toBe(0);
    expect(atom(end, 'civilization').presence).toBe(1);
    expect(end.setBack.get('civilization')).toBeUndefined();
    const [x, y, z] = atom(end, 'civilization').at;
    const [fx, fy, fz] = end.camera.facing;
    expect(x * fx + y * fy + z * fz).toBeCloseTo(1);
    expect(captionText(beat('atom-again').caption)).toMatch(
      /^Everything starts with an atom, and here we are, at the atom again\./,
    );
  });

  it('turns the graph to its other side round the vertical, smoothly, never over its top', () => {
    const longitude = ([x, , z]: readonly number[]) =>
      Math.atan2(x ?? 0, z ?? 0);
    const turned = (share: number) => at('atom-again', share).camera.facing;
    let previous = longitude(turned(0.4));
    let travelled = 0;
    for (let share = 0.41; share <= 0.85; share += 0.01) {
      const facing = turned(share);
      // Up or down no further than where it starts and ends.
      expect(facing[1]).toBeLessThanOrEqual(Math.sin(0.3) + 1e-9);
      expect(facing[1]).toBeGreaterThanOrEqual(-1e-9);
      const step = Math.atan2(
        Math.sin(longitude(facing) - previous),
        Math.cos(longitude(facing) - previous),
      );
      // Each step a small part of the turn, never a flip, all of them one
      // way: at its fastest, eased, it turns a fifth of a radian a step.
      expect(Math.abs(step)).toBeLessThan(0.3);
      travelled += step;
      previous = longitude(facing);
    }
    expect(Math.abs(travelled)).toBeCloseTo(Math.PI, 1);
  });

  it('ends on the way on, without a caption: civilization shall, start building, the future of information, the predicate standing out', () => {
    const turn = beat('your-turn');
    const end = settled('your-turn');

    expect(turn.index).toBe(BEATS.length - 1);
    expect(turn.caption).toEqual([]);
    expect(TRIPLES.civilizationStartBuilding.predicate).toBe(THE_WAY_ON);
    expect(
      end.triples.find(({ id }) => id === 'civilizationStartBuilding')
        ?.progress,
    ).toBe(1);
    const shareOf = (ms: number) => ms / turn.motionMs;
    const line = (ms: number) =>
      at('your-turn', shareOf(ms)).triples.find(
        ({ id }) => id === 'civilizationStartBuilding',
      )?.progress;
    expect(line(2800)).toBe(0);
    expect(line(4700)).toBe(1);
    // Whole once its object has arrived, the claim holds 5.28 seconds; then
    // the subject and object quieten, and the way on does not.
    expect(
      atom(at('your-turn', shareOf(3360)), 'futureOfInformation').presence,
    ).toBe(1);
    expect(
      at('your-turn', shareOf(3360 + 5280)).quiet.get('civilization'),
    ).toBe(0);
    expect(
      at('your-turn', shareOf(3360 + 5280 + 100)).quiet.get('civilization'),
    ).toBeGreaterThan(0);
    expect(end.quiet.get('civilization')).toBe(1);
    expect(end.quiet.get('futureOfInformation')).toBe(1);
    expect(end.quiet.has(THE_WAY_ON)).toBe(false);
    expect(end.crowd).toBe(1);
    expect(describeScene(end)).toContain('start building');
  });

  it('has no part of it before the chapter', () => {
    expect(settled('another-perspective').enrichment).toBeNull();
  });
});

describe('the wider graph', () => {
  const apart = (a: readonly number[], b: readonly number[]): number =>
    Math.acos(
      Math.min(
        Math.max(
          a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0),
          -1,
        ),
        1,
      ),
    );

  it('has its atoms on the cloud, apart from each other', () => {
    expect(CROWD.length).toBeGreaterThan(20);
    for (const [index, { at }] of CROWD.entries()) {
      expect(Math.hypot(...at)).toBeCloseTo(1);
      for (const other of CROWD.slice(index + 1)) {
        expect(apart(at, other.at)).toBeGreaterThanOrEqual(0.3);
      }
    }
  });

  it('keeps them clear of the story’s atoms and of the way on', () => {
    const end = settled('your-turn');
    for (const { at } of CROWD) {
      for (const drawn of end.atoms) {
        expect(apart(at, drawn.at)).toBeGreaterThanOrEqual(0.3);
      }
    }
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
      beat('money-deposit').start,
    );
    expect(
      stepFrom(beat('money-deposit').start + 100, 1, 'start', 'chapter'),
    ).toBe(beat('list-back').start);
    expect(stepFrom(beat('list-back').start + 100, 1, 'start', 'chapter')).toBe(
      beat('perspective').start,
    );
    expect(
      stepFrom(beat('perspective').start + 100, 1, 'start', 'chapter'),
    ).toBe(beat('one-atom').start);
    expect(stepFrom(beat('one-atom').start + 100, 1, 'start', 'chapter')).toBe(
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
    expect(describeScene(settled('atom-vault'))).toBe(
      'An atom, Elon Musk, with its vault under its name, and people depositing into it.',
    );
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

describe('the money flow chapter', () => {
  it('comes after vaults and before lists, one beat a picture', () => {
    const titles = CHAPTER_SPANS.map((span) => span.title);

    expect(titles.slice(3, 6)).toEqual(['Vaults', 'Money flow', 'Lists']);
    expect(moneyFlowAt(beat('money-deposit').end - 1)?.view).toBe('deposit');
    expect(moneyFlowAt(beat('money-fees').start)?.view).toBe('fees');
  });

  it('plays on the plane the vaults leave, which holds to the lists', () => {
    expect(beat('money-deposit').stage).toBe(beat('positions').stage);
    expect(beat('money-fees').stage).toBe(beat('positions').stage);
  });

  it('sets the other positions aside, and they stay gone as the plane closes', () => {
    expect(moneyFlowAt(beat('positions').end - 1)).toBeUndefined();
    expect(moneyFlowAt(beat('money-deposit').start)?.quiet).toBe(0);
    expect(moneyFlowAt(beat('money-deposit').start + 500)?.quiet).toBe(1);
    expect(moneyFlowAt(beat('list-back').start + 250)).toMatchObject({
      quiet: 1,
      shown: 0.5,
    });
    expect(moneyFlowAt(beat('list-grows').start)).toBeUndefined();
  });

  it('plays with the clock, starting over with each picture', () => {
    const { start } = beat('money-fees');

    expect(moneyFlowAt(start)?.seconds).toBeLessThan(0);
    expect(moneyFlowAt(start + 1600)?.seconds).toBeCloseTo(1);
  });

  it('settles played through, and shows so at once for reduced motion', () => {
    for (const id of ['money-deposit', 'money-fees']) {
      const { start, motionMs } = beat(id);

      expect(moneyFlowAt(start + motionMs)?.seconds).toBeGreaterThan(2.5);
      expect(moneyFlowAt(start, true)?.seconds).toBeGreaterThan(10);
    }
  });
});

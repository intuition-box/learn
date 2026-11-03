/**
 * The plane: a close-up of one claim, opened in front of the cloud, where a
 * triple can hold another triple. It is a branch off the graph: its atoms
 * are drawn as the cloud draws them, a shape with its name under it, and
 * each triple is a line from its subject through its predicate to its
 * object, as on the cloud, only straight. Each triple inside the claim
 * stands in a rounded frame, tinted the role it fills, and a line that
 * reaches it ends at the frame: the whole triple is the object, not the
 * first atom in it. A triple inside a triple is a frame inside a frame.
 *
 * Part of a claim can still be plain words: a triple's words in one line in
 * its frame, then broken into their parts, with frames showing how they
 * divide, then made atoms. A claim always grows in the same order: what is
 * there moves, atoms arrive, and only then do the lines grow between them.
 *
 * Pure, so it is tested without a canvas: the canvas passes in how wide a
 * piece of text is.
 */

import type { AtomId, Role } from './story-model';

/**
 * What fills a place in a claim: an atom, or a whole triple. A plane can
 * also hold a list, on its own.
 */
export type PlaneTerm =
  | { atom: AtomId }
  | { triple: PlaneTriple }
  | { list: PlaneList };

/**
 * Triples that share a predicate and an object: a list. Its members, the
 * triples' subjects, stand in a column, the one predicate across from them
 * and the one object beyond it. Its lines are the triples' own, which come
 * out of the cloud with their atoms: the plane adds only their weights.
 */
export interface PlaneList {
  id: string;
  /** Each member, and its triple's weight, in the order they joined. */
  members: readonly { atom: AtomId; weight: number }[];
  predicate: AtomId;
  object: AtomId;
  /** Whether each member's line shows its triple's weight. */
  isWeighed?: boolean;
  /** Whether the members stand in order of weight, the heaviest on top. */
  isRanked?: boolean;
}

/** A triple on the plane. Its subject and object can be triples too. */
export interface PlaneTriple {
  /** Names its frame, so the frame can be followed as the claim grows. */
  id: string;
  subject: PlaneTerm;
  predicate: AtomId;
  object: PlaneTerm;
}

/**
 * A claim of its own about one of the claim's atoms, its subject: it rises
 * from that atom in a column, its predicate above it and its object on top.
 */
export interface PlaneBranch {
  id: string;
  /** An atom of the claim, or a whole triple of it, from the top of its frame. */
  subject: PlaneEnd;
  predicate: AtomId;
  object: AtomId;
}

/**
 * A triple's two vaults, and the people with a position in them. Lines hang
 * from the middle of the bottom of its frame: down, then apart, one side for
 * each vault, then to each person.
 */
export interface PlaneVaults {
  /** The triple whose vaults they are: its frame. */
  frame: string;
  /** Each person's position, left to right: against the triple on the left. */
  against: readonly number[];
  /** And for it, on the right. */
  for: readonly number[];
  /** Whether each person's line shows their position. */
  isWeighed?: boolean;
  /** Whether each side's lines show which vault they lead to. */
  isSided?: boolean;
}

/** Whose perspective a claim is seen through: the people to choose from, and the one chosen. */
export interface PlanePerspective {
  options: readonly string[];
  chosen: number;
}

/** A claim on the plane, as a beat leaves it. */
export interface PlaneClaim {
  term: PlaneTerm;
  /** Claims of their own, rising from its atoms or its frames. */
  branches?: readonly PlaneBranch[];
  /** The whole claim in a frame too, tinted this role. */
  frame?: Role;
  /**
   * That frame gone, but not the room it took: the claim keeps its size,
   * and nothing in it moves.
   */
  isFrameHidden?: boolean;
  /** The vaults of one of its triples, hanging below it. */
  vaults?: PlaneVaults;
  /**
   * Atoms set back, and the lines from them: there, but not what the claim
   * is about now.
   */
  faded?: readonly AtomId[];
  /**
   * Whose perspective it is seen through: a menu above it, which shows the
   * one chosen, and opens to choose another.
   */
  perspective?: PlanePerspective;
  /**
   * Its atoms still shown as words: broken apart where the atoms will
   * stand, the claim's frames round them.
   */
  spelled?: readonly AtomId[];
  /**
   * Triples whose words are not yet broken apart: one line in their frame,
   * with no frame yet inside it.
   */
  folded?: readonly string[];
}

/** Sizes on the plane, in its own units: CSS pixels at zoom 1. */
export const PLANE = {
  /** An atom's shape, as the cloud sizes one near its front. */
  atomSize: 34,
  /** A name's badge, under its shape, as the cloud sets it. */
  badge: { height: 22, padding: 8, fontSize: 13, gap: 8 },
  /** Between neighbouring names: room for the line between their shapes. */
  gap: 34,
  /** Inside a frame, either side of what it holds. */
  framePadding: 16,
  /** Inside the innermost frame, above and below what it holds. */
  frameInset: 14,
  /** How much farther each frame reaches, above and below, than the one inside it. */
  frameStep: 12,
  /** A frame's corners: rounded, never a pill. */
  frameRadius: 14,
  /** Between one atom and the next up a branch: room for its name and the line. */
  branchStep: 96,
  /**
   * A triple's vaults: how far below the claim its line splits in two, how
   * far either side the two vaults' lines go, how far apart the people on
   * one side stand, and how far along a person's line their position shows.
   */
  vaults: { split: 26, spread: 160, apart: 100, weightAt: 0.6, staggerMs: 150 },
  /**
   * A list: between its members, one under another; from them across to
   * the predicate; and how far along a member's line its weight shows.
   */
  list: { rowStep: 80, reach: 170, weightAt: 0.45 },
  /** A ranked member's medal, before its name and as tall: the room between them. */
  medal: { gap: 4 },
  /**
   * The menu of perspectives above a claim, on the frame round it: its
   * height, the room either side of its words and for its chevrons, and the
   * room inside the frame, round the claim; its open list's rows, the room
   * round them, and its corners; the frame's border, in CSS pixels; and
   * how far below the menu its open list drops, and the frame's top with
   * it, so the list sits on the frame.
   */
  picker: {
    height: 30,
    padding: 12,
    chevrons: 16,
    gap: 28,
    row: 28,
    inset: 4,
    radius: 8,
    border: 1,
    drop: 6,
  },
  /** How much of an atom set back shows, and of the lines from it. */
  faded: 0.3,
} as const;

/** Which of a triple's two vaults: the one against it, or the one for it. */
export type VaultSide = 'against' | 'for';

/** A point on the plane: along the line, and down from it. */
export interface PlanePoint {
  x: number;
  y: number;
}

/**
 * A line of a triple's vaults, through `points`, from the top down: the
 * trunk, from the frame to where it splits; or a person's, from there
 * through their vault to them. A side's lines run together as far as its
 * vault, so the stretch they share shows stronger, as a list's lines do.
 */
export interface VaultLine {
  id: string;
  points: readonly PlanePoint[];
  side: VaultSide | null;
  /**
   * A person's line, its turn to grow, from 0: the people's lines grow one
   * after another. The trunk has none: it grows once the first reaches it.
   */
  turn?: number;
  /** The position of the person it reaches, and where on the line that shows. */
  weight?: PlanePoint & { value: number };
  /**
   * On a side's first line, all the positions in its vault, where the
   * side's lines run together.
   */
  total?: PlanePoint & { value: number };
}

/** A person with a position in a vault: the middle of their icon, an atom's size. */
export interface PlanePerson extends PlanePoint {
  id: string;
  side: VaultSide;
}

/**
 * An atom, where it sits on the plane. Every atom's shape is on one line,
 * at `y` 0, and its name is under it. An atom still spelled out is its word,
 * centred on `x`, on that line.
 */
export interface PlaneAtom {
  id: AtomId;
  /** The role it plays in the triple that holds it. */
  role: Role;
  /** The middle of its shape, or of its word. */
  x: number;
  /** Up from the claim's line, for an atom up a branch: 0 on the line. */
  y: number;
  /**
   * Which side of its shape its name is on, when not under it: to the
   * right up a branch, so the line up through it stays clear; to the left
   * in a list, where its line leaves to the right.
   */
  nameSide?: 'left' | 'right';
  /** Its place in a ranked list, from 0 at the top. */
  rank?: number;
  /** Its name's badge, or its shape if wider; or its word. */
  width: number;
}

/** A triple inside the claim, in its frame. */
export interface PlaneFrame {
  id: string;
  /** The role the whole triple fills in the triple that holds it: its frame's tint. */
  role: Role;
  /** Its left edge. */
  x: number;
  width: number;
  /** Above and below the line the shapes are on. */
  top: number;
  bottom: number;
}

/** What a line joins: an atom, or a whole triple, at the edge of its frame. */
export type PlaneEnd =
  | { atom: AtomId }
  | {
      frame: string;
      /** From the middle of its top, for a claim rising from it. */
      isTop?: boolean;
    };

/**
 * Part of a triple's line: subject to predicate, or predicate to object. A
 * line leaves a frame from its right edge and reaches one at its left.
 */
export interface PlaneLink {
  /** The triple's id, then 0 from the subject or 1 to the object. */
  id: string;
  from: PlaneEnd;
  to: PlaneEnd;
}

/** A triple's weight, shown on its line from one atom to another: a list member's. */
export interface PlaneWeight {
  id: string;
  from: AtomId;
  to: AtomId;
  value: number;
}

/** A box on the plane: its top left, and its size. */
export interface PlaneBox extends PlanePoint {
  width: number;
  height: number;
}

/** The menu of perspectives, closed: its box, on the top of the frame round the claim. */
export interface PlanePicker extends PlaneBox {
  frame: PlaneBox;
}

export interface PlaneLayout {
  atoms: PlaneAtom[];
  /** Outermost first, so inner ones are drawn over them. */
  frames: PlaneFrame[];
  links: PlaneLink[];
  weights: PlaneWeight[];
  /** The lines down to the people with a position in a triple's vaults, from the frame on. */
  vaultLines: VaultLine[];
  people: PlanePerson[];
  width: number;
  top: number;
  bottom: number;
  /** Where its branches' first atoms stand, up from its line, if it has any. */
  branchRow?: number;
  /** The menu of perspectives above it, if it is seen through one. */
  picker?: PlanePicker;
}

/** From the shapes' line, the top of a shape and the bottom of a name under it. */
export const ATOM_TOP = -PLANE.atomSize / 2;
export const ATOM_BOTTOM =
  PLANE.atomSize / 2 + PLANE.badge.gap + PLANE.badge.height;
/** The middle of a name, under its shape. */
const NAME_Y = PLANE.atomSize / 2 + PLANE.badge.gap + PLANE.badge.height / 2;
/** Above and below a line of words. */
const WORDS_TOP = -PLANE.badge.fontSize / 2 - 4;
const WORDS_BOTTOM = PLANE.badge.fontSize / 2 + 4;

/** How a claim is laid out: which atoms are words, and which triples' words are one line. */
interface LayoutOptions {
  spelled?: readonly AtomId[] | undefined;
  folded?: readonly string[] | undefined;
  branches?: readonly PlaneBranch[] | undefined;
  frame?: Role | undefined;
  vaults?: PlaneVaults | undefined;
  /**
   * Where the branches' first atoms stand, up from the claim's line, when
   * the claim the beats build to sets it: a column then stands, from the
   * start, where it will once the others rise beside it.
   */
  branchRow?: number | undefined;
  /** A space's width, between words not yet broken apart. */
  space?: number;
  /** How wide a menu of perspectives above the claim is, if it has one. */
  pickerWidth?: number | undefined;
}

/** A term's atoms, as the claim reads, each with the role it plays. */
function atomsIn(
  term: PlaneTerm,
  role: Role,
): Array<{ id: AtomId; role: Role }> {
  if ('atom' in term) {
    return [{ id: term.atom, role }];
  }
  if ('list' in term) {
    const { members, predicate, object } = term.list;

    return [
      ...members.map((member) => ({
        id: member.atom,
        role: 'identity' as const,
      })),
      { id: predicate, role: 'predicate' },
      { id: object, role: 'object' },
    ];
  }
  const { subject, predicate, object } = term.triple;

  return [
    ...atomsIn(subject, 'identity'),
    { id: predicate, role: 'predicate' },
    ...atomsIn(object, 'object'),
  ];
}

interface Laid {
  /** What a line to or from it joins. */
  end: PlaneEnd;
  width: number;
  /** How many frames deep it is, its own included. */
  levels: number;
  /** Whether all of it is still words: its frame is then a line high. */
  isSpelled: boolean;
  place: (x: number, into: PlaneLayout) => void;
}

function layTerm(
  term: PlaneTerm,
  role: Role,
  depth: number,
  measure: (atom: AtomId) => number,
  options: LayoutOptions,
): Laid {
  if ('list' in term) {
    return layList(term.list, measure);
  }
  if ('atom' in term) {
    // An atom still spelled out stands, as a word, where it will stand as an
    // atom: when it is made, its word only comes down to be its name.
    const slot = Math.max(
      measure(term.atom) + PLANE.badge.padding * 2,
      PLANE.atomSize,
    );

    return {
      end: { atom: term.atom },
      width: slot,
      levels: 0,
      isSpelled: options.spelled?.includes(term.atom) ?? false,
      place: (x, into) => {
        into.atoms.push({
          id: term.atom,
          role,
          x: x + slot / 2,
          y: 0,
          width: slot,
        });
      },
    };
  }

  // A triple not yet broken apart: its words in one line, in its frame.
  if (depth > 0 && (options.folded?.includes(term.triple.id) ?? false)) {
    const inside = atomsIn(term, role);
    const space = options.space ?? 0;
    const line =
      inside.reduce((sum, atom) => sum + measure(atom.id), 0) +
      space * (inside.length - 1);
    const width = line + PLANE.framePadding * 2;
    const id = term.triple.id;

    return {
      end: { frame: id },
      width,
      levels: 1,
      isSpelled: true,
      place: (x, into) => {
        into.frames.push({
          id,
          role,
          x,
          width,
          top: WORDS_TOP - PLANE.frameInset,
          bottom: WORDS_BOTTOM + PLANE.frameInset,
        });
        let cursor = x + PLANE.framePadding;
        for (const atom of inside) {
          const wordWidth = measure(atom.id);
          into.atoms.push({
            id: atom.id,
            role: atom.role,
            x: cursor + wordWidth / 2,
            y: 0,
            width: wordWidth,
          });
          cursor += wordWidth + space;
        }
      },
    };
  }

  const { subject, predicate, object } = term.triple;
  const parts = [
    layTerm(subject, 'identity', depth + 1, measure, options),
    layTerm({ atom: predicate }, 'predicate', depth + 1, measure, options),
    layTerm(object, 'object', depth + 1, measure, options),
  ];
  // The claim itself is framed only when asked: the triples inside it are.
  const isFramed = depth > 0 || options.frame !== undefined;
  const padding = isFramed ? PLANE.framePadding : 0;
  const width =
    parts.reduce((sum, part) => sum + part.width, 0) +
    PLANE.gap * (parts.length - 1) +
    padding * 2;
  const levels =
    Math.max(...parts.map((part) => part.levels)) + (isFramed ? 1 : 0);
  const reach = PLANE.frameInset + (levels - 1) * PLANE.frameStep;
  const isSpelled = parts.every((part) => part.isSpelled);

  return {
    end: { frame: term.triple.id },
    width,
    levels,
    isSpelled,
    place: (x, into) => {
      // Subject to predicate, predicate to object.
      parts.slice(1).forEach((part, index) => {
        const from = parts[index];
        if (from !== undefined) {
          into.links.push({
            id: `${term.triple.id}:${index}`,
            from: from.end,
            to: part.end,
          });
        }
      });
      if (isFramed) {
        // As wide as it will be, and as high as what it holds: a line of
        // words until they are atoms, with their names under them.
        into.frames.push({
          id: term.triple.id,
          role: depth === 0 ? (options.frame ?? role) : role,
          x,
          width,
          top: (isSpelled ? WORDS_TOP : ATOM_TOP) - reach,
          bottom: (isSpelled ? WORDS_BOTTOM : ATOM_BOTTOM) + reach,
        });
      }
      let cursor = x + padding;
      for (const part of parts) {
        part.place(cursor, into);
        cursor += part.width + PLANE.gap;
      }
    },
  };
}

/**
 * A list: its members in a column, in the order they joined, or ranked,
 * the heaviest on top, their names to their left; the predicate across
 * from their middle, and the object beyond it.
 */
function layList(list: PlaneList, measure: (atom: AtomId) => number): Laid {
  const { rowStep, reach } = PLANE.list;
  const slot = (atom: AtomId): number =>
    Math.max(measure(atom) + PLANE.badge.padding * 2, PLANE.atomSize);
  // Ranked, its members' medals stand before their names.
  const medals =
    list.isRanked === true ? PLANE.badge.height + PLANE.medal.gap : 0;
  const names =
    medals +
    Math.max(...list.members.map((member) => slot(member.atom))) +
    PLANE.badge.gap;
  const across =
    PLANE.atomSize / 2 +
    reach +
    (slot(list.predicate) + slot(list.object)) / 2 +
    PLANE.gap;
  const width = names + across + slot(list.object) / 2;
  const order = list.isRanked
    ? list.members.toSorted((a, b) => b.weight - a.weight)
    : list.members;
  const reachUp = ((order.length - 1) / 2) * rowStep;

  return {
    end: { atom: list.object },
    width,
    levels: 0,
    isSpelled: false,
    place: (x, into) => {
      const memberX = x + names + PLANE.atomSize / 2;
      const predicateX = memberX + reach;
      for (const [index, member] of order.entries()) {
        into.atoms.push({
          id: member.atom,
          role: 'identity',
          x: memberX,
          y: index * rowStep - reachUp,
          nameSide: 'left',
          ...(list.isRanked === true ? { rank: index } : {}),
          width: slot(member.atom),
        });
      }
      into.atoms.push(
        {
          id: list.predicate,
          role: 'predicate',
          x: predicateX,
          y: 0,
          width: slot(list.predicate),
        },
        {
          id: list.object,
          role: 'object',
          x: x + names + across,
          y: 0,
          width: slot(list.object),
        },
      );
      for (const member of list.members) {
        into.weights.push({
          id: `${list.id}:${member.atom}`,
          from: member.atom,
          to: list.predicate,
          value: member.weight,
        });
      }
      into.top = Math.min(into.top, ATOM_TOP - reachUp);
      into.bottom = Math.max(into.bottom, reachUp + PLANE.atomSize / 2);
    },
  };
}

/** A branch's column: what it rises from, where, and how low its atoms can stand. */
interface Column {
  branch: PlaneBranch;
  from: PlaneEnd;
  x: number;
  lowest: number;
}

/**
 * Lays a claim out on the plane, from 0 at its left. `measure` gives a
 * name's width, in plane units. Atoms `spelled` stand as words where they
 * will stand as atoms, and the words of a triple `folded` stand in one line
 * in its frame. Each
 * of `branches` rises in a column from its subject: an atom, which, the
 * object of the claim and the subject of the branch, takes both roles; or
 * a frame, from the middle of its top.
 */
export function layoutPlane(
  term: PlaneTerm,
  measure: (atom: AtomId) => number,
  options: LayoutOptions = {},
): PlaneLayout {
  const laid = layTerm(term, 'identity', 0, measure, options);
  const layout: PlaneLayout = {
    atoms: [],
    frames: [],
    links: [],
    weights: [],
    vaultLines: [],
    people: [],
    width: laid.width,
    top: ATOM_TOP,
    bottom: ATOM_BOTTOM,
  };
  laid.place(0, layout);
  for (const frame of layout.frames) {
    layout.top = Math.min(layout.top, frame.top);
    layout.bottom = Math.max(layout.bottom, frame.bottom);
  }
  // Where each column rises from: an atom's shape, or a frame's top.
  const step = PLANE.branchStep;
  const columns = (options.branches ?? []).flatMap((branch): Column[] => {
    const { subject } = branch;
    if ('atom' in subject) {
      const atom = layout.atoms.find(
        (candidate) => candidate.id === subject.atom,
      );
      if (atom === undefined) {
        return [];
      }
      if (atom.role === 'object') {
        atom.role = 'subjectAndObject';
      }

      return [{ branch, from: subject, x: atom.x, lowest: atom.y - step }];
    }
    const frame = layout.frames.find(
      (candidate) => candidate.id === subject.frame,
    );

    return frame === undefined
      ? []
      : [
          {
            branch,
            from: { frame: subject.frame, isTop: true },
            x: frame.x + frame.width / 2,
            lowest: frame.top - step * 0.75,
          },
        ];
  });
  // Side by side, the columns' atoms stand on the same rows: as low as the
  // highest-starting column allows, of these or of those still to come.
  const row = Math.min(
    ...columns.map((column) => column.lowest),
    options.branchRow ?? Number.POSITIVE_INFINITY,
  );
  if (columns.length > 0) {
    layout.branchRow = row;
  }
  for (const { branch, from, x } of columns) {
    for (const [index, id] of [branch.predicate, branch.object].entries()) {
      layout.atoms.push({
        id,
        role: index === 0 ? 'predicate' : 'object',
        x,
        y: row - step * index,
        nameSide: 'right',
        width: Math.max(measure(id) + PLANE.badge.padding * 2, PLANE.atomSize),
      });
    }
    layout.links.push(
      { id: `${branch.id}:0`, from, to: { atom: branch.predicate } },
      {
        id: `${branch.id}:1`,
        from: { atom: branch.predicate },
        to: { atom: branch.object },
      },
    );
    layout.top = Math.min(layout.top, row - step + ATOM_TOP);
  }
  const hung = layout.frames.find(
    (candidate) => candidate.id === options.vaults?.frame,
  );
  if (options.vaults !== undefined && hung !== undefined) {
    hangVaults(options.vaults, hung, layout);
  }
  if (options.pickerWidth !== undefined) {
    // A frame round the claim, as far from it all round, and the menu just
    // above its top, in the middle.
    const { height, gap, drop } = PLANE.picker;
    const frame = {
      x: -gap,
      y: layout.top - gap,
      width: layout.width + gap * 2,
      height: layout.bottom - layout.top + gap * 2,
    };
    layout.picker = {
      x: (layout.width - options.pickerWidth) / 2,
      y: frame.y - drop - height,
      width: options.pickerWidth,
      height,
      frame,
    };
    layout.top = layout.picker.y;
    layout.bottom = frame.y + frame.height;
  }

  return layout;
}

/**
 * Hangs a triple's vaults below its frame. The lines reach as far below the
 * claim as a claim rising from its top reaches above it, a row for the
 * vaults and a row for the people, so the plane is as tall with either; from
 * a triple inside the claim, the line down to where it splits is longer.
 */
function hangVaults(
  vaults: PlaneVaults,
  frame: PlaneFrame,
  into: PlaneLayout,
): void {
  const { split, spread, apart, weightAt } = PLANE.vaults;
  const step = PLANE.branchStep;
  const root = { x: frame.x + frame.width / 2, y: frame.bottom };
  const fork = { x: root.x, y: into.bottom + split };
  const vaultsRow = into.bottom + step * 0.75;
  const peopleRow = vaultsRow + step;
  // The people make the claim: every line runs from them up to it.
  into.vaultLines.push({
    id: `${vaults.frame}:vaults`,
    points: [fork, root],
    side: null,
  });
  let turn = 0;
  for (const [side, positions, direction] of [
    ['against', vaults.against, -1],
    ['for', vaults.for, 1],
  ] as const) {
    const vault = { x: root.x + spread * direction, y: vaultsRow };
    // The people on a side centred on its vault, left to right; each one's
    // line from the top of their icon, through the vault, to the split.
    for (const [index, value] of positions.entries()) {
      const id = `${vaults.frame}:${side}:${index}`;
      const x = vault.x + (index - (positions.length - 1) / 2) * apart;
      const to = { x, y: peopleRow - PLANE.atomSize / 2 };
      into.vaultLines.push({
        id,
        points: [to, vault, fork],
        side,
        turn,
        weight: {
          x: vault.x + (to.x - vault.x) * weightAt,
          y: vault.y + (to.y - vault.y) * weightAt,
          value,
        },
        ...(index === 0
          ? {
              total: {
                x: fork.x + (vault.x - fork.x) * weightAt,
                y: fork.y + (vault.y - fork.y) * weightAt,
                value: positions.reduce((sum, position) => sum + position, 0),
              },
            }
          : {}),
      });
      into.people.push({ id, side, x, y: peopleRow });
      turn += 1;
    }
  }
  into.bottom = Math.max(into.bottom, peopleRow + PLANE.atomSize / 2);
}

/** A claim in words, each inner triple in brackets. */
export function planeSentence(
  term: PlaneTerm,
  labelOf: (atom: AtomId) => string,
  isInner = false,
): string {
  if ('atom' in term) {
    return labelOf(term.atom);
  }
  if ('list' in term) {
    const { members, predicate, object } = term.list;

    return members
      .map(
        (member) =>
          `${labelOf(member.atom)} ${labelOf(predicate)} ${labelOf(object)}`,
      )
      .join('; ');
  }
  const { subject, predicate, object } = term.triple;
  const words = `${planeSentence(subject, labelOf, true)} ${labelOf(predicate)} ${planeSentence(object, labelOf, true)}`;

  return isInner ? `(${words})` : words;
}

/** An atom partway from one beat's claim to the next. */
export interface BlendedAtom extends PlaneAtom {
  /** 0 when absent, 1 when fully there. */
  presence: number;
  /** The role it is morphing from, toward `role`, `roleProgress` of the way. */
  fromRole: Role;
  roleProgress: number;
  /**
   * Whether it brings its own name: 0 when its word, already in place, is
   * its name, and grows a pill behind it.
   */
  named: number;
  /** How far its rank, in a ranked list, shows. */
  ranked: number;
  /** How far it is set back: fully, only `PLANE.faded` of it shows. */
  faded: number;
}

/** A frame partway from one beat's claim to the next. */
export interface BlendedFrame extends PlaneFrame {
  presence: number;
}

/** Part of a triple's line, drawn from its start as far as `presence`. */
export interface BlendedLink extends PlaneLink {
  presence: number;
  /** How far it is set back, with an atom it joins. */
  faded: number;
}

/** A triple's weight partway from one beat's claim to the next. */
export interface BlendedWeight extends PlaneWeight {
  /** How far it shows. */
  weighed: number;
}

/** A line of a triple's vaults partway from one beat's claim to the next. */
export interface BlendedVaultLine extends VaultLine {
  /** How far it is drawn, from its start. */
  presence: number;
  /** How far it has taken its vault's colour, from grey, and its total shows. */
  sided: number;
  /** How far the position on it shows. */
  weighed: number;
}

/** A person partway from one beat's claim to the next. */
export interface BlendedPerson extends PlanePerson {
  presence: number;
}

/** Plain words, centred on `x`, `y` down from the shapes' line. */
export interface BlendedWords {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  /** How far the pill of the name it is becoming has grown behind it. */
  pill: number;
}

/** The menu of perspectives partway from one beat's claim to the next. */
export interface BlendedPicker extends PlanePicker {
  options: readonly string[];
  /** The one it shows, closed. */
  chosen: number;
  /** How far it shows, 0 to 1. */
  presence: number;
  /** How far its list is open, 0 to 1. */
  open: number;
  /** Which option the open list highlights: between two, as it moves. */
  highlight: number;
}

/** The claim a run of beats builds to, laid out as it ends: what the plane sizes itself by. */
export interface PlaneFit {
  width: number;
  top: number;
  bottom: number;
  /** Where each of its atoms finally stands along the line. */
  xs: ReadonlyMap<AtomId, number>;
}

export interface BlendedPlane {
  /** The atoms made: not those still words. */
  atoms: BlendedAtom[];
  /** Outermost first. */
  frames: BlendedFrame[];
  links: BlendedLink[];
  weights: BlendedWeight[];
  vaultLines: BlendedVaultLine[];
  people: BlendedPerson[];
  words: BlendedWords[];
  picker: BlendedPicker | null;
  /** Its extent along the line, and above and below it. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** The claim it builds to, when known. */
  fit: PlaneFit | null;
  /** How far what was there has moved to its new place, 0 to 1. */
  settle: number;
}

/** A part of a change: the share of it it starts at, and the share it is done by. */
type Window = readonly [start: number, end: number];

interface Stages {
  /** The atom a plane opens on arrives. */
  lead: Window;
  /** Words appear. */
  write: Window;
  /**
   * What is not in the next claim leaves: its lines draw back over the
   * first half, as it fades.
   */
  leave: Window;
  /** What is there moves to its new place: atoms, words and frames. */
  move: Window;
  /** New frames form. */
  frames: Window;
  /** Words about to be atoms move down, to where their names go. */
  down: Window;
  /** New atoms arrive. */
  atoms: Window;
  /** The words that are their names grow a pill behind them. */
  pills: Window;
  /** Then the lines grow between them. */
  lines: Window;
  /** An atom with a new role takes it. */
  roles: Window;
  /** The people's positions show on their lines. */
  weights: Window;
  /** The lines to each vault take its colour, and show all the positions in it. */
  sides: Window;
  /** A list's members show their ranks, once they stand in order. */
  ranks: Window;
  /**
   * The menu of perspectives shows; or, choosing another, opens, moves to
   * it, and closes on it.
   */
  pick: Window;
  /** A list's weights change to the new perspective's. */
  reweigh: Window;
}

const NONE: Window = [0, 0];

/**
 * When, in the change that hangs a triple's vaults below it, the claim
 * moves up to make room, as what rose from it goes: what stands behind the
 * plane can go then too.
 */
export const HANGING_RISE: Window = [0, 0.35];

/**
 * The order a claim grows in. Opening, the atom it opens on arrives first;
 * once it settles, the rest of the claim shows, and then its lines grow.
 * Dividing words in a frame, they break into their parts, then the frames
 * inside show how the parts divide. Making them atoms, the words move down
 * to where the names go as the frames grow to hold them, the atoms arrive
 * in their shapes above them, the words grow their pills, and the lines
 * grow. Framing the whole claim, it
 * moves into place, then the frame forms round it, then what rises from it
 * arrives and the lines grow up to it. Hanging a triple's vaults below it,
 * at once what rose from it draws back and goes, an atom left with one role
 * takes it, and the claim moves up; then the people arrive below it, and
 * their lines grow up to it, one after another. Weighing them, each position shows on its line,
 * then each side takes its vault's colour. Seen through a perspective, the
 * claim moves down to make room for the menu above it, which shows. Choosing
 * another, the menu opens, moves to it, and closes on it; the weights change
 * to the new perspective's; the members move into their new order; and
 * their ranks change. Otherwise, what is there moves
 * aside before anything new arrives, and lines grow only between atoms
 * already in place.
 */
const STAGES = {
  opening: {
    lead: [0, 0.6],
    write: [0.6, 0.8],
    leave: NONE,
    move: NONE,
    frames: [0.6, 0.8],
    down: NONE,
    atoms: [0.6, 0.8],
    pills: [0.6, 0.8],
    lines: [0.8, 1],
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  dividing: {
    lead: [0.45, 0.85],
    write: NONE,
    leave: [0, 0.45],
    move: [0, 0.45],
    frames: [0.45, 0.85],
    down: [0.45, 0.85],
    atoms: [0.45, 0.85],
    pills: [0.45, 0.85],
    lines: [0.85, 1],
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  making: {
    lead: [0.2, 0.5],
    write: NONE,
    leave: [0, 0.4],
    move: [0, 0.4],
    frames: [0, 0.4],
    down: [0, 0.4],
    atoms: [0.2, 0.5],
    pills: [0.45, 0.65],
    lines: [0.65, 0.92],
    roles: [0.92, 1],
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  framing: {
    lead: [0.5, 0.7],
    write: NONE,
    leave: [0, 0.3],
    move: [0, 0.3],
    frames: [0.3, 0.5],
    down: [0, 0.3],
    atoms: [0.5, 0.7],
    pills: [0.5, 0.7],
    lines: [0.7, 0.92],
    roles: [0.92, 1],
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  growing: {
    lead: [0.3, 0.6],
    write: [0.3, 0.6],
    leave: [0, 0.3],
    move: [0, 0.3],
    frames: [0, 0.3],
    down: [0, 0.3],
    atoms: [0.3, 0.6],
    pills: [0.3, 0.6],
    lines: [0.6, 0.85],
    roles: [0.85, 1],
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  hanging: {
    lead: NONE,
    write: NONE,
    leave: HANGING_RISE,
    move: HANGING_RISE,
    frames: NONE,
    down: NONE,
    atoms: [0.38, 0.55],
    pills: NONE,
    lines: [0.6, 0.95],
    roles: HANGING_RISE,
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  closing: {
    lead: NONE,
    write: NONE,
    leave: [0, 0.45],
    move: NONE,
    frames: NONE,
    down: NONE,
    atoms: NONE,
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  listing: {
    lead: [0, 0.55],
    write: NONE,
    leave: NONE,
    move: NONE,
    frames: NONE,
    down: NONE,
    atoms: [0, 0.55],
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: [0.65, 0.9],
    sides: NONE,
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  ranking: {
    lead: NONE,
    write: NONE,
    leave: NONE,
    move: [0.05, 0.7],
    frames: NONE,
    down: NONE,
    atoms: NONE,
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: [0.75, 0.95],
    pick: NONE,
    reweigh: NONE,
  },
  weighing: {
    lead: NONE,
    write: NONE,
    leave: NONE,
    move: NONE,
    frames: NONE,
    down: NONE,
    atoms: NONE,
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: [0, 0.4],
    sides: [0.55, 1],
    ranks: NONE,
    pick: NONE,
    reweigh: NONE,
  },
  presenting: {
    lead: NONE,
    write: NONE,
    leave: NONE,
    move: [0, 0.45],
    frames: NONE,
    down: NONE,
    atoms: NONE,
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: NONE,
    pick: [0.25, 0.65],
    reweigh: NONE,
  },
  switching: {
    lead: NONE,
    write: NONE,
    leave: NONE,
    move: [0.52, 0.82],
    frames: NONE,
    down: NONE,
    atoms: NONE,
    pills: NONE,
    lines: NONE,
    roles: NONE,
    weights: NONE,
    sides: NONE,
    ranks: [0.84, 0.97],
    pick: [0, 0.36],
    reweigh: [0.38, 0.52],
  },
} as const satisfies Record<string, Stages>;

/**
 * Choosing another perspective, within the stage that picks it: the menu
 * opens, the highlight moves to the one chosen, and the menu closes on it.
 */
const PICKING = {
  open: [0, 0.3],
  highlight: [0.3, 0.65],
  close: [0.72, 1],
} as const;

/** The list a claim is, if it is one. */
function listOf(claim: PlaneClaim | null): PlaneList | undefined {
  return claim !== null && 'list' in claim.term ? claim.term.list : undefined;
}

/** The order the change from one claim to the next follows: see `STAGES`. */
function stagesOf(
  from: PlaneClaim | null,
  to: PlaneClaim | null,
  after: PlaneLayout | null,
): Stages {
  if (from === null) {
    if (to !== null && 'list' in to.term) {
      return STAGES.listing;
    }

    return (after?.atoms.length ?? 0) === 1
      ? { ...STAGES.opening, lead: [0, 1] }
      : STAGES.opening;
  }
  if (to === null) {
    return STAGES.closing;
  }
  if (to.perspective !== undefined) {
    if (from.perspective === undefined) {
      return STAGES.presenting;
    }
    if (from.perspective.chosen !== to.perspective.chosen) {
      return STAGES.switching;
    }
  }
  if (listOf(to)?.isRanked === true && listOf(from)?.isRanked !== true) {
    return STAGES.ranking;
  }
  if ((from.folded?.length ?? 0) > 0 && (to?.spelled?.length ?? 0) > 0) {
    return STAGES.dividing;
  }
  if ((from.spelled?.length ?? 0) > 0) {
    return STAGES.making;
  }
  if (to?.frame !== undefined && from.frame === undefined) {
    return STAGES.framing;
  }
  if (to?.vaults !== undefined && from.vaults === undefined) {
    return STAGES.hanging;
  }
  if (to?.vaults?.isWeighed === true && from.vaults?.isWeighed !== true) {
    return STAGES.weighing;
  }

  return STAGES.growing;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function distance(from: PlanePoint, to: PlanePoint): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

/** How long a line through `points` is. */
function lengthOf(points: readonly PlanePoint[]): number {
  return points
    .slice(1)
    .reduce(
      (sum, point, index) => sum + distance(points[index] ?? point, point),
      0,
    );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** How far through `window` a change at `t` is, eased. */
function through([start, end]: Window, t: number): number {
  if (end <= start) {
    return t >= end ? 1 : 0;
  }

  return easeInOutCubic(Math.min(Math.max((t - start) / (end - start), 0), 1));
}

/**
 * How far each of a triple's vault lines has grown at `t`, in a stage that
 * grows them over `window` of a change `durationMs` long, evenly: the
 * people's lines one after another, `staggerMs` apart, at one speed; the
 * trunk from when the first of them reaches it, at that speed, as that line
 * going on up; and all of it done as the stage ends. Without a duration,
 * the people's lines start together.
 */
function vaultGrowth(
  lines: readonly VaultLine[],
  [start, end]: Window,
  durationMs: number,
): (line: VaultLine, t: number) => number {
  const span = end - start;
  const climbing = lines.filter((line) => line.turn !== undefined);
  const gaps = Math.max(climbing.length - 1, 0);
  // Never more than half the stage from the first to start to the last.
  const stagger =
    durationMs > 0
      ? Math.min(
          PLANE.vaults.staggerMs / durationMs,
          span / 2 / Math.max(gaps, 1),
        )
      : 0;
  const longest = Math.max(0, ...climbing.map((line) => lengthOf(line.points)));
  const trunk = Math.max(
    0,
    ...lines
      .filter((line) => line.turn === undefined)
      .map((line) => lengthOf(line.points)),
  );
  const speed = (longest + trunk) / (span - stagger * gaps);
  const startOf = (line: VaultLine): number =>
    start + (line.turn ?? 0) * stagger;
  const firstMet = Math.min(
    ...climbing.map((line) => startOf(line) + lengthOf(line.points) / speed),
  );

  return (line, t) => {
    const length = lengthOf(line.points);
    if (t >= end || span <= 0 || length <= 0) {
      return t >= end ? 1 : 0;
    }
    const from = line.turn === undefined ? firstMet : startOf(line);

    return Math.min(Math.max(((t - from) * speed) / length, 0), 1);
  };
}

/** A layout moved along the line, and where its left edge is then. */
type Placed = PlaneLayout & { left: number };

/**
 * Where a line's end is on a laid-out plane, as the scene draws it: at an
 * atom, at the middle of a frame's top, or at a frame's right edge leaving
 * it and its left edge reaching it, on the claim's line.
 */
function endOf(
  layout: PlaneLayout,
  end: PlaneEnd,
  side: 'from' | 'to',
): { x: number; y: number } {
  if ('atom' in end) {
    const atom = layout.atoms.find((candidate) => candidate.id === end.atom);

    return { x: atom?.x ?? 0, y: atom?.y ?? 0 };
  }
  const frame = layout.frames.find((candidate) => candidate.id === end.frame);
  if (frame === undefined) {
    return { x: 0, y: 0 };
  }
  if (end.isTop === true) {
    return { x: frame.x + frame.width / 2, y: frame.top };
  }

  return { x: side === 'from' ? frame.x + frame.width : frame.x, y: 0 };
}

/**
 * How far each of `links` has grown, `grow` of the way through their time:
 * one after another, in the order the layout lists them (each triple from
 * its subject to its predicate to its object, then the triples it holds,
 * then the claims rising from it), each in its share of the time by its
 * length, so the bridge is drawn as one stroke at one speed.
 */
function growInTurn(
  links: readonly PlaneLink[],
  layout: PlaneLayout,
  grow: number,
): number[] {
  const lengths = links.map((link) => {
    const from = endOf(layout, link.from, 'from');
    const to = endOf(layout, link.to, 'to');

    return Math.hypot(to.x - from.x, to.y - from.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let drawn = 0;

  return lengths.map((length) => {
    const start = drawn;
    drawn += length;
    if (length === 0) {
      return grow * total >= start ? 1 : 0;
    }

    return Math.min(Math.max((grow * total - start) / length, 0), 1);
  });
}

function shifted(layout: PlaneLayout, shift: number): Placed {
  const moved = <T extends { x: number }>(point: T): T => ({
    ...point,
    x: point.x + shift,
  });

  return {
    ...layout,
    atoms: layout.atoms.map(moved),
    frames: layout.frames.map(moved),
    vaultLines: layout.vaultLines.map((line) => ({
      ...line,
      points: line.points.map(moved),
      ...(line.weight === undefined ? {} : { weight: moved(line.weight) }),
      ...(line.total === undefined ? {} : { total: moved(line.total) }),
    })),
    people: layout.people.map(moved),
    ...(layout.picker === undefined
      ? {}
      : {
          picker: {
            ...moved(layout.picker),
            frame: moved(layout.picker.frame),
          },
        }),
    left: shift,
  };
}

/** A layout moved so its middle, along the line, is at 0. */
function centred(layout: PlaneLayout): Placed {
  return shifted(layout, -layout.width / 2);
}

function isSameEnd(a: PlaneEnd, b: PlaneEnd): boolean {
  return 'atom' in a
    ? 'atom' in b && a.atom === b.atom
    : 'frame' in b && a.frame === b.frame;
}

function isSameLink(a: PlaneLink, b: PlaneLink): boolean {
  return a.id === b.id && isSameEnd(a.from, b.from) && isSameEnd(a.to, b.to);
}

/** Where a piece of text stands: centred on `x`, `y` down from the line. */
interface Spot {
  text: string;
  x: number;
  y: number;
}

/**
 * The plane `t` of the way from one beat's claim to the next, `t` running
 * evenly from 0 to 1: each stage eases on its own. Either claim can be
 * `null`, for a plane opening or closing. `measureText` gives a piece of
 * text's width at a name's size, in plane units. With `fit`, the claim the
 * beats build to, each claim stands where that one will: its first atom
 * where it stands there, so the claim only grows along the line and never
 * shifts; and the plane sizes itself by it, once. `durationMs`, how long
 * the change takes, times what is staggered in it.
 */
export function planeAt(
  from: PlaneClaim | null,
  to: PlaneClaim | null,
  t: number,
  measureText: (text: string) => number,
  labelOf: (atom: AtomId) => string,
  fit: PlaneClaim | null = null,
  durationMs = 0,
): BlendedPlane {
  const measure = (atom: AtomId): number => measureText(labelOf(atom));
  const space = measureText(' ');
  const { padding, chevrons } = PLANE.picker;
  const pickerWidth = (claim: PlaneClaim | null): number | undefined =>
    claim?.perspective === undefined
      ? undefined
      : Math.max(...claim.perspective.options.map(measureText)) +
        padding * 3 +
        chevrons;
  const fitLayout =
    fit === null
      ? null
      : centred(
          layoutPlane(fit.term, measure, {
            branches: fit.branches,
            frame: fit.frame,
            vaults: fit.vaults,
            pickerWidth: pickerWidth(fit),
            space,
          }),
        );
  // The final claim without what rises from it or hangs below it: up and
  // down, every step stands as it will, and moves only to make room above
  // or below it.
  const fitClaim =
    fit === null
      ? null
      : layoutPlane(fit.term, measure, { frame: fit.frame, space });
  // The row the final claim's branches stand on, so each stands there
  // from the start.
  const branchRow = fitLayout?.branchRow;
  const lay = (claim: PlaneClaim | null): Placed | null => {
    if (claim === null) {
      return null;
    }
    const layout = layoutPlane(claim.term, measure, {
      spelled: claim.spelled,
      folded: claim.folded,
      branches: claim.branches,
      frame: claim.frame,
      vaults: claim.vaults,
      branchRow,
      pickerWidth: pickerWidth(claim),
      space,
    });
    const first = layout.atoms[0];
    const there = fitLayout?.atoms.find((atom) => atom.id === first?.id);

    return first === undefined || there === undefined
      ? centred(layout)
      : shifted(layout, there.x - first.x);
  };
  const before = lay(from);
  const after = lay(to);
  const isMade = (claim: PlaneClaim | null, id: AtomId): boolean =>
    !(claim?.spelled?.includes(id) ?? false);
  const madeIn = (claim: PlaneClaim | null, layout: PlaneLayout | null) =>
    (layout?.atoms ?? []).filter((atom) => isMade(claim, atom.id));

  const stages = stagesOf(from, to, after);
  const lead = through(stages.lead, t);
  const write = through(stages.write, t);
  const leave = through(stages.leave, t);
  const move = through(stages.move, t);
  const form = through(stages.frames, t);
  const down = through(stages.down, t);
  const arrive = through(stages.atoms, t);
  const pill = through(stages.pills, t);
  const grow = through(stages.lines, t);
  const roles = through(stages.roles, t);
  const weigh = through(stages.weights, t);
  const rank = through(stages.ranks, t);
  const side = through(stages.sides, t);
  const reweigh = through(stages.reweigh, t);
  const [leaveStart, leaveEnd] = stages.leave;
  const retract = through([leaveStart, (leaveStart + leaveEnd) / 2], t);
  /** How far a thing shown or not, as one claim says and the next, shows. */
  const shift = (was: boolean, is: boolean, progress: number): number =>
    was === is ? (is ? 1 : 0) : is ? progress : 1 - progress;
  // An atom set back, and a line from one, fades as what leaves goes, but
  // only so far; and comes back as the plane closes.
  const isFaded = (claim: PlaneClaim | null, end: PlaneEnd): boolean =>
    'atom' in end && (claim?.faded?.includes(end.atom) ?? false);
  const fadedAtom = (id: AtomId): number =>
    shift(isFaded(from, { atom: id }), isFaded(to, { atom: id }), leave);
  const fadedLink = (link: PlaneLink): number =>
    shift(
      isFaded(from, link.from) || isFaded(from, link.to),
      isFaded(to, link.from) || isFaded(to, link.to),
      leave,
    );

  // The words: in one line in their frame, then broken into their parts,
  // which then move down to where their atoms' names go.
  const spotsOf = (
    claim: PlaneClaim | null,
    layout: PlaneLayout | null,
  ): Map<string, Spot> =>
    new Map(
      (claim?.spelled ?? []).map((id) => [
        id,
        {
          text: labelOf(id),
          x: layout?.atoms.find((atom) => atom.id === id)?.x ?? 0,
          y: 0,
        },
      ]),
    );
  const oldSpots = spotsOf(from, before);
  const newSpots = spotsOf(to, after);
  // The atoms made: what was there moves, what is new arrives in its shape.
  const oldMade = madeIn(from, before);
  const newMade = madeIn(to, after);
  // Opening, the claim's first atom leads, and the rest follow.
  const leader = from === null ? after?.atoms[0]?.id : undefined;
  // A ranked list's members show their ranks once they stand in order.
  const ranked = shift(
    listOf(from)?.isRanked === true,
    listOf(to)?.isRanked === true,
    rank,
  );
  // A member that changes place in a ranked list changes its rank: the old
  // one goes, then the new one comes.
  const rankedAs = (
    was: number | undefined,
    is: number | undefined,
  ): { rank?: number; ranked: number } =>
    is === undefined
      ? { ranked: 0 }
      : was === undefined || was === is
        ? { rank: is, ranked }
        : rank < 0.5
          ? { rank: was, ranked: 1 - rank * 2 }
          : { rank: is, ranked: rank * 2 - 1 };
  const atoms: BlendedAtom[] = newMade.map((atom) => {
    const was = oldMade.find((old) => old.id === atom.id);

    return was === undefined
      ? {
          ...atom,
          presence: atom.id === leader ? lead : arrive,
          fromRole: atom.role,
          roleProgress: 1,
          // An atom made from a word takes the word, in place, as its name.
          named: oldSpots.has(atom.id) ? 0 : 1,
          ranked: atom.rank === undefined ? 0 : ranked,
          faded: fadedAtom(atom.id),
        }
      : {
          ...atom,
          x: lerp(was.x, atom.x, move),
          y: lerp(was.y, atom.y, move),
          width: lerp(was.width, atom.width, move),
          presence: 1,
          fromRole: was.role,
          roleProgress: roles,
          named: 1,
          ...rankedAs(was.rank, atom.rank),
          faded: fadedAtom(atom.id),
        };
  });
  for (const atom of oldMade) {
    if (!newMade.some((next) => next.id === atom.id)) {
      atoms.push({
        ...atom,
        presence: 1 - leave,
        fromRole: atom.role,
        roleProgress: 1,
        named: 1,
        // The first to go, as lines draw back.
        ranked: atom.rank === undefined ? 0 : 1 - retract,
        faded: fadedAtom(atom.id),
      });
    }
  }

  // The whole claim's frame, where the claim hides it, goes as what leaves
  // goes; its room stays.
  const isShown = (claim: PlaneClaim | null, frame: PlaneFrame): boolean =>
    claim?.isFrameHidden !== true ||
    !('triple' in claim.term) ||
    claim.term.triple.id !== frame.id;
  const frames: BlendedFrame[] = (after?.frames ?? []).map((frame) => {
    const was = before?.frames.find((old) => old.id === frame.id);

    return was === undefined
      ? { ...frame, presence: isShown(to, frame) ? form : 0 }
      : {
          ...frame,
          x: lerp(was.x, frame.x, move),
          width: lerp(was.width, frame.width, move),
          top: lerp(was.top, frame.top, move),
          bottom: lerp(was.bottom, frame.bottom, move),
          presence: shift(isShown(from, was), isShown(to, frame), leave),
        };
  });
  for (const frame of before?.frames ?? []) {
    if (!(after?.frames ?? []).some((next) => next.id === frame.id)) {
      frames.push({
        ...frame,
        presence: isShown(from, frame) ? 1 - leave : 0,
      });
    }
  }
  // Outermost first: of two nested frames, the wider holds the other.
  frames.sort((a, b) => b.width - a.width);

  // A line is drawn between atoms made, or to a frame: never to a word.
  // One that joins the same as before stays; one that joins something else
  // draws back as what is there moves; new ones grow once everything is in
  // place, one after another from the subject on, as one stroke.
  const drawnIn = (claim: PlaneClaim | null, layout: PlaneLayout | null) =>
    (layout?.links ?? []).filter((link) =>
      [link.from, link.to].every(
        (end) => !('atom' in end) || isMade(claim, end.atom),
      ),
    );
  const oldLinks = drawnIn(from, before);
  const newLinks = drawnIn(to, after);
  const growing = newLinks.filter(
    (link) => !oldLinks.some((old) => isSameLink(old, link)),
  );
  const grown = after === null ? [] : growInTurn(growing, after, grow);
  const links: BlendedLink[] = [
    ...oldLinks.map((link) => ({
      ...link,
      presence: newLinks.some((next) => isSameLink(next, link))
        ? 1
        : 1 - retract,
      faded: fadedLink(link),
    })),
    ...growing.map((link, index) => ({
      ...link,
      presence: grown[index] ?? grow,
      faded: fadedLink(link),
    })),
  ];
  // A list's weights, as the list says; the first to go as it closes, as
  // lines draw back.
  const listWeighed = shift(
    listOf(from)?.isWeighed === true,
    listOf(to)?.isWeighed === true,
    weigh,
  );
  const weights: BlendedWeight[] =
    after === null
      ? (before?.weights ?? []).map((weight) => ({
          ...weight,
          weighed: listOf(from)?.isWeighed === true ? 1 - retract : 0,
        }))
      : after.weights.map((weight) => {
          const was = before?.weights.find((old) => old.id === weight.id);

          return {
            ...weight,
            value: Math.round(
              lerp(was?.value ?? weight.value, weight.value, reweigh),
            ),
            weighed: listWeighed,
          };
        });

  // A triple's vaults: the people arrive, then their lines grow from them up
  // to the claim, one after another (see `vaultGrowth`). A position shows,
  // or a side takes its colour, as the claim says.
  const oldVaults = from?.vaults;
  const newVaults = to?.vaults;
  const weighed = shift(
    oldVaults?.isWeighed === true,
    newVaults?.isWeighed === true,
    weigh,
  );
  const sided = shift(
    oldVaults?.isSided === true,
    newVaults?.isSided === true,
    side,
  );
  const growth = vaultGrowth(after?.vaultLines ?? [], stages.lines, durationMs);
  const vaultLines: BlendedVaultLine[] = (after?.vaultLines ?? []).map(
    (line) => {
      const isThere = (before?.vaultLines ?? []).some(
        (old) => old.id === line.id,
      );

      return {
        ...line,
        presence: isThere ? 1 : growth(line, t),
        sided,
        weighed,
      };
    },
  );
  for (const line of before?.vaultLines ?? []) {
    if (!vaultLines.some((next) => next.id === line.id)) {
      vaultLines.push({
        ...line,
        presence: 1 - retract,
        sided,
        weighed,
      });
    }
  }
  const people: BlendedPerson[] = (after?.people ?? []).map((person) => ({
    ...person,
    presence: (before?.people ?? []).some((old) => old.id === person.id)
      ? 1
      : arrive,
  }));
  for (const person of before?.people ?? []) {
    if (!people.some((next) => next.id === person.id)) {
      people.push({ ...person, presence: 1 - leave });
    }
  }

  // The menu of perspectives: it shows; or, choosing another, it opens,
  // moves to it, and closes on it, which shows from then on.
  const pickerAt = (): BlendedPicker | null => {
    const was = from?.perspective;
    const is = to?.perspective;
    const box = after?.picker;
    if (is === undefined || box === undefined) {
      const left = before?.picker;

      return was === undefined || left === undefined
        ? null
        : {
            ...left,
            options: was.options,
            chosen: was.chosen,
            presence: 1 - leave,
            open: 0,
            highlight: was.chosen,
          };
    }
    const old = before?.picker;
    const placed =
      old === undefined
        ? box
        : {
            ...box,
            x: lerp(old.x, box.x, move),
            y: lerp(old.y, box.y, move),
            frame: {
              x: lerp(old.frame.x, box.frame.x, move),
              y: lerp(old.frame.y, box.frame.y, move),
              width: lerp(old.frame.width, box.frame.width, move),
              height: lerp(old.frame.height, box.frame.height, move),
            },
          };
    if (was === undefined || was.chosen === is.chosen) {
      return {
        ...placed,
        options: is.options,
        chosen: is.chosen,
        presence: was === undefined ? through(stages.pick, t) : 1,
        open: 0,
        highlight: is.chosen,
      };
    }
    const [start, end] = stages.pick;
    const along =
      end > start ? Math.min(Math.max((t - start) / (end - start), 0), 1) : 1;
    const closing = through(PICKING.close, along);

    return {
      ...placed,
      options: is.options,
      chosen: closing > 0 ? is.chosen : was.chosen,
      presence: 1,
      open: through(PICKING.open, along) * (1 - closing),
      highlight: lerp(was.chosen, is.chosen, through(PICKING.highlight, along)),
    };
  };

  const words: BlendedWords[] = [];
  for (const [id, spot] of oldSpots) {
    const next = newSpots.get(id);
    const made = newMade.find((atom) => atom.id === id);
    if (next !== undefined) {
      words.push({
        id,
        text: spot.text,
        x: lerp(spot.x, next.x, move),
        y: lerp(spot.y, next.y, move),
        alpha: 1,
        pill: 0,
      });
    } else if (made !== undefined) {
      // Down to where its atom's name goes; then, its atom above it, it
      // grows a pill and is its name.
      words.push({
        id,
        text: spot.text,
        x: lerp(spot.x, made.x, down),
        y: lerp(spot.y, NAME_Y, down),
        alpha: 1,
        pill,
      });
    } else {
      words.push({ id, ...spot, alpha: 1 - leave, pill: 0 });
    }
  }
  for (const [id, spot] of newSpots) {
    if (!oldSpots.has(id)) {
      words.push({ id, ...spot, alpha: write, pill: 0 });
    }
  }

  const edge = (of: (layout: Placed) => number): number =>
    lerp(
      before === null ? (after === null ? 0 : of(after)) : of(before),
      after === null ? (before === null ? 0 : of(before)) : of(after),
      before === null ? 1 : move,
    );

  return {
    atoms,
    frames,
    links,
    weights,
    vaultLines,
    people,
    words,
    picker: pickerAt(),
    left: edge((layout) => layout.left),
    right: edge((layout) => layout.left + layout.width),
    top: edge((layout) =>
      fitClaim === null
        ? layout.top
        : Math.min(
            fitClaim.top,
            ...layout.atoms
              .filter((atom) => atom.y < 0)
              .map((atom) => atom.y + ATOM_TOP),
            layout.picker?.y ?? 0,
          ),
    ),
    // Down, as the claim will stand, or lower, for what hangs below it.
    bottom: edge((layout) =>
      fitClaim === null
        ? layout.bottom
        : Math.max(fitClaim.bottom, layout.bottom),
    ),
    fit:
      fitLayout === null
        ? null
        : {
            width: fitLayout.width,
            top: fitLayout.top,
            bottom: fitLayout.bottom,
            xs: new Map(fitLayout.atoms.map((atom) => [atom.id, atom.x])),
          },
    settle: move,
  };
}

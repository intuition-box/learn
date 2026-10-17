/**
 * Flies the camera through the field behind the onboarding.
 *
 * The camera sits on the time axis (+z) at a station and looks ahead. At a
 * station nothing moves. Going to another station is a flight: it eases in,
 * rushes, and eases out. While it moves, each atom is drawn as a shutter
 * would catch it, smeared along its path. At its fastest a lens shows: the
 * frame bulges and twists a little and its edges split into their colours.
 *
 * What is drawn, the atoms and the claims between them, is the scene in
 * `field-scene.ts`. This file moves it: flights, links being drawn in, and
 * the pass over the finished frame for the lens. Its layout is new on every
 * visit, and each page's is new again each time the camera comes back to
 * it.
 *
 * Plain WebGL2, no library.
 */

import {
  compile,
  createUniforms,
  easeInOutCubic,
  easeInOutCubicSlope,
  float,
  smoothstep,
  type Tween,
} from './field-gl';
import {
  createScene,
  createSceneTarget,
  freshSeeds,
  FULL_SCREEN_VERTEX,
  type SceneFrame,
} from './field-scene';
import { LAST_STATION, STATION_GAP } from './time-field-geometry';

/** How long a flight between two neighbouring stations takes. */
export const FLIGHT_MS = 1400;
/** Added for each further station, so a long flight is not a blur. */
const FLIGHT_EXTRA_MS = 300;
/**
 * The lens. It shows from `LENS_FROM` of a trip's top speed and is full at
 * `LENS_FULL`, so it is there for the fastest part of the trip only. At its
 * fullest the corners are pulled in by `LENS_BULGE` of their distance from
 * the centre, turned by `LENS_TWIST` radians (about 2 degrees), and split
 * into their colours by `LENS_SPLIT_PX` CSS pixels. All three are nothing at
 * the centre and grow toward the corners.
 */
const LENS_FROM = 0.45;
const LENS_FULL = 0.9;
const LENS_BULGE = 0.04;
const LENS_TWIST = 0.035;
const LENS_SPLIT_PX = 1.5;

/**
 * How quickly the cursor's push follows the cursor, and comes and goes as
 * it enters and leaves the page: the time to cover two thirds of the way.
 */
const HOVER_FOLLOW_MS = 325;
/** Closer than this, in half-heights or in strength, the push has arrived. */
const SETTLED = 0.002;

/**
 * How long the link level takes to move from one playground step's level to
 * the next, so the links are seen being drawn. A smaller change is quicker.
 */
const LINKS_MS = 4200;
const LINKS_SHORT_MS = 1800;

/*
 * The scene, drawn first to a texture, read back through the lens. With no
 * lens it reads each pixel from where it is, unchanged.
 */
const COMPOSITE_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  uniform sampler2D u_scene;
  uniform vec2 u_resolution;
  uniform float u_pixelRatio;
  uniform float u_lens;
  out vec4 outColour;

  void main() {
    vec2 px = gl_FragCoord.xy;
    vec2 halfSize = 0.5 * u_resolution;
    // Half-heights from the centre, and 0 at the centre to 1 at a corner.
    vec2 c = (px - halfSize) / halfSize.y;
    float r = length(c) / length(vec2(halfSize.x / halfSize.y, 1.0));
    vec2 outward = length(c) > 0.0 ? c / length(c) : vec2(0.0);

    // The lens: the corners pulled in and turned, and their colours split.
    float edge = u_lens * r * r;
    vec2 lensed = c * (1.0 - ${float(LENS_BULGE)} * edge);
    float twist = ${float(LENS_TWIST)} * edge;
    lensed = mat2(cos(twist), sin(twist), -sin(twist), cos(twist)) * lensed;
    vec2 at = lensed * halfSize.y + halfSize;
    vec2 split = outward * ${float(LENS_SPLIT_PX)} * u_pixelRatio * edge;

    vec2 uv = at / u_resolution;
    vec2 shift = split / u_resolution;
    vec3 colour = vec3(
      texture(u_scene, uv + shift).r,
      texture(u_scene, uv).g,
      texture(u_scene, uv - shift).b
    );
    outColour = vec4(colour, 1.0);
  }
`;

/**
 * Spread on an element, `<div {...QUIET_FIELD}>`, to have the field ignore
 * the mouse over it: its atoms settle back while the mouse is on the
 * playground's card, say, and make way again when it leaves.
 */
export const QUIET_FIELD = { 'data-field-quiet': '' } as const;

export interface TimeField {
  /**
   * Fly to a station. Called mid-flight with another station, it leaves
   * from where it is. Called with the station it is already bound for, it
   * does nothing.
   */
  travelTo: (station: number) => void;
  /**
   * Move the link level, one of `LINK_LEVELS`. The links between the old
   * level and the new are drawn, or withdrawn, over a few seconds. Called
   * with the level it is already bound for, it does nothing.
   */
  setLinks: (level: number) => void;
  /** Stop or resume drawing, for when the canvas is not on screen. */
  setRunning: (isRunning: boolean) => void;
  destroy: () => void;
}

/** What one frame needs to know. */
interface Frame extends SceneFrame {
  /** How much of the lens shows, 0 to 1. */
  lens: number;
}

interface Renderer {
  /** Draws one frame. */
  draw: (frame: Frame, pixelRatio: number) => void;
  /** Lays the field out again, one seed per station: see `Scene`. */
  relayout: (seeds: readonly number[]) => void;
}

/**
 * Sets up the scene, laid out from `seeds`, and the pass over it. Kept apart
 * from the animation so it can be run again, with the same seeds, after the
 * browser restores a lost context.
 */
function createRenderer(
  gl: WebGL2RenderingContext,
  seeds: readonly number[],
): Renderer {
  const scene = createScene(gl, seeds);
  const target = createSceneTarget(gl);
  const compositeProgram = compile(gl, FULL_SCREEN_VERTEX, COMPOSITE_FRAGMENT);
  const compositeUniform = createUniforms(gl, compositeProgram);
  // The composite pass reads no attributes, but draws with an array bound.
  const emptyArray = gl.createVertexArray();

  function drawScene(frame: Frame, pixelRatio: number): void {
    scene.clear();
    scene.drawLinks(frame, pixelRatio);
    if (Math.abs(frame.speed) > 0.01) {
      // The blur draws the atoms too: at no speed it is the atom itself.
      scene.drawMovingAtoms(frame, pixelRatio);
    } else {
      scene.drawAtoms(frame, pixelRatio);
    }
  }

  function draw(frame: Frame, pixelRatio: number): void {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);

    if (frame.lens <= 0.001) {
      // Most frames: the scene straight to the canvas.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawScene(frame, pixelRatio);

      return;
    }

    target.bind(width, height);
    drawScene(frame, pixelRatio);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    gl.useProgram(compositeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.uniform1i(compositeUniform('u_scene'), 0);
    gl.uniform2f(compositeUniform('u_resolution'), width, height);
    gl.uniform1f(compositeUniform('u_pixelRatio'), pixelRatio);
    gl.uniform1f(compositeUniform('u_lens'), frame.lens);
    gl.bindVertexArray(emptyArray);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  return { draw, relayout: scene.relayout };
}

/** A field for a browser without WebGL2: the pages work, with nothing behind. */
const NO_FIELD: TimeField = {
  travelTo: () => {},
  setLinks: () => {},
  setRunning: () => {},
  destroy: () => {},
};

function clampStation(station: number): number {
  return Math.min(Math.max(station, 0), LAST_STATION);
}

/**
 * Starts the field on `canvas` with the camera at `station` and the links
 * at `links`.
 *
 * At rest the atoms are still. What moves is the energy of the claims: the
 * dots along their links flow, so the loop runs while any link is drawn,
 * and otherwise only during a flight, or while the atoms make way for the
 * mouse: those near it are pushed aside, and settle back when it leaves. The video page, with no links, is still until the
 * mouse moves. With `prefers-reduced-motion`, the camera and the links jump
 * to where they are sent instead, and nothing else moves.
 */
export function createTimeField(
  canvas: HTMLCanvasElement,
  station: number,
  links: number,
): TimeField {
  const context = canvas.getContext('webgl2', {
    // Opaque: the scene is drawn on the page's own colour.
    alpha: false,
    antialias: false,
  });
  if (context === null) {
    return NO_FIELD;
  }
  // Named again so the functions below see it as never null.
  const gl: WebGL2RenderingContext = context;

  const isStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A seed for each station, new on every visit. Each time the camera comes
  // to a station, the others are laid out afresh while out of sight, so a
  // page left and come back to shows a universe it has not shown before.
  let seeds = freshSeeds();
  let renderer = createRenderer(gl, seeds);
  let cameraZ = clampStation(station) * STATION_GAP;
  // Where the camera is bound for: where it is, unless it is in flight.
  let boundForZ = cameraZ;
  // The top speed is kept with the flight: the lens shows near it.
  let flight: (Tween & { topSpeed: number }) | null = null;
  let linkLevel = links;
  let boundForLinks = links;
  let linkTween: Tween | null = null;
  let isRunning = true;
  // The animation frame asked for, or 0 when there is none.
  let frame = 0;
  // The dots' clock starts with the field, so its seconds stay small.
  const startedAt = performance.now();
  // The mouse, in half-heights from the centre with y up, and the push that
  // follows it: where it is, and how strong, 0 to 1.
  const pointer = { x: 0, y: 0, isOver: false };
  const push = { x: 0, y: 0, strength: 0 };
  let lastDrawAt = 0;

  /**
   * The camera has come to a station: every other station is out of sight
   * (behind it, or past how far it sees), so each is laid out afresh.
   */
  function arrive(): void {
    const here = Math.round(cameraZ / STATION_GAP);
    const fresh = freshSeeds();
    seeds = seeds.map((seed, station) =>
      station === here ? seed : (fresh[station] ?? seed),
    );
    renderer.relayout(seeds);
  }

  /** Two device pixels per CSS pixel at most: more costs fill and shows nothing. */
  function pixelRatio(): number {
    return Math.min(window.devicePixelRatio, 2);
  }

  function resize(): void {
    const ratio = pixelRatio();
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
  }

  /** Whether any link is drawn, and so has dots to flow along it. */
  function isFlowing(): boolean {
    return !isStill && Math.max(linkLevel, boundForLinks) > 0;
  }

  /** Whether the push is still catching up with the mouse. */
  function isHovering(): boolean {
    const target = pointer.isOver ? 1 : 0;

    return (
      push.strength !== target ||
      (pointer.isOver && (push.x !== pointer.x || push.y !== pointer.y))
    );
  }

  function isMoving(): boolean {
    return flight !== null || linkTween !== null || isFlowing() || isHovering();
  }

  function draw(now: number): void {
    let speed = 0;
    let speedShare = 0;
    if (flight !== null) {
      const t = (now - flight.startedAt) / flight.durationMs;
      if (t >= 1) {
        cameraZ = flight.to;
        flight = null;
        arrive();
      } else {
        const distance = flight.to - flight.from;
        cameraZ = flight.from + distance * easeInOutCubic(t);
        speed =
          (distance * easeInOutCubicSlope(t)) / (flight.durationMs / 1000);
        speedShare = Math.abs(speed) / flight.topSpeed;
      }
    }

    if (linkTween !== null) {
      const t = (now - linkTween.startedAt) / linkTween.durationMs;
      if (t >= 1) {
        linkLevel = linkTween.to;
        linkTween = null;
      } else {
        linkLevel =
          linkTween.from + (linkTween.to - linkTween.from) * easeInOutCubic(t);
      }
    }

    // The push follows the mouse, and comes in and goes as it enters and
    // leaves the page.
    const follow =
      1 -
      Math.exp(-(lastDrawAt === 0 ? 16 : now - lastDrawAt) / HOVER_FOLLOW_MS);
    lastDrawAt = now;
    if (pointer.isOver) {
      push.x += (pointer.x - push.x) * follow;
      push.y += (pointer.y - push.y) * follow;
      // Within a pixel or so it is there, and the field can rest.
      if (Math.hypot(pointer.x - push.x, pointer.y - push.y) < SETTLED) {
        push.x = pointer.x;
        push.y = pointer.y;
      }
    }
    const target = pointer.isOver ? 1 : 0;
    push.strength += (target - push.strength) * follow;
    if (Math.abs(target - push.strength) < SETTLED) {
      push.strength = target;
    }

    renderer.draw(
      {
        cameraZ,
        speed,
        links: linkLevel,
        flow: isStill ? 0 : (now - startedAt) / 1000,
        repel: push,
        lens: smoothstep(LENS_FROM, LENS_FULL, speedShare),
      },
      pixelRatio(),
    );
  }

  function loop(now: number): void {
    draw(now);
    frame = isMoving() ? requestAnimationFrame(loop) : 0;
    if (frame === 0) {
      lastDrawAt = 0;
    }
  }

  /**
   * Draws the field on the next frame, and goes on drawing while something
   * moves. Stops when the field is not shown.
   */
  function sync(): void {
    if (!isRunning || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (frame === 0) {
      frame = requestAnimationFrame(loop);
    }
  }

  /**
   * A mouse or pen over the page: touch has no hover, and pushes nothing.
   * Over an element marked `QUIET_FIELD` it is as if it had left.
   */
  function handlePointerMove(event: PointerEvent): void {
    if (isStill || event.pointerType === 'touch') {
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest('[data-field-quiet]') !== null
    ) {
      handlePointerLeave();

      return;
    }
    const box = canvas.getBoundingClientRect();
    const halfHeight = box.height / 2;
    pointer.x = (event.clientX - box.left - box.width / 2) / halfHeight;
    pointer.y = -(event.clientY - box.top - halfHeight) / halfHeight;
    if (!pointer.isOver && push.strength === 0) {
      // Comes in where the mouse is, not from where it last left.
      push.x = pointer.x;
      push.y = pointer.y;
    }
    pointer.isOver = true;
    sync();
  }

  function handlePointerLeave(): void {
    pointer.isOver = false;
    sync();
  }

  function handleContextLost(event: Event): void {
    // Tells the browser the context will be set up again when it returns.
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function handleContextRestored(): void {
    renderer = createRenderer(gl, seeds);
    sync();
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    // Resizing clears the canvas: drawn now, it never shows blank.
    if (isRunning && !document.hidden) {
      draw(performance.now());
    }
  });
  resizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', handlePointerLeave);
  window.addEventListener('blur', handlePointerLeave);
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  resize();
  sync();

  return {
    travelTo: (next) => {
      const to = clampStation(next) * STATION_GAP;
      if (to === boundForZ) {
        return;
      }
      boundForZ = to;
      if (isStill) {
        cameraZ = to;
        arrive();
      } else {
        const now = performance.now();
        const distance = Math.abs(to - cameraZ);
        const durationMs =
          FLIGHT_MS + FLIGHT_EXTRA_MS * Math.max(distance / STATION_GAP - 1, 0);
        flight = {
          from: cameraZ,
          to,
          startedAt: now,
          durationMs,
          // The slope of easeInOutCubic is 3 at its steepest.
          topSpeed: (distance * 3) / (durationMs / 1000),
        };
      }
      sync();
    },
    setLinks: (next) => {
      if (next === boundForLinks) {
        return;
      }
      boundForLinks = next;
      if (isStill) {
        linkLevel = next;
      } else {
        linkTween = {
          from: linkLevel,
          to: next,
          startedAt: performance.now(),
          durationMs:
            Math.abs(next - linkLevel) > 0.1 ? LINKS_MS : LINKS_SHORT_MS,
        };
      }
      sync();
    },
    setRunning: (next) => {
      isRunning = next;
      sync();
    },
    destroy: () => {
      cancelAnimationFrame(frame);
      frame = 0;
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener(
        'pointerleave',
        handlePointerLeave,
      );
      window.removeEventListener('blur', handlePointerLeave);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    },
  };
}

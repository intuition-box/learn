/**
 * The field's scene, drawn by the onboarding's field (`time-field.ts`): its
 * look, its shaders, and the drawing of its links and atoms. What happens
 * between frames, and the pass over the finished frame, belong to the
 * field.
 *
 * An atom is a filled circle, triangle or square: an identity, a predicate
 * or an object, each in its role's colour; one that is the object of one
 * claim and the subject of the next is a pink hexagon. A link is a faint
 * hairline in the page's ink, carrying fine dots of ink that flow from the
 * subject to the object (`DOT_TEXTURE`, the same texture as the
 * playground's lines). A claim's two links are drawn as one stroke, from the
 * identity, through the predicate, to the object.
 *
 * The canvas starts as the page's colour. The links darken it, as ink on
 * paper (multiply blending). The atoms are solid: drawn over it, farthest
 * first, so a nearer one covers a farther one rather than mixing with it.
 * It would not read on a dark page.
 */

import { DOT_TEXTURE } from './dot-texture';
import {
  attribute,
  compile,
  createUniforms,
  float,
  readCssColour,
  rgb,
} from './field-gl';
import {
  buildFieldGeometry,
  FADE_FROM,
  FAR,
  FOCAL,
  CLAIM_DRAW_WINDOW,
  LAST_STATION,
  LINK_STRIDE,
  POINT_STRIDE,
} from './time-field-geometry';

/** An atom closer to the camera than this is not drawn. */
export const NEAR = 0.6;

/**
 * An atom's width in CSS pixels when it is one unit ahead. It shrinks with
 * distance, between the two limits.
 */
export const ATOM_SIZE = 110;
export const MIN_ATOM_SIZE = 2;
export const MAX_ATOM_SIZE = 34;
/**
 * The near atoms are shards of glass catching a light just above the
 * screen, whose beams fan down across it, each split into its colours as
 * by a prism. Atoms from `from` world units ahead show none of it, and
 * those nearer than `full` all of it. `beamsPerRadian` sets how wide the
 * beams are, seen from the light; `splitPx` how far, in CSS pixels, a
 * shard's edge parts into its colours, and `rimOpacity` how strongly.
 */
const PRISM = {
  from: 10,
  full: 5,
  beamsPerRadian: 55,
  splitPx: 1.8,
  rimOpacity: 0.75,
} as const;
/**
 * The size, in CSS pixels, of an atom while it is connected: no larger and
 * no smaller than this however near or far, so the claims read as one
 * family. It eases into it as its claim is drawn.
 */
export const CONNECTED_SIZE = { min: 4, max: 8 } as const;

/**
 * The cursor's push, as in a starfield that makes way for it: how far
 * round it reaches, and how far it pushes an atom right beside it, both in
 * screen half-heights.
 */
const REPEL = { radius: 0.48, push: 0.2 } as const;

/** One colour per role, as sRGB channels from 0 to 255. */
export const ROLE_COLOURS = {
  identity: [122, 134, 255],
  predicate: [47, 224, 139],
  object: [255, 79, 94],
  /** The palette's pink: the identity's blue and the object's red, blended. */
  subjectAndObject: [255, 95, 210],
} as const;

/**
 * How dark a link's hairline is drawn, as a share of the page's ink. Faint:
 * its dots carry the line.
 */
export const LINK_OPACITY = 0.1;
/**
 * The most dots one link can carry: enough for the longest link on a wide
 * screen. A link short on screen shows fewer, so the texture is as dense
 * near as far.
 */
const DOTS_PER_LINK = 96;

/**
 * The motion blur: how long the shutter is open, as seconds of camera travel
 * at its current speed, and how many places along an atom's path one pixel
 * samples. Short, so a fast atom becomes a short, see-through dash rather
 * than a tail.
 */
export const SHUTTER_SECONDS = 0.016;
const SHUTTER_TAPS = 16;

/** The projection and the look the scene's programs share. */
const PROJECTION_GLSL = /* glsl */ `
  uniform float u_cameraZ;
  uniform float u_aspect;

  const float NEAR = ${float(NEAR)};
  const float FAR = ${float(FAR)};
  const float FADE_FROM = ${float(FADE_FROM)};
  const float FOCAL = ${float(FOCAL)};

  // Clip-space xy of a point seen from a camera at cameraZ. "depth" is how
  // far ahead of that camera it is.
  vec2 project(vec3 position, float cameraZ, out float depth) {
    depth = position.z - cameraZ;
    float scale = FOCAL / max(depth, 0.0001);
    vec2 xy = position.xy * scale;
    return vec2(xy.x / u_aspect, xy.y);
  }

  // An atom fades in out of the distance and fades out as it passes.
  float fade(float depth) {
    return (1.0 - smoothstep(FADE_FROM, FAR, depth))
      * smoothstep(NEAR, NEAR * 4.0, depth);
  }

  // An atom's width in CSS pixels at a depth.
  float sizeAt(float depth) {
    return clamp(
      ${float(ATOM_SIZE)} / depth, ${float(MIN_ATOM_SIZE)}, ${float(MAX_ATOM_SIZE)}
    );
  }

  // The link level, for the atoms as well as the links.
  uniform float u_links;

  // An atom's width at a depth, held to the connected size while its claim
  // is drawn. The claim is its reveal value, negative for none.
  float atomSizeAt(float depth, float claim) {
    float size = sizeAt(depth);
    if (claim < 0.0) {
      return size;
    }
    float connected = clamp((u_links - claim) / ${float(CLAIM_DRAW_WINDOW)}, 0.0, 1.0);
    return mix(
      size,
      clamp(size, ${float(CONNECTED_SIZE.min)}, ${float(CONNECTED_SIZE.max)}),
      connected
    );
  }

  // How much of a glass shard a near atom is, 0 to 1.
  float prismAt(float depth) {
    return 1.0 - smoothstep(${float(PRISM.full)}, ${float(PRISM.from)}, depth);
  }

  // Several unrelated values in [0, 1) out of an atom's one seed.
  float pick(float seed, float salt) {
    return fract(seed * salt);
  }

  // An identity is a circle, a predicate a triangle, an object a square,
  // and an atom that is both a subject and an object a hexagon, each in its
  // own colour.
  vec3 colourOf(float role) {
    if (role < 0.5) return ${rgb(ROLE_COLOURS.identity)};
    if (role < 1.5) return ${rgb(ROLE_COLOURS.predicate)};
    if (role < 2.5) return ${rgb(ROLE_COLOURS.object)};
    return ${rgb(ROLE_COLOURS.subjectAndObject)};
  }

  // An atom shrinks away into the distance, rather than fading: atoms are
  // solid.
  float farShrink(float depth) {
    return 1.0 - smoothstep(FADE_FROM, FAR, depth);
  }

  // The cursor's push: where it is, in half-heights from the centre with y
  // up, and how much it pushes, 0 to 1.
  uniform vec3 u_repel;

  // A point on screen, in clip units, moved away from the cursor: most when
  // close to it, and less, smoothly, out to about its radius, so a soft
  // hole opens round the cursor. Nothing moves where it is not.
  vec2 repelled(vec2 clip) {
    if (u_repel.z <= 0.0) {
      return clip;
    }
    vec2 at = vec2(clip.x * u_aspect, clip.y);
    vec2 away = at - u_repel.xy;
    float apart = length(away);
    if (apart < 0.00001) {
      return clip;
    }
    float q = apart / ${float(REPEL.radius)};
    at += away / apart * u_repel.z * ${float(REPEL.push)} * exp(-q * q);
    return vec2(at.x / u_aspect, at.y);
  }

  // Anything behind the camera, or too close, is moved off screen.
  const vec4 CULLED = vec4(2.0, 2.0, 2.0, 1.0);
`;

/**
 * The shapes, how much of a pixel an atom covers, and the glass a near one
 * is made of. It reads the atom's `v_shape` (its role), `v_spin` and
 * `v_size`, in device pixels, and `u_resolution`.
 */
export const SHAPES_GLSL = /* glsl */ `
  // Signed distances to the three shapes, each drawn filled, in a box that
  // runs -1 to 1: negative inside. The proportions are those of a 24-unit
  // icon grid.
  float circle(vec2 p) {
    return length(p) - 0.83;
  }

  float roundedSquare(vec2 p) {
    vec2 q = abs(p) - 0.39;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.36;
  }

  // Points to the left and the right, a little rounded, and as big as the
  // circle.
  float roundedHexagon(vec2 p) {
    const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
    const float r = 0.72;
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y) - 0.07;
  }

  float roundedTriangle(vec2 p) {
    const float k = 1.7320508;
    const float r = 0.58;
    p.y += 0.12;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y) - 0.2;
  }

  // How much of a pixel the atom covers, 0 to 1, at an offset in device
  // pixels from its centre.
  float coverage(vec2 px) {
    vec2 turned = vec2(
      v_spin.x * px.x + v_spin.y * px.y,
      v_spin.x * px.y - v_spin.y * px.x
    );
    float halfSize = 0.5 * v_size;
    vec2 p = turned / halfSize;
    float inside = v_shape < 0.5
      ? circle(p)
      : v_shape < 1.5
        ? roundedTriangle(p)
        : v_shape < 2.5 ? roundedSquare(p) : roundedHexagon(p);
    float soft = 0.7 * u_pixelRatio;
    return 1.0 - smoothstep(-soft, soft, inside * halfSize);
  }

  // The colours of the light: red, through green, to violet.
  vec3 spectrum(float t) {
    return clamp(
      1.25 * (0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67)))) - 0.12,
      0.0,
      1.0
    );
  }

  // Where the light is, in device pixels from the bottom left: just above
  // the middle of the screen.
  vec2 lightAt() {
    return vec2(0.5 * u_resolution.x, 1.6 * u_resolution.y);
  }

  // The colour of a shard at a pixel, as much glass as the amount says: its
  // own colour, cut into two facets, and across it the beam of light it is
  // in, split into its colours with a bright core. The point is the pixel
  // in the shard's own turned box, -1 to 1; the seed is the atom's.
  vec3 shardColour(vec3 base, float amount, vec2 p, float seed) {
    vec2 fromLight = gl_FragCoord.xy - lightAt();
    float beam = atan(fromLight.x, -fromLight.y) * ${float(PRISM.beamsPerRadian)};
    float across = fract(beam);
    float strength = 0.35 + 0.65 * fract(sin(floor(beam) * 127.1) * 43758.5453);
    float profile = smoothstep(0.0, 0.5, across) * smoothstep(1.0, 0.5, across);
    float core = exp(-pow((across - 0.5) / 0.09, 2.0));
    vec3 light = mix(spectrum(across), vec3(1.0), 0.7 * core);
    float facet = step(0.0, dot(p, vec2(cos(seed * 40.0), sin(seed * 40.0))));
    vec3 glass = base * (0.82 + 0.14 * facet);
    vec3 lit = mix(glass, light, 0.7 * profile * strength);
    return mix(base, lit, amount);
  }
`;

/*
 * An atom is one point sprite, wide enough for the shape and, for a near
 * one, its edge parting into its colours. The
 * fragment shader works in device pixels from the sprite's centre.
 */
const ATOM_VERTEX = /* glsl */ `#version 300 es
  ${PROJECTION_GLSL}
  in vec4 a_point;
  in float a_role;
  in float a_claim;
  uniform float u_pixelRatio;
  uniform float u_maxSprite;
  out vec3 v_colour;
  out float v_size;
  out float v_sprite;
  out float v_shape;
  out vec2 v_spin;
  out float v_prism;
  out float v_seed;

  void main() {
    float seed = a_point.w;
    float depth;
    vec2 xy = project(a_point.xyz, u_cameraZ, depth);
    // Too near, or past where it has shrunk away: not drawn at all, not
    // even as the faint smudge a point of no size leaves.
    if (depth < NEAR || depth >= FAR) { gl_Position = CULLED; gl_PointSize = 0.0; return; }

    float size = atomSizeAt(depth, a_claim) * farShrink(depth);
    float prism = prismAt(depth);
    // Room for the shape, and for its edges parting into their colours.
    float sprite = (size + 2.0 + 2.0 * prism * ${float(PRISM.splitPx)}) * u_pixelRatio;
    // A GPU caps how large a point can be. Past the cap everything about the
    // atom shrinks together, so it is smaller and never cut off.
    float fit = min(1.0, u_maxSprite / sprite);
    v_size = size * u_pixelRatio * fit;
    v_sprite = sprite * fit;
    v_prism = prism;
    v_seed = seed;
    gl_Position = vec4(repelled(xy), 0.0, 1.0);
    gl_PointSize = v_sprite;

    v_shape = a_role;
    float angle = pick(seed, 91.0) * 6.2831853;
    v_spin = vec2(cos(angle), sin(angle));
    v_colour = colourOf(a_role);
  }
`;

const ATOM_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  uniform float u_pixelRatio;
  uniform vec2 u_resolution;
  in vec3 v_colour;
  in float v_size;
  in float v_sprite;
  in float v_shape;
  in vec2 v_spin;
  in float v_prism;
  in float v_seed;
  out vec4 outColour;

  ${SHAPES_GLSL}

  void main() {
    vec2 px = (gl_PointCoord - 0.5) * v_sprite;
    // Point coordinates grow downward. The shapes are drawn growing up.
    px.y = -px.y;
    // Premultiplied, drawn over what is behind: solid, but for its edges.
    if (v_prism <= 0.0) {
      float cover = coverage(px);
      outColour = vec4(v_colour * cover, cover);
      return;
    }
    // A shard: solid glass, and at its edges the light it splits, a warm
    // rim on the side toward the light and a cool one on the other, light
    // and see-through, as a prism's edges are on a white page.
    vec2 along = normalize(gl_FragCoord.xy - lightAt());
    float split = v_prism * ${float(PRISM.splitPx)} * u_pixelRatio;
    float inside = coverage(px);
    float warm = max(coverage(px - along * split) - inside, 0.0);
    float cool = max(coverage(px + along * split) - inside, 0.0);
    vec2 turned = vec2(
      v_spin.x * px.x + v_spin.y * px.y,
      v_spin.x * px.y - v_spin.y * px.x
    ) / (0.5 * v_size);
    vec3 colour = shardColour(v_colour, v_prism, turned, v_seed);
    float rim = ${float(PRISM.rimOpacity)};
    outColour = vec4(
      colour * inside
        + vec3(1.0, 0.62, 0.3) * warm * rim
        + vec3(0.36, 0.62, 1.0) * cool * rim,
      inside + (warm + cool) * rim
    );
  }
`;

/*
 * A moving atom as a shutter would catch it: a quad over the whole path the
 * atom crosses while the shutter is open, and each pixel the share of that
 * time the atom covered it. A long path spreads the same colour thin, so a
 * fast atom is lighter, not heavier.
 */
const SHUTTER_VERTEX = /* glsl */ `#version 300 es
  ${PROJECTION_GLSL}
  in vec2 a_corner;
  in vec4 a_point;
  in float a_role;
  in float a_claim;
  uniform float u_shutter;
  uniform float u_pixelRatio;
  uniform vec2 u_resolution;
  out vec2 v_offset;
  out vec2 v_path;
  out vec3 v_colour;
  out float v_size;
  out float v_shape;
  out vec2 v_spin;
  out float v_prism;
  out float v_seed;

  void main() {
    float seed = a_point.w;
    float headDepth;
    float tailDepth;
    vec2 head = project(a_point.xyz, u_cameraZ, headDepth);
    vec2 tail = project(a_point.xyz, u_cameraZ - u_shutter, tailDepth);
    if (headDepth < NEAR || tailDepth < NEAR || headDepth >= FAR) { gl_Position = CULLED; return; }

    head = repelled(head);
    tail = repelled(tail);
    vec2 headPx = head * 0.5 * u_resolution;
    vec2 tailPx = tail * 0.5 * u_resolution;
    vec2 path = tailPx - headPx;
    float pathLength = length(path);
    vec2 direction = pathLength > 0.001 ? -path / pathLength : vec2(1.0, 0.0);
    vec2 normal = vec2(-direction.y, direction.x);

    float size =
      atomSizeAt(headDepth, a_claim) * farShrink(headDepth) * u_pixelRatio;
    // Far enough out from the path to hold the atom anywhere on it.
    float reach = 0.5 * size + u_pixelRatio;

    vec2 px = mix(tailPx - direction * reach, headPx + direction * reach, a_corner.x)
      + normal * a_corner.y * reach;
    gl_Position = vec4(px / (0.5 * u_resolution), 0.0, 1.0);

    v_offset = px - headPx;
    v_path = path;
    v_size = size;
    v_prism = prismAt(headDepth);
    v_seed = seed;
    v_shape = a_role;
    float angle = pick(seed, 91.0) * 6.2831853;
    v_spin = vec2(cos(angle), sin(angle));
    v_colour = colourOf(a_role);
  }
`;

const SHUTTER_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  uniform float u_pixelRatio;
  in vec2 v_offset;
  in vec2 v_path;
  in vec3 v_colour;
  in float v_size;
  in float v_shape;
  in vec2 v_spin;
  in float v_prism;
  in float v_seed;
  uniform vec2 u_resolution;
  out vec4 outColour;

  ${SHAPES_GLSL}

  void main() {
    // A different start along the path for each pixel, which turns the
    // banding of a fixed set of samples into fine grain.
    float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float cover = 0.0;
    for (int tap = 0; tap < ${SHUTTER_TAPS}; tap++) {
      float along = (float(tap) + jitter) / ${float(SHUTTER_TAPS)};
      cover += coverage(v_offset - v_path * along);
    }
    cover /= ${float(SHUTTER_TAPS)};
    vec2 turned = vec2(
      v_spin.x * v_offset.x + v_spin.y * v_offset.y,
      v_spin.x * v_offset.y - v_spin.y * v_offset.x
    ) / (0.5 * v_size);
    vec3 colour = v_prism > 0.0
      ? shardColour(v_colour, v_prism, turned, v_seed)
      : v_colour;
    outColour = vec4(colour * cover, cover);
  }
`;

/*
 * A link is a hairline from one atom of a claim to the next. As the link
 * level crosses the claim's draw window, the claim is drawn as one stroke:
 * its first link grows from the identity to the predicate, then its second
 * from the predicate to the object.
 */
const LINK_VERTEX = /* glsl */ `#version 300 es
  ${PROJECTION_GLSL}
  in float a_end;
  in vec4 a_from;
  in vec4 a_to;
  in float a_reveal;
  in float a_half;
  out float v_alpha;

  void main() {
    float progress = clamp(
      (u_links - a_reveal) / ${float(CLAIM_DRAW_WINDOW)}, 0.0, 1.0
    );
    // The first half grows over the first half of the stroke, the second
    // over the rest.
    float grown = clamp(progress * 2.0 - a_half, 0.0, 1.0);
    if (grown <= 0.0) {
      gl_Position = CULLED;
      v_alpha = 0.0;
      return;
    }
    // The first end stays on the first atom. The second runs toward the
    // other atom as the link grows.
    vec3 position = mix(a_from.xyz, mix(a_from.xyz, a_to.xyz, grown), a_end);
    float depth = position.z - u_cameraZ;

    // The same projection as project(), left undivided: with the depth in w
    // the GPU divides, and clips a line that runs behind the camera instead
    // of drawing it across the screen.
    gl_Position = vec4(
      position.x * FOCAL / u_aspect, position.y * FOCAL, 0.0, depth
    );
    // Its end goes where the cursor pushes its atom.
    if (depth > 0.0) {
      gl_Position.xy = repelled(gl_Position.xy / depth) * depth;
    }
    // The whole claim fades as its predicate does, so its links are seen,
    // or not, together.
    float predicateDepth = (a_half < 0.5 ? a_to.z : a_from.z) - u_cameraZ;
    v_alpha = fade(predicateDepth) * ${float(LINK_OPACITY)};
  }
`;

const LINK_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  uniform vec3 u_ink;
  in float v_alpha;
  out vec4 outColour;

  void main() {
    outColour = vec4(mix(vec3(1.0), u_ink, v_alpha), 1.0);
  }
`;

/** How fast a link's dots flow, in world units a second: the slowest, and up to how much faster. */
const DOT_SPEED = { min: 0.25, range: 0.3 } as const;

/*
 * A link's dots: one instance per dot, `DOTS_PER_LINK` to a link. Each dot
 * takes a place along the link, a speed, a size, a darkness and a little
 * offset across it from its instance number alone, and flows on with the
 * frame's `flow`. A dot shows only on the part of the link drawn so far, and
 * only as many as the link's length on screen asks for.
 */
const LINK_DOT_VERTEX = /* glsl */ `#version 300 es
  ${PROJECTION_GLSL}
  in vec4 a_from;
  in vec4 a_to;
  in float a_reveal;
  in float a_half;
  uniform vec2 u_resolution;
  uniform float u_pixelRatio;
  // Seconds the dots have flowed.
  uniform float u_flow;
  out float v_alpha;
  out float v_radius;
  out float v_size;

  const uint DOTS = ${DOTS_PER_LINK}u;

  uint mixBits(uint x) {
    x ^= x >> 16;
    x *= 0x7feb352du;
    x ^= x >> 15;
    x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
  }

  // A value in [0, 1] for this dot, a different one for each salt.
  float random(uint salt) {
    return float(mixBits(uint(gl_InstanceID) * 5u + salt)) / 4294967295.0;
  }

  vec4 clip(vec3 position) {
    return vec4(
      position.x * FOCAL / u_aspect, position.y * FOCAL, 0.0,
      position.z - u_cameraZ
    );
  }

  void main() {
    float progress = clamp(
      (u_links - a_reveal) / ${float(CLAIM_DRAW_WINDOW)}, 0.0, 1.0
    );
    float grown = clamp(progress * 2.0 - a_half, 0.0, 1.0);
    // Each dot flows from the subject's end to the object's at its own
    // speed, in world units a second, and comes round again.
    float speed = ${float(DOT_SPEED.min)} + random(5u) * ${float(DOT_SPEED.range)};
    float along = fract(
      random(0u) + u_flow * speed / max(distance(a_from.xyz, a_to.xyz), 0.001)
    );
    vec4 from = clip(a_from.xyz);
    vec4 to = clip(a_to.xyz);
    // A dot has no clipping to save it, as a line does: with either end
    // behind the camera, the link's dots are not drawn.
    if (along > grown || from.w <= NEAR * 0.5 || to.w <= NEAR * 0.5) {
      gl_Position = CULLED;
      gl_PointSize = 0.0;
      return;
    }
    // The link's length on screen, in device pixels, sets how many dots.
    vec2 fromPixel = from.xy / from.w * 0.5 * u_resolution;
    vec2 toPixel = to.xy / to.w * 0.5 * u_resolution;
    float span = distance(fromPixel, toPixel);
    float index = float(uint(gl_InstanceID) % DOTS);
    if (index >= span / (${float(DOT_TEXTURE.pixelsPerDot)} * u_pixelRatio)) {
      gl_Position = CULLED;
      gl_PointSize = 0.0;
      return;
    }

    gl_Position = clip(mix(a_from.xyz, a_to.xyz, along));
    // Where the cursor pushes the link's two ends, the dots between go too,
    // so they stay on the line.
    vec2 fromClip = from.xy / from.w;
    vec2 toClip = to.xy / to.w;
    gl_Position.xy += mix(
      repelled(fromClip) - fromClip, repelled(toClip) - toClip, along
    ) * gl_Position.w;
    // A little way off the line, across it, in device pixels.
    vec2 direction = span > 0.0 ? (toPixel - fromPixel) / span : vec2(1.0, 0.0);
    float offset = (random(1u) - 0.5) * 2.0 * ${float(DOT_TEXTURE.maxOffset)}
      * random(2u) * u_pixelRatio;
    gl_Position.xy += vec2(-direction.y, direction.x) * offset
      / (0.5 * u_resolution) * gl_Position.w;

    v_radius = (${float(DOT_TEXTURE.radius.min)} + random(3u) * ${float(DOT_TEXTURE.radius.range)})
      * u_pixelRatio;
    v_size = ceil(v_radius * 2.0 + 2.0);
    gl_PointSize = v_size;
    // Seen, or not, with the rest of the claim, as its hairline is.
    float predicateDepth = (a_half < 0.5 ? a_to.z : a_from.z) - u_cameraZ;
    v_alpha = fade(predicateDepth) * (
      ${float(DOT_TEXTURE.alpha.min)}
        + ${float(DOT_TEXTURE.alpha.range)} * pow(random(4u), ${float(DOT_TEXTURE.alpha.curve)})
    );
  }
`;

const LINK_DOT_FRAGMENT = /* glsl */ `#version 300 es
  precision highp float;
  uniform vec3 u_ink;
  in float v_alpha;
  in float v_radius;
  in float v_size;
  out vec4 outColour;

  void main() {
    float reach = length(gl_PointCoord - 0.5) * v_size;
    float cover = 1.0 - smoothstep(v_radius - 0.6, v_radius + 0.6, reach);
    outColour = vec4(mix(vec3(1.0), u_ink, v_alpha * cover), 1.0);
  }
`;

/** One triangle over the whole canvas, from the vertex index alone. */
export const FULL_SCREEN_VERTEX = /* glsl */ `#version 300 es
  void main() {
    vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
  }
`;

/** What drawing the scene needs to know. */
export interface SceneFrame {
  cameraZ: number;
  /** World units a second along z. Negative when flying back. */
  speed: number;
  /** The link level: see `LINK_LEVELS`. */
  links: number;
  /** Seconds the dots along the links have flowed. Still when left out. */
  flow?: number;
  /**
   * The cursor, pushing atoms near it aside: where it is, in half-heights
   * from the centre with y up, and how much it pushes, 0 to 1. No push when
   * left out.
   */
  repel?: { x: number; y: number; strength: number };
}

export interface Scene {
  /** The page's colour, with multiply blending on for the links. */
  clear: () => void;
  drawLinks: (frame: SceneFrame, pixelRatio: number) => void;
  /** The atoms as they stand. */
  drawAtoms: (frame: SceneFrame, pixelRatio: number) => void;
  /** The atoms as a shutter catches them while the camera moves. */
  drawMovingAtoms: (frame: SceneFrame, pixelRatio: number) => void;
  /**
   * Lays the field out again from `seeds`, one per station (see
   * `buildFieldGeometry`), in the same buffers. A station whose seed is
   * unchanged stays exactly as it was.
   */
  relayout: (seeds: readonly number[]) => void;
}

/** A seed for each station, new on every call: a field no visit has seen. */
export function freshSeeds(): number[] {
  return [...crypto.getRandomValues(new Uint32Array(LAST_STATION + 1))];
}

/**
 * Sets up the scene's programs and buffers. Run again after the browser
 * restores a lost context.
 */
export function createScene(
  gl: WebGL2RenderingContext,
  seeds: readonly number[] = freshSeeds(),
): Scene {
  let pointCount = 0;
  let linkCount = 0;

  const atomProgram = compile(gl, ATOM_VERTEX, ATOM_FRAGMENT);
  const shutterProgram = compile(gl, SHUTTER_VERTEX, SHUTTER_FRAGMENT);
  const linkProgram = compile(gl, LINK_VERTEX, LINK_FRAGMENT);
  const dotProgram = compile(gl, LINK_DOT_VERTEX, LINK_DOT_FRAGMENT);
  const atomUniform = createUniforms(gl, atomProgram);
  const shutterUniform = createUniforms(gl, shutterProgram);
  const linkUniform = createUniforms(gl, linkProgram);
  const dotUniform = createUniforms(gl, dotProgram);

  const pointBuffer = gl.createBuffer();
  const linkBuffer = gl.createBuffer();
  /**
   * Fills the atoms' and links' buffers with the field laid out from
   * `seeds`. The vertex arrays point at the buffers, not at their data, so
   * they need nothing new.
   */
  function relayout(next: readonly number[]): void {
    const geometry = buildFieldGeometry(next);
    pointCount = geometry.points.length / POINT_STRIDE;
    linkCount = geometry.links.length / LINK_STRIDE;
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.points, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.links, gl.STATIC_DRAW);
  }
  relayout(seeds);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  // Two triangles: start to end along x, one side to the other along y.
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, -1, 1, -1, 0, 1, 0, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  /** Points `program` at the atoms, one per vertex or one per instance. */
  function pointAttributes(program: WebGLProgram, perInstance: boolean): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    attribute(gl, program, 'a_point', {
      size: 4,
      stride: POINT_STRIDE,
      offset: 0,
      perInstance,
    });
    attribute(gl, program, 'a_role', {
      size: 1,
      stride: POINT_STRIDE,
      offset: 4,
      perInstance,
    });
    attribute(gl, program, 'a_claim', {
      size: 1,
      stride: POINT_STRIDE,
      offset: 5,
      perInstance,
    });
  }

  function cornerAttribute(program: WebGLProgram): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    attribute(gl, program, 'a_corner', { size: 2, stride: 2, offset: 0 });
  }

  const atomArray = gl.createVertexArray();
  gl.bindVertexArray(atomArray);
  pointAttributes(atomProgram, false);

  function quadPerAtom(program: WebGLProgram): WebGLVertexArrayObject {
    const array = gl.createVertexArray();
    gl.bindVertexArray(array);
    pointAttributes(program, true);
    cornerAttribute(program);
    gl.bindVertexArray(null);

    return array;
  }
  const shutterArray = quadPerAtom(shutterProgram);

  // A link is a line: two vertices, its two ends, for each link.
  const endBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, endBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1]), gl.STATIC_DRAW);
  const linkArray = gl.createVertexArray();
  gl.bindVertexArray(linkArray);
  attribute(gl, linkProgram, 'a_end', { size: 1, stride: 1, offset: 0 });
  gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
  const LINK_ATTRIBUTES = [
    ['a_from', 4, 0],
    ['a_to', 4, POINT_STRIDE],
    ['a_reveal', 1, POINT_STRIDE * 2],
    ['a_half', 1, POINT_STRIDE * 2 + 1],
  ] as const;
  for (const [name, size, offset] of LINK_ATTRIBUTES) {
    attribute(gl, linkProgram, name, {
      size,
      stride: LINK_STRIDE,
      offset,
      perInstance: true,
    });
  }
  gl.bindVertexArray(null);

  // A link's dots: one point per instance, the link's own values shared by
  // its `DOTS_PER_LINK` instances.
  const dotArray = gl.createVertexArray();
  gl.bindVertexArray(dotArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
  for (const [name, size, offset] of LINK_ATTRIBUTES) {
    attribute(gl, dotProgram, name, {
      size,
      stride: LINK_STRIDE,
      offset,
      divisor: DOTS_PER_LINK,
    });
  }
  gl.bindVertexArray(null);

  const ink = readCssColour('--wave-docs-fg');
  const page = readCssColour('--wave-docs-bg');
  // The largest point this GPU draws, which caps an atom's sprite.
  const pointSizes: unknown = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
  const maxSprite =
    pointSizes instanceof Float32Array ? (pointSizes[1] ?? 64) : 64;

  function bindProgram(
    program: WebGLProgram,
    uniform: (name: string) => WebGLUniformLocation | null,
    frame: SceneFrame,
    pixelRatio: number,
  ): void {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.useProgram(program);
    gl.uniform1f(uniform('u_cameraZ'), frame.cameraZ);
    gl.uniform1f(uniform('u_aspect'), width / height);
    gl.uniform2f(uniform('u_resolution'), width, height);
    gl.uniform1f(uniform('u_pixelRatio'), pixelRatio);
    gl.uniform3fv(uniform('u_ink'), ink);
    gl.uniform3f(
      uniform('u_repel'),
      frame.repel?.x ?? 0,
      frame.repel?.y ?? 0,
      frame.repel?.strength ?? 0,
    );
  }

  /**
   * Draws solid things over what is there, in premultiplied colour, then
   * leaves the blending as the scene keeps it, multiply, for whatever is
   * drawn after.
   */
  function drawSolid(drawCall: () => void): void {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    drawCall();
    gl.blendFunc(gl.DST_COLOR, gl.ZERO);
  }

  return {
    clear: () => {
      gl.disable(gl.BLEND);
      gl.clearColor(page[0], page[1], page[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    },
    drawLinks: (frame, pixelRatio) => {
      bindProgram(linkProgram, linkUniform, frame, pixelRatio);
      gl.uniform1f(linkUniform('u_links'), frame.links);
      gl.bindVertexArray(linkArray);
      gl.drawArraysInstanced(gl.LINES, 0, 2, linkCount);
      bindProgram(dotProgram, dotUniform, frame, pixelRatio);
      gl.uniform1f(dotUniform('u_links'), frame.links);
      gl.uniform1f(dotUniform('u_flow'), frame.flow ?? 0);
      gl.bindVertexArray(dotArray);
      gl.drawArraysInstanced(gl.POINTS, 0, 1, linkCount * DOTS_PER_LINK);
      gl.bindVertexArray(null);
    },
    drawAtoms: (frame, pixelRatio) => {
      bindProgram(atomProgram, atomUniform, frame, pixelRatio);
      gl.uniform1f(atomUniform('u_maxSprite'), maxSprite);
      gl.uniform1f(atomUniform('u_links'), frame.links);
      drawSolid(() => {
        gl.bindVertexArray(atomArray);
        gl.drawArrays(gl.POINTS, 0, pointCount);
        gl.bindVertexArray(null);
      });
    },
    drawMovingAtoms: (frame, pixelRatio) => {
      bindProgram(shutterProgram, shutterUniform, frame, pixelRatio);
      gl.uniform1f(shutterUniform('u_shutter'), frame.speed * SHUTTER_SECONDS);
      gl.uniform1f(shutterUniform('u_links'), frame.links);
      drawSolid(() => {
        gl.bindVertexArray(shutterArray);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, pointCount);
        gl.bindVertexArray(null);
      });
    },
    relayout,
  };
}

/**
 * A texture the size of the canvas to draw the scene into, for a pass over
 * the finished frame. `bind` makes it the target, sized again whenever the
 * canvas changes size.
 */
export function createSceneTarget(gl: WebGL2RenderingContext): {
  bind: (width: number, height: number) => void;
  texture: WebGLTexture;
} {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  let targetWidth = 0;
  let targetHeight = 0;

  return {
    texture,
    bind: (width, height) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      if (width === targetWidth && height === targetHeight) {
        return;
      }
      targetWidth = width;
      targetHeight = height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
      );
    },
  };
}

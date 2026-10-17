/** Small WebGL2 and animation helpers for the onboarding's field. */

/** A number as a GLSL float literal. */
export const float = (value: number): string => value.toFixed(3);

/** A colour from 0 to 255 channels, as a GLSL vec3 of 0 to 1 channels. */
export const rgb = (value: readonly number[]): string =>
  `vec3(${value.map((channel) => float(channel / 255)).join(', ')})`;

/** A value on its way from one number to another. */
export interface Tween {
  from: number;
  to: number;
  startedAt: number;
  durationMs: number;
}

/** Position along a tween, 0 to 1, for a share of its time. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** The slope of `easeInOutCubic`: 0 at both ends, 3 in the middle. */
export function easeInOutCubicSlope(t: number): number {
  return t < 0.5 ? 12 * t ** 2 : 12 * (1 - t) ** 2;
}

/** Hermite smoothing from 0 below `from` to 1 above `to`, as GLSL's. */
export function smoothstep(from: number, to: number, value: number): number {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);

  return t * t * (3 - 2 * t);
}

/**
 * A CSS colour as three 0 to 1 sRGB channels. The browser does the
 * conversion, by painting the colour on a canvas, because a computed colour
 * can come back in any colour space (`lab()`, `oklch()`).
 */
export function readCssColour(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    name,
  );
  const context = document.createElement('canvas').getContext('2d');
  if (context === null || value === '') {
    return [0, 0, 0];
  }
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;

  return [red / 255, green / 255, blue / 255];
}

export function compile(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ] as const) {
    const shader = gl.createShader(type);
    if (shader === null) {
      throw new Error('Could not create a shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
      throw new Error(
        `Shader failed to compile: ${gl.getShaderInfoLog(shader)}`,
      );
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

/**
 * Returns a lookup for a program's uniforms that asks the GPU for each
 * location once. A uniform the shader does not use comes back `null`, which
 * the `gl.uniform*` calls accept and ignore.
 */
export function createUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): (name: string) => WebGLUniformLocation | null {
  const locations = new Map<string, WebGLUniformLocation | null>();

  return (name) => {
    let location = locations.get(name);
    if (location === undefined) {
      location = gl.getUniformLocation(program, name);
      locations.set(name, location);
    }

    return location;
  };
}

/**
 * Points one attribute at part of each vertex in the bound buffer. `size`,
 * `stride` and `offset` are counted in floats. With `perInstance`, it moves
 * on once per instance rather than once per vertex, or once every `divisor`
 * instances when that is given. An attribute the program does not use is
 * left alone.
 */
export function attribute(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  {
    size,
    stride,
    offset,
    perInstance = false,
    divisor = perInstance ? 1 : 0,
  }: {
    size: number;
    stride: number;
    offset: number;
    perInstance?: boolean;
    divisor?: number;
  },
): void {
  const location = gl.getAttribLocation(program, name);
  if (location < 0) {
    return;
  }
  const bytes = Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(
    location,
    size,
    gl.FLOAT,
    false,
    stride * bytes,
    offset * bytes,
  );
  gl.vertexAttribDivisor(location, divisor);
}

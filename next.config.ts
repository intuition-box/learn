import type { NextConfig } from 'next';

const config: NextConfig = {
  // A folder of static files in `out/`, deployable to any host. No page here
  // needs a server: the playground derives ids in the browser and reads the
  // chain from the public RPC.
  output: 'export',
  // The brand page's PNGs are rasterized by resvg (`/brand/files/[file]`), a
  // native `.node` addon the bundler cannot inline, and not on Next's own
  // list of packages it leaves to Node's `require`.
  serverExternalPackages: ['@resvg/resvg-js'],
  // Next 16 writes an AGENTS.md and a CLAUDE.md into the project on `dev` and
  // `build` unless this is off.
  agentRules: false,
};

export default config;

# The site as a container: built with the project's own toolchain, then
# served as static files by nginx. Coolify builds it with the "Dockerfile"
# build pack and routes to port 80.

# Build: Node 26, as .nvmrc pins, and pnpm 11 as a standalone binary, the
# version package.json names. Never corepack: the corepack Nixpacks ships
# cannot run pnpm 11.
FROM node:26-slim AS build
ENV PNPM_HOME=/pnpm
# pnpm 11 puts its binary in a bin/ folder of its home.
ENV PATH=$PNPM_HOME/bin:$PATH
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL https://get.pnpm.io/install.sh \
  | env PNPM_VERSION=11.21.0 ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
WORKDIR /app
# The dependencies first, so a change to the code alone reuses this layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Serve: the static export in out/, and nothing else.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80

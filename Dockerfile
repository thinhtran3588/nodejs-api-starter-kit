FROM oven/bun:1.3.10-alpine AS builder

WORKDIR /app

# Copy package manifest (and bun lockfile if present)
COPY package.json bun.lockb* ./

# Install all dependencies for compiling the executable
RUN bun install

# Copy source code
COPY . .

# Compile a single Linux executable
RUN bun build src/index.ts --compile --minify --outfile /app/server

FROM alpine:3.20

WORKDIR /app

# Install runtime libraries required by the compiled executable
RUN apk add --no-cache libstdc++ libgcc

# Create and use a non-root user for runtime security
RUN addgroup -S app && adduser -S -G app app

# Copy compiled executable only (no node_modules needed)
COPY --from=builder --chown=app:app /app/server ./server

USER app

# Expose the port the app runs on
EXPOSE 3000

# Run the compiled executable
CMD ["./server"]


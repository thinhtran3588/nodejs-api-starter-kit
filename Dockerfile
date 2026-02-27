FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package manifest (and bun lockfile if present)
COPY package.json bun.lockb* ./

# Install all dependencies (dev + prod) for build
RUN bun install

# Copy the rest of the source code
COPY . .

# Build the application (outputs to ./dist)
RUN bun run build

FROM oven/bun:1-alpine

WORKDIR /app

# Copy package manifest (and bun lockfile if present)
COPY package.json bun.lockb* ./

# Install only production dependencies
RUN bun install --production --no-save

# Copy compiled application from builder image
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 8080

# Run the compiled executable
CMD ["./dist/index"]


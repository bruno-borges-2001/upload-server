# Use Node.js 20.18 as the base image
FROM node:20.18 AS base

# Install pnpm globally
RUN npm i -g pnpm

# Create a new stage for dependencies
FROM base AS dependencies

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Create a new stage for building the application
FROM base AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy all files from the current directory to the working directory
COPY . .

# Copy node_modules from the dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Build the application
RUN pnpm build

# Prune development dependencies
RUN pnpm prune --prod

# Create a new stage for deployment using a smaller Node.js image
FROM gcr.io/distroless/nodejs20-debian12 AS deploy

# Set the user to a non-root user with UID 1000
USER 1000

# Set the working directory
WORKDIR /usr/src/app

# Copy the built application from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Copy node_modules from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy package.json from the build stage
COPY --from=build /usr/src/app/package.json ./package.json

# Expose port 3333
EXPOSE 3333

# Start the application
CMD ["dist/infra/http/server.js"]
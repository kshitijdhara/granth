FROM node:24-slim

# Set environment variable
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Set the working directory
WORKDIR /app
# Enable corepack and prepare yarn 4.4.1
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy the rest of the application code
COPY . .

# Expose necessary ports
EXPOSE 3000

# Install openssl and build the application in one RUN to reduce layers
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    yarn install && \
    yarn run build && \
    rm -rf /var/lib/apt/lists/*

# Use ENTRYPOINT to start the application
ENTRYPOINT ["yarn", "run", "dev"]
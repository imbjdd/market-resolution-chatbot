# Dockerfile pour l'extension Chrome
FROM node:22-alpine

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm@10.11.0

# Copier les fichiers de configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY pages/ ./pages/
COPY chrome-extension/ ./chrome-extension/
COPY tests/ ./tests/

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le reste du code
COPY . .

# Build de l'extension
RUN pnpm build

# Créer le zip de l'extension
RUN pnpm zip

# Exposer le volume pour récupérer le build
VOLUME ["/app/dist"]

# Commande par défaut
CMD ["pnpm", "dev"]
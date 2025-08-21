# Docker Setup Guide

## Vue d'ensemble

Ce projet est entièrement dockerisé avec Docker Compose pour faciliter le déploiement et le développement.

### Architecture

- **honc-api**: API Hono (port 8787)
- **landingpage**: Application Next.js (port 3000)
- **chrome-extension**: Extension Chrome (build uniquement)

## Installation rapide

1. **Cloner et configurer**:
```bash
git clone <votre-repo>
cd market-resolution-chatbot
cp .env.example .env
```

2. **Éditer les variables d'environnement**:
```bash
nano .env  # Éditer avec vos valeurs
```

3. **Lancer en production**:
```bash
docker-compose build
docker-compose up -d
```

## Commandes disponibles

### Production
```bash
docker-compose build         # Construire les images
docker-compose up -d         # Démarrer tous les services
docker-compose down          # Arrêter tous les services
docker-compose logs -f       # Voir les logs
docker-compose restart       # Redémarrer les services
```

### Développement
```bash
docker-compose -f docker-compose.dev.yml build    # Construire pour le dev
docker-compose -f docker-compose.dev.yml up -d    # Démarrer en mode dev
docker-compose -f docker-compose.dev.yml down     # Arrêter le dev
docker-compose -f docker-compose.dev.yml logs -f  # Logs en mode dev
```

### Extension Chrome
```bash
docker-compose --profile build up chrome-extension  # Builder l'extension
```

### Utilitaires
```bash
docker-compose ps                    # Voir l'état des conteneurs
docker-compose exec honc-api sh      # Se connecter au conteneur API
docker-compose exec landingpage sh   # Se connecter au conteneur Next.js
```

## Ports exposés

- **3000**: Landing page (Next.js)
- **8787**: API Hono

## Variables d'environnement

Copiez `.env.example` vers `.env` et configurez:

```env
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here


# Blockchain
ETHEREUM_RPC_URL=your_ethereum_rpc_url_here
PRIVATE_KEY=your_private_key_here
```

## Développement

En mode développement, les volumes sont montés pour le hot-reload:

```bash
make dev-up
```

Les changements de code sont automatiquement reflétés.

## Production

En production, les images sont optimisées:

```bash
make build
make up
```

## Debugging

### Voir les logs
```bash
make logs                    # Tous les services
docker logs chatbot         # Service spécifique
```

### Se connecter aux conteneurs
```bash
make exec-chatbot           # Shell dans le chatbot
make exec-api               # Shell dans l'API
make exec-db                # PostgreSQL CLI
```

### Vérifier l'état
```bash
make ps                     # État des conteneurs
docker-compose ps           # Alternative
```

## Troubleshooting

### Problème de build
```bash
docker-compose down -v      # Nettoyer volumes
docker system prune -f      # Nettoyer système
docker-compose build        # Reconstruire
```


### Problème de réseau
```bash
docker network ls           # Voir les réseaux
docker network prune        # Nettoyer les réseaux
```
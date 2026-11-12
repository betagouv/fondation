# Monter de version Postgres en local

Postgres suit la version majeure de la production (17). Chaque version majeure a son propre volume Docker
(`fondation_postgres-17`). Après un changement de version, la base repart vide et il faut réappliquer les
migrations de la base locale et de la base de test (étape 3 du [README](../README.md)).

Pour garder ses données, les sauvegarder avant de changer d'image puis les restaurer.

```bash
docker exec postgres-test pg_dumpall -U fondation > ~/fondation.sql      # avant
docker exec -i postgres-test psql -U fondation -d postgres < ~/fondation.sql   # après
```

Sans sauvegarde, il suffit de recharger les [données fictives](./donnees-fictives.md).

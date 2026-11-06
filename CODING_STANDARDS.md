# Points de revue

Ce que les outils ne vérifient pas et que les revues ont relevé plusieurs fois. Une revue répond à chaque question pour le diff qu'elle lit, en citant le fichier et la ligne. Les conventions générales vivent dans [CLAUDE.md](CLAUDE.md), [apps/api/CLAUDE.md](apps/api/CLAUDE.md) et [apps/client/CLAUDE.md](apps/client/CLAUDE.md).

## La mutation refuse-t-elle ce que la query interdit ?

Chaque capacité servie au client (`canX`, `xRequired`, un statut) est revérifiée par la mutation correspondante, avec la même règle du domaine : un client qui masque un bouton n'empêche pas l'appel. Voir [l'ADR](docs/adr/2026-10-19-regles-metier-servies-comme-capacites.md).

Défaut type : un menu affiché sur un dossier verrouillé, dont l'action finit en 409, ou une écriture acceptée alors que la lecture affiche « Sans objet ».

## Cette règle de gestion existe-t-elle déjà ailleurs ?

Une règle (un tri, une garde, une condition d'affichage) n'est écrite qu'une fois, côté domaine. Chercher son vocabulaire dans le code avant d'en accepter une nouvelle : deux implémentations finissent par diverger.

Défaut type : l'ordre protocolaire trié en SQL et en TypeScript, avec des résultats différents sur les accents.

## Chaque nouvelle lecture en base passe-t-elle dans un e2e ?

Un finder ou une query ajoutée est exercée par au moins un scénario de [apps/api-e2e](apps/api-e2e) : les tests unitaires du domaine reçoivent des données déjà préparées et ne voient pas une jointure fausse.

## Les textes disent-ils ce que fait le code ?

Commentaires, messages de commit, libellés et toasts décrivent un comportement qui existe dans le diff, pas un comportement prévu ou supposé.

Défaut type : une modale qui promet une « lecture seule » que l'API n'applique pas.

## Une donnée personnelle part-elle vers Sentry ?

Adresse électronique, adresse IP, nom : rien de tout cela dans les messages, les tags ou le contexte envoyés à Sentry. On y met des identifiants techniques.

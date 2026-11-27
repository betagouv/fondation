---
title: L'API journalise un événement par requête, sur stdout et dans Sentry Logs
author:
  - github.com/kornifex
date: 2026-10-28
---

## En une phrase

Chaque requête HTTP et chaque commande CLI de l'API émettent un seul événement riche (« wide event »),
écrit en JSON sur stdout, gardé un an dans les archives de Scalingo, et envoyé à Sentry Logs, où il
s'interroge pendant 90 jours.

## Contexte

L'API n'avait pas de système de logs, seulement les issues Sentry :

- le `Logger` de Nest écrivait du texte brut (71 loggers, environ 155 appels), sans identifiant de
  requête ni log d'accès : impossible de relier les lignes d'une même requête ;
- Sentry ne voyait presque rien : une seule issue API en 90 jours. Le filtre d'exception ne lui avait en
  fait jamais transmis une 500 (FON-714) ;
- on ne pouvait répondre ni à « que s'est-il passé pour cette requête ? » sans exception (403 inattendu,
  PDF vide, lenteur), ni à « le secrétariat n'a pas pu valider le dossier X ce matin ».

La traçabilité d'audit reste en base (`UserStatusChange`, `AdminRightChange`, tables `*Version`) :
durable et exhaustive, elle n'a rien à faire dans des logs jetables. Le client garde Sentry seul.

## Contraintes

- Hébergement en France, chez un hébergeur déjà autorisé pour Fondation ou sur l'outillage de
  l'incubateur : les SaaS étrangers (Datadog, Honeycomb, Axiom, Grafana Cloud) sont exclus.
- Accès réservé aux développeurs, avec des comptes nominatifs.
- Rétention dans la fourchette recommandée par la CNIL (délibération n° 2021-122 : six mois à un an),
  avec une purge automatique.

## Mesures

| Critère                              | A. Sentry Logs                        | B. OpenSearch (addon Scalingo)          | C. Table PostgreSQL         | D. Scaleway Cockpit                                          | E. OVHcloud Logs Data Platform                        |
| ------------------------------------ | ------------------------------------- | --------------------------------------- | --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Hébergement                          | Instance de l'incubateur, en France   | Scalingo, osc-fr1 ou osc-secnum-fr1     | Base de production          | Paris (`fr-par`)                                             | Gravelines                                            |
| Coût mensuel                         | 0 €                                   | 14,40 € HT, plus Logstash et Dashboards | 0 €, mais du volume en base | 0,35 € le Go reçu, 0,002 € le Go par jour au-delà de 7 jours | 1 Gio stocké offert, puis 0,99 € HT le Gio            |
| Exploitation                         | Aucune                                | Addon, application Logstash, Dashboards | Partitions et cron de purge | Un relais (Fluent Bit, Promtail) : aucun drain Scalingo      | Un log drain Scalingo (`ovh-graylog`)                 |
| Requêtes (utilisateur, route, durée) | Filtre et regroupement par attribut   | Oui                                     | SQL                         | Grafana                                                      | Graylog ou OpenSearch Dashboards                      |
| Rétention                            | 90 jours, fixée pour toute l'instance | Politique ISM au choix                  | Au choix                    | De 1 jour à 5 ans                                            | 14 jours, 1 mois, 3 mois ou 1 an, fixée à la création |
| Accès nominatif                      | Oui                                   | **Non : un seul utilisateur partagé**   | Comptes de la base partagés | Oui, comptes IAM Scaleway                                    | Oui, comptes IAM OVHcloud                             |
| Dépendance ajoutée                   | Aucune (`@sentry/node` déjà là)       | Aucune côté API                         | Aucune                      | Aucune côté API                                              | Aucune côté API                                       |
| Impact sur le temps de réponse       | 11 µs par événement, envoi différé    | —                                       | Une écriture par requête    | Aucun : le relais lit les logs                               | Aucun : le drain lit stdout                           |

Vérifié le 28 octobre 2026 : l'instance de l'incubateur (version 25.9.0) accepte les logs envoyés par
`Sentry.logger`, les filtre sur un attribut, les regroupe par `http.route` et calcule un p95 sur un
attribut numérique (`p95(tags[x,number])`). Vérifié le 25 novembre 2026 dans la documentation et les
grilles tarifaires des deux hébergeurs : Cockpit ne reçoit que du Loki ou de l'OTLP, absents des
drains Scalingo ; Logs Data Platform figure parmi eux.

Temps de réponse de la liste des dossiers d'une session (`/api/sessions/v2/:sessionId/files`), avec et
sans l'événement, `npx autocannon`, 20 connexions pendant 30 s, deux passages chacun :

| Mesure                        | Sans l'événement                       | Avec l'événement            |
| ----------------------------- | -------------------------------------- | --------------------------- |
| Local, moyenne                | 4,57 ms et 4,65 ms                     | 5,32 ms et 5,29 ms          |
| Local, p50 / p97,5            | 4 ms / 9 ms                            | 5 ms / 10 ms                |
| Local, requêtes par seconde   | 3 817 et 3 767                         | 3 536 et 3 561              |
| Staging, p50 / p97,5          | 643 ms / 1 005 ms et 611 ms / 1 701 ms | _non mesuré, voir plus bas_ |
| Staging, requêtes par seconde | 31,6 et 31,4                           | _non mesuré, voir plus bas_ |

En local, sans session, chaque requête s'arrête sur une 401 après le middleware, la garde et le filtre
d'exception : le cas où l'événement pèse le plus, en proportion. L'API y tourne à saturation, et
l'écart de débit donne le coût de l'événement : environ 20 µs de calcul par requête. Les 0,7 ms de
plus en moyenne viennent de la file d'attente des 20 connexions ; à une vingtaine d'utilisateurs, loin
de la saturation, il reste ces 20 µs.

La copie dans Sentry Logs coûte environ 11 µs de plus par événement (`Sentry.logger`, 100 000 appels
avec un transport qui ne fait rien, trois passages entre 10,6 et 12,1 µs) : le SDK met les logs en
tampon et les envoie par paquets de 100 ou toutes les 5 secondes, hors de la requête. L'API vide ce
tampon à son arrêt : sans cela, un redémarrage perdrait les 5 dernières secondes.

Sur staging, avec une session, la même liste (100 dossiers, 180 Ko) plafonne à une trentaine de
requêtes par seconde : chacune occupe l'API une trentaine de millisecondes, et les 20 µs de l'événement s'y
perdent. L'écart entre les deux p97,5 « sans », près de 700 ms, montre le bruit d'une machine partagée :
il dépasse des dizaines de milliers de fois le coût de l'événement, qu'une mesure « avec » sur staging
ne ferait pas ressortir. Elle n'est donc pas faite ; après le déploiement, staging sert à vérifier que la
ligne s'écrit avec, en `request.id`, le `request_id` de la ligne du routeur.

## Options écartées

- **B. Log drain Scalingo vers OpenSearch** : l'addon n'a qu'un utilisateur, non renommable, sans
  possibilité d'en créer d'autres, ce qui contredit l'accès nominatif. Il faudrait en plus déployer et
  maintenir un Logstash (un drain ne peut pas écrire directement dans l'addon) et OpenSearch Dashboards.
- **D. Scaleway Cockpit** : il ne reçoit que du Loki ou de l'OTLP, qu'aucun drain Scalingo n'envoie. Il
  faudrait faire tourner un relais (Fluent Bit, Promtail), comme le Logstash de B.
- **Loki / Grafana ou ClickHouse auto-hébergés** : recommandés par loggingsucks.com, mais il faudrait
  exploiter un service de plus pour une vingtaine d'utilisateurs simultanés.
- **Un intercepteur Nest** : les gardes s'exécutent avant les intercepteurs, il ne verrait donc ni les
  401 ni les 403, ni les 404 de route.
- **pino ou winston** : le `ConsoleLogger` de Nest écrit déjà du JSON (`json: true`) pour les lignes de
  `this.logger` (FON-868). L'événement, une ligne au format fixé, s'écrit directement sur stdout.

## Décision

- **Sentry Logs (A) sert à interroger les événements.** Si l'instance de l'incubateur venait à manquer,
  le repli est OVHcloud Logs Data Platform (E), branché par un log drain Scalingo, avec des comptes
  nominatifs et une rétention d'un an au plus, fixée à la création du flux. La table PostgreSQL (C) ne reste qu'en dernier recours : les logs
  entreraient dans la base de production et dans ses sauvegardes, et chaque requête paierait une
  écriture.
- **Un événement par requête et par commande CLI**, ouvert dans le `setup` du middleware de
  `nestjs-cls` et émis à `res.on('close')`, qui se déclenche aussi quand le client coupe la connexion
  avant la réponse (`fondation.request.interrupted`, sans statut puisqu'aucune réponse n'est partie),
  contrairement à `finish`. Le middleware est monté avant le body parser de Nest, pour qu'un corps
  illisible ou trop gros soit décrit aussi, et après CORS : `/_health` et les preflights n'en émettent pas.
  Une commande CLI ouvre le sien dans `cli.ts`, autour de `CommandFactory.runApplication`, par
  `WideEvent.runCommand` (FON-867) : `job.name` avec la sous-commande (`user register`), jamais ses
  arguments, `job.duration`, `process.exit.code`, et `fondation.ingestion_job.id` pour l'ingestion.
- **Les appels sortants sont comptés par service** (FON-869) : pour Gotenberg et le stockage S3,
  `fondation.<gotenberg|storage>.call.count`, `.call.duration` (somme, en secondes) et
  `.call.failure.count`, par `WideEvent.timeCall`, sans URL ni nom de fichier. Un appel compte dès son
  départ : une requête coupée pendant qu'elle l'attend, souvent la plus lente, garde le temps attendu
  jusqu'à la coupure, sans échec puisque l'issue de l'appel n'est pas encore connue. Un échec est un
  service qui n'a pas fait son travail : toute erreur de Gotenberg, puisqu'aucun PDF n'est produit,
  mais pour le stockage ni un fichier qu'il n'a plus (signalé à part à Sentry), ni une plage au-delà
  de la fin du fichier (demandée par le navigateur) : `isStorageFailure`. Le stockage est
  chronométré par un middleware de chaque client S3, à l'étape qui envoie la requête : chaque
  tentative compte, une URL signée, construite sans appel, ne compte pas. La lecture d'un fichier par
  son URL signée l'est jusqu'aux en-têtes de la réponse, le corps passant ensuite au navigateur ; elle
  compte pour un appel avec les nouvelles tentatives de `HttpService`, pauses comprises. Tchap,
  l'API Scalingo et le fournisseur OpenID ne sont pas suivis, bien que des requêtes les attendent
  (`POST /api/ingest/v1/lolfi`, `POST /api/tchap/alerts`, le retour de connexion) : un PDF ou un
  fichier lent est le cas à diagnostiquer, et leurs échecs se voient déjà, dans Sentry pour Tchap,
  dans l'erreur de la requête pour Scalingo et OpenID.
- **Des identifiants seulement** : utilisateur, rôle, usurpateur, statut, route, durée, `error.type`,
  `error.cause.type` (la règle du domaine qu'enveloppe une erreur, `ReporterRecused` dans un 400),
  et les identifiants de la route (`:sessionId` devient `fondation.session.id`, `:nominationFileId`
  `fondation.nomination_file.id`), lus dans `req.params` à l'émission sans rien ajouter dans chaque
  module. Seule l'API publique ajoute ce que la route ne dit pas, par `WideEvent.set` : le client
  (`api_client.id`, depuis `ApiClientsService`, `/auth` compris, qui n'a pas de garde) et, pour les
  routes magistrat, l'identifiant trouvé et la réponse (`fondation.magistrat.status`), jamais l'adresse
  demandée (FON-855). `error.message` ne figure que pour une `HttpException` qui a trouvé sa route : nos messages,
  jamais ceux de Prisma ou de pg, ni la 404 du routeur, qui cite l'URL. Jamais de corps de requête ni
  de query string.
- **Les noms suivent OpenTelemetry** (`http.route`, `http.response.status_code`, `user.id`) ; le métier
  est rangé sous `fondation.*`, parce que `session.id` y désigne une session de navigation. Exception :
  `api_client.id`, le nom du tag que portent déjà les issues Sentry des clients de l'API publique.
- **L'identifiant de requête** est l'en-tête `X-Request-ID` posé par le routeur Scalingo s'il a la forme
  d'un UUID (le routeur garde celui qu'envoie un client), sinon un UUID tiré par l'API ; `trace.id`
  relie l'événement à sa trace Sentry, y compris quand la trace n'est pas échantillonnée : les erreurs
  de la requête portent le même identifiant. L'événement ne porte pas le chemin : la ligne du
  routeur de même `request_id`, dans les archives, l'a déjà. Une commande tire le sien au lancement,
  sous le même nom `request.id`, pour qu'une seule recherche trouve les lignes de l'une comme de
  l'autre. Sur Scalingo, les lignes de `this.logger` s'écrivent en JSON avec l'identifiant de la
  requête ou de la commande en cours, leur niveau et leur heure écrits comme ceux de l'événement
  (`info` pour `log`, une date ISO) ; dans le terminal, elles restent du texte, sans identifiant
  (`ApiLogger`, FON-868). Les filtres d'exception n'écrivent plus de ligne `chemin - code`, que
  l'événement remplace : seule une 500 garde la sienne, pour sa pile, que l'événement n'a pas et que
  seul Sentry aurait, éteint en local.
- **Le contrat est une ligne JSON sur stdout** : le stockage se branche derrière et se remplace sans
  toucher au code. Sentry Logs ne reçoit que l'événement, les lignes de `this.logger` restent sur stdout.
- **Tout est gardé** : à notre volume, l'échantillonnage n'a pas d'intérêt.

## Conséquences

- Les archives Scalingo gardent stdout un an, sans purge possible de notre côté ; Sentry purge à
  90 jours, réglage commun à toute l'instance. Le RSSI et le DPO du CSM ont validé ces durées le
  30 octobre 2026 (FON-703).
- Le niveau dépend du statut : `info` sous 400, `warn` de 400 à 499 et pour une requête interrompue,
  `error` à partir de 500. Une commande est en `error` dès que son code de sortie n'est pas 0, que
  l'ingestion pose sans lever d'exception.
- `app.close()` vide le tampon de Sentry à la fin de chaque commande, réussie ou non
  (`SentryService.onApplicationShutdown`). Une erreur de commander lui-même, comme une option
  inconnue, arrête le processus aussitôt : elle n'a ni événement ni erreur dans Sentry. Une commande
  tuée par un signal, comme un conteneur que Scalingo arrête, n'en a pas non plus : la CLI ne pose pas
  de shutdown hooks. L'annulation d'une ingestion passe par `SIGUSR1`, que la commande attend : elle a
  son événement.
- La métrique Sentry `http.server.request.duration` disparaît : les durées se lisent dans les
  événements.
- Si l'incubateur désactive les Logs ou change d'instance, l'API continue d'écrire sur stdout et l'on
  branche un log drain vers Logs Data Platform sans changer le contrat.
- L'instance de l'incubateur tourne en 25.9.0, une version que Sentry conseille de sauter.

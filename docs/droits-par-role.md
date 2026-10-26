# Droits par rôle

Ce document liste ce que chaque rôle peut voir et faire dans Fondation : les vues du client, puis les actions de l'API, puis les accès sans utilisateur. Il décrit les droits voulus. Deux tests le confrontent au code à chaque pull request : une ligne manquante, en trop ou dont les rôles diffèrent de ceux du code les fait échouer. Un changement de droit apparaît donc toujours dans le listing.

## Lecture

**Rôles**

- **Membre** : Membre du siège, Membre du parquet ou Membre commun. Un Membre du siège ou du parquet ne voit que les sessions de sa formation, un Membre commun voit les deux.
- **Secrétariat général**.
- **Administrateur** : personne du Secrétariat général qui détient en plus le droit d'administrateur. Elle passe toutes les gardes de rôle, côté API comme côté client, et peut se connecter à la place d'un autre utilisateur. Le domaine lui refuse ce qu'il refuse au Secrétariat général.

**Cases**

- `✓` : autorisé.
- `—` : refusé.
- `✓ si …` : autorisé sous condition. Les conditions viennent de cette liste :
  - _sa formation_ : la session appartient à la formation du membre ;
  - _affectation publiée_ : le membre ne voit que la dernière affectation publiée ;
  - _rapporteur du dossier_ : le membre est rapporteur du dossier dans l'affectation publiée ;
  - _session non archivée_ : la session n'est pas archivée ;
  - _auteur de la synthèse_ : l'utilisateur a rédigé la synthèse le premier ;
  - _lecteur de la synthèse_ : l'utilisateur est l'auteur ou un lecteur de la synthèse ;
  - _ses propres données_ : l'utilisateur de l'URL est celui qui est connecté.

Les tests vérifient les rôles : une case `✓ si …` compte comme `✓`. Les conditions relèvent des tests du domaine. La colonne Administrateur n'est pas vérifiée.

## Vues

Après la connexion, un Membre arrive sur `/transparences`, le Secrétariat général sur `/secretariat-general`. Le Secrétariat général n'ouvre pas les URL de l'espace membre, et un Membre n'ouvre pas celles du Secrétariat général. Les URL qui ne font que rediriger vers une autre ne sont pas des vues et ne figurent pas ici.

### Pages publiques

| URL              | Vue                         | Membre | Secrétariat général | Administrateur |
| ---------------- | --------------------------- | ------ | ------------------- | -------------- |
| `/`              | Connexion                   | ✓      | ✓                   | ✓              |
| `/login`         | Connexion                   | ✓      | ✓                   | ✓              |
| `/accessibilite` | Déclaration d'accessibilité | ✓      | ✓                   | ✓              |

### Pages communes

| URL                                                   | Vue                                          | Membre                      | Secrétariat général         | Administrateur              |
| ----------------------------------------------------- | -------------------------------------------- | --------------------------- | --------------------------- | --------------------------- |
| `/avis`                                               | Questionnaire de satisfaction                | ✓                           | ✓                           | ✓                           |
| `/aide`                                               | Aide                                         | ✓                           | ✓                           | ✓                           |
| `/aide/manuel`                                        | Manuel utilisateur                           | ✓                           | ✓                           | ✓                           |
| `/mon-compte`                                         | Son compte et son mot de passe               | ✓                           | ✓                           | ✓                           |
| `/session/:sessionId/dossier/:fileId/synthese`        | Synthèse d'un dossier                        | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse |
| `/session/:sessionId/dossier/:fileId/lolfi-magistrat` | Redirection vers la fiche Lolfi du magistrat | ✓ si sa formation           | ✓                           | ✓                           |

L'administrateur voit le questionnaire de satisfaction en aperçu : sa réponse n'est pas enregistrée, sauf en environnement de test.

### Espace membre

Le menu propose Accueil, Archives et Magistrats.

| URL                                                                                                                                    | Vue                                    | Membre                                 | Secrétariat général | Administrateur |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- | ------------------- | -------------- |
| `/transparences`                                                                                                                       | Mes sessions en cours                  | ✓ si sa formation, affectation publiée | —                   | ✓              |
| `/transparences/archives/sessions`                                                                                                     | Sessions archivées                     | ✓ si sa formation, affectation publiée | —                   | ✓              |
| `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId`                                                        | Session : dossiers et mes rapports     | ✓ si sa formation                      | —                   | ✓              |
| `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/auditions`                                              | Session, onglet Auditions              | ✓ si sa formation                      | —                   | ✓              |
| `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/pieces-jointes`                                         | Session, onglet Pièces jointes         | ✓ si sa formation                      | —                   | ✓              |
| `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/rapports/:id`                                                               | Rapport sur un dossier                 | ✓ si rapporteur du dossier             | —                   | ✓              |
| `/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/:sessionId/dossiers/:nominationFileId/observations/:observationId` | Détail d'une observation               | ✓ si sa formation                      | —                   | ✓              |
| `/magistrats`                                                                                                                          | Recherche de magistrats                | ✓                                      | —                   | ✓              |
| `/magistrats/:magistratId`                                                                                                             | Fiche d'un magistrat et son historique | ✓                                      | —                   | ✓              |

Un Membre ne voit les auditions d'une session qu'une fois publiées.

### Espace Secrétariat général

Le menu propose Accueil, Créer une session, Gérer les sessions, Restitutions, Gérer les membres, Archives et Magistrats. L'Administrateur y voit en plus un sous-menu Administration.

| URL                                                                                              | Vue                                                             | Membre | Secrétariat général | Administrateur |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------ | ------------------- | -------------- |
| `/secretariat-general`                                                                           | Tableau de bord                                                 | —      | ✓                   | ✓              |
| `/secretariat-general/nouvelle-transparence`                                                     | Créer une session à partir d'un fichier Lodam                   | —      | ✓                   | ✓              |
| `/secretariat-general/sessions`                                                                  | Gérer les sessions                                              | —      | ✓                   | ✓              |
| `/secretariat-general/archives/sessions`                                                         | Sessions archivées                                              | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId`                                                        | Session, onglet Propositions : dossiers, affectation, décisions | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/auditions`                                              | Session, onglet Auditions                                       | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/evaluations-manquantes`                                 | Session, onglet Évaluations manquantes                          | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/documents`                                              | Session, onglet Documents : ordres du jour, procès-verbaux      | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/pieces-jointes`                                         | Session, onglet Pièces jointes                                  | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/commentaire`                                            | Commentaire de session                                          | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/dossiers/:nominationFileId/observations/:observationId` | Détail d'une observation                                        | —      | ✓                   | ✓              |
| `/secretariat-general/magistrats`                                                                | Recherche de magistrats                                         | —      | ✓                   | ✓              |
| `/secretariat-general/magistrats/:magistratId`                                                   | Fiche d'un magistrat, avec ses numéros de téléphone             | —      | ✓                   | ✓              |
| `/secretariat-general/membres`                                                                   | Liste des membres                                               | —      | ✓                   | ✓              |
| `/secretariat-general/membres/:userId`                                                           | Fiche d'un membre : titre, juridictions exclues                 | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/ordre-du-jour`                                     | Nouvel ordre du jour                                            | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/metadonnees`               | Ordre du jour : métadonnées                                     | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/dossiers`                  | Ordre du jour : dossiers                                        | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation`                | Ordre du jour : aperçu et validation                            | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/ordre-du-jour/:agendaId/validation/edition`        | Ordre du jour : retouche du document                            | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/pv`                                                | Nouveau procès-verbal                                           | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/pv/:officialReportId`                              | Procès-verbal : saisie                                          | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation`                   | Procès-verbal : aperçu et validation                            | —      | ✓                   | ✓              |
| `/secretariat-general/session/:sessionId/docs/pv/:officialReportId/validation/edition`           | Procès-verbal : retouche du document                            | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/ordres-du-jour`                                               | Restitutions, onglet Ordres du jour                             | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/a-restituer`                                                  | Restitutions, onglet À restituer                                | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/restituees`                                                   | Restitutions, onglet Restituées                                 | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/nouvelle-notice`                                              | Nouvelle notice de restitution                                  | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/:planId`                                                      | Notice de restitution : saisie                                  | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/:planId/validation`                                           | Notice : aperçu et validation                                   | —      | ✓                   | ✓              |
| `/secretariat-general/restitutions/:planId/validation/edition`                                   | Notice : retouche du document                                   | —      | ✓                   | ✓              |

### Espace administration

| URL                    | Vue                                                                                                                     | Membre | Secrétariat général | Administrateur |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | -------------- |
| `/admin/lolfi`         | Import d'une archive Lolfi                                                                                              | —      | —                   | ✓              |
| `/admin/jobs`          | Liste des traitements en arrière-plan                                                                                   | —      | —                   | ✓              |
| `/admin/jobs/:jobId`   | Détail d'un traitement                                                                                                  | —      | —                   | ✓              |
| `/admin/avis`          | Export des réponses au questionnaire                                                                                    | —      | —                   | ✓              |
| `/admin/users`         | Liste des utilisateurs                                                                                                  | —      | —                   | ✓              |
| `/admin/users/:userId` | Fiche d'un utilisateur : e-mail, mot de passe, rôle, titre, droit d'administrateur, désactivation, connexion à sa place | —      | —                   | ✓              |

## Actions de l'API

Le préfixe `/api` est omis.

### Connexion et compte

| Action                                         | Endpoint                                     | Membre                   | Secrétariat général      | Administrateur           |
| ---------------------------------------------- | -------------------------------------------- | ------------------------ | ------------------------ | ------------------------ |
| Savoir qui est connecté                        | `GET /auth/v2/introspect`                    | ✓                        | ✓                        | ✓                        |
| Se déconnecter                                 | `POST /auth/v2/logout`                       | ✓                        | ✓                        | ✓                        |
| Changer son mot de passe                       | `PUT /auth/v2/password`                      | ✓                        | ✓                        | ✓                        |
| Se connecter à la place d'un utilisateur       | `POST /auth/v2/users/:userId/impersonations` | —                        | —                        | ✓                        |
| Répondre au questionnaire de satisfaction      | `POST /feedbacks/v1/answer`                  | ✓                        | ✓                        | —                        |
| Voir sa dernière réponse au questionnaire      | `GET /feedbacks/v1/mine`                     | ✓ si ses propres données | ✓ si ses propres données | ✓ si ses propres données |
| Exporter les réponses au questionnaire (Excel) | `GET /feedbacks/v1/answers.xlsx`             | —                        | —                        | ✓                        |
| Télécharger un fichier par son lien temporaire | `GET /files/v1/:fileUrlId`                   | ✓                        | ✓                        | ✓                        |

Le lien de téléchargement temporaire fonctionne comme un jeton : quiconque le détient télécharge le fichier. Une réponse donnée à la place d'un utilisateur n'est pas enregistrée. Un mot de passe ne se change jamais à la place d'un utilisateur.

### Sessions

| Action                                        | Endpoint                                                         | Membre                                                                            | Secrétariat général      | Administrateur           |
| --------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------ | ------------------------ |
| Lister mes sessions en cours                  | `GET /members/v1/:userId/sessions/transparence/garde-des-sceaux` | ✓ si ses propres données, sa formation, affectation publiée, session non archivée | ✓ si ses propres données | ✓ si ses propres données |
| Lister les sessions archivées                 | `GET /archived-sessions/v1`                                      | ✓ si sa formation, affectation publiée                                            | ✓                        | ✓                        |
| Lister les sessions (gestion)                 | `GET /sessions/v2/garde-des-sceaux`                              | —                                                                                 | ✓                        | ✓                        |
| Compter les nouvelles sessions                | `GET /sessions/v2/new/count`                                     | —                                                                                 | ✓                        | ✓                        |
| Voir le détail d'une session                  | `GET /sessions/v2/:sessionId`                                    | ✓ si sa formation                                                                 | ✓                        | ✓                        |
| Créer une session à partir d'un fichier Lodam | `POST /sessions/v2/lodam`                                        | —                                                                                 | ✓                        | ✓                        |
| Modifier les observateurs d'une session       | `POST /sessions/v2/lodam/:sessionId/observers`                   | —                                                                                 | ✓                        | ✓                        |
| Modifier une session                          | `PUT /sessions/v2/:sessionId`                                    | —                                                                                 | ✓                        | ✓                        |
| Valider une session                           | `POST /sessions/v2/:sessionId/validation`                        | —                                                                                 | ✓                        | ✓                        |
| Archiver une session                          | `POST /sessions/v2/:sessionId/archive`                           | —                                                                                 | ✓                        | ✓                        |
| Supprimer une session                         | `DELETE /sessions/v2/:sessionId`                                 | —                                                                                 | ✓                        | ✓                        |
| Lire le commentaire de session                | `GET /sessions/v2/:sessionId/comment`                            | —                                                                                 | ✓                        | ✓                        |
| Écrire le commentaire de session              | `PUT /sessions/v2/:sessionId/comment`                            | —                                                                                 | ✓                        | ✓                        |
| Lister les pièces jointes de la session       | `GET /sessions/v2/:sessionId/attachments`                        | ✓ si sa formation                                                                 | ✓                        | ✓                        |
| Télécharger une pièce jointe de la session    | `GET /sessions/v2/:sessionId/attachments/:fileId`                | ✓ si sa formation                                                                 | ✓                        | ✓                        |
| Ajouter des pièces jointes à la session       | `PUT /sessions/v2/:sessionId/multiattachments`                   | —                                                                                 | ✓                        | ✓                        |
| Retirer une pièce jointe de la session        | `DELETE /sessions/v2/:sessionId/attachments/:fileId`             | —                                                                                 | ✓                        | ✓                        |
| Lister les pièces jointes des observations    | `GET /sessions/v2/:sessionId/observations/attachments`           | —                                                                                 | ✓                        | ✓                        |

Le Secrétariat général n'a pas de sessions en cours à lui : la liste lui revient vide.

### Dossiers

| Action                                      | Endpoint                                                                                                 | Membre                                                       | Secrétariat général | Administrateur |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------- | -------------- |
| Lister les dossiers d'une session           | `GET /sessions/v2/:sessionId/files`                                                                      | ✓ si sa formation, affectation publiée                       | ✓                   | ✓              |
| Voir un dossier                             | `GET /sessions/v2/:sessionId/files/:nominationFileId`                                                    | ✓ si sa formation, affectation publiée                       | ✓                   | ✓              |
| Exporter les dossiers (Excel)               | `GET /sessions/v2/:sessionId/files.xlsx`                                                                 | —                                                            | ✓                   | ✓              |
| Compter les dossiers par statut             | `GET /sessions/v2/:sessionId/files/status-counts`                                                        | —                                                            | ✓                   | ✓              |
| Lister les pièces jointes d'un dossier      | `GET /sessions/v2/:sessionId/files/:nominationFileId/attachments`                                        | ✓ si sa formation                                            | ✓                   | ✓              |
| Télécharger une pièce jointe d'un dossier   | `GET /sessions/v2/:sessionId/files/:nominationFileId/attachments/:fileId`                                | ✓ si sa formation                                            | ✓                   | ✓              |
| Ajouter des pièces jointes à un dossier     | `PUT /sessions/v2/:sessionId/files/:nominationFileId/attachments`                                        | —                                                            | ✓                   | ✓              |
| Retirer une pièce jointe d'un dossier       | `DELETE /sessions/v2/:sessionId/files/:nominationFileId/attachments/:fileId`                             | —                                                            | ✓                   | ✓              |
| Obtenir le lien Lolfi du magistrat proposé  | `GET /sessions/v2/:sessionId/files/:nominationFileId/lolfi-url`                                          | ✓ si sa formation                                            | ✓                   | ✓              |
| Commenter un dossier                        | `PATCH /sessions/v2/:sessionId/files/:nominationFileId/comment`                                          | —                                                            | ✓                   | ✓              |
| Masquer l'alerte d'un dossier               | `DELETE /sessions/v2/:sessionId/file/:nominationFileId/alert`                                            | —                                                            | ✓                   | ✓              |
| Modifier les priorités des dossiers         | `PUT /sessions/v2/:sessionId/files/priorities`                                                           | —                                                            | ✓                   | ✓              |
| Saisir la décision sur un dossier           | `PUT /sessions/v2/:sessionId/files/:nominationFileId/outcome`                                            | —                                                            | ✓                   | ✓              |
| Saisir la décision sur plusieurs dossiers   | `PUT /sessions/v2/:sessionId/files/outcome`                                                              | —                                                            | ✓                   | ✓              |
| Signaler une évaluation manquante           | `PUT /sessions/v2/:sessionId/files/:nominationFileId/missing-evaluation`                                 | —                                                            | ✓                   | ✓              |
| Commenter une évaluation manquante          | `PATCH /sessions/v2/:sessionId/files/:nominationFileId/missing-evaluation/comment`                       | —                                                            | ✓                   | ✓              |
| Exporter les évaluations manquantes (Excel) | `GET /sessions/v2/:sessionId/files/missing-evaluations.xlsx`                                             | —                                                            | ✓                   | ✓              |
| Écrire son mémo personnel sur un dossier    | `PUT /members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/memo` | ✓ si ses propres données, sa formation, session non archivée | —                   | —              |

Un Membre ne voit pas le commentaire de décision d'un dossier. Un rapporteur du dossier n'a pas de mémo : il rédige le rapport.

### Affectation

| Action                                    | Endpoint                                                                     | Membre                                 | Secrétariat général | Administrateur |
| ----------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- | ------------------- | -------------- |
| Lister les rapporteurs affectés           | `GET /sessions/v2/:sessionId/files/reporters/versions/last/members`          | ✓ si sa formation, affectation publiée | ✓                   | ✓              |
| Affecter des rapporteurs                  | `POST /sessions/v2/:sessionId/files/reporters`                               | —                                      | ✓                   | ✓              |
| Affecter automatiquement                  | `POST /sessions/v2/:sessionId/auto-affectation`                              | —                                      | ✓                   | ✓              |
| Publier l'affectation                     | `POST /sessions/v2/:sessionId/files/reporters/versions`                      | —                                      | ✓                   | ✓              |
| Voir la dernière version de l'affectation | `GET /sessions/v2/:sessionId/files/reporters/versions/last`                  | —                                      | ✓                   | ✓              |
| Voir l'historique de l'affectation        | `GET /sessions/v2/:sessionId/files/reporters/versions/history`               | —                                      | ✓                   | ✓              |
| Compter les dossiers non affectés         | `GET /sessions/v2/:sessionId/files/reporters/versions/last/unaffected-count` | —                                      | ✓                   | ✓              |

### Rapports

| Action                                  | Endpoint                                                                                                    | Membre                                           | Secrétariat général      | Administrateur           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------ | ------------------------ |
| Lister mes rapports d'une session       | `GET /members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/reports`                         | ✓ si ses propres données, sa formation           | ✓ si ses propres données | ✓ si ses propres données |
| Trouver mon rapport sur un dossier      | `GET /members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/reports` | ✓ si ses propres données                         | ✓ si ses propres données | ✓ si ses propres données |
| Lire un rapport                         | `GET /reports/v2/:reportId`                                                                                 | ✓ si rapporteur du dossier                       | ✓                        | ✓                        |
| Rédiger un rapport                      | `PATCH /reports/v2/:reportId`                                                                               | ✓ si rapporteur du dossier, session non archivée | —                        | —                        |
| Valider une règle statutaire du rapport | `PUT /reports/v2/:reportId/rules/:ruleId`                                                                   | ✓ si rapporteur du dossier, session non archivée | —                        | —                        |
| Joindre des fichiers au rapport         | `POST /reports/v2/:reportId/files`                                                                          | ✓ si rapporteur du dossier, session non archivée | —                        | —                        |
| Retirer des fichiers du rapport         | `DELETE /reports/v2/:reportId/files`                                                                        | ✓ si rapporteur du dossier, session non archivée | —                        | —                        |
| Coller des captures dans le rapport     | `POST /reports/v2/:reportId/screenshots`                                                                    | ✓ si rapporteur du dossier, session non archivée | —                        | —                        |
| Télécharger les fichiers du rapport     | `GET /reports/v2/:reportId/files/url`                                                                       | ✓ si rapporteur du dossier                       | —                        | —                        |

### Synthèses

| Action                                      | Endpoint                                                                              | Membre                      | Secrétariat général         | Administrateur              |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- | --------------------------- | --------------------------- |
| Lire une synthèse                           | `GET /sessions/v2/:sessionId/files/:nominationFileId/summary`                         | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse |
| Télécharger une pièce jointe de la synthèse | `GET /sessions/v2/:sessionId/files/:nominationFileId/summary/attachments/:fileId/url` | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse | ✓ si lecteur de la synthèse |
| Créer une synthèse                          | `POST /sessions/v2/:sessionId/files/:nominationFileId/summary`                        | —                           | ✓                           | ✓                           |
| Rédiger une synthèse                        | `PUT /sessions/v2/:sessionId/files/:nominationFileId/summary/content`                 | —                           | ✓ si auteur de la synthèse  | ✓ si auteur de la synthèse  |
| Coller des captures dans la synthèse        | `POST /sessions/v2/:sessionId/files/:nominationFileId/summary/screenshots`            | —                           | ✓                           | ✓                           |
| Joindre des fichiers à la synthèse          | `POST /sessions/v2/:sessionId/files/:nominationFileId/summary/attachments`            | —                           | ✓                           | ✓                           |
| Retirer des fichiers de la synthèse         | `DELETE /sessions/v2/:sessionId/files/:nominationFileId/summary/attachments`          | —                           | ✓                           | ✓                           |
| Rechercher des lecteurs possibles           | `GET /sessions/v2/:sessionId/files/:nominationFileId/summary/readers`                 | —                           | ✓                           | ✓                           |
| Choisir les lecteurs                        | `PUT /sessions/v2/:sessionId/files/:nominationFileId/summary/readers`                 | —                           | ✓                           | ✓                           |

### Observations

| Action                                   | Endpoint                                                                                                       | Membre                                           | Secrétariat général | Administrateur |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------- | -------------- |
| Lister les observations d'un dossier     | `GET /sessions/v2/:sessionId/files/:nominationFileId/observations`                                             | ✓ si sa formation                                | ✓                   | ✓              |
| Voir une observation                     | `GET /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId`                              | ✓ si sa formation                                | ✓                   | ✓              |
| Télécharger une pièce d'une observation  | `GET /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/files/:fileId/url`            | ✓ si sa formation                                | ✓                   | ✓              |
| Commenter une observation                | `PUT /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/member-comments`              | ✓ si rapporteur du dossier, session non archivée | —                   | —              |
| Coller des captures dans son commentaire | `POST /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/member-comments/screenshots` | ✓ si rapporteur du dossier, session non archivée | —                   | —              |
| Enregistrer une observation              | `POST /sessions/v2/:sessionId/files/:nominationFileId/observations`                                            | —                                                | ✓                   | ✓              |
| Modifier une observation                 | `PATCH /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId`                            | —                                                | ✓                   | ✓              |
| Supprimer une observation                | `DELETE /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId`                           | —                                                | ✓                   | ✓              |
| Donner une suite à une observation       | `PUT /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/follow-up`                    | —                                                | ✓                   | ✓              |
| Programmer l'audition d'un observant     | `PUT /sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/audition/schedule`            | —                                                | ✓                   | ✓              |

Dans le détail d'une observation, un Membre ne voit que son propre commentaire.

### Auditions

| Action                                       | Endpoint                                                                | Membre            | Secrétariat général | Administrateur |
| -------------------------------------------- | ----------------------------------------------------------------------- | ----------------- | ------------------- | -------------- |
| Lister les auditions d'une session           | `GET /sessions/v2/:sessionId/auditions`                                 | ✓ si sa formation | ✓                   | ✓              |
| Compter les auditions                        | `GET /sessions/v2/:sessionId/auditions/counts`                          | ✓ si sa formation | ✓                   | ✓              |
| Exporter les auditions (Excel)               | `GET /sessions/v2/:sessionId/auditions.xlsx`                            | —                 | ✓                   | ✓              |
| Publier les auditions                        | `POST /sessions/v2/:sessionId/auditions/publications`                   | —                 | ✓                   | ✓              |
| Voir la dernière publication des auditions   | `GET /sessions/v2/:sessionId/auditions/publications/last`               | —                 | ✓                   | ✓              |
| Demander l'audition d'un candidat            | `PUT /sessions/v2/:sessionId/files/:nominationFileId/audition/request`  | —                 | ✓                   | ✓              |
| Programmer l'audition d'un candidat          | `PUT /sessions/v2/:sessionId/files/:nominationFileId/audition/schedule` | —                 | ✓                   | ✓              |
| Voir l'historique des auditions d'un dossier | `GET /sessions/v2/:sessionId/files/:nominationFileId/audition/history`  | —                 | ✓                   | ✓              |

Un Membre ne voit les auditions qu'une fois publiées, et sans les coordonnées des candidats.

### Magistrats

| Action                               | Endpoint                                                          | Membre | Secrétariat général | Administrateur |
| ------------------------------------ | ----------------------------------------------------------------- | ------ | ------------------- | -------------- |
| Rechercher un magistrat              | `GET /magistrats/v1`                                              | ✓      | ✓                   | ✓              |
| Voir la fiche d'un magistrat         | `GET /magistrats/v1/:magistratId`                                 | ✓      | ✓                   | ✓              |
| Voir les dossiers d'un magistrat     | `GET /magistrats/v1/:magistratId/nomination-files`                | ✓      | ✓                   | ✓              |
| Voir les observations d'un magistrat | `GET /magistrats/v1/:magistratId/observations`                    | ✓      | ✓                   | ✓              |
| Lister les numéros de téléphone      | `GET /magistrats/v1/:magistratId/phone-numbers`                   | —      | ✓                   | ✓              |
| Ajouter un numéro de téléphone       | `POST /magistrats/v1/:magistratId/phone-numbers`                  | —      | ✓                   | ✓              |
| Modifier un numéro de téléphone      | `PATCH /magistrats/v1/:magistratId/phone-numbers/:phoneNumberId`  | —      | ✓                   | ✓              |
| Supprimer un numéro de téléphone     | `DELETE /magistrats/v1/:magistratId/phone-numbers/:phoneNumberId` | —      | ✓                   | ✓              |
| Rechercher une juridiction           | `GET /jurisdictions/v1`                                           | —      | ✓                   | ✓              |

Dans les dossiers d'un magistrat, un Membre ne voit que l'affectation et les auditions publiées.

### Membres

| Action                                                | Endpoint                                         | Membre | Secrétariat général | Administrateur |
| ----------------------------------------------------- | ------------------------------------------------ | ------ | ------------------- | -------------- |
| Lister les membres                                    | `GET /members/v1`                                | —      | ✓                   | ✓              |
| Voir un membre                                        | `GET /members/v1/:userId`                        | —      | ✓                   | ✓              |
| Modifier le titre affiché d'un membre                 | `PUT /members/v1/:userId/display-title`          | —      | ✓                   | ✓              |
| Exclure des juridictions de l'affectation d'un membre | `PUT /members/v1/:userId/excluded-jurisdictions` | —      | ✓                   | ✓              |

### Documents de séance : préparation

| Action                                             | Endpoint                                     | Membre | Secrétariat général | Administrateur |
| -------------------------------------------------- | -------------------------------------------- | ------ | ------------------- | -------------- |
| Lister les documents d'une session                 | `GET /docs/v1/sessions/:sessionId/docs`      | —      | ✓                   | ✓              |
| Savoir si une session est prête pour les documents | `GET /docs/v1/sessions/:sessionId/readiness` | —      | ✓                   | ✓              |
| Lister les dossiers d'une session pour un document | `GET /docs/v1/sessions/:sessionId/files`     | —      | ✓                   | ✓              |
| Lister les membres pour un document                | `GET /docs/v1/members`                       | —      | ✓                   | ✓              |
| Lister les secrétaires généraux                    | `GET /docs/v1/secretaries-general`           | —      | ✓                   | ✓              |
| Rechercher un contact de la Chancellerie           | `GET /docs/v1/justice-contacts`              | —      | ✓                   | ✓              |
| Ajouter un contact de la Chancellerie              | `POST /docs/v1/justice-contacts`             | —      | ✓                   | ✓              |

### Ordres du jour

| Action                             | Endpoint                                                 | Membre | Secrétariat général | Administrateur |
| ---------------------------------- | -------------------------------------------------------- | ------ | ------------------- | -------------- |
| Créer un ordre du jour             | `POST /docs/v1/sessions/:sessionId/agendas`              | —      | ✓                   | ✓              |
| Voir l'ordre du jour d'une session | `GET /docs/v1/sessions/:sessionId/agendas/:agendaId`     | —      | ✓                   | ✓              |
| Voir les métadonnées               | `GET /docs/v1/agendas/:agendaId`                         | —      | ✓                   | ✓              |
| Modifier les métadonnées           | `PUT /docs/v1/agendas/:agendaId/metadata`                | —      | ✓                   | ✓              |
| Voir les dossiers                  | `GET /docs/v1/agendas/:agendaId/files`                   | —      | ✓                   | ✓              |
| Modifier les dossiers              | `PUT /docs/v1/agendas/:agendaId/files`                   | —      | ✓                   | ✓              |
| Voir les blocs du document         | `GET /docs/v1/agendas/:agendaId/blocks`                  | —      | ✓                   | ✓              |
| Retoucher le bloc d'un dossier     | `PATCH /docs/v1/agendas/:agendaId/blocks/files/:fileId`  | —      | ✓                   | ✓              |
| Rétablir le bloc d'un dossier      | `DELETE /docs/v1/agendas/:agendaId/blocks/files/:fileId` | —      | ✓                   | ✓              |
| Abandonner le brouillon            | `DELETE /docs/v1/agendas/:agendaId/draft`                | —      | ✓                   | ✓              |
| Valider                            | `POST /docs/v1/agendas/:agendaId/validation`             | —      | ✓                   | ✓              |
| Générer le HTML                    | `GET /docs/v1/agendas/:agendaId.html`                    | —      | ✓                   | ✓              |
| Générer le PDF                     | `GET /docs/v1/agendas/:agendaId.pdf`                     | —      | ✓                   | ✓              |
| Supprimer                          | `DELETE /docs/v1/agendas/:agendaId`                      | —      | ✓                   | ✓              |

### Procès-verbaux

| Action                                                      | Endpoint                                                                                 | Membre | Secrétariat général | Administrateur |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ | ------------------- | -------------- |
| Lister les ordres du jour utilisables pour un procès-verbal | `GET /docs/v1/sessions/:sessionId/new-official-reports/agendas`                          | —      | ✓                   | ✓              |
| Créer un procès-verbal                                      | `POST /docs/v1/sessions/:sessionId/official-reports`                                     | —      | ✓                   | ✓              |
| Voir le procès-verbal d'une session                         | `GET /docs/v1/sessions/:sessionId/official-reports/:officialReportId`                    | —      | ✓                   | ✓              |
| Voir un procès-verbal                                       | `GET /docs/v1/official-reports/:officialReportId`                                        | —      | ✓                   | ✓              |
| Modifier un procès-verbal                                   | `PUT /docs/v1/official-reports/:officialReportId`                                        | —      | ✓                   | ✓              |
| Voir les blocs du document                                  | `GET /docs/v1/official-reports/:officialReportId/blocks`                                 | —      | ✓                   | ✓              |
| Retoucher l'introduction                                    | `PATCH /docs/v1/official-reports/:officialReportId/blocks/intro`                         | —      | ✓                   | ✓              |
| Rétablir l'introduction                                     | `DELETE /docs/v1/official-reports/:officialReportId/blocks/intro`                        | —      | ✓                   | ✓              |
| Retoucher la conclusion                                     | `PATCH /docs/v1/official-reports/:officialReportId/blocks/conclusion`                    | —      | ✓                   | ✓              |
| Rétablir la conclusion                                      | `DELETE /docs/v1/official-reports/:officialReportId/blocks/conclusion`                   | —      | ✓                   | ✓              |
| Retoucher le titre d'une section                            | `PATCH /docs/v1/official-reports/:officialReportId/blocks/:outcome/title`                | —      | ✓                   | ✓              |
| Rétablir le titre d'une section                             | `DELETE /docs/v1/official-reports/:officialReportId/blocks/:outcome/title`               | —      | ✓                   | ✓              |
| Retoucher l'introduction d'une section                      | `PATCH /docs/v1/official-reports/:officialReportId/blocks/:outcome/intro`                | —      | ✓                   | ✓              |
| Rétablir l'introduction d'une section                       | `DELETE /docs/v1/official-reports/:officialReportId/blocks/:outcome/intro`               | —      | ✓                   | ✓              |
| Rétablir le bloc d'un dossier                               | `DELETE /docs/v1/official-reports/:officialReportId/blocks/files/:nominationFileId`      | —      | ✓                   | ✓              |
| Écrire la note sous une proposition                         | `PATCH /docs/v1/official-reports/:officialReportId/blocks/files/:nominationFileId/note`  | —      | ✓                   | ✓              |
| Retirer la note sous une proposition                        | `DELETE /docs/v1/official-reports/:officialReportId/blocks/files/:nominationFileId/note` | —      | ✓                   | ✓              |
| Abandonner le brouillon                                     | `DELETE /docs/v1/official-reports/:officialReportId/draft`                               | —      | ✓                   | ✓              |
| Valider                                                     | `POST /docs/v1/official-reports/:officialReportId/validation`                            | —      | ✓                   | ✓              |
| Générer le HTML                                             | `GET /docs/v1/official-reports/:officialReportId.html`                                   | —      | ✓                   | ✓              |
| Générer le PDF                                              | `GET /docs/v1/official-reports/:officialReportId.pdf`                                    | —      | ✓                   | ✓              |
| Supprimer                                                   | `DELETE /docs/v1/official-reports/:officialReportId`                                     | —      | ✓                   | ✓              |

### Notices de restitution

| Action                                | Endpoint                                                  | Membre | Secrétariat général | Administrateur |
| ------------------------------------- | --------------------------------------------------------- | ------ | ------------------- | -------------- |
| Lister les notices à restituer        | `GET /docs/v1/presentation-plans`                         | —      | ✓                   | ✓              |
| Lister les notices restituées         | `GET /docs/v1/presentation-plans/presented`               | —      | ✓                   | ✓              |
| Lister les ordres du jour à restituer | `GET /docs/v1/presentation-plans/agendas`                 | —      | ✓                   | ✓              |
| Créer une notice                      | `POST /docs/v1/presentation-plans`                        | —      | ✓                   | ✓              |
| Voir une notice                       | `GET /docs/v1/presentation-plans/:planId`                 | —      | ✓                   | ✓              |
| Modifier une notice                   | `PUT /docs/v1/presentation-plans/:planId`                 | —      | ✓                   | ✓              |
| Retoucher le document                 | `PATCH /docs/v1/presentation-plans/:planId/html`          | —      | ✓                   | ✓              |
| Rétablir le document                  | `DELETE /docs/v1/presentation-plans/:planId/document`     | —      | ✓                   | ✓              |
| Valider                               | `POST /docs/v1/presentation-plans/:planId/validation`     | —      | ✓                   | ✓              |
| Marquer comme restituée               | `PUT /docs/v1/presentation-plans/:planId/presentation`    | —      | ✓                   | ✓              |
| Annuler la restitution                | `DELETE /docs/v1/presentation-plans/:planId/presentation` | —      | ✓                   | ✓              |
| Générer le HTML                       | `GET /docs/v1/presentation-plans/:planId.html`            | —      | ✓                   | ✓              |
| Télécharger le PDF                    | `GET /docs/v1/presentation-plans/:planId/url`             | —      | ✓                   | ✓              |
| Supprimer                             | `DELETE /docs/v1/presentation-plans/:planId`              | —      | ✓                   | ✓              |

### Administration

| Action                            | Endpoint                                               | Membre | Secrétariat général | Administrateur |
| --------------------------------- | ------------------------------------------------------ | ------ | ------------------- | -------------- |
| Lister les utilisateurs           | `GET /administration/v1/users`                         | —      | —                   | ✓              |
| Voir un utilisateur               | `GET /administration/v1/users/:userId`                 | —      | —                   | ✓              |
| Modifier l'e-mail                 | `PUT /administration/v1/users/:userId/email`           | —      | —                   | ✓              |
| Modifier le mot de passe          | `PUT /administration/v1/users/:userId/password`        | —      | —                   | ✓              |
| Modifier le rôle                  | `PUT /administration/v1/users/:userId/role`            | —      | —                   | ✓              |
| Modifier le titre affiché         | `PUT /administration/v1/users/:userId/display-title`   | —      | —                   | ✓              |
| Donner le droit d'administrateur  | `PUT /administration/v1/users/:userId/promotion`       | —      | —                   | ✓              |
| Retirer le droit d'administrateur | `DELETE /administration/v1/users/:userId/promotion`    | —      | —                   | ✓              |
| Désactiver un compte              | `PUT /administration/v1/users/:userId/deactivation`    | —      | —                   | ✓              |
| Réactiver un compte               | `DELETE /administration/v1/users/:userId/deactivation` | —      | —                   | ✓              |
| Lister les traitements            | `GET /jobs/v1`                                         | —      | —                   | ✓              |
| Voir un traitement                | `GET /jobs/v1/:jobId`                                  | —      | —                   | ✓              |

Le droit d'administrateur ne se donne qu'à une personne du Secrétariat général.

## Accès sans utilisateur

Ces endpoints ne passent par aucun rôle : ils sont publics ou réservés à d'autres systèmes. Le préfixe `/api` est omis.

| Accès                                             | Endpoint                                  | Qui                       | Raison                                                    |
| ------------------------------------------------- | ----------------------------------------- | ------------------------- | --------------------------------------------------------- |
| Se connecter                                      | `POST /auth/v2/login`                     | public                    | Connexion par e-mail et mot de passe                      |
| Lister les fournisseurs OpenID                    | `GET /auth/v2/openid/providers`           | public                    | Connexion OpenID                                          |
| Préparer une connexion OpenID                     | `POST /auth/v2/openid/:provider/requests` | public                    | Connexion OpenID                                          |
| Retour du fournisseur OpenID                      | `GET /auth/v2/openid/:provider/callback`  | public                    | Connexion OpenID                                          |
| Vérifier les droits d'un magistrat (API publique) | `POST /public/v1/magistrats/role`         | machine                   | Service partenaire, authentifié par jeton                 |
| Importer une archive Lolfi                        | `POST /ingest/v1/lolfi`                   | machine ou Administrateur | Dépôt automatique des archives Lolfi, ou import à la main |

### Hors spécification OpenAPI

Ces endpoints n'apparaissent pas dans la spécification OpenAPI : aucun test ne les vérifie.

| Accès                    | Endpoint                 | Qui                                |
| ------------------------ | ------------------------ | ---------------------------------- |
| Créer un compte          | `POST /auth/v2/register` | public, en développement seulement |
| État de santé            | `GET /_health`           | public                             |
| Icône                    | `GET /favicon.ico`       | public                             |
| Envoyer une alerte Tchap | `POST /tchap/alerts`     | machine                            |

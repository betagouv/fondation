# ADR : Table Magistrat - Analyse XML LOLFi

## Contexte

Cette table stocke les données des magistrats importées depuis le flux XML LOLFi.
Elle servira de référentiel pour les fonctionnalités futures (observations, affectations, etc.).

## Mapping XML -> Base de données

| Champ XML | Description | Format XML | Exemple | Nullable |
|-----------|-------------|------------|---------|----------|
| `id` | Identifiant LOLFi unique | Numérique | `36` | Non |
| `civilite` | Civilité du magistrat | `M` / `MME` | `MME` | Non |
| `sit_fam` | Situation familiale | `C/D/I/M/P/S/U/V` | `M` | Oui |
| `nom` | Nom de famille | Majuscules | `PERRAUT` | Non |
| `prenom` | Prénom | Majuscules | `FLORENCE` | Non |
| `nom_marital` | Nom marital | Majuscules | `LAGARDE` | Oui |
| `nom_usage` | Nom d'usage | Majuscules | `PERRAUT` | Non |
| `email_pro` | Email professionnel | @justice.fr / @justice.gouv.fr | `florence.perraut@justice.fr` | Oui |
| `date_naiss` | Date de naissance | `JJ/MM/AAAA` | `26/04/1978` | Oui |
| `lieu_naiss` | Lieu de naissance | Majuscules | `MARSEILLE` | Oui |
| `dep_naiss` | Département de naissance | Numérique (2-3 car.) | `13` | Oui |
| `tableau` | Année tableau d'avancement | `AAAA` | `2017` | Oui |
| `num_emploi_cible` | ID poste actuel (mal nommé) | Numérique | `43533` | Oui |
| `grade` | Grade actuel | `I/II/II-N/III/HH` | `I` | Oui |
| `date_grade` | Date prise de grade | `JJ/MM/AAAA` | `16/08/2019` | Oui |
| `date_installation` | Date prise de poste actuel | `JJ/MM/AAAA` | `01/09/2023` | Oui |
| `date_nomination` | Date nomination poste actuel | `JJ/MM/AAAA` | `26/06/2023` | Oui |
| `historique` | Biographie / parcours | Texte libre | Voir exemple ci-dessous | Oui |
| `posad` | Position administrative | 8 car. max (`PT`, `DET`...) | `PT` | Oui |
| `posad_prev` | Position prévisionnelle | 8 car. max | - | Oui |
| `date_posad_prev` | Début position prév. | `JJ/MM/AAAA` | - | Oui |
| `date_posad_prev_fin` | Fin position prév. | `JJ/MM/AAAA` | - | Oui |
| `posad_prev2` | Position suivante | 8 car. max | - | Oui |
| `date_posad_prev2` | Date position suivante | `JJ/MM/AAAA` | - | Oui |
| `date_modification` | Dernière MAJ fiche LOLFi | `JJ/MM/AAAA` | `10/07/2023` | Oui |

## Codes de référence

### Situation familiale (`sit_fam`)

| Code | Signification |
|------|---------------|
| C | Célibataire |
| D | Divorcé |
| I | Inconnu |
| M | Marié |
| P | PACS |
| S | Séparé |
| U | Concubin |
| V | Veuf |

### Position administrative (`posad`)

| Code | Signification |
|------|---------------|
| PT | Plein Temps |
| DET | Détachement |
| ... | Voir fichier POSAD.XML pour liste exhaustive |

### Grade

| Valeur | Notes |
|--------|-------|
| I | 1er grade |
| II | 2ème grade |
| II-N | 2ème grade - variante (à confirmer avec métier) |
| III | 3ème grade |
| HH | Hors Hiérarchie |

## Exemple de données XML

```xml
<magistrats num="4">
  <id>36</id>
  <civilite>MME</civilite>
  <sit_fam>M</sit_fam>
  <nom>PERRAUT</nom>
  <prenom>FLORENCE</prenom>
  <nom_marital>LAGARDE</nom_marital>
  <nom_usage>PERRAUT</nom_usage>
  <email_pro>florence.perraut@justice.fr</email_pro>
  <date_naiss>26/04/1978</date_naiss>
  <lieu_naiss>MARSEILLE</lieu_naiss>
  <dep_naiss>13</dep_naiss>
  <tableau>2017</tableau>
  <num_emploi_cible>43533</num_emploi_cible>
  <grade>I</grade>
  <date_grade>16/08/2019</date_grade>
  <date_installation>01/09/2023</date_installation>
  <date_nomination>26/06/2023</date_nomination>
  <historique>J BAR LE DUC (2me grade), 09/07/2010 (Ins.30/08/2010). - J CRETEIL...</historique>
  <posad>PT</posad>
  <posad_prev null="TRUE"/>
  <date_posad_prev null="TRUE"/>
  <date_posad_prev_fin null="TRUE"/>
  <posad_prev2 null="TRUE"/>
  <date_posad_prev2 null="TRUE"/>
  <date_modification>10/07/2023</date_modification>
</magistrats>
```

## Définition de la table `magistrat`

Convention suivie : camelCase anglais pour les propriétés Prisma, snake_case anglais pour les colonnes SQL.

| Champ XML | Colonne SQL | Propriété Prisma | Type | Description |
|-----------|-------------|------------------|------|-------------|
| `id` | `external_id` | `externalId` | `String` | Identifiant LOLFi unique |
| `civilite` | `civilite` | `civilite` | `String` | M ou MME |
| `nom` | `last_name` | `lastName` | `String` | Nom de famille |
| `prenom` | `first_name` | `firstName` | `String` | Prénom |
| `nom_marital` | `married_name` | `marriedName` | `String?` | Nom marital |
| `nom_usage` | `used_name` | `usedName` | `String` | Nom d'usage |
| `sit_fam` | `marital_status` | `maritalStatus` | `String?` | Situation familiale |
| `email_pro` | `professional_email` | `professionalEmail` | `String?` | Email professionnel |
| `date_naiss` | `birth_date` | `birthDate` | `DateTime?` | Date de naissance |
| `lieu_naiss` | `birth_place` | `birthPlace` | `String?` | Lieu de naissance |
| `dep_naiss` | `birth_department` | `birthDepartment` | `String?` | Département de naissance |
| `grade` | `grade` | `grade` | `String?` | Grade actuel |
| `date_grade` | `grade_date` | `gradeDate` | `DateTime?` | Date prise de grade |
| `num_emploi_cible` | `current_position_id` | `currentPositionId` | `String?` | ID poste actuel |
| `date_installation` | `installation_date` | `installationDate` | `DateTime?` | Date prise de poste |
| `date_nomination` | `nomination_date` | `nominationDate` | `DateTime?` | Date nomination |
| `tableau` | `advancement_year` | `advancementYear` | `Int?` | Année tableau avancement |
| `historique` | `career_history` | `careerHistory` | `Text?` | Biographie / parcours |
| `posad` | `admin_position` | `adminPosition` | `String?` | Position administrative |
| `posad_prev` | `admin_position_prev` | `adminPositionPrev` | `String?` | Position prévisionnelle |
| `date_posad_prev` | `admin_position_prev_start` | `adminPositionPrevStart` | `DateTime?` | Début position prév. |
| `date_posad_prev_fin` | `admin_position_prev_end` | `adminPositionPrevEnd` | `DateTime?` | Fin position prév. |
| `posad_prev2` | `admin_position_prev2` | `adminPositionPrev2` | `String?` | Position suivante |
| `date_posad_prev2` | `admin_position_prev2_date` | `adminPositionPrev2Date` | `DateTime?` | Date position suivante |
| `date_modification` | `lolfi_updated_at` | `lolfiUpdatedAt` | `DateTime?` | Dernière MAJ LOLFi |
| - | `id` | `id` | `Uuid` | PK interne |
| - | `created_at` | `createdAt` | `DateTime` | Date création |
| - | `updated_at` | `updatedAt` | `DateTime` | Date MAJ |

---

## Notes d'implémentation

1. **`num_emploi_cible`** : Le nom est trompeur dans le XML - il s'agit de l'affectation **actuelle**, pas de l'emploi cible → renommé `currentPositionId`
2. **Nulls XML** : Les valeurs nulles sont représentées par `<champ null="TRUE"/>` dans le XML
3. **Dates** : Toutes au format `JJ/MM/AAAA`, à convertir en `DateTime` lors de l'import
4. **Grade `II-N`** : Variante non documentée officiellement - TODO: valider avec le métier la liste exhaustive
5. **Convention de nommage** : Anglais pour les colonnes SQL et propriétés Prisma (cohérence avec le reste du codebase)

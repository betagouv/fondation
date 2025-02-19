import { AllRulesMap, NominationFile } from "shared-models";
import { NonEmptyTuple } from "type-fest";

type GroupLabels<
  RulesMap extends AllRulesMap,
  RuleGroup extends NominationFile.RuleGroup,
  ExcludedRules extends NominationFile.RuleName = never,
> =
  NonEmptyTuple<RulesMap[RuleGroup]> extends readonly [
    RulesMap[RuleGroup],
    ...RulesMap[RuleGroup][],
  ]
    ? {
        [key in Exclude<RulesMap[RuleGroup][number], ExcludedRules>]: {
          label: string;
          hint: string | JSX.Element;
        };
      }
    : undefined;

export type RulesLabelsMap<RulesMap extends AllRulesMap = AllRulesMap> = {
  [NominationFile.RuleGroup.MANAGEMENT]: GroupLabels<
    RulesMap,
    NominationFile.RuleGroup.MANAGEMENT,
    | NominationFile.ManagementRule.CASSATION_COURT_NOMINATION
    | NominationFile.ManagementRule.GETTING_FIRST_GRADE
    | NominationFile.ManagementRule.GETTING_GRADE_HH
    | NominationFile.ManagementRule.PROFILED_POSITION
    | NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS
    | NominationFile.ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
  >;
  [NominationFile.RuleGroup.STATUTORY]: GroupLabels<
    RulesMap,
    NominationFile.RuleGroup.STATUTORY
  >;
  [NominationFile.RuleGroup.QUALITATIVE]: GroupLabels<
    RulesMap,
    NominationFile.RuleGroup.QUALITATIVE,
    NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS
  >;
};

export const allRulesLabelsMap: RulesLabelsMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: {
    // supprimé ?
    // [NominationFile.ManagementRule.CASSATION_COURT_NOMINATION]: {
    //   label: "Nomination à la cour de cassation",
    //   hint: ``,
    // },
    // supprimé ?
    // [NominationFile.ManagementRule.GETTING_FIRST_GRADE]: {
    //   label: "Passer au 1er grade",
    //   hint: ``,
    // },
    [NominationFile.ManagementRule.TRANSFER_TIME]: {
      label: "Mutation avant 3 ans",
      hint: (
        <div>
          <p>
            Un magistrat est, par principe, dans l'obligation de rester 3 ans
            dans ses fonctions avant nouvelle mobilité. Exceptions possibles à
            justifier (voir note de présentation DSJ).
          </p>
          <p>
            Date de prise de poste pressentie - Date de prise de poste ≥ 3 ans
            <ul>
              <li>Si OK pas d'erreur</li>
              <li>Si KO erreur</li>
            </ul>
          </p>
          <p>Non bloquant car exceptions possibles à justifier.</p>
        </div>
      ),
    },
    // supprimé ?
    // [NominationFile.ManagementRule.GETTING_GRADE_HH]: {
    //   label: "Proposition de nomination à un poste HH",
    //   hint: (
    //     <div>
    //       <p>
    //         <ul>
    //           <li>
    //             Pour les magistrats ayant pris leur premier poste avant le 1er
    //             septembre 2020 :
    //           </li>
    //         </ul>
    //         Le magistrat proposé doit avoir exercé au moins deux fonctions au
    //         1er grade. Si ces deux fonctions sont juridictionnelles, elles
    //         doivent avoir été exercées dans deux juridictions différentes, a
    //         l'exception des conseillers référendaires et avocats généraux
    //         référendaires.
    //       </p>
    //       <p>
    //         <ul>
    //           <li>
    //             Pour les magistrats ayant pris leur premier poste après le 1er
    //             septembre 2020 :
    //           </li>
    //         </ul>
    //         Le magistrat proposé doit également avoir effectué une mobilité non
    //         juridictionnelle (mise à disposition, détachement).
    //       </p>
    //       <p>Cf. liste des fonctions dans la magistrature.</p>
    //     </div>
    //   ),
    // },
    [NominationFile.ManagementRule.GETTING_GRADE_IN_PLACE]: {
      label: "Avancement sur place",
      hint: `Par principe, la mobilité géographique est privilégiée pour réaliser un avancement (1er grade, HH). Les motivations des dérogations sont à vérifier dans la note de présentation DSJ.`,
    },
    // supprimé ?
    //     [NominationFile.ManagementRule.PROFILED_POSITION]: {
    //       label: "Proposition d'avancement sans inscription au tableau",
    //       hint: `Le magistrat proposé doit être inscrit au tableau pour prendre son grade.

    // A vérifier dans l'espace LOLFI du magistrat proposé`,
    //     },
    // supprimé ?
    // [NominationFile.ManagementRule.OVERSEAS_TO_OVERSEAS]: {
    //   label: 'Être muté "d\'Outremer sur Outremer"',
    //   hint: ``,
    // },
    // supprimé ?
    // fusionné avec NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
    // [NominationFile.ManagementRule
    //   .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE]: {
    //   label:
    //     "Passer du siège au parquet tout en passant d'un TJ à une CA (ou l'inverse)",
    //   hint: ``,
    // },
    [NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]: {
      label: "Passage parquet / siège ou inversement au sein d'un même ressort",
      hint: `Au sein d'une même cour d'appel, passage du siège au parquet entre le TJ et la CA et inversement.

Comme la CA a une vision macro de tous les dossiers du ressort, les risques de se retrouver en situation de conflit d'intérêt sur ses anciens dossiers sont plus forts.

Passage du siège au parquet (ou inversement) entre 2 TJ du ressort d'une même CA. Avoir une vigilance particulière pour les infra-pôles.`,
    },
  },
  [NominationFile.RuleGroup.STATUTORY]: {
    [NominationFile.StatutoryRule.JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION]: {
      label:
        "Passage parquet / siège ou inversement au sein d'une même juridiction en moins de 5 ans",
      hint: `Passage du siège au parquet ou inversement au sein d'une même juridiction, sans l'avoir quitté dans les 5 ans.

⚠️ biographie.

Cf. liste des fonctions dans la magistrature.`,
    },
    [NominationFile.StatutoryRule.GRADE_ON_SITE_AFTER_7_YEARS]: {
      label: "Avancement sur place après 7 ans",
      hint: "Prendre son avancement du 2nd au 1er grade dans une même juridiction après 7 ans (Art 2 de l'OS).",
    },
    [NominationFile.StatutoryRule.MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS]: {
      label: "Nomination à l'administration centrale avant 3 ans de fonction",
      hint: `Impossibilité d'être nommé à l'administration centrale avant 3 ans d'exercice en juridiction.

Sur la transparence, le poste apparait comme "substitut à l'administration centrale de la justice".`,
    },
    [NominationFile.StatutoryRule.MINISTER_CABINET]: {
      label: "Nomination en cabinet ministériel avant 4 ans de fonction",
      hint: `Impossibilité d'être nommé en cabinet ministériel avant une durée de 4 ans d'exercice.

Si le magistrat proposé n'a pas 4 ans d'exercice et qu'il est pressenti pour un poste en cabinet, l'avis est nécessairement défavorable : cette règle étant statutairement exigée pour une nomination en cabinet.`,
    },
    [NominationFile.StatutoryRule.GRADE_REGISTRATION]: {
      label: "Proposition d'avancement sans inscription au tableau",
      hint: `Le magistrat proposé doit être inscrit au tableau pour prendre son grade.

A vérifier dans l'espace LOLFI du magistrat proposé.`,
    },
    [NominationFile.StatutoryRule.HH_WITHOUT_2_FIRST_GRADE_POSITIONS]: {
      label: "Proposition de nomination à un poste HH",
      hint: (
        <div>
          <p>
            <ul>
              <li>
                Pour les magistrats ayant pris leur premier poste avant le 1er
                septembre 2020 :
              </li>
            </ul>
            Le magistrat proposé doit avoir exercé au moins deux fonctions au
            1er grade. Si ces deux fonctions sont juridictionnelles, elles
            doivent avoir été exercées dans deux juridictions différentes, a
            l'exception des conseillers référendaires et avocats généraux
            référendaires.
          </p>
          <p>
            <ul>
              <li>
                Pour les magistrats ayant pris leur premier poste après le 1er
                septembre 2020 :
              </li>
            </ul>
            Le magistrat proposé doit également avoir effectué une mobilité non
            juridictionnelle (mise à disposition, détachement).
          </p>
          <p>Cf. liste des fonctions dans la magistrature.</p>
        </div>
      ),
    },
    [NominationFile.StatutoryRule
      .LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO]: {
      label:
        "Exercice d'une profession juridique ou fonction publique élective dans le ressort du TJ depuis moins de 5 ans",
      hint: `Le magistrat proposé ne doit pas avoir exercé une profession juridique (article 32 OS : avocat, notaire, huissier / commissaire de justice) ou une fonction publique élective (article 9 OS), dans le ressort du poste pressenti depuis moins de 5 ans.`,
    },
  },
  [NominationFile.RuleGroup.QUALITATIVE]: {
    [NominationFile.QualitativeRule.CONFLICT_OF_INTEREST_PRE_MAGISTRATURE]: {
      label: "Conflit d'intérêt avec parcours pré-magistrature",
      hint: (
        <div>
          <p>
            On s'assure qu'il n'y a pas de proximité sectorielle et géographique
            avec un précédent poste exercé par le magistrat proposé, hors de la
            magistrature.
          </p>
          <p>
            Exemples de conflits d'intérêt :
            <ul>
              <li>
                Un ancien directeur de centre pénitentiaire sera difficilement
                proposé pour un poste de juge d'application des peines dans la
                même région.
              </li>
              <li>
                Un ancien éducateur de la protection judiciaire de la jeunesse
                sera difficilement proposé pour un poste de juge des enfants
                dans la même région.
              </li>
            </ul>
          </p>
        </div>
      ),
    },
    [NominationFile.QualitativeRule
      .CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION]: {
      label: "Conflit d'intérêt avec la profession d'un proche",
      hint: (
        <div>
          <p>
            <ul>
              <li>Professions para-judiciaires :</li>
            </ul>
            On s'assure qu'il n'y a pas de proximité sectorielle et géographique
            avec un précédent poste exercé par le proche, hors de la
            magistrature.
          </p>
          <p>Exemples de conflits d'intérêt :</p>
          <p>
            <ul>
              <li>
                <li>
                  Une personne dont le proche est directeur de centre
                  pénitentiaire sera difficilement proposé pour un poste de juge
                  d'application des peines dans la même région.
                </li>
                <li>
                  Une personne dont le proche est éducateur de la protection
                  judiciaire de la jeunesse sera difficilement proposé pour un
                  poste de juge des enfants dans la même région.
                </li>
              </li>
            </ul>
          </p>
          <p>
            <ul>
              <li>Proche en poste dans le ressort de la cour d'appel :</li>
            </ul>
            Si le magistrat proposé est pressenti pour un poste dans une
            juridiction du même ressort que celui où son proche est en poste, on
            s'assure de l'absence d'un lien hiérarchique.
          </p>
        </div>
      ),
    },
    [NominationFile.QualitativeRule.EVALUATIONS]: {
      label: "Évaluations",
      hint: `S'assurer qu'une évaluation de moins de 2 ans apparait dans le
dossier.

Voir rubrique dossier > E - Evaluations dans LOLFI.`,
    },
    [NominationFile.QualitativeRule.DISCIPLINARY_ELEMENTS]: {
      label: "Éléments disciplinaires",
      hint: `Voir rubrique dossier > C - incidents, discipline dans LOLFI.`,
    },
    // supprimé ?
    // [NominationFile.QualitativeRule.HH_NOMINATION_CONDITIONS]: {
    //   label: "Conditions de nomination HH",
    //   hint: ``,
    // },
  },
};

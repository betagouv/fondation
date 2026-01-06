import { AuthGuard } from '@/components/guards/AuthGuard';
import { AUTHORIZED_ROLES } from '@/constants/authorized-roles.constants';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Button from '@codegouvfr/react-dsfr/Button';
import { useUser } from '@queries/auth.queries';
import { useLocation } from 'react-router-dom';

export function HelpPage() {
  const location = useLocation();

  return (
    <AuthGuard authorizedRoles={AUTHORIZED_ROLES.ALL}>
      <article className="fr-container fr-py-5w mx-auto w-5/12">
        <h1>Aide</h1>

        <section>
          <h2>Règles d'analyse d'un dossier d'une transparence</h2>
          <Accordion
            label="Règles statutaires"
            titleAs="h3"
            defaultExpanded={location.hash?.startsWith('#regle-statutaire') ?? false}
          >
            <ol>
              <li id="regle-statutaire-passage-parquet-siege-meme-juridiction-moins-de-5-ans">
                <h4 className="text-lg">
                  Passage parquet / siège ou inversement au sein d'une même juridiction en moins de 5 ans
                </h4>
                <p>
                  Passage du siège au parquet ou Inversement au sein d'une même juridiction, sans l'avoir
                  quitté dans les 5 ans.
                </p>
                <p>
                  <em className="ml-4 text-sm">Cf. liste des fonctions dans la magistrature</em>
                </p>
              </li>
              <li id="regle-statutaire-avancement-sur-place-apres-7-ans">
                <h4 className="text-lg">Avancement sur place après 7 ans</h4>

                <p>
                  Prendre son avancement du 2<sup>nd</sup> au 1<sup>er</sup> grade dans une même juridiction
                  après 7&nbsp;ans (Art&nbsp;2 de l'OS).
                </p>
              </li>
              <li id="regle-statutaire-nomination-administration-avant-3-ans">
                <h4 className="text-lg">Nomination à l'administration centrale avant 3 ans de fonction</h4>
                <p>
                  Impossibilité d'être nommé à l'administration centrale avant 3 ans d'exercice en
                  juridiction. Sur la transparence, le poste apparait comme "substitut à l'administration
                  centrale de la justice".
                </p>
              </li>
              <li id="regle-statutaire-nomination-cabinet-ministeriel-avant-4-ans">
                <h4 className="text-lg">Nomination en cabinet ministériel avant 4 ans de fonction</h4>
                <p>
                  Impossibilité d'être nommé en cabinet ministériel avant une durée de 4 ans d'exercice. Si le
                  magistrat proposé n'a pas 4 ans d'exercice et qu'il est pressenti pour un poste en cabinet,
                  l'avis est nécessairement défavorable&nbsp;: cette règle étant statutairement exigée pour
                  une nomination en cabinet.
                </p>
              </li>
              <li id="regle-statutaire-avancement-sans-inscription-au-tableau">
                <h4 className="text-lg">Proposition d'avancement sans inscription au tableau</h4>
                <p>
                  Le magistrat proposé doit être inscrit au tableau pour prendre son grade. À vérifier dans
                  l'espace LOLFI du magistrat proposé
                </p>
              </li>
              <li id="regle-statutaire-proposition-hh">
                <h4 className="text-lg">Proposition de nomination à un poste HH</h4>
                <p>
                  Pour les magistrats ayant pris leur premier poste <em>avant</em> le 1<sup>er</sup> septembre
                  2020&nbsp;: Le magistrat proposé doit avoir exercé au moins deux fonctions au 1er grade. Si
                  ces deux fonctions sont juridictionnelles, elles doivent avoir été exercées dans deux
                  juridictions différentes, a l'exception des conseillers référendaires et avocats généraux
                  référendaires.
                </p>
                <p>
                  Pour les magistrats ayant pris leur premier poste <em>après</em> le 1<sup>er</sup> septembre
                  2020&nbsp;: Le magistrat proposé doit également avoir effectué une mobilité non
                  juridictionnelle (mise à disposition, détachement).
                </p>
                <p>
                  <em className="ml-4 text-sm">Cf. liste des fonctions dans la magistrature</em>
                </p>
              </li>
              <li id="regle-statutaire-exercice-profession-ressort-tj-moins-de-5-ans">
                <h4 className="text-lg">
                  Exercice d'une profession juridique ou fonction publique élective dans le ressort du TJ
                  depuis moins de 5 ans
                </h4>
                <p>
                  Le magistrat proposé ne doit pas avoir exercé une profession juridique (article 32 OS :
                  avocat, notaire, huissier / commissaire de justice). Le magistrat ne peut être nommé dans
                  une juridiction dans le ressort de laquelle se trouve tout ou partie du département dont son
                  conjoint est député ou sénateur.
                </p>
                <p>
                  Il ne peut exercer un mandat de conseiller régional, de conseiller départemental, de
                  conseiller municipal ou de conseiller d'arrondissement, de conseiller de Paris, de
                  conseiller de la métropole de Lyon, de conseiller de l'Assemblée de Corse, de conseiller de
                  l'Assemblée de Guyane ou de conseiller de l'Assemblée de Martinique dans le ressort de la
                  juridiction où il est proposé.{' '}
                </p>
                <p>
                  Il ne peut être nommé magistrat ni le demeurer dans une juridiction dans le ressort de
                  laquelle il aura exercé depuis moins de cinq ans, une fonction publique élective ou fait
                  acte de candidature à l'un de ces mandats, à l'exception du mandat de représentant au
                  Parlement européen, depuis moins de trois ans (article 9 OS).
                </p>
              </li>
              <li id="regle-statutaire-incompatibilite-fonction-proche">
                <h4 className="text-lg">
                  <div>Incompatibilité avec la fonction d'un proche</div>
                  <div className="text-sm font-normal">Proche = conjoint / concubin / parent ou allié</div>
                </h4>
                <p>
                  Conjoint député ou sénateur (article 9 OS) : le magistrat proposé ne peut être nommé dans le
                  ressort où son conjoint est député ou sénateur&nbsp;
                </p>
                <p>
                  Proche (jusqu'au 3ème degré) en poste dans la même juridiction (L111-10 COJ) : le magistrat
                  proposé ne peut pas, sauf dispense de la DSJ, être nommé dans la même juridiction que son
                  proche. (voir rubrique desiderata du dossier LOLFI du magistrat proposé)
                </p>
                <p>
                  Aucune dispense ne peut être accordée dans les cas suivants&nbsp;: la juridiction ne
                  comprend qu'une chambre&nbsp;; le proche est le chef de la juridiction ou le chef du parquet
                  près celle-ci.
                </p>
              </li>
              <li id="regle-statutaire-retour-avant-5-ans-sur-specialise-avant-9-ans">
                <h4 className="text-lg">
                  Retour avant une durée de 5 ans sur des fonctions spécialisés occupées pendant la durée
                  maximale de 9 ans
                </h4>
                <p>Article 28-4 de l’OS : </p>
                <blockquote className="italic">
                  <p>
                    Nul ne peut être nommé pour exercer une fonction spécialisée (JLD / JE / JI / JAP / JCP)
                    dans une juridiction au sein de laquelle il a exercé les mêmes fonctions durant plus de
                    neuf années avant l'expiration d'un délai de cinq ans à compter de la cessation de ses
                    fonctions au sein de cette juridiction.
                  </p>
                </blockquote>
              </li>
              <li id="regle-statutaire-nomination-ca-avant-4-ans">
                <h4 className="text-lg">
                  Nomination pour sur un poste de conseiller CA ou de substitut général CA du second grade
                  avant 4 ans de fonction
                </h4>
                <p>Article 10 du décret du 7/01/1993 pris pour l'application de l'OS&nbsp;:</p>
                <blockquote className="italic">
                  <p>
                    Nul magistrat du second grade ne peut être nommé aux fonctions de conseiller ou de
                    substitut général de cour d'appel s'il n'a accompli quatre années de services effectifs
                    dans le corps judiciaire depuis son entrée dans la magistrature
                  </p>
                </blockquote>
              </li>
            </ol>
          </Accordion>

          <Accordion
            label="Lignes directrices de gestion"
            titleAs="h3"
            defaultExpanded={location.hash?.startsWith('#ligne-directrice')}
          >
            <ol>
              <li id="ligne-directrice-mutation-avant-3-ans">
                <h4 className="text-lg">Mutation avant 3 ans</h4>
                <p>
                  Un magistrat est, par principe, dans l’obligation de rester 3 ans dans ses fonctions avant
                  nouvelle mobilité. Exceptions possibles à justifier (voir note de présentation DSJ).
                </p>

                <blockquote className="font-serif italic">
                  <p>Date de prise de poste pressentie — Date de prise de poste ≥ 3 ans</p>
                </blockquote>

                <p>
                  <ul>
                    <li>Si OK pas d’erreur.</li>
                    <li>Si KO erreur</li>
                  </ul>
                </p>
                <p>Non bloquant car exceptions possibles à justifier.</p>
              </li>

              <li id="ligne-directrice-avancement-sur-place">
                <h4 className="text-lg">Avancement sur place</h4>
                <p>
                  Par principe, la mobilité géographique est privilégiée pour réaliser un avancement (1er
                  grade, HH). Les motivations des dérogations sont à vérifier dans la note de présentation
                  DSJ.
                </p>
              </li>

              <li id="ligne-directrice-parquet-siege-meme-ressort">
                <h4 className="text-lg">Passage parquet / siège ou inversement au sein d'un même ressort</h4>
                <p>
                  Au sein d'une même cour d'appel, passage du siège au parquet entre le TJ et la CA et
                  inversement. Comme la CA a une vision macro de tous les dossiers du ressort, les risques de
                  se retrouver en situation de conflit d’intérêt sur ses anciens dossiers sont plus forts.
                </p>
                <p>
                  Passage du siège au parquet (ou inversement) entre 2 TJ du ressort d'une même CA. Avoir une
                  vigilance particulière pour les infra-pôles.
                </p>
              </li>
            </ol>
          </Accordion>

          <Accordion
            label="Autres items à vérifier"
            titleAs="h3"
            defaultExpanded={location.hash?.startsWith('#autre')}
          >
            <ol>
              <li id="autre-conflit-interet-parcours-pre-magistrature">
                <h4 className="text-lg">Conflit d'intérêt avec parcours pré-magistrature</h4>
                <p>
                  On s'assure qu'il n'y a pas de proximité sectorielle et géographique avec un précédent poste
                  exercé par le magistrat proposé, hors de la magistrature.
                </p>
                <p>Exemples de conflits d'intérêt :</p>
                <blockquote>
                  <p>
                    un ancien directeur de centre pénitentiaire sera difficilement proposé pour un poste de
                    juge d’application des peines dans la même région un ancien éducateur de la protection
                    judiciaire de la jeunesse sera difficilement proposé pour un poste de juge des enfants
                    dans la même région.
                  </p>
                </blockquote>
              </li>

              <li id="autre-conflit-interet-profession-proche">
                <h4 className="text-lg">
                  <div>Conflit d'intérêt avec la profession d'un proche</div>
                  <div className="text-sm font-normal">Proche = conjoint / concubin / parent ou allié</div>
                </h4>
                <p>
                  Professions para-judiciaires&nbsp;: On s'assure qu'il n'y a pas de proximité sectorielle et
                  géographique avec un précédent poste exercé par le proche, hors de la magistrature.
                </p>
                <p>Exemples de conflits d'intérêt&nbsp;:</p>
                <ul>
                  <li>
                    une personne dont le proche est directeur de centre pénitentiaire sera difficilement
                    proposé pour un poste de juge d’application des peines dans la même région.
                  </li>
                  <li>
                    une personne dont le proche est éducateur de la protection judiciaire de la jeunesse sera
                    difficilement proposé pour un poste de juge des enfants dans la même région.
                  </li>
                </ul>
                <p>
                  Proche en poste dans le ressort de la cour d'appel&nbsp;: Si le magistrat proposé est
                  pressenti pour un poste dans une juridiction du même ressort que celui où son proche est en
                  poste, on s'assure de l'absence d'un lien hiérarchique.
                </p>
              </li>

              <li id="autre-evaluations">
                <h4 className="text-lg">Evaluations</h4>
                <p>S'assurer qu'une évaluation de moins de 2 ans apparait dans le dossier.</p>
                <p className="ml-4 text-sm italic">Voir rubrique dossier &gt; E - Evaluations dans LOLFI</p>
              </li>
              <li id="autre-elements-disciplinaires">
                <h4 className="text-lg">Éléments disciplinaires</h4>
                <p className="ml-4 text-sm italic">
                  Voir rubrique dossier &gt; C - incidents, discipline dans LOLFI
                </p>
              </li>
            </ol>
          </Accordion>
        </section>
      </article>
    </AuthGuard>
  );
}

export function HelpPageButton() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Button linkProps={{ to: ROUTE_PATHS.HELP }} iconId="fr-icon-questionnaire-line" className="self-center">
      Centre d'aide
    </Button>
  );
}

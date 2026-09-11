import { FormattedMessage, useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';

const LIST_CLASS = 'fr-mb-6v flex list-inside list-disc flex-col gap-2';

export function AccessibilityPage() {
  const { formatMessage } = useIntl();

  return (
    <PageContentLayout>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de la déclaration d'accessibilité" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: "Déclaration d'accessibilité" }),
          segments: [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }],
        }}
        id="accessibility-breadcrumb"
      />

      <article className="max-w-3xl">
        <h1>
          <FormattedMessage defaultMessage="Déclaration d'accessibilité" />
        </h1>

        <p>
          <FormattedMessage
            defaultMessage={
              `Le Conseil supérieur de la magistrature s'engage à rendre son service Fondation accessible ` +
              `conformément à l'article 47 de la loi n° 2005-102 du 11 février 2005.`
            }
          />
        </p>

        <h2>
          <FormattedMessage defaultMessage="État de conformité" />
        </h2>
        <p>
          <FormattedMessage
            defaultMessage={
              `Fondation n'est pas conforme avec le référentiel général d'amélioration de l'accessibilité ` +
              `(RGAA), version 4.1.`
            }
          />
        </p>

        <h2>
          <FormattedMessage defaultMessage="Résultats des tests" />
        </h2>
        <p>
          <FormattedMessage
            defaultMessage={
              `Aucun audit de conformité RGAA n'a été réalisé à ce jour. Le taux de conformité du service ` +
              `n'est donc pas mesuré.`
            }
          />
        </p>
        <p>
          <FormattedMessage
            defaultMessage={
              `Un audit est prévu dans le cadre du plan d'action d'accessibilité de l'équipe, avec l'appui des ` +
              `experts accessibilité de la DINUM. La présente déclaration sera mise à jour à l'issue de cet audit.`
            }
          />
        </p>

        <h2>
          <FormattedMessage defaultMessage="Contenus non accessibles" />
        </h2>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Non conformité" />
        </h3>
        <p>
          <FormattedMessage
            defaultMessage={
              `En l'absence d'audit, la liste des non-conformités ne peut pas être établie de façon exhaustive. ` +
              `Les points suivants concernent des composants hors du champ du DSFR : en effet, le DSFR est plus ` +
              `adapté aux sites vitrines de l'État qu'à une application métier comme Fondation.`
            }
          />
        </p>
        <p>
          <FormattedMessage defaultMessage="Voici les points principaux identifiés à ce stade :" />
        </p>
        <ul className={LIST_CLASS}>
          <li>
            <FormattedMessage defaultMessage="Tableaux complexes et toasts." />
          </li>
          <li>
            <FormattedMessage
              defaultMessage={
                `Éditeur de rapports : les membres, non spécialistes, doivent produire des contenus accessibles ` +
                `(structure, alternatives) relus par d'autres ; l'éditeur doit les y guider.`
              }
            />
          </li>
          <li>
            <FormattedMessage
              defaultMessage={
                `Outils tiers intégrés (en particulier module d'aide sur Notion) : accessibilité non ` +
                `maîtrisable en l'état, à réinternaliser.`
              }
            />
          </li>
          <li>
            <FormattedMessage
              defaultMessage={`Socle "muet" (titres de page, états non annoncés) et PDF générés à baliser.`}
            />
          </li>
          <li>
            <FormattedMessage defaultMessage="Module de plaintes des justiciables à venir, à construire accessible dès l'origine." />
          </li>
        </ul>
        <p>
          <FormattedMessage
            defaultMessage={
              `Le service est conçu à partir du système de design de l'État (DSFR), dont les composants ` +
              `intègrent nativement une part des exigences du RGAA. Cela ne préjuge pas de la conformité de ` +
              `l'ensemble du service, qui reste à établir par audit.`
            }
          />
        </p>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Dérogations pour charge disproportionnée" />
        </h3>
        <p>
          <FormattedMessage defaultMessage="Aucune dérogation n'est invoquée à ce jour." />
        </p>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Contenus non soumis à l'obligation d'accessibilité" />
        </h3>
        <ul className={LIST_CLASS}>
          <li>
            <FormattedMessage defaultMessage="Les pièces jointes aux dossiers déposées par des tiers et intégrées à Fondation" />
          </li>
        </ul>

        <h2>
          <FormattedMessage defaultMessage="Établissement de cette déclaration d'accessibilité" />
        </h2>
        <p>
          <FormattedMessage defaultMessage="Cette déclaration a été mise à jour le 8 septembre 2026." />
        </p>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Technologies utilisées pour la réalisation du service" />
        </h3>
        <ul className={LIST_CLASS}>
          <li>HTML</li>
          <li>CSS</li>
          <li>JavaScript / TypeScript</li>
          <li>React</li>
          <li>
            <FormattedMessage defaultMessage="Système de design de l'État (DSFR)" />
          </li>
        </ul>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Environnement de test" />
        </h3>
        <p>
          <FormattedMessage
            defaultMessage={
              `Aucune vérification de conformité n'a été réalisée à ce jour. Les combinaisons de navigateurs ` +
              `et de technologies d'assistance utilisées seront précisées lors du premier audit.`
            }
          />
        </p>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Outils utilisés lors de l'évaluation" />
        </h3>
        <p>
          <FormattedMessage defaultMessage="Sans objet à ce stade." />
        </p>

        <h3 className="fr-h5">
          <FormattedMessage defaultMessage="Pages du service ayant fait l'objet de la vérification de conformité" />
        </h3>
        <p>
          <FormattedMessage defaultMessage="Sans objet à ce stade. Le périmètre du futur audit portera au minimum sur :" />
        </p>
        <ul className={LIST_CLASS}>
          <li>
            <FormattedMessage defaultMessage="Page d'accueil et connexion" />
          </li>
          <li>
            <FormattedMessage defaultMessage="Parcours de gestion d'une session, secrétariat général" />
          </li>
          <li>
            <FormattedMessage defaultMessage="Parcours de rédaction d'un rapport, membre rapporteur" />
          </li>
          <li>
            <FormattedMessage defaultMessage="Écrans de suivi de séance et exports" />
          </li>
        </ul>

        <h2>
          <FormattedMessage defaultMessage="Retour d'information et contact" />
        </h2>
        <p>
          <FormattedMessage
            defaultMessage={
              `Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le ` +
              `responsable de Fondation pour être orienté vers une alternative accessible ou obtenir le ` +
              `contenu sous une autre forme.`
            }
          />
        </p>
        <ul className={LIST_CLASS}>
          <li>
            <FormattedMessage
              defaultMessage={
                `Envoyer un message à Alice Maintigneux, <alice>alice.maintigneux@justice.fr</alice> ` +
                `ou Rémi Boureau-Lienard, <remi>remi.boureau-lienard@justice.fr</remi>`
              }
              values={{
                alice: (chunks) => (
                  <a className="fr-link" href="mailto:alice.maintigneux@justice.fr">
                    {chunks}
                  </a>
                ),
                remi: (chunks) => (
                  <a className="fr-link" href="mailto:remi.boureau-lienard@justice.fr">
                    {chunks}
                  </a>
                ),
              }}
            />
          </li>
        </ul>
        <p>
          <FormattedMessage
            defaultMessage={
              `Une réponse vous sera apportée dans un délai d'une semaine à compter de l'envoi de votre ` +
              `demande. Si votre demande soulève des questions complexes nécessitant un délai d'examen plus ` +
              `long, la réponse vous indiquera un délai raisonnable pour la réponse définitive.`
            }
          />
        </p>

        <h2>
          <FormattedMessage defaultMessage="Voies de recours" />
        </h2>
        <p>
          <FormattedMessage
            defaultMessage={
              `Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du ` +
              `service un défaut d'accessibilité qui vous empêche d'accéder à un contenu ou à l'un des ` +
              `services, et vous n'avez pas obtenu de réponse satisfaisante.`
            }
          />
        </p>
        <ul className={LIST_CLASS}>
          <li>
            <a
              className="fr-link"
              href="https://www.defenseurdesdroits.fr/nous-contacter-355"
              rel="noopener noreferrer"
              target="_blank"
              title={formatMessage({
                defaultMessage: 'Écrire un message au Défenseur des droits - nouvelle fenêtre',
              })}
            >
              <FormattedMessage defaultMessage="Écrire un message au Défenseur des droits" />
            </a>
          </li>
          <li>
            <a
              className="fr-link"
              href="https://www.defenseurdesdroits.fr/carte-des-delegues"
              rel="noopener noreferrer"
              target="_blank"
              title={formatMessage({
                defaultMessage:
                  'Contacter le délégué du Défenseur des droits près de chez vous - nouvelle fenêtre',
              })}
            >
              <FormattedMessage defaultMessage="Contacter le délégué du Défenseur des droits près de chez vous" />
            </a>
          </li>
          <li>
            <FormattedMessage defaultMessage="Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :" />
          </li>
        </ul>
        <p>
          <FormattedMessage
            defaultMessage={'Défenseur des droits{br}Libre réponse 71120{br}75342 Paris CEDEX 07'}
            values={{ br: <br /> }}
          />
        </p>
      </article>
    </PageContentLayout>
  );
}

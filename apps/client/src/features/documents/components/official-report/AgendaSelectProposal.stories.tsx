import Select from '@codegouvfr/react-dsfr/Select';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';

const MENU_MESSAGES = [
  {
    situation: 'Un rapporteur est affecté mais la transparence n’est pas publiée',
    message: 'Pour l’ordre du jour du 16/09/2026, vous devez publier la transparence aux membres',
  },
  {
    situation: 'Il manque des issues et des rapporteurs',
    message:
      'Pour l’ordre du jour du 22/09/2026, vous devez renseigner l’issue de 3 propositions et affecter un rapporteur à 5 propositions',
  },
  {
    situation: 'La transparence n’a jamais été publiée',
    message: 'Vous devez publier la transparence aux membres dans l’onglet Propositions',
  },
  { situation: 'Aucun ordre du jour', message: 'Vous devez d’abord générer un ordre du jour' },
  {
    situation: 'Tous les ordres du jour sont restitués',
    message: 'Tous les ordres du jour ont déjà un procès verbal',
  },
];

const AVAILABLE = [{ id: 'odj-1', label: 'ODJ 16/09/2026 - Transparence annuelle - IJC - Siège' }];

const BLOCKED = [
  {
    id: 'odj-2',
    label: 'ODJ 17/09/2026 - Transparence annuelle - IJC - Siège',
    reason: 'rapporteur à publier aux membres, 1 proposition sans rapporteur',
  },
  {
    id: 'odj-3',
    label: 'ODJ 22/09/2026 - Transparence annuelle - IJC - Siège',
    reason: '3 propositions sans issue, 5 sans rapporteur',
  },
];

const PER_AGENDA = [
  'Pour les ordres du jour du 16/09/2026 et du 17/09/2026, vous devez publier la transparence aux membres.',
  'Pour l’ordre du jour du 22/09/2026, vous devez renseigner l’issue de 3 propositions et affecter un rapporteur à 5 propositions.',
];

function DocMenu(props: { children: React.ReactNode }) {
  return (
    <MenuRoot defaultOpen>
      <MenuTrigger
        className="self-start py-2!"
        iconId="fr-icon-folder-2-line"
        priority="primary"
        size="small"
      >
        Générer la documentation
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </MenuTrigger>

      <MenuContent>
        <MenuItem iconId="ri-calendar-line">Ordre du jour</MenuItem>
        <MenuItem disabled iconId="ri-file-text-line">
          <span className="flex flex-col items-start text-left">
            Procès verbal
            {props.children}
          </span>
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}

function Panel(props: { children: React.ReactNode; note: string; title: string }) {
  return (
    <section className="flex-1">
      <h2 className="fr-h6 fr-mb-1v">{props.title}</h2>
      <p className="fr-mb-4v text-sm text-(--text-mention-grey)">{props.note}</p>
      {props.children}
    </section>
  );
}

function AgendaSelectProposal() {
  return (
    <div className="fr-container fr-py-8v flex flex-col gap-16">
      <div className="flex flex-col gap-10 md:flex-row">
        <Panel
          note="Seuls les ordres du jour éligibles existent dans la liste. Les autres ont disparu, sans un mot."
          title="Aujourd'hui"
        >
          <Select label="Ordre du jour" nativeSelectProps={{ defaultValue: '' }}>
            <option disabled value="">
              Sélectionner un ordre du jour
            </option>
            {AVAILABLE.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </Select>
        </Panel>

        <Panel
          note="Les ordres du jour bloqués restent visibles, désactivés, chacun avec ce qui lui manque."
          title="Proposition"
        >
          <Select label="Ordre du jour" nativeSelectProps={{ defaultValue: '' }}>
            <option disabled value="">
              Sélectionner un ordre du jour
            </option>
            <optgroup label="Disponibles">
              {AVAILABLE.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Incomplets">
              {BLOCKED.map(({ id, label, reason }) => (
                <option disabled key={id} value={id}>
                  {label} — {reason}
                </option>
              ))}
            </optgroup>
          </Select>
        </Panel>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="fr-h6 fr-mb-1v">Et le bouton « Générer la documentation » ?</h2>
          <p className="fr-mb-0 text-sm text-(--text-mention-grey)">
            Il garde son explication. Le menu dit le chemin le plus court, la liste déroulante ci dessus donne
            le détail une fois entré.
          </p>
        </div>

        <div className="flex flex-col gap-10 pb-72 md:flex-row md:gap-24">
          <Panel
            note="Un seul ordre du jour nommé, celui auquel il manque le moins de choses."
            title="A. Le chemin le plus court"
          >
            <DocMenu>
              <span className="text-xs font-normal text-(--text-mention-grey)">
                {MENU_MESSAGES[0].message} dans l’onglet Propositions
              </span>
            </DocMenu>
          </Panel>

          <Panel
            note="Tous les ordres du jour bloqués, regroupés par action à mener."
            title="B. Un message par action"
          >
            <DocMenu>
              <span className="flex max-w-96 flex-col items-start gap-1 text-xs font-normal text-(--text-mention-grey)">
                {PER_AGENDA.map((sentence) => (
                  <span key={sentence}>{sentence}</span>
                ))}
                <span>Ces actions se font dans l’onglet Propositions.</span>
              </span>
            </DocMenu>
          </Panel>
        </div>

        <table className="fr-table fr-table--sm">
          <caption className="text-left">Les autres situations, même place, même style</caption>
          <thead>
            <tr>
              <th scope="col">Situation</th>
              <th scope="col">Message affiché</th>
            </tr>
          </thead>
          <tbody>
            {MENU_MESSAGES.map(({ message, situation }) => (
              <tr key={situation}>
                <td>{situation}</td>
                <td>{message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const meta = {
  title: 'Session/Documents/Choix de l’ordre du jour (proposition)',
  component: AgendaSelectProposal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AgendaSelectProposal>;

export default meta;

export const Comparaison: StoryObj<typeof meta> = {};

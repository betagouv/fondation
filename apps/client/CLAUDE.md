# Développement front-end

## Recommandations

À garder en tête :

- L'application doit être fluide (des temps de réponse courts) et compréhensible par différents profils d'utilisateurs, y compris ceux qui ont besoin d'une assistance
- On suit les préconisations ARIA et on préfère les implémentations natives du navigateur (Chrome)

Côté technique :

- Toujours privilégier l'inférence de type quand c'est possible. Par exemple, plutôt que d'écrire un composant React ainsi :

```tsx
type MyAwesomeComponentProps = { foo: string };
export const MyAwesomeComponent: React.FC<MyAwesomeComponentProps> = ({ foo }) => <p>{foo}</p>;
```

Préférer :

```tsx
export function MyAwesomeComponent(props: { foo: string }) {
  return <p>{props.foo}</p>;
}
```

- Préférer un `Context` au prop drilling
- Croiser deux sources de données passe par un modèle construit une fois et partagé par un `Context`, pas par un hook appelé à chaque ligne
- Un nom de composant se suffit à lui-même, même dans un dossier déjà ciblé : `MagistratDetailsContent` plutôt que `DetailsContent`
- Le titre d'une story Storybook suit le dossier du composant qu'elle affiche : `Pages/...` pour un écran entier de `src/pages`, `Features/...` pour une brique de `src/features`, `Shared/...` pour un composant générique, `Layout/...` pour la coquille de l'application. Exception : l'en-tête et les tableaux des écrans de session, cœur de l'application, sont rangés sous `Session/<type de session>/...`. Les autres briques d'une session, comme le panneau latéral, restent sous `Features/...`
- Une story montre un écran ou une brique en entier, jamais ses blocs un par un. Elle passe les états par des contrôles qui reprennent les valeurs de l'API : une seule story `Playground` suffit. Seule exception : une story `Usages` à côté, quand une galerie compare des variantes côte à côte (tailles, usages d'une icône)
- Utiliser TanStack Query pour gérer l'état asynchrone de l'application (voir [État asynchrone](#état-asynchrone))

## État asynchrone

La synchronisation entre le client et le serveur utilise TanStack Query et le SDK généré avec [hey-api](https://heyapi.dev/openapi-ts/plugins/sdk).

- Les queries et les mutations vivent dans le dossier [queries](src/queries)
- Chaque hook déclaré ici est responsable de sa propre API, avec ces règles :
  - Chaque query utilise une clé tirée d'un registre de clés déclaré en haut du fichier
  - Chaque clé doit pouvoir être identifiée pour invalider son contenu
  - Si une mutation rend une query périmée, elle l'invalide

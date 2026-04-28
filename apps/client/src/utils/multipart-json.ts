type JsonifiablePrimitive =
  | undefined
  | null
  | number
  | string
  | { toString(): string }
  | { toJSON(): unknown };

type JsonifiableItem =
  | JsonifiablePrimitive
  | Record<
      string,
      | JsonifiablePrimitive
      | JsonifiablePrimitive[]
      | Record<string, JsonifiablePrimitive | JsonifiablePrimitive[]>
    >;

type Jsonifiable = JsonifiableItem | JsonifiableItem[];

export function multipartJson<T extends Jsonifiable>(json: T): T {
  const serialized = JSON.stringify(json);
  const blob = new Blob([serialized], { type: 'application/json' });

  return blob as unknown as T;
}

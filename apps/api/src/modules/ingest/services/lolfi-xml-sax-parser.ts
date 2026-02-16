import { Transform, TransformCallback } from 'node:stream';
import sax from 'sax';

export type LolfiNode = {
  name: string;
  children: LolfiNode[];
  content: string | null;
  attributes: Record<string, string>;
};

class LolfiNodeBuilder {
  #content: string | null = null;

  readonly name: string;
  readonly parent: LolfiNodeBuilder | null = null;
  readonly children: (LolfiNodeBuilder | LolfiNode)[] = [];
  readonly #attributes = new Map<string, string>();

  get attributes() {
    return Object.fromEntries(this.#attributes);
  }

  get content() {
    return this.#content;
  }

  constructor(props: {
    name: string;
    attributes?: Record<string, string>;
    content?: string | null;
    parent?: LolfiNodeBuilder;
  }) {
    this.name = props.name;
    this.#content = props.content ?? null;

    for (const [k, v] of Object.entries(props.attributes ?? {})) {
      if (k === 'null' && v === 'TRUE') {
        this.#content ??= null;
        continue;
      }

      this.#attributes.set(k, v);
    }

    if (props.parent) {
      props.parent.addChild(this);
      this.parent = props.parent;
    }
  }

  close(): LolfiNode {
    const snapshot: LolfiNode = {
      name: this.name,
      content: this.content,
      children: this.children,
      attributes: this.attributes,
    };

    this.parent?.replaceChild(this, snapshot);
    return snapshot;
  }

  setContent(value: string) {
    this.#content = value;
  }

  addChild(node: LolfiNodeBuilder): this {
    this.children.push(node);
    return this;
  }

  protected replaceChild(
    reference: LolfiNodeBuilder,
    snapshot: LolfiNode,
  ): void {
    const idx = this.children.findIndex((x) => x === reference);
    if (idx !== -1) this.children.splice(idx, 1, snapshot);
  }
}

/** takes latin1 encoded xml string as input and streams {@link LolfiNode} */
export class LolfiXmlSaxParser extends Transform {
  private readonly parser: sax.SAXParser;
  private readonly tag: string;
  private readonly predicate: ((node: LolfiNode) => boolean) | undefined;

  private currentNode: LolfiNodeBuilder | null = null;

  constructor(props: { tag: string; predicate?: (row: LolfiNode) => boolean }) {
    super({ readableObjectMode: true });

    this.tag = props.tag;
    this.predicate = props.predicate;

    this.parser = sax.parser(true, {
      normalize: true,
      lowercase: true,
      position: true,
      trim: true,
      xmlns: false,
      noscript: true,
    });

    this.parser.onopentag = this.onOpenTag.bind(this);
    this.parser.onclosetag = this.onCloseTag.bind(this);
    this.parser.ontext = this.onText.bind(this);
  }

  private onOpenTag(node: sax.Tag): void {
    if (this.currentNode === null && node.name !== this.tag) return;

    this.currentNode = new LolfiNodeBuilder({
      name: node.name,
      attributes: node.attributes,
      parent: this.currentNode ?? undefined,
    });
  }

  private onCloseTag(): void {
    if (!this.currentNode) return;

    const node = this.currentNode;
    this.currentNode = node.parent;

    const snapshot = node.close();
    if (this.currentNode === null) {
      const shouldPush = this.predicate?.(node) ?? true;
      if (shouldPush) this.push(snapshot);
    }
  }

  private onText(text: string): void {
    this.currentNode?.setContent(text);
  }

  override _transform(
    chunk: Buffer,
    _encoding: unknown,
    callback: TransformCallback,
  ): void {
    const utf8 = Buffer.from(chunk.toString('latin1'), 'latin1').toString(
      'utf-8',
    );

    this.parser.write(utf8);

    callback();
  }
}

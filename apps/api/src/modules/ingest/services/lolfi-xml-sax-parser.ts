import { Transform, TransformCallback } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
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

/**
 * takes latin1 encoded xml string as input and streams {@link LolfiNode}
 *
 * ```
 * import * as assert from 'node:assert';
 * import { Readable } from 'node:stream';
 * import { pipeline } from 'node:stream/promises'
 *
 * const content = Buffer.from(`
 *  <?xml version="1.0" encoding="ISO-8859-1" ?>
 *  <root>
 *    <subroot>
 *      <entity>
 *        <id>1</id>
 *        <name>Charles</name>
 *        <role null="TRUE" />
 *      </entity>
 *    </subroot>
 *  </root>
 * `, 'latin1')
 *
 * const parser = new LolfiXmlSaxParser({ tag: 'entity' });
 * await pipeline(Readable.from(content), parser, async function* (source: AsyncIterable<LolfiNode>) {
 *   for await (const item of source) {
 *      assert.equal(item, {
 *        name: 'entity', content: null, attributes: {}, children: [
 *          { name: 'id', content: '1', attributes: {}, children: [] },
 *          { name: 'name', content: 'Charles', attributes: {}, children: [] },
 *          { name: 'role', content: null, attributes: {}, children: [] },
 *        ]
 *      })
 *   }
 * })
 * ```
 */
export class LolfiXmlSaxParser extends Transform {
  private readonly parser: sax.SAXParser;
  private readonly tag: string;
  private readonly predicate: ((node: LolfiNode) => boolean) | undefined;

  /** LOLFI specific */
  private readonly stringDecoder = new StringDecoder('latin1');

  private currentNode: LolfiNodeBuilder | null = null;

  constructor(props: {
    /** the tag you want to keep as _primary_ object (the rest will be considered _sub_ objects) */
    tag: string;
    /** mainly when wanting to ignore duplicates */
    predicate?: (row: LolfiNode) => boolean;
  }) {
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

  override _flush(callback: TransformCallback) {
    try {
      const utf8 = this.stringDecoder.end();
      if (utf8.length) this.parser.write(utf8);

      callback();
    } catch (error) {
      callback(error);
    }
  }

  override _transform(
    chunk: Buffer,
    _encoding: unknown,
    callback: TransformCallback,
  ): void {
    try {
      const utf8 = this.stringDecoder.write(chunk);
      if (utf8.length) this.parser.write(utf8);

      callback();
    } catch (error) {
      callback(error);
    }
  }
}

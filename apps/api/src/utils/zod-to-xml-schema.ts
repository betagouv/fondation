/* oxlint-disable */
/** @ts-ignore */

import { z } from 'zod';

/**
 * this file is stored here mainly for historisation reasons, but is not intended to be used
 */

export function zodToXmlSchema<T extends z.ZodObject>(input: {
  schema: T;
  wrapper: string;
  root: string;
}): string {
  const { types, elements } = Object.entries(input.schema.shape)
    .map(([name, property]) => toElement(name, property))
    .reduce(
      (agg, { types, elements }) => {
        agg.types.push(...types);
        agg.elements.push(...elements);
        return agg;
      },
      { types: [] as string[], elements: [] as string[] },
    );

  return `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">

  ${types.join('\n  ')}

  <xs:element name="${input.root}">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="${input.wrapper}" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              ${elements.join('\n              ')}
            </xs:sequence>
            <xs:attribute name="num" type="xs:nonNegativeInteger" use="required" />
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;
}

function toElement(
  name: string,
  property:
    | z.ZodNullable
    | z.ZodOptional
    | z.ZodNumber
    | z.ZodInt
    | z.ZodString
    | z.ZodEnum,
) {
  let isNullable = false;
  let subProperty: z.ZodType = property;
  while (
    subProperty instanceof z.ZodNullable ||
    subProperty instanceof z.ZodOptional ||
    subProperty instanceof z.ZodCatch
  ) {
    isNullable = true;
    subProperty = subProperty.def.innerType as z.ZodType;
  }

  const types: string[] = [];
  const elements: string[] = [];

  switch (subProperty.type) {
    case 'string':
      stringToElement({
        elements,
        types,
        name,
        property: subProperty as z.ZodString,
        isNullable,
      });
      break;
    case 'enum':
      enumToElement({
        elements,
        types,
        name,
        property: subProperty as z.ZodEnum,
        isNullable,
      });
      break;
    case 'number':
      numberToElement({
        elements,
        types,
        name,
        property: subProperty as z.ZodNumber,
        isNullable,
      });
      break;
  }

  return { types, elements };
}

function stringToElement(options: {
  name: string;
  property: z.ZodString;
  isNullable: boolean;
  types: string[];
  elements: string[];
}): void {
  const json: z.core.JSONSchema.JSONSchema = (
    options.property as any
  ).toJSONSchema();

  const restrictions = [
    ...(json.pattern && !options.isNullable
      ? [`<xs:pattern value="${escapeXml(json.pattern)}" />`]
      : []),
    ...(json.pattern && options.isNullable
      ? [`<xs:pattern value="[*]{0}|${escapeXml(json.pattern)}" />`]
      : []),
    ...(json.minLength && !options.isNullable
      ? [`<xs:minLength value="${json.minLength}" />`]
      : []),
    ...(json.maxLength ? [`<xs:maxLength value="${json.maxLength}" />`] : []),
  ];

  if (!options.isNullable && restrictions.length === 0) {
    options.elements.push(
      `<xs:element name="${options.name}" type="xs:string" />`,
    );
    return;
  }

  if (restrictions.length > 0) {
    const simpleType = `
      <xs:simpleType name="${options.name}_simple_type">
        <xs:restriction base="xs:string">
          ${restrictions.join('\n        ')}
        </xs:restriction>
      </xs:simpleType>
    `;
    options.types.push(simpleType);

    if (!options.isNullable) {
      options.elements.push(
        `<xs:element name="${options.name}" type="${options.name}_simple_type" />`,
      );
      return;
    }
  }

  const complexType = `
      <xs:complexType name="${options.name}_nullable">
        <xs:simpleContent>
          <xs:extension base="${restrictions.length === 0 ? `xs:string` : `${options.name}_simple_type`}">
            <xs:attribute name="null" type="xs:string" fixed="TRUE" use="optional" />
          </xs:extension>
        </xs:simpleContent>
      </xs:complexType>
  `;

  options.types.push(complexType);
  options.elements.push(
    `<xs:element name="${options.name}" type="${options.name}_nullable" minOccurs="0" />`,
  );
}

function numberToElement(options: {
  name: string;
  property: z.ZodNumber;
  isNullable: boolean;
  elements: string[];
  types: string[];
}) {
  const json: z.core.JSONSchema.JSONSchema = (
    options.property as any
  ).toJSONSchema();

  let baseType;

  const maximum = !json.exclusiveMaximum ? json.maximum : undefined;
  const minimum = !json.exclusiveMinimum
    ? json.type === 'integer'
      ? typeof json.minimum === 'number' && json.minimum > 1
        ? json.minimum
        : undefined
      : json.minimum
    : undefined;

  const maxExclusive =
    json.exclusiveMaximum === true
      ? json.maximum
      : typeof json.exclusiveMaximum === 'number'
        ? json.exclusiveMaximum
        : undefined;

  const minExclusive =
    json.exclusiveMinimum === true &&
    typeof json.minimum === 'number' &&
    json.minimum > 0
      ? json.minimum
      : typeof json.exclusiveMinimum === 'number' && json.exclusiveMinimum > 1
        ? json.exclusiveMinimum
        : undefined;

  if (json.type === 'integer') {
    if (
      (minimum !== undefined && minimum > 0) ||
      (minExclusive !== undefined && minExclusive >= 0)
    ) {
      baseType = 'xs:positiveInteger';
    } else if (
      (minimum !== undefined && minimum >= 0) ||
      (minExclusive !== undefined && minExclusive >= -1)
    ) {
      baseType = 'xs:nonNegativeInteger';
    } else {
      baseType = 'xs:integer';
    }
  } else {
    baseType = 'xs:double';
  }

  const pattern = options.isNullable
    ? json.type === 'integer'
      ? baseType === 'xs:positiveInteger' ||
        baseType === 'xs:nonNegativeInteger'
        ? /[0-9]*/
        : /-?[0-9]*/
      : /-?[0-9]*(\.[0-9]+)?/
    : undefined;
  baseType = options.isNullable ? 'xs:string' : baseType;

  const restrictions = [
    ...(!pattern && minExclusive !== undefined && !options.isNullable
      ? [`<xs:minExclusive value="${minExclusive}" />`]
      : []),
    ...(!pattern && maxExclusive !== undefined
      ? [`<xs:maxExclusive value="${maxExclusive}" />`]
      : []),
    ...(!pattern && minimum !== undefined && !options.isNullable
      ? [`<xs:minInclusive value="${minimum}" />`]
      : []),
    ...(!pattern && maximum !== undefined
      ? [`<xs:maxInclusive value="${maximum}" />`]
      : []),

    ...(pattern
      ? [
          `<xs:pattern value="${escapeXml(pattern.toString().replace(/(^\/|\/$)/g, ''))}" />`,
        ]
      : []),
  ];

  if (!options.isNullable && restrictions.length === 0) {
    options.elements.push(
      `<xs:element name="${options.name}" type="${baseType}" />`,
    );
    return;
  }

  if (restrictions.length > 0) {
    const simpleType = `
    <xs:simpleType name="${options.name}_simple_type">
      <xs:restriction base="${baseType}">
        ${restrictions.join('\n        ')}
      </xs:restriction>
    </xs:simpleType>
  `;
    options.types.push(simpleType);

    if (!options.isNullable) {
      options.elements.push(
        `<xs:element name="${options.name}" type="${options.name}_simple_type" />`,
      );
      return;
    }
  }

  const complexType = `
    <xs:complexType name="${options.name}_nullable">
      <xs:simpleContent>
        <xs:extension base="${restrictions.length > 0 ? `${options.name}_simple_type` : baseType}">
          <xs:attribute name="null" type="xs:string" fixed="TRUE" use="optional" />
        </xs:extension>
      </xs:simpleContent>
    </xs:complexType>
  `;
  options.types.push(complexType);
  options.elements.push(
    `<xs:element name="${options.name}" minOccurs="0" type="${options.name}_nullable" />`,
  );
}

function enumToElement(options: {
  name: string;
  property: z.ZodEnum;
  isNullable: boolean;
  elements: string[];
  types: string[];
}) {
  const json: z.core.JSONSchema.JSONSchema = (
    options.property as any
  ).toJSONSchema();

  if (options.isNullable) {
    const simpleType = `
      <xs:simpleType name="${options.name}_simple_type">
        <xs:restriction base="xs:string">
          <xs:pattern value="${json.enum?.concat('[*]{0}').join('|')}" />
        </xs:restriction>
      </xs:simpleType>
    `;
    const complexType = `
      <xs:complexType name="${options.name}_nullable">
        <xs:simpleContent>
          <xs:extension base="${options.name}_simple_type">
            <xs:attribute name="null" type="xs:string" fixed="TRUE" use="optional" />
          </xs:extension>
        </xs:simpleContent>
      </xs:complexType>
    `;

    options.types.push(simpleType);
    options.types.push(complexType);

    options.elements.push(
      `<xs:element name="${options.name}" type="${options.name}_nullable" minOccurs="0" />`,
    );
    return;
  }

  const simpleType = `
    <xs:simpleType name="${options.name}_simple_type">
      <xs:restriction base="xs:string">
        ${json.enum?.map((value) => `<xs:enumeration value="${value}" />`).join('\n      ')}
      </xs:restriction>
    </xs:simpleType>
  `;
  options.types.push(simpleType);

  options.elements.push(
    `<xs:element name="${options.name}" type="${options.name}_simple_type" />`,
  );
  return;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\\/g, '');
}

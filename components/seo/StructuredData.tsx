type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

interface StructuredDataProps {
  data: JsonLdValue;
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

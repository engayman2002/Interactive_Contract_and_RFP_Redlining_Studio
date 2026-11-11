/**
 * Browser-Native OpenXML (.docx) ZIP Archive Builder & OS "Save As" Downloader
 *
 * Generates genuine Microsoft Word `.docx` OpenXML ZIP packages (`PK\x03\x04`)
 * completely in-browser with zero external dependencies, supporting:
 * - `track_changes`: native Word `<w:ins>` / `<w:del>` / `<w:delText>` revision markup
 * - `clean`: finalized clean agreement text with accepted redlines applied
 * - OS "Save As..." dialog (`window.showSaveFilePicker`) with `<a download>` fallback
 */

import { computeWordDiff } from "@/components/diff/wordDiff";
import type {
  ClauseCommentDTO,
  ClauseDTO,
  ExportMode,
  RedlineSuggestionDTO,
} from "./contracts";

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface ZipEntryInput {
  name: string;
  data: Uint8Array;
}

function buildZipArchiveBytes(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = entry.data;
    const crc = computeCrc32(data);
    const size = data.length;

    // Local File Header (30 bytes + filename)
    const lfh = new Uint8Array(30 + nameBytes.length);
    const lfhView = new DataView(lfh.buffer);
    lfhView.setUint32(0, 0x04034b50, true); // PK\x03\x04
    lfhView.setUint16(4, 20, true); // Version needed: 2.0
    lfhView.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lfhView.setUint16(8, 0, true); // Method: 0 (STORED)
    lfhView.setUint16(10, 0, true); // Mod time
    lfhView.setUint16(12, 0x5421, true); // Mod date
    lfhView.setUint32(14, crc, true);
    lfhView.setUint32(18, size, true);
    lfhView.setUint32(22, size, true);
    lfhView.setUint16(26, nameBytes.length, true);
    lfhView.setUint16(28, 0, true); // Extra field length
    lfh.set(nameBytes, 30);

    localParts.push(lfh, data);

    // Central Directory File Header (46 bytes + filename)
    const cdh = new Uint8Array(46 + nameBytes.length);
    const cdhView = new DataView(cdh.buffer);
    cdhView.setUint32(0, 0x02014b50, true); // PK\x01\x02
    cdhView.setUint16(4, 20, true); // Version made by
    cdhView.setUint16(6, 20, true); // Version needed
    cdhView.setUint16(8, 0x0800, true); // UTF-8 filename flag
    cdhView.setUint16(10, 0, true); // Method: STORED
    cdhView.setUint16(12, 0, true);
    cdhView.setUint16(14, 0x5421, true);
    cdhView.setUint32(16, crc, true);
    cdhView.setUint32(20, size, true);
    cdhView.setUint32(24, size, true);
    cdhView.setUint16(28, nameBytes.length, true);
    cdhView.setUint16(30, 0, true); // Extra len
    cdhView.setUint16(32, 0, true); // Comment len
    cdhView.setUint16(34, 0, true); // Disk number start
    cdhView.setUint16(36, 0, true); // Internal attrs
    cdhView.setUint32(38, 0, true); // External attrs
    cdhView.setUint32(42, offset, true); // Relative offset of LFH
    cdh.set(nameBytes, 46);

    centralParts.push(cdh);
    offset += lfh.length + size;
  }

  const cdOffset = offset;
  const cdSize = centralParts.reduce((sum, p) => sum + p.length, 0);

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // PK\x05\x06
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, entries.length, true);
  eocdView.setUint16(10, entries.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);

  const totalSize = cdOffset + cdSize + eocd.length;
  const out = new Uint8Array(totalSize);
  let cursor = 0;
  for (const part of [...localParts, ...centralParts, eocd]) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="120" w:after="200"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="312E81"/></w:rPr>
  </w:style>
</w:styles>`;

export interface BuildDocxExportInput {
  title: string;
  version?: number;
  mode: ExportMode;
  clauses: ClauseDTO[];
  redlines?: RedlineSuggestionDTO[];
  comments?: ClauseCommentDTO[];
  authorName?: string;
}

export function deriveSafeDocxFilename(title: string, mode: ExportMode): string {
  const cleanTitle =
    title
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 72) || "contract";
  return `${cleanTitle}_${mode}.docx`;
}

export function buildDocxBinaryBytes(input: BuildDocxExportInput): Uint8Array {
  const {
    title,
    version = 1,
    mode,
    clauses,
    redlines = [],
    comments = [],
    authorName = "Redline Studio AI",
  } = input;

  const isoDate = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const escapedAuthor = escapeXml(authorName);
  const orderedClauses = [...clauses].sort(
    (a, b) => a.clause_index - b.clause_index
  );

  const paragraphsXml: string[] = [];

  // Title & Metadata Header
  paragraphsXml.push(
    `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(
      title || "Contract Agreement"
    )}</w:t></w:r></w:p>`
  );
  paragraphsXml.push(
    `<w:p><w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t xml:space="preserve">${escapeXml(
      `Export Mode: ${mode === "track_changes" ? "Track Changes (Redlined)" : "Clean Final Draft"} | Version: v${version} | Exported: ${isoDate}`
    )}</w:t></w:r></w:p>`
  );

  let revisionId = 1;

  for (const clause of orderedClauses) {
    const heading = clause.heading?.trim() || `Clause ${clause.clause_index + 1}`;
    paragraphsXml.push(
      `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(
        heading
      )}</w:t></w:r></w:p>`
    );

    const clauseSuggestions = redlines.filter((r) => r.clause_id === clause.id);
    const clauseComments = comments.filter((c) => c.clause_id === clause.id);
    const activeSuggestion =
      clauseSuggestions.find((r) => r.status === "ACCEPTED" || r.status === "MODIFIED") ??
      clauseSuggestions.find((r) => r.status === "PENDING");

    if (mode === "clean") {
      const cleanText =
        clause.current_text !== clause.original_text
          ? clause.current_text
          : activeSuggestion && activeSuggestion.status === "ACCEPTED"
            ? activeSuggestion.proposed_text
            : clause.current_text;
      paragraphsXml.push(
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(cleanText)}</w:t></w:r></w:p>`
      );
      continue;
    }

    // TRACK_CHANGES mode: diff original_text -> revisedText
    const targetRevisedText =
      clause.current_text !== clause.original_text
        ? clause.current_text
        : activeSuggestion
          ? activeSuggestion.proposed_text
          : clause.current_text;

    if (targetRevisedText === clause.original_text) {
      paragraphsXml.push(
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(
          clause.original_text
        )}</w:t></w:r></w:p>`
      );
    } else {
      const tokens = computeWordDiff(clause.original_text, targetRevisedText);
      const runsXml = tokens
        .map((token, idx) => {
          const prefixSpace = idx > 0 ? " " : "";
          const content = `${prefixSpace}${token.text}`;
          if (token.type === "equal") {
            return `<w:r><w:t xml:space="preserve">${escapeXml(content)}</w:t></w:r>`;
          }
          const rev = revisionId;
          revisionId += 1;
          if (token.type === "delete") {
            return `<w:del w:id="${rev}" w:author="${escapedAuthor}" w:date="${isoDate}"><w:r><w:rPr><w:color w:val="B91C1C"/><w:strike/></w:rPr><w:delText xml:space="preserve">${escapeXml(
              content
            )}</w:delText></w:r></w:del>`;
          }
          return `<w:ins w:id="${rev}" w:author="${escapedAuthor}" w:date="${isoDate}"><w:r><w:rPr><w:color w:val="047857"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${escapeXml(
            content
          )}</w:t></w:r></w:ins>`;
        })
        .join("");

      paragraphsXml.push(`<w:p>${runsXml}</w:p>`);
    }

    // Rationale callouts
    for (const s of clauseSuggestions) {
      paragraphsXml.push(
        `<w:p><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="4338CA"/></w:rPr><w:t xml:space="preserve">${escapeXml(
          `[AI Redline Rationale — ${s.status} | Risk: ${s.risk}] `
        )}</w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="19"/><w:color w:val="475569"/></w:rPr><w:t xml:space="preserve">${escapeXml(
          s.rationale
        )}</w:t></w:r></w:p>`
      );
    }

    // Reviewer comment callouts
    for (const comment of clauseComments) {
      paragraphsXml.push(
        `<w:p><w:r><w:rPr><w:b/><w:sz w:val="19"/><w:color w:val="0F766E"/></w:rPr><w:t xml:space="preserve">${escapeXml(
          `[Reviewer Comment] `
        )}</w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="19"/><w:color w:val="334155"/></w:rPr><w:t xml:space="preserve">${escapeXml(
          comment.body
        )}</w:t></w:r></w:p>`
      );
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${paragraphsXml.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const encoder = new TextEncoder();
  return buildZipArchiveBytes([
    { name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES_XML) },
    { name: "_rels/.rels", data: encoder.encode(ROOT_RELS_XML) },
    {
      name: "word/_rels/document.xml.rels",
      data: encoder.encode(DOCUMENT_RELS_XML),
    },
    { name: "word/styles.xml", data: encoder.encode(STYLES_XML) },
    { name: "word/document.xml", data: encoder.encode(documentXml) },
  ]);
}

export function buildDocxBinaryBlob(input: BuildDocxExportInput): Blob {
  const bytes = buildDocxBinaryBytes(input);
  const ownedBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ownedBuffer).set(bytes);
  return new Blob([ownedBuffer], { type: DOCX_MIME_TYPE });
}

interface SaveFilePickerWritable {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface SaveFilePickerHandle {
  name?: string;
  createWritable: () => Promise<SaveFilePickerWritable>;
}

interface WindowWithSaveFilePicker extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SaveFilePickerHandle>;
}

/**
 * Triggers a native OS "Save As..." dialog (`window.showSaveFilePicker`) in supported
 * desktop browsers with automatic `<a download>` browser download fallback.
 */
export async function triggerBrowserDocxDownload(
  blob: Blob,
  suggestedFilename: string,
  options: { forceInTest?: boolean } = {}
): Promise<string> {
  if (typeof window === "undefined") {
    return suggestedFilename;
  }

  const isAutomatedTestEnv =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST));

  if (isAutomatedTestEnv && !options.forceInTest) {
    return suggestedFilename;
  }

  const pickerWindow = window as WindowWithSaveFilePicker;
  if (typeof pickerWindow.showSaveFilePicker === "function") {
    try {
      const fileHandle = await pickerWindow.showSaveFilePicker({
        suggestedName: suggestedFilename,
        types: [
          {
            description: "Microsoft Word Document (.docx)",
            accept: { [DOCX_MIME_TYPE]: [".docx"] },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return fileHandle.name || suggestedFilename;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User explicitly cancelled the Save As dialog
        return suggestedFilename;
      }
      // Fall through to standard <a download> trigger if picker failed (e.g. iframe / gesture restriction)
    }
  }

  if (typeof URL.createObjectURL === "function") {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = suggestedFilename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => {
      if (typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(objectUrl);
      }
    }, 5000);
  }

  return suggestedFilename;
}

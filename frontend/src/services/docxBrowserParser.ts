/**
 * Browser-Native OpenXML (.docx) ZIP Parser & Binary Text Sanitizer
 *
 * Parses real `.docx` ZIP archives (`PK\x03\x04`) in browser and Node/JSDOM
 * runtimes without external npm dependencies using Web standard
 * `DecompressionStream("deflate-raw")`, Central Directory + Data Descriptor
 * resolution, WordprocessingML (`word/document.xml`) extraction, and strict
 * binary corruption guards.
 */

const ZIP_LOCAL_HEADER_SIG = 0x04034b50;
const ZIP_CENTRAL_HEADER_SIG = 0x02014b50;
const ZIP_EOCD_SIG = 0x06054b50;
const ZIP_DATA_DESCRIPTOR_SIG = 0x08074b50;

const CORRUPT_ARCHIVE_MARKERS = [
  "PK\u0003\u0004",
  "PK\u0001\u0002",
  "word/numbering.xml",
  "word/document.xml",
  "word/styles.xml",
  "word/fontTable.xml",
  "[Content_Types].xml",
  "_rels/.rels",
];

function toOwnedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    return new Uint8Array(ab);
  }
  if (typeof FileReader !== "undefined") {
    return await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          resolve(new Uint8Array());
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
      reader.readAsArrayBuffer(file);
    });
  }
  const fallbackText = await file.text();
  return new TextEncoder().encode(fallbackText);
}

export function isZipMagicBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

export function isPdfMagicBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  );
}

export function isCorruptBinaryText(text: string): boolean {
  if (!text) {
    return false;
  }
  for (const marker of CORRUPT_ARCHIVE_MARKERS) {
    if (text.includes(marker)) {
      return true;
    }
  }
  if (text.includes("%PDF-") && text.includes("endobj")) {
    return true;
  }

  let replacementCount = 0;
  let controlCount = 0;
  const sampleLen = Math.min(text.length, 4000);
  for (let i = 0; i < sampleLen; i += 1) {
    const code = text.charCodeAt(i);
    if (code === 0xfffd) {
      replacementCount += 1;
    } else if (
      code <= 0x08 ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f
    ) {
      controlCount += 1;
    }
  }

  if (replacementCount >= 3 || controlCount >= 4) {
    return true;
  }
  return sampleLen > 0 && (replacementCount + controlCount) / sampleLen > 0.015;
}

export function sanitizeExtractedDocumentText(raw: string): string {
  if (!raw) {
    return "";
  }

  let cleaned = raw;
  for (const marker of CORRUPT_ARCHIVE_MARKERS) {
    if (cleaned.includes(marker)) {
      cleaned = cleaned.split(marker).join(" ");
    }
  }

  cleaned = cleaned
    // Strip binary XML/archive metadata paths if any lingered
    .replace(/\b(?:word|docProps|_rels|customXml)\/[A-Za-z0-9_./-]+\.xml\b/gi, " ")
    // Strip UTF-8 replacement & control characters
    .replace(/\uFFFD+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, " ")
    .replace(/\r\n?/g, "\n")
    // Normalize horizontal whitespace on each line while preserving newlines
    .replace(/[ \t\u00A0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return "";
  }

  // Ensure meaningful natural language characters exist (Latin, Arabic, CJK, etc.)
  const letterMatches = cleaned.match(/[\p{L}]/gu);
  if (!letterMatches || letterMatches.length < 10) {
    return "";
  }

  // Reject binary strings where symbols/punctuation overwhelm letters
  const ratio = letterMatches.length / Math.max(1, cleaned.replace(/\s+/g, "").length);
  if (ratio < 0.35) {
    return "";
  }

  return cleaned;
}

function readUint16LE(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

interface ZipEntrySlice {
  name: string;
  compressionMethod: number;
  compressedBytes: Uint8Array;
}

function findNextZipBoundary(bytes: Uint8Array, startOffset: number): number {
  const limit = bytes.length - 4;
  for (let i = startOffset; i <= limit; i += 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b) {
      const b2 = bytes[i + 2];
      const b3 = bytes[i + 3];
      if (
        (b2 === 0x03 && b3 === 0x04) ||
        (b2 === 0x01 && b3 === 0x02) ||
        (b2 === 0x07 && b3 === 0x08) ||
        (b2 === 0x05 && b3 === 0x06)
      ) {
        return i;
      }
    }
  }
  return bytes.length;
}

function findZipEntriesFromCentralDirectory(
  bytes: Uint8Array,
  view: DataView
): ZipEntrySlice[] {
  const minOffset = Math.max(0, bytes.length - 65557);
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= minOffset; i -= 1) {
    if (readUint32LE(view, i) === ZIP_EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    return [];
  }

  const totalEntries = readUint16LE(view, eocdOffset + 10);
  const cdSize = readUint32LE(view, eocdOffset + 12);
  const cdOffset = readUint32LE(view, eocdOffset + 16);
  if (cdOffset + cdSize > bytes.length) {
    return [];
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  const entries: ZipEntrySlice[] = [];
  let cursor = cdOffset;

  for (let idx = 0; idx < totalEntries && cursor + 46 <= bytes.length; idx += 1) {
    if (readUint32LE(view, cursor) !== ZIP_CENTRAL_HEADER_SIG) {
      break;
    }
    const compressionMethod = readUint16LE(view, cursor + 10);
    const compressedSize = readUint32LE(view, cursor + 20);
    const fileNameLen = readUint16LE(view, cursor + 28);
    const extraLen = readUint16LE(view, cursor + 30);
    const commentLen = readUint16LE(view, cursor + 32);
    const localHeaderOffset = readUint32LE(view, cursor + 42);

    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + fileNameLen);
    const name = decoder.decode(nameBytes);

    cursor += 46 + fileNameLen + extraLen + commentLen;

    if (
      localHeaderOffset + 30 <= bytes.length &&
      readUint32LE(view, localHeaderOffset) === ZIP_LOCAL_HEADER_SIG
    ) {
      const lfhNameLen = readUint16LE(view, localHeaderOffset + 26);
      const lfhExtraLen = readUint16LE(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
      const dataEnd = Math.min(bytes.length, dataStart + compressedSize);
      if (dataEnd >= dataStart) {
        entries.push({
          name,
          compressionMethod,
          compressedBytes: bytes.subarray(dataStart, dataEnd),
        });
      }
    }
  }

  return entries;
}

function findZipEntriesFromLocalHeaders(
  bytes: Uint8Array,
  view: DataView
): ZipEntrySlice[] {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const entries: ZipEntrySlice[] = [];
  let cursor = 0;

  while (cursor + 30 <= bytes.length) {
    const sig = readUint32LE(view, cursor);
    if (sig !== ZIP_LOCAL_HEADER_SIG) {
      break;
    }
    const flags = readUint16LE(view, cursor + 6);
    const compressionMethod = readUint16LE(view, cursor + 8);
    let compressedSize = readUint32LE(view, cursor + 18);
    const fileNameLen = readUint16LE(view, cursor + 26);
    const extraLen = readUint16LE(view, cursor + 28);

    const nameStart = cursor + 30;
    const dataStart = nameStart + fileNameLen + extraLen;
    if (dataStart > bytes.length) {
      break;
    }

    const name = decoder.decode(bytes.subarray(nameStart, nameStart + fileNameLen));
    const hasDataDescriptor = (flags & 0x0008) !== 0;

    let dataEnd: number;
    if (compressedSize === 0 && (hasDataDescriptor || compressionMethod === 8)) {
      dataEnd = findNextZipBoundary(bytes, dataStart);
      compressedSize = Math.max(0, dataEnd - dataStart);
    } else {
      dataEnd = Math.min(bytes.length, dataStart + compressedSize);
    }

    entries.push({
      name,
      compressionMethod,
      compressedBytes: bytes.subarray(dataStart, dataEnd),
    });

    cursor = dataEnd;
    if (
      cursor + 4 <= bytes.length &&
      readUint32LE(view, cursor) === ZIP_DATA_DESCRIPTOR_SIG
    ) {
      cursor += 16;
    }
  }

  return entries;
}

interface HuffmanTable {
  counts: Int32Array;
  symbols: Int32Array;
}

const DEFLATE_LEN_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
];
const DEFLATE_LEN_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
];
const DEFLATE_DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DEFLATE_DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
];
const DEFLATE_CL_ORDER = [
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
];

function buildHuffmanTable(lengths: number[]): HuffmanTable {
  const counts = new Int32Array(16);
  for (const len of lengths) {
    if (len > 0 && len < 16) {
      counts[len] += 1;
    }
  }
  const offsets = new Int32Array(16);
  let total = 0;
  for (let len = 1; len <= 15; len += 1) {
    offsets[len] = total;
    total += counts[len];
  }
  const symbols = new Int32Array(total);
  for (let sym = 0; sym < lengths.length; sym += 1) {
    const len = lengths[sym];
    if (len > 0 && len < 16) {
      symbols[offsets[len]] = sym;
      offsets[len] += 1;
    }
  }
  return { counts, symbols };
}

function inflateRawPure(src: Uint8Array): Uint8Array {
  let bytePos = 0;
  let bitBuf = 0;
  let bitCnt = 0;
  const out: number[] = [];

  const readBits = (n: number): number => {
    let val = bitBuf;
    while (bitCnt < n) {
      if (bytePos >= src.length) {
        throw new Error("Unexpected end of DEFLATE stream");
      }
      val |= src[bytePos] << bitCnt;
      bytePos += 1;
      bitCnt += 8;
    }
    bitBuf = val >>> n;
    bitCnt -= n;
    return val & ((1 << n) - 1);
  };

  const decodeSymbol = (table: HuffmanTable): number => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len += 1) {
      code |= readBits(1);
      const count = table.counts[len];
      if (code - count < first) {
        return table.symbols[index + (code - first)];
      }
      index += count;
      first += count;
      first <<= 1;
      code <<= 1;
    }
    throw new Error("Invalid Huffman code in DEFLATE stream");
  };

  let fixedLitTable: HuffmanTable | null = null;
  let fixedDistTable: HuffmanTable | null = null;

  const getFixedTables = (): [HuffmanTable, HuffmanTable] => {
    if (!fixedLitTable || !fixedDistTable) {
      const litLens = new Array<number>(288);
      for (let i = 0; i <= 143; i += 1) litLens[i] = 8;
      for (let i = 144; i <= 255; i += 1) litLens[i] = 9;
      for (let i = 256; i <= 279; i += 1) litLens[i] = 7;
      for (let i = 280; i <= 287; i += 1) litLens[i] = 8;
      const distLens = new Array<number>(32).fill(5);
      fixedLitTable = buildHuffmanTable(litLens);
      fixedDistTable = buildHuffmanTable(distLens);
    }
    return [fixedLitTable, fixedDistTable];
  };

  let isFinal = 0;
  do {
    isFinal = readBits(1);
    const btype = readBits(2);

    if (btype === 0) {
      // Stored uncompressed block
      bitBuf = 0;
      bitCnt = 0;
      if (bytePos + 4 > src.length) {
        throw new Error("Truncated stored DEFLATE block");
      }
      const len = src[bytePos] | (src[bytePos + 1] << 8);
      bytePos += 4;
      const end = Math.min(src.length, bytePos + len);
      for (let i = bytePos; i < end; i += 1) {
        out.push(src[i]);
      }
      bytePos = end;
      continue;
    }

    if (btype === 3) {
      throw new Error("Reserved DEFLATE block type 3");
    }

    let litTable: HuffmanTable;
    let distTable: HuffmanTable;

    if (btype === 1) {
      [litTable, distTable] = getFixedTables();
    } else {
      const hlit = readBits(5) + 257;
      const hdist = readBits(5) + 1;
      const hclen = readBits(4) + 4;
      const clLens = new Array<number>(19).fill(0);
      for (let i = 0; i < hclen; i += 1) {
        clLens[DEFLATE_CL_ORDER[i]] = readBits(3);
      }
      const clTable = buildHuffmanTable(clLens);
      const totalCodes = hlit + hdist;
      const combinedLens = new Array<number>(totalCodes).fill(0);
      let idx = 0;
      while (idx < totalCodes) {
        const sym = decodeSymbol(clTable);
        if (sym < 16) {
          combinedLens[idx] = sym;
          idx += 1;
        } else {
          const prev = sym === 16 ? combinedLens[idx - 1] ?? 0 : 0;
          const rep =
            sym === 16
              ? 3 + readBits(2)
              : sym === 17
                ? 3 + readBits(3)
                : 11 + readBits(7);
          for (let r = 0; r < rep && idx < totalCodes; r += 1) {
            combinedLens[idx] = prev;
            idx += 1;
          }
        }
      }
      litTable = buildHuffmanTable(combinedLens.slice(0, hlit));
      distTable = buildHuffmanTable(combinedLens.slice(hlit));
    }

    while (true) {
      const sym = decodeSymbol(litTable);
      if (sym < 256) {
        out.push(sym);
      } else if (sym === 256) {
        break;
      } else {
        const lenIdx = sym - 257;
        const length = DEFLATE_LEN_BASE[lenIdx] + readBits(DEFLATE_LEN_EXTRA[lenIdx]);
        const distSym = decodeSymbol(distTable);
        const distance =
          DEFLATE_DIST_BASE[distSym] + readBits(DEFLATE_DIST_EXTRA[distSym]);
        for (let k = 0; k < length; k += 1) {
          out.push(out[out.length - distance]);
        }
      }
    }
  } while (isFinal === 0);

  return new Uint8Array(out);
}

async function inflateZipEntry(entry: ZipEntrySlice): Promise<string> {
  if (entry.compressionMethod === 0) {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      entry.compressedBytes
    );
  }

  if (entry.compressionMethod === 8) {
    if (typeof DecompressionStream !== "undefined") {
      try {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        const writePromise = writer
          .write(toOwnedArrayBuffer(entry.compressedBytes))
          .then(() => writer.close());

        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLen = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            chunks.push(value);
            totalLen += value.byteLength;
          }
        }

        await writePromise;

        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.byteLength;
        }

        return new TextDecoder("utf-8", { fatal: false }).decode(merged);
      } catch {
        // Node 18 and older runtimes do not support 'deflate-raw' in DecompressionStream; fall through to pure RFC 1951 inflate
      }
    }

    try {
      const inflated = inflateRawPure(entry.compressedBytes);
      return new TextDecoder("utf-8", { fatal: false }).decode(inflated);
    } catch {
      return "";
    }
  }

  return "";
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
}

export function parseWordprocessingXml(xml: string): string {
  if (!xml) {
    return "";
  }

  // Exclude deleted tracked changes (<w:del>...</w:del>) and field codes
  const withoutDeletions = xml
    .replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/gi, "")
    .replace(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>/gi, "");

  // Convert Word paragraph/row/break tags to structured line breaks & space runs
  const structured = withoutDeletions
    .replace(/<w:tab\b[^>]*\/?>/gi, "<w:t> </w:t>")
    .replace(/<w:(?:cr|br)\b[^>]*\/?>/gi, "<w:t>\n</w:t>")
    .replace(/<\/w:tc>/gi, "<w:t> | </w:t>")
    .replace(/<\/w:(?:p|tr)>/gi, "\n\n");

  const blocks = structured.split(/\n\n+/);
  const extractedParagraphs: string[] = [];

  for (const block of blocks) {
    const tMatches = [...block.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi)];
    let paragraphText = "";
    if (tMatches.length > 0) {
      paragraphText = tMatches.map((m) => decodeXmlEntities(m[1])).join("");
    } else if (!block.includes("<w:") && !block.includes("<?xml")) {
      paragraphText = decodeXmlEntities(block.replace(/<[^>]+>/g, " "));
    }
    const cleanLine = paragraphText.replace(/[ \t]+/g, " ").trim();
    if (cleanLine) {
      extractedParagraphs.push(cleanLine);
    }
  }

  return sanitizeExtractedDocumentText(extractedParagraphs.join("\n\n"));
}

export async function extractTextFromDocxBytes(
  bytes: Uint8Array
): Promise<string> {
  if (!isZipMagicBytes(bytes)) {
    return "";
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let entries = findZipEntriesFromCentralDirectory(bytes, view);
  if (entries.length === 0) {
    entries = findZipEntriesFromLocalHeaders(bytes, view);
  }

  const targetEntry =
    entries.find((e) => e.name.toLowerCase() === "word/document.xml") ??
    entries.find((e) => e.name.toLowerCase().endsWith("document.xml"));

  if (!targetEntry) {
    return "";
  }

  try {
    const xml = await inflateZipEntry(targetEntry);
    return parseWordprocessingXml(xml);
  } catch {
    return "";
  }
}

function extractReadableTextFromPdfBytes(bytes: Uint8Array): string {
  // Decode latin1 so raw byte positions stay 1:1 with PDF tokens
  const latin1 = new TextDecoder("latin1").decode(bytes);
  const chunks: string[] = [];

  // Match PDF text objects and literal string operators: (...) Tj / [...] TJ
  const stringRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(latin1)) !== null) {
    const decoded = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (/[a-zA-Z\u0600-\u06FF]{2,}/.test(decoded)) {
      chunks.push(decoded);
    }
  }

  if (chunks.length === 0) {
    // Also inspect TJ array text strings if present
    const tjArrayRegex = /\[((?:[^[\]]|\((?:[^()\\]|\\.)*\))+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(latin1)) !== null) {
      const parts = [...match[1].matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g)];
      const joined = parts
        .map((p) => p[1].replace(/\\([()\\])/g, "$1"))
        .join("");
      if (/[a-zA-Z\u0600-\u06FF]{2,}/.test(joined)) {
        chunks.push(joined);
      }
    }
  }

  return sanitizeExtractedDocumentText(chunks.join("\n\n"));
}

/**
 * Safely extract clean, human-readable text from `.docx`, `.pdf`, or plain-text files.
 * Never returns raw ZIP `PK\x03\x04` binary bytes or XML archive headers.
 */
export async function extractCleanTextFromFile(file: File): Promise<string> {
  const bytes = await readFileAsBytes(file);
  if (bytes.length === 0) {
    return "";
  }

  if (isZipMagicBytes(bytes)) {
    return await extractTextFromDocxBytes(bytes);
  }

  if (isPdfMagicBytes(bytes)) {
    return extractReadableTextFromPdfBytes(bytes);
  }

  // Plain-text / UTF-8 file (including plain-text mock `.docx` files in tests)
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (isCorruptBinaryText(decoded)) {
    return "";
  }
  return sanitizeExtractedDocumentText(decoded);
}

/**
 * Split clean contract text into structured clauses while keeping numbered/titled
 * headings attached to their clause body and preserving multi-clause granularity.
 */
export function segmentCleanContractClauses(cleanText: string): string[] {
  const sanitized = sanitizeExtractedDocumentText(cleanText);
  if (!sanitized) {
    return [];
  }

  // Split on double newlines OR single newlines that clearly begin a new numbered/headed section
  const rawBlocks = sanitized
    .split(
      /\n\s*\n+|\n(?=(?:\d+(?:\.\d+)*[.)]\s+[A-Z\u0600-\u06FF]|(?:Article|Section|Clause|Part|Exhibit|Artículo|Cláusula|Article\s+|المادة|البند)\s+[A-Z0-9\u0660-\u0669]|[•*-]\s+))/i
    )
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length > 0 && !isCorruptBinaryText(block));

  // Merge standalone short section headings (e.g., "1. Warranty") with their body paragraph
  const merged: string[] = [];
  for (let i = 0; i < rawBlocks.length; i += 1) {
    const current = rawBlocks[i];
    const next = rawBlocks[i + 1];
    const looksLikeStandaloneHeading =
      current.length <= 75 &&
      !current.endsWith(".") &&
      /^(?:\d+(?:\.\d+)*[.)]?|[A-Z][A-Za-z\s&/,-]{2,55}|(?:Article|Section|Clause|Artículo|Cláusula|المادة|البند)\b)/i.test(
        current
      );

    if (looksLikeStandaloneHeading && next && next.length >= 20) {
      merged.push(`${current}: ${next}`);
      i += 1;
    } else if (current.length >= 20) {
      merged.push(current);
    }
  }

  // Deduplicate exact repeated blocks
  const seen = new Set<string>();
  return merged.filter((clause) => {
    const key = clause.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

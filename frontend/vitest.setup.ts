import { webcrypto } from "crypto";
import "@testing-library/jest-dom/vitest";

function toNodeBuffer(input: BufferSource): Buffer {
  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }
  return Buffer.from(new Uint8Array(input));
}

function normalizeAlgorithm(alg: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm | Pbkdf2Params | AesGcmParams): unknown {
  if (typeof alg === "string") {
    return alg;
  }
  const copy: Record<string, unknown> = { ...alg };
  if ("salt" in copy && copy.salt) {
    copy.salt = toNodeBuffer(copy.salt as BufferSource);
  }
  if ("iv" in copy && copy.iv) {
    copy.iv = toNodeBuffer(copy.iv as BufferSource);
  }
  if ("additionalData" in copy && copy.additionalData) {
    copy.additionalData = toNodeBuffer(copy.additionalData as BufferSource);
  }
  return copy;
}

// Bridge JSDOM VM-realm ArrayBuffers to Node's W3C SubtleCrypto implementation
if (typeof globalThis.crypto !== "undefined") {
  const bridgedSubtle = {
    importKey: (
      format: KeyFormat,
      keyData: BufferSource | JsonWebKey,
      algorithm: AlgorithmIdentifier,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ) =>
      webcrypto.subtle.importKey(
        format as "raw",
        format === "jwk" ? (keyData as never) : toNodeBuffer(keyData as BufferSource),
        normalizeAlgorithm(algorithm) as AlgorithmIdentifier,
        extractable,
        keyUsages
      ),
    deriveKey: (
      algorithm: AlgorithmIdentifier,
      baseKey: CryptoKey,
      derivedKeyType: AlgorithmIdentifier,
      extractable: boolean,
      keyUsages: KeyUsage[]
    ) =>
      webcrypto.subtle.deriveKey(
        normalizeAlgorithm(algorithm) as AlgorithmIdentifier,
        baseKey as webcrypto.CryptoKey,
        normalizeAlgorithm(derivedKeyType) as AlgorithmIdentifier,
        extractable,
        keyUsages
      ),
    encrypt: (
      algorithm: AlgorithmIdentifier,
      key: CryptoKey,
      data: BufferSource
    ) =>
      webcrypto.subtle.encrypt(
        normalizeAlgorithm(algorithm) as AlgorithmIdentifier,
        key as webcrypto.CryptoKey,
        toNodeBuffer(data)
      ),
    decrypt: (
      algorithm: AlgorithmIdentifier,
      key: CryptoKey,
      data: BufferSource
    ) =>
      webcrypto.subtle.decrypt(
        normalizeAlgorithm(algorithm) as AlgorithmIdentifier,
        key as webcrypto.CryptoKey,
        toNodeBuffer(data)
      ),
  };

  Object.defineProperty(globalThis.crypto, "subtle", {
    value: bridgedSubtle,
    configurable: true,
  });
}

// Polyfill Element.prototype.scrollIntoView for jsdom testing
if (typeof window !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoViewMock() {
    // no-op in jsdom
  };
}


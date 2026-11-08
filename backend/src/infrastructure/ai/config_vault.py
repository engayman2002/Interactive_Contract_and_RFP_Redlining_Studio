"""Passphrase-protected AEAD vault (PBKDF2-HMAC-SHA256 + AES-256-GCM) for AI settings."""

import base64
import binascii
import hashlib
import json
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Final

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from src.domain.exceptions import DomainValidationError, InvalidAIVaultError

VAULT_VERSION: Final[int] = 1
VAULT_KDF: Final[str] = "PBKDF2-HMAC-SHA256"
VAULT_DEFAULT_ITERATIONS: Final[int] = 600_000
VAULT_MIN_ITERATIONS: Final[int] = 100_000
VAULT_MAX_ITERATIONS: Final[int] = 2_000_000
VAULT_CIPHER: Final[str] = "AES-256-GCM"
VAULT_AAD: Final[bytes] = b"redline-studio-ai-vault-v1"
MIN_PASSPHRASE_LENGTH: Final[int] = 8
_SALT_BYTES: Final[int] = 16
_NONCE_BYTES: Final[int] = 12
_KEY_BYTES: Final[int] = 32
_GCM_TAG_BYTES: Final[int] = 16


@dataclass(frozen=True)
class EncryptedAIVaultEnvelope:
    """Versioned AEAD envelope containing zero plaintext configuration or API keys."""

    vault_version: int
    kdf: str
    iterations: int
    cipher: str
    salt_b64: str
    nonce_b64: str
    ciphertext_b64: str
    exported_at: str


def encrypt_ai_settings_vault(
    payload: dict[str, Any],
    passphrase: str,
) -> EncryptedAIVaultEnvelope:
    """Encrypt an AI settings dictionary with PBKDF2-HMAC-SHA256 (600k) + AES-256-GCM."""
    if len(passphrase) < MIN_PASSPHRASE_LENGTH:
        raise DomainValidationError(
            f"Vault passphrase must be at least {MIN_PASSPHRASE_LENGTH} characters long."
        )

    salt = secrets.token_bytes(_SALT_BYTES)
    nonce = secrets.token_bytes(_NONCE_BYTES)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        passphrase.encode("utf-8"),
        salt,
        VAULT_DEFAULT_ITERATIONS,
        dklen=_KEY_BYTES,
    )

    plaintext_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode(
        "utf-8"
    )
    ciphertext = AESGCM(key).encrypt(nonce, plaintext_bytes, associated_data=VAULT_AAD)

    return EncryptedAIVaultEnvelope(
        vault_version=VAULT_VERSION,
        kdf=VAULT_KDF,
        iterations=VAULT_DEFAULT_ITERATIONS,
        cipher=VAULT_CIPHER,
        salt_b64=base64.b64encode(salt).decode("ascii"),
        nonce_b64=base64.b64encode(nonce).decode("ascii"),
        ciphertext_b64=base64.b64encode(ciphertext).decode("ascii"),
        exported_at=datetime.now(UTC).isoformat(),
    )


def decrypt_ai_settings_vault(
    envelope: EncryptedAIVaultEnvelope,
    passphrase: str,
) -> dict[str, Any]:
    """Authenticate and decrypt an `EncryptedAIVaultEnvelope` using the supplied passphrase."""
    if len(passphrase) < MIN_PASSPHRASE_LENGTH:
        raise InvalidAIVaultError()

    if (
        envelope.vault_version != VAULT_VERSION
        or envelope.kdf != VAULT_KDF
        or envelope.cipher != VAULT_CIPHER
        or not (VAULT_MIN_ITERATIONS <= envelope.iterations <= VAULT_MAX_ITERATIONS)
    ):
        raise InvalidAIVaultError()

    try:
        salt = base64.b64decode(envelope.salt_b64, validate=True)
        nonce = base64.b64decode(envelope.nonce_b64, validate=True)
        ciphertext = base64.b64decode(envelope.ciphertext_b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise InvalidAIVaultError() from exc

    if (
        len(salt) < _SALT_BYTES
        or len(nonce) != _NONCE_BYTES
        or len(ciphertext) <= _GCM_TAG_BYTES
    ):
        raise InvalidAIVaultError()

    key = hashlib.pbkdf2_hmac(
        "sha256",
        passphrase.encode("utf-8"),
        salt,
        envelope.iterations,
        dklen=_KEY_BYTES,
    )

    try:
        plaintext_bytes = AESGCM(key).decrypt(
            nonce,
            ciphertext,
            associated_data=VAULT_AAD,
        )
        decoded = json.loads(plaintext_bytes.decode("utf-8"))
    except (InvalidTag, UnicodeDecodeError, ValueError) as exc:
        raise InvalidAIVaultError() from exc

    if not isinstance(decoded, dict):
        raise InvalidAIVaultError()

    return decoded


__all__ = [
    "EncryptedAIVaultEnvelope",
    "MIN_PASSPHRASE_LENGTH",
    "VAULT_AAD",
    "VAULT_CIPHER",
    "VAULT_DEFAULT_ITERATIONS",
    "VAULT_KDF",
    "VAULT_VERSION",
    "decrypt_ai_settings_vault",
    "encrypt_ai_settings_vault",
]


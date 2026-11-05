"""Secure tenant-isolated file storage adapter implementing FileStoragePort."""

import asyncio
import os
from pathlib import Path
from typing import Final
from uuid import UUID, uuid4

from src.domain.exceptions import (
    EmptyDocumentError,
    EntityNotFoundError,
    InvalidDocumentFormatError,
    TenantIsolationError,
)
from src.domain.ports.ingestion_ports import FileStoragePort

ALLOWED_STORAGE_EXTENSIONS: Final[frozenset[str]] = frozenset({".docx", ".pdf"})


class LocalS3CompatibleStorageAdapter(FileStoragePort):
    """Local / S3-compatible object storage adapter with strict tenant & path-traversal guards.

    TODO(security): Integrate sandboxed antivirus API scan prior to permanent object persistence.
    TODO(security): Integrate Content Disarm and Reconstruction (CDR) to strip macros/scripts.
    """

    def __init__(self, root_path: Path) -> None:
        self._root_path = root_path.resolve()
        self._root_path.mkdir(parents=True, exist_ok=True, mode=0o700)

    def _verify_within_sandbox(self, target_path: Path, tenant_root: Path) -> Path:
        """Verify that `target_path` resolves inside `tenant_root` and `self._root_path`."""
        resolved_target = target_path.resolve()
        resolved_tenant = tenant_root.resolve()
        resolved_global = self._root_path.resolve()

        global_prefix = str(resolved_global) + os.sep
        tenant_prefix = str(resolved_tenant) + os.sep

        if not str(resolved_target).startswith(global_prefix):
            raise TenantIsolationError("Storage path escapes global storage sandbox boundary.")
        if not str(resolved_target).startswith(tenant_prefix):
            raise TenantIsolationError("Storage path escapes tenant organization boundary.")
        return resolved_target

    @staticmethod
    def _extract_safe_extension(filename: str) -> str:
        """Sanitize untrusted filename using basename and allow-list the file extension."""
        safe_basename = os.path.basename(filename.replace("\\", "/")).strip()
        if not safe_basename:
            raise InvalidDocumentFormatError("Uploaded filename cannot be empty.")
        _, ext = os.path.splitext(safe_basename)
        normalized_ext = ext.lower()
        if normalized_ext not in ALLOWED_STORAGE_EXTENSIONS:
            raise InvalidDocumentFormatError(
                f"Unsupported file extension '{normalized_ext}'. Only .docx and .pdf are allowed."
            )
        return normalized_ext

    async def save_file(
        self,
        org_id: UUID,
        document_id: UUID,
        filename: str,
        content: bytes,
    ) -> str:
        """Persist raw uploaded file under `org_id/document_id/<random_uuid>.<ext>`."""
        if not content:
            raise EmptyDocumentError("Cannot store an empty 0-byte document file.")

        ext = self._extract_safe_extension(filename)
        unique_object_name = f"{uuid4().hex}{ext}"

        tenant_dir = (self._root_path / str(org_id) / str(document_id)).resolve()
        target_file = tenant_dir / unique_object_name
        verified_target = self._verify_within_sandbox(target_file, tenant_dir)

        def _write_bytes() -> None:
            tenant_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
            verified_target.write_bytes(content)
            verified_target.chmod(0o600)

        await asyncio.to_thread(_write_bytes)
        return f"{org_id}/{document_id}/{unique_object_name}"

    async def load_file(
        self,
        org_id: UUID,
        document_id: UUID,
        storage_key: str,
    ) -> bytes:
        """Load stored file bytes strictly isolated within `org_id` and `document_id`."""
        expected_prefix = f"{org_id}/{document_id}/"
        if not storage_key.startswith(expected_prefix):
            raise TenantIsolationError(
                "Cross-tenant or cross-document storage key access is forbidden."
            )

        object_name = os.path.basename(storage_key.replace("\\", "/"))
        tenant_dir = (self._root_path / str(org_id) / str(document_id)).resolve()
        target_file = tenant_dir / object_name
        verified_target = self._verify_within_sandbox(target_file, tenant_dir)

        if not verified_target.exists() or not verified_target.is_file():
            raise EntityNotFoundError("Stored document file not found.")

        return await asyncio.to_thread(verified_target.read_bytes)


__all__ = ["LocalS3CompatibleStorageAdapter"]

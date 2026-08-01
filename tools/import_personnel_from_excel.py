"""Disabled release stub for importing real personnel data.

Real personnel data must be validated, encrypted in transit, and imported by the
approved backend administration workflow. The frontend release intentionally
contains no local path, identity mapping, or spreadsheet parser for real staff.
"""

from __future__ import annotations


def main() -> None:
    raise SystemExit(
        "Real personnel import is disabled in the frontend release. "
        "See docs/handoff/vietqs-frontend/SECURE_REAL_DATA_IMPORT.md."
    )


if __name__ == "__main__":
    main()

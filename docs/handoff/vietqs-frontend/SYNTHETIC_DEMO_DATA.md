# Synthetic Demo Data

## Release Contract

This frontend release contains synthetic personnel only. Every demo person:

- has an ID beginning with `demo-`;
- has an employee number beginning with `DEMO-`;
- has a display name beginning with `[DEMO]`;
- uses the reserved `example.invalid` email domain;
- contains no phone, address, birth date, photo, signature, or business-card image;
- belongs to either `CON_COST` or `VIET_QS` with an explicit organization membership.

The fixture preserves representative `ADMIN`, `GRADE_1`, `GRADE_2`, `GRADE_3`,
`GRADE_4`, and `FINANCE_ACCESS` personas. It is not an employee directory and
must never be merged into a production personnel table.

## Files

- `src/data/dummyPersonnel.json`: frontend synthetic dataset
- `json/personnel-cards.json`: export-compatible synthetic dataset
- `dummy/personnel-cards.json`: compact legacy compatibility subset

Run the gate before packaging:

```powershell
node scripts/check-release-pii.mjs .
```

The command must return `PASS` with `findingCount: 0`.

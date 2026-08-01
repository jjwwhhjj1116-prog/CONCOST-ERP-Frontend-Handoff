# AI Assistant Integration

## Frontend Flow

Text flow:

```text
rough notes
→ structured meeting minute
→ decisions / issues / action items
→ citation review
→ user edit and confirmation
→ save candidate
```

Audio flow:

```text
audio file
→ transcription job
→ timed transcript
→ summary
→ decisions / issues / action items
→ human review
→ save candidate
```

The Frontend can prepare Task, Calendar, Approval, and Drive candidates. It does
not persist those records until the user confirms the corresponding command.

## Required Operations

- `getAiCapabilities`
- `createAiTranscriptionJob`
- `createAiSummarizationJob`
- `createProjectMeetingMinute`

Job status, cancellation, feedback, and output-reference operations must be
implemented according to the frozen AI capability contract before activation.

## Security and Review

- Link through canonical `projectId`, `claimServiceProjectId`, `fileId`,
  `aiJobId`, and `outputArtifactId`.
- Preserve citations and source file references.
- Require human review before saving or creating downstream candidates.
- Do not make final legal, accounting, HR, or Project approval decisions.
- Restricted legal, HR, and finance data requires an approved private/local AI
  capability.
- Secrets and credentials are forbidden AI inputs.
- Recording requires consent and a legal basis controlled by Backend policy.
- Provider missing or failed jobs never produce a success state.

Demo results are clearly marked as simulations and are not server records.

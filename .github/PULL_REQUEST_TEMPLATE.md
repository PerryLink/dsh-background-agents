## Checklist

- [ ] CI gates pass locally — `pnpm run typecheck && pnpm test && pnpm run build && git diff --exit-code lib/` (CI additionally runs the pinned-harness pack smoke)
- [ ] Tests added or updated for the behavior change (or a note in the description why none are needed)
- [ ] Release notes updated — this repo documents versions in GitHub releases (no CHANGELOG.md)
- [ ] Multi-language READMEs kept in sync — `README.md` is the source of truth; `README.zh.md` / `README.es.md` / `README.pt.md` / `README.hi.md` follow
- [ ] Related issue linked (e.g. `Fixes #123`)
- [ ] No secrets, tokens, credentials, or personal data in the diff

## Notes for reviewers

<!-- Anything a reviewer should know: scope, migration notes, deliberate stay-behinds. -->

# Source Citations

## Story

As a user, I want to see where information comes from, so I can trust the
content and explore original sources.

## Acceptance Criteria

- [ ] Each node displays source links below its content
- [ ] Sources shown as small, muted text: "[Title](url)"
- [ ] Sources come from Claude's web search during generation
- [ ] Tapping a source opens it in the system browser
- [ ] Sources stored as JSON array on each node: [{title, url}]
- [ ] Nodes without sources show no source section (not "no sources found")

## Priority: 2
## Phase: 2 (AI Integration)

## Notes

- Sources are what make Delve credible vs. "AI made this up"
- Style them subtly — present but not distracting from content
- The system prompt instructs Claude to cite sources; web_search tool provides them

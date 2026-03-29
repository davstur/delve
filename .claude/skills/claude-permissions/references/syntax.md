# Permission Pattern Syntax Reference

## Pattern Format

| Pattern          | Meaning          | Example                 |
| ---------------- | ---------------- | ----------------------- |
| `Tool`           | Any use of tool  | `Read` allows all reads |
| `Tool(exact)`    | Exact match only | `Bash(npm test)`        |
| `Tool(prefix:*)` | Prefix match     | `Bash(git:*)`           |

## Wildcard Rules

The `:*` wildcard **only works at the END** of a pattern (prefix matching):

```
✓ Valid:
Bash(git:*)           → matches: git, git status, git commit -m "msg"
Bash(npm run test:*)  → matches: npm run test, npm run test:unit
Bash(pnpm:*)          → matches: pnpm install, pnpm dev

✗ Invalid:
Bash(*git*)           → wildcards only work at end
Bash(*.js)            → not a glob pattern
```

## File Path Patterns (Read/Edit/Write)

| Pattern  | Meaning                    | Example             |
| -------- | -------------------------- | ------------------- |
| `//path` | Absolute filesystem path   | `Read(//etc/hosts)` |
| `/path`  | Relative to settings file  | `Edit(/src/**)`     |
| `~/path` | Relative to home directory | `Read(~/.zshrc)`    |
| `path`   | Relative to CWD            | `Read(*.env)`       |

**Critical gotcha:** `/Users/alice/file` is NOT absolute! Use
`//Users/alice/file`.

## Shell Awareness

Claude Code parses shell operators. This prevents chaining bypasses:

```
Bash(echo:*) will NOT match: echo foo && rm -rf /
```

The `&&`, `||`, `;`, `|` operators are understood.

## MCP Tool Patterns

```
mcp__<server>           → any tool from server
mcp__<server>__*        → wildcard: all tools from server
mcp__<server>__<tool>   → specific tool
```

Examples:

```
mcp__puppeteer__*       → all puppeteer tools
mcp__github__*          → all GitHub tools
mcp__postgres           → specific postgres tool
```

## WebFetch Patterns

```
WebFetch(domain:example.com)   → matches fetches to example.com
```

More reliable than Bash URL patterns for network filtering.

## Precedence

**Deny > Ask > Allow**

1. If command matches a `deny` pattern → blocked
2. If command matches an `allow` pattern → auto-approved
3. Otherwise → prompts user (ask)

## Common Syntax Errors

| Error                | Problem                   | Fix                    |
| -------------------- | ------------------------- | ---------------------- |
| `Bash(git *)`        | Space instead of colon    | `Bash(git:*)`          |
| `/etc/hosts`         | Missing double slash      | `//etc/hosts`          |
| `Bash(*test*)`       | Wildcard not at end       | `Bash(test:*)`         |
| `Bash(npm run test)` | Missing `:*` for variants | `Bash(npm run test:*)` |

## Bypass Vectors (URL Patterns)

Bash URL patterns are weak and easily bypassed:

```
Pattern: Bash(curl http://github.com/:*)

Bypasses:
- curl -X GET http://github.com/     (options before URL)
- curl https://github.com/           (different protocol)
- URL=github.com && curl $URL        (variable)
- curl  http://github.com/           (extra space)
```

**Recommendation:** Use `WebFetch(domain:...)` instead for URL filtering.

# Baseline Allow/Deny Lists by Stack

## Universal Baseline

### Always Allow (safe, common operations)

```json
{
  "allow": [
    "Bash(ls:*)",
    "Bash(cat:*)",
    "Bash(head:*)",
    "Bash(tail:*)",
    "Bash(grep:*)",
    "Bash(rg:*)",
    "Bash(find:*)",
    "Bash(tree:*)",
    "Bash(wc:*)",
    "Bash(pwd)",
    "Bash(which:*)",
    "Bash(echo:*)",
    "Bash(date)",
    "Bash(git:*)",
    "Read",
    "Edit",
    "Write"
  ]
}
```

### Always Deny (dangerous primitives)

```json
{
  "deny": [
    "Bash(sudo:*)",
    "Bash(rm -rf /*)",
    "Bash(rm -rf ~/*)",
    "Bash(chmod:*)",
    "Bash(chown:*)"
  ]
}
```

## Stack-Specific Additions

### Node.js / JavaScript

```json
{
  "allow": [
    "Bash(npm run:*)",
    "Bash(npm test:*)",
    "Bash(npm install:*)",
    "Bash(npx:*)",
    "Bash(node:*)",
    "Bash(tsc:*)"
  ]
}
```

### pnpm

```json
{
  "allow": ["Bash(pnpm:*)"]
}
```

### Yarn

```json
{
  "allow": ["Bash(yarn:*)"]
}
```

### Python

```json
{
  "allow": [
    "Bash(python:*)",
    "Bash(python3:*)",
    "Bash(pip:*)",
    "Bash(pip3:*)",
    "Bash(pytest:*)",
    "Bash(mypy:*)",
    "Bash(ruff:*)"
  ]
}
```

### Rust

```json
{
  "allow": ["Bash(cargo:*)", "Bash(rustc:*)"]
}
```

### Go

```json
{
  "allow": ["Bash(go:*)"]
}
```

### Make/Build Tools

```json
{
  "allow": ["Bash(make:*)", "Bash(cmake:*)"]
}
```

### Docker (only in isolated VM)

```json
{
  "allow": ["Bash(docker:*)", "Bash(docker-compose:*)"]
}
```

**Warning:** Only allow Docker in isolated environments (VM). On host machine,
exclude from sandbox instead.

### Supabase

```json
{
  "sandbox": {
    "excludedCommands": ["supabase:*"]
  }
}
```

Supabase CLI requires Docker socket access - exclude from sandbox, don't
allow-list.

## Sandbox Configuration

### Standard (most projects)

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "allowUnsandboxedCommands": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

### High-Security

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "allowUnsandboxedCommands": false,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  }
}
```

### Inside VM (maximum autonomy)

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker:*", "docker-compose:*", "supabase:*"]
  },
  "permissions": {
    "allow": ["Bash(docker:*)", "Bash(supabase:*)"],
    "deny": []
  }
}
```

## Deny vs Prompt Decision Framework

### Deny if ALL true:

- **Irreversible** - can't undo (git reset won't help)
- **Never legitimate** - you'd always say "no"
- **High blast radius** - affects system, not just project
- **Fast damage** - happens before you'd notice prompt

### Just Prompt if ANY true:

- Sometimes you'd approve it
- Legitimate use cases exist
- Damage is recoverable
- Low urgency - prompt gives thinking time

### Common Decisions

| Command            | Recommendation    | Reasoning                          |
| ------------------ | ----------------- | ---------------------------------- |
| `sudo:*`           | Deny              | Never needed, privilege escalation |
| `rm -rf /`         | Deny              | Catastrophic, never intentional    |
| `chmod:*`          | Deny              | System-level, rarely legitimate    |
| `git push --force` | Deny or Prompt    | Destroys history (debatable)       |
| `rm:*`             | Prompt            | Too broad, normal deletion is fine |
| `curl:*`           | Prompt or Deny    | Depends on workflow                |
| `docker:*`         | Prompt or Exclude | Context-dependent                  |

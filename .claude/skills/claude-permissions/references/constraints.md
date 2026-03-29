# Known Constraints and Lessons Learned

Documented constraints from implementing agentic development workflows.

## Docker Socket Constraint

**Problem:** Claude Code sandbox blocks access to `/var/run/docker.sock`

**Impact:**

- `docker` commands fail inside sandbox
- `docker-compose` commands fail inside sandbox
- Any tool using Docker API fails (Supabase CLI, etc.)

**Solutions:**

1. Add to `excludedCommands` with `:*` suffix (e.g., `"docker:*"`)
2. Use VM where Docker socket access is safe
3. Use MCP tools instead of CLI (they run outside sandbox)

## Supabase CLI Constraint

**Problem:** Supabase CLI requires Docker for local development

**Commands affected:**

- `supabase start` - spins up Docker containers
- `supabase stop` - stops containers
- `supabase db reset` - needs Docker access
- `supabase db push` - needs Docker access

**Solution:** Exclude from sandbox OR use VM:

```json
{
  "sandbox": {
    "excludedCommands": ["supabase:*"]
  }
}
```

## Containers on macOS Constraint

**Problem:** Can't have BOTH isolation AND Docker socket access in containers

**The tension:**

- Full isolation = no Docker socket → Supabase CLI broken
- Mount Docker socket = container can access ALL host Docker → isolation broken

**Why VMs solve this:** VM is the isolation boundary. Docker socket access
inside VM is fine because the VM itself is the blast radius.

See: `docs/planning/archive/container-dev-lessons.md` for detailed post-mortem.

## MCP Tools Bypass

**Insight:** MCP servers run as separate processes outside Claude Code's sandbox

**Implication:**

- `postgres` MCP → connects to DB directly, no Docker needed
- `supabase` MCP → API access, no Docker needed
- Can use MCPs for DB operations while keeping strict sandbox for Bash

**Trade-off:** MCPs have different capabilities than CLI tools.

## Network Filtering Limitations

**Problem:** Sandbox network filtering has limitations

**Known issues:**

- Domain fronting can bypass filtering
- Bash URL patterns easily bypassed (options before URL, variables, etc.)
- Only filters at domain level, not path level

**Recommendation:** Use `WebFetch(domain:...)` instead of `Bash(curl:*)`
patterns.

## Escape Hatch Risk

**Problem:** `dangerouslyDisableSandbox` parameter lets commands escape sandbox

**Risk:** If Claude is tricked (prompt injection, malicious deps), it could use
escape hatch.

**Mitigation:**

```json
{
  "sandbox": {
    "allowUnsandboxedCommands": false
  }
}
```

This completely ignores the escape hatch parameter.

## Apple Virtualization Networking Bug

**Problem:** macOS Sequoia + Apple Virtualization Framework has networking
issues

**Symptom:** Host → VM traffic blocked

**Solution:** Use QEMU emulation instead of Apple Virtualization in UTM

See: `tooling/vm/TROUBLESHOOTING.md`

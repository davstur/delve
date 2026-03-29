# Container Commands

Commands for managing containerized development environments using the
**devcontainer.json standard** for IDE compatibility.

## Prerequisites

Before using container commands, ensure the following are set up:

### 1. Docker Desktop

- Install Docker Desktop
- Enable: Settings → Advanced → "Allow the default Docker socket to be used"
  (creates `/var/run/docker.sock` symlink needed by IDEs)

### 2. GitHub CLI

```bash
gh auth status  # Should show authenticated
```

### 3. Claude Code OAuth Token (for auto-login in containers)

Generate a long-lived token on your host:

```bash
claude setup-token
```

Store in a file (NOT in shell config, to avoid affecting host auth):

```bash
echo "sk-ant-oat01-..." > ~/.claude-token
chmod 600 ~/.claude-token
```

The create command reads this file and bakes the token into devcontainer.json,
enabling Claude Code to work without manual login in containers.

### 4. IDE with Dev Containers Support

- **WebStorm**: Built-in (Remote Development → Dev Containers)
- **VS Code**: Install "Dev Containers" extension
- **Cursor**: Install "Dev Containers" extension

## Overview

The container workflow enables:

- **Isolated environments** - Each issue/feature gets its own container
- **Dedicated databases** - Per-container Supabase local stack
- **No port conflicts** - Automatic port block allocation
- **IDE integration** - Works with WebStorm, VS Code, Cursor, Codespaces
- **Clean teardown** - Nuke everything when done

## Architecture

```
/session:container:create
├── Creates: Docker network, Supabase stack
├── Clones: Repository to ~/dev-containers/<project>-<id>/
├── Generates: .devcontainer/devcontainer.json
└── Outputs: Instructions to open in IDE

IDE (WebStorm/VS Code/Cursor)
├── Opens project with devcontainer.json
├── Creates dev container on OUR network
├── Full IDE-in-container experience
└── Connects to OUR Supabase via Docker DNS
```

## Commands

### `/session:container:create`

Prepares a containerized dev environment for an issue.

```
/session:container:create --issue 123
/session:container:create --issue 123 --repo github.com/org/project
/session:container:create --branch feature/experiment --no-supabase
```

**What it creates:**

- Docker network for isolation
- Supabase stack (postgres, studio) as sibling containers
- Local project clone at `~/dev-containers/<project>-<id>/`
- Generated `.devcontainer/devcontainer.json`

**What the IDE creates:**

- Dev container using the generated devcontainer.json
- Joins the network we created
- Connects to our Supabase

### `/session:container:list`

Shows all container development environments.

```
/session:container:list
/session:container:list --all
/session:container:list --json
```

### `/session:container:destroy`

Removes a container environment and all associated resources.

```
/session:container:destroy --issue 123
/session:container:destroy --id issue-123
/session:container:destroy --issue 123 --force
/session:container:destroy --issue 123 --keep-local
```

## Typical Workflow

```
# 1. Create environment (network, Supabase, project clone)
/session:container:create --issue 123

# 2. Open in IDE
#    WebStorm: File → Remote Development → Dev Containers → From Local Project
#    VS Code:  Open folder, then Cmd+Shift+P → "Reopen in Container"

# 3. IDE creates dev container on our network
#    Container can reach Supabase via: supabase-issue-123-db:5432

# 4. Work, commit, push, create PR...

# 5. After PR merged, destroy everything
/session:container:destroy --issue 123
```

## Directory Structure

Container directories are placed alongside the main repo, mirroring the worktree
pattern:

```
~/Development/Workflows/
├── agentic-coding/                    # Main repo
├── agentic-coding-worktrees/          # Git worktrees
│   └── feature-branch/
└── agentic-coding-containers/         # Container environments
    ├── issue-123/
    │   ├── .devcontainer/
    │   │   └── devcontainer.json      # Generated, joins our network
    │   ├── .container-metadata.json   # Tracks network, ports, etc.
    │   └── ... (cloned repo)
    └── issue-456/
        └── ...
```

## Port Allocation

Ports are computed from issue number to avoid conflicts:

```
Issue #123:
  App ports:      3230-3234  (base = 3000 + (123 % 100) * 10)
  Supabase ports: 54532-54539

Issue #456:
  App ports:      3560-3564
  Supabase ports: 54860-54869
```

### Multi-Container Support

For multiple containers to run in parallel without port conflicts, your
project's dev-wrapper.js (or equivalent) must read `APP_PORT_BASE`:

```javascript
function computePort(appName) {
  if (process.env.PORT) return parseInt(process.env.PORT, 10)

  // Container mode: use APP_PORT_BASE + offset
  const portBase = parseInt(process.env.APP_PORT_BASE, 10)
  if (!isNaN(portBase)) {
    return portBase + (APP_PORT_OFFSETS[appName] ?? 0)
  }

  // Default: standard development ports
  return DEFAULT_PORTS[appName] ?? 3000
}
```

This ensures each container runs apps on its unique port block.

## devcontainer.json Features Used

| Feature                      | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `runArgs: ["--network=..."]` | Join our Docker network                    |
| `containerEnv`               | Pass DATABASE_URL, GH_TOKEN, CLAUDE_TOKEN  |
| `forwardPorts`               | Expose app ports to host                   |
| `postCreateCommand`          | Install gh CLI, Claude Code, dependencies  |
| `postStartCommand`           | Configure git auth via `gh auth setup-git` |
| `remoteUser: node`           | Run as non-root (allows skip-permissions)  |

## What Gets Auto-Installed

The `postCreateCommand` installs:

1. **GitHub CLI** - with auto-authentication via `GH_TOKEN`
2. **Claude Code** - latest version from npm
3. **Project dependencies** - via pnpm/yarn/npm (auto-detected)

## What Gets Auto-Generated

| File                              | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `.devcontainer/devcontainer.json` | Container configuration for IDE          |
| `.container-metadata.json`        | Port mappings, network info, timestamps  |
| `.idea/dataSources.xml`           | WebStorm database connection to Supabase |

## IDE Support

| IDE               | Support Level                                  |
| ----------------- | ---------------------------------------------- |
| WebStorm          | Full (via Remote Development → Dev Containers) |
| VS Code           | Full (via Dev Containers extension)            |
| Cursor            | Full (via Dev Containers extension)            |
| GitHub Codespaces | Full (native devcontainer.json support)        |

## Notes

- Uses **devcontainer.json standard** for maximum portability
- IDE creates and manages the dev container lifecycle
- We create and manage the infrastructure (network, Supabase)
- Supabase connects via Docker internal DNS (no port exposure needed)
- GitHub token passed via `containerEnv` for authenticated git operations

## What Containers Receive

| Resource                  | How Passed                                 | Purpose                       |
| ------------------------- | ------------------------------------------ | ----------------------------- |
| `GH_TOKEN`                | containerEnv (baked at creation)           | Git operations                |
| `CLAUDE_CODE_OAUTH_TOKEN` | containerEnv (from `~/.claude-token` file) | Claude Code auth              |
| `APP_PORT_BASE`           | containerEnv                               | Port allocation awareness     |
| `DATABASE_URL`            | containerEnv (if Supabase)                 | Database connection           |
| `cc` alias                | ~/.bashrc                                  | Claude with Opus + skip-perms |

## Security Model

**Intentional design: Isolated containers with autonomous Claude**

| What                             | Status        | Why                                    |
| -------------------------------- | ------------- | -------------------------------------- |
| Host filesystem mounts           | ❌ None       | Container can't access host files      |
| Docker socket mount              | ❌ None       | Container can't control Docker         |
| `--dangerously-skip-permissions` | ✅ Enabled    | Safe because container is isolated     |
| Secrets in devcontainer.json     | ⚠️ Gitignored | Tokens baked in, but excluded from git |

The `cc` alias runs Claude with `--dangerously-skip-permissions`. This is
**intentional**:

- The container IS the security boundary
- Claude can do anything inside the container
- Claude cannot affect the host system
- This enables fully autonomous AI-assisted development

## Troubleshooting

### Claude asks for login in container

- Verify token file exists on host: `cat ~/.claude-token | head -c 20`
- Regenerate if expired:
  `claude setup-token && echo "<new-token>" > ~/.claude-token`
- Check container has the token: `echo $CLAUDE_CODE_OAUTH_TOKEN` (inside
  container)
- Recreate container after updating token (it's baked in at creation time)

### WebStorm can't find Dev Containers

- Ensure Docker socket is enabled in Docker Desktop settings
- Verify on host: `ls -la /var/run/docker.sock`

### gh CLI not found

- Should be auto-installed by `postCreateCommand`
- Manual install:
  ```bash
  sudo apt-get update && sudo apt-get install -y gh
  gh auth setup-git
  ```

### WebStorm Database tab not showing Supabase

- Auto-generated in `.idea/dataSources.xml` for new containers
- Manual connection (from inside container):
  - Host: `supabase-issue-<n>-db` (Docker DNS name)
  - Port: `5432`
  - User/Password: `postgres`/`postgres`
  - Database: `postgres`

### Claude Code version in container

- Container installs latest version from npm (may differ from host)
- Auth tokens are compatible across versions
- Recreate container to pick up newer npm releases

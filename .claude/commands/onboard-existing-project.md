# Onboard Existing Project Command

You are helping to onboard an existing project into the Agentic Coding workflow.
This command analyzes the current codebase and collaboratively creates the
documentation structure typically generated during inception.

## Purpose

For projects that already exist but want to adopt the workflow, this command:

- Analyzes the codebase to understand tech stack and architecture
- Collaboratively creates key documentation (vision, architecture, workflow
  rules)
- Establishes initial user stories based on current features
- Sets up the project for future workflow usage

## Process

### 1. Verify Prerequisites

```bash
# Check we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Check workflow is set up
if [ ! -d ".claude/commands/project" ]; then
    echo "Error: Workflow not set up. Run setup-workflow.md first"
    exit 1
fi

# Get project name and path
PROJECT_NAME=$(basename "$(pwd)")
PROJECT_PATH=$(pwd)
```

### 2. Analyze Codebase

Perform comprehensive analysis to understand the project:

```bash
echo "🔍 Analyzing $PROJECT_NAME codebase..."
echo ""

# Detect primary language
echo "Detecting primary languages..."
LANGUAGES=$(find . -type f -name "*.swift" -o -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.java" -o -name "*.go" -o -name "*.rb" | grep -E '\.(swift|py|js|ts|java|go|rb)$' | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -5)
echo "$LANGUAGES"

# Check for common framework indicators
echo ""
echo "Checking for frameworks and tools..."

# Swift/iOS
if [ -f "*.xcodeproj" ] || [ -f "*.xcworkspace" ] || [ -f "Package.swift" ]; then
    echo "✓ iOS/macOS project detected"
    if [ -f "Package.swift" ]; then
        echo "  - Swift Package Manager"
    fi
    if find . -name "*.storyboard" | head -1 | grep -q .; then
        echo "  - UIKit/Storyboards"
    fi
    if grep -r "import SwiftUI" --include="*.swift" | head -1 | grep -q .; then
        echo "  - SwiftUI"
    fi
fi

# Web frameworks
if [ -f "package.json" ]; then
    echo "✓ Node.js project detected"
    # Check for specific frameworks
    if grep -q '"next"' package.json; then
        echo "  - Next.js"
    elif grep -q '"react"' package.json; then
        echo "  - React"
    elif grep -q '"vue"' package.json; then
        echo "  - Vue"
    fi
fi

# Python
if [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
    echo "✓ Python project detected"
    if [ -f "manage.py" ]; then
        echo "  - Django"
    elif grep -q "flask" requirements.txt 2>/dev/null; then
        echo "  - Flask"
    fi
fi

# Check for databases
echo ""
echo "Checking for data storage..."
if grep -r "Core Data" --include="*.swift" | head -1 | grep -q .; then
    echo "✓ Core Data"
fi
if [ -f "docker-compose.yml" ] && grep -q "postgres\|mysql\|mongo" docker-compose.yml; then
    echo "✓ Database in Docker Compose"
fi

# Check for tests
echo ""
echo "Checking testing setup..."
TEST_COUNT=$(find . -type f \( -name "*test*" -o -name "*spec*" \) | grep -E '\.(swift|py|js|ts|java)$' | wc -l)
echo "Found $TEST_COUNT test files"

# Check README
if [ -f "README.md" ]; then
    echo ""
    echo "✓ README.md exists"
    README_LINES=$(wc -l < README.md)
    echo "  ($README_LINES lines)"
fi
```

### 3. Interactive Documentation Creation

Now engage the user in creating key documentation:

#### A. Project Vision

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PROJECT VISION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# If README exists, extract potential vision
if [ -f "README.md" ]; then
    echo "From your README:"
    echo "────────────────"
    head -20 README.md | grep -v "^#" | grep -v "^$" | head -5
    echo "────────────────"
    echo ""
fi

echo "Let's define your project vision. Please answer:"
echo ""
echo "1. What problem does $PROJECT_NAME solve?"
echo "   (Who is suffering and how does this help them?)"
echo ""
read -r PROBLEM_STATEMENT

echo ""
echo "2. What is the key value proposition?"
echo "   (Why would someone choose this over alternatives?)"
echo ""
read -r VALUE_PROP

echo ""
echo "3. Who are the target users?"
echo "   (Be specific: developers, businesses, consumers?)"
echo ""
read -r TARGET_USERS

echo ""
echo "4. What does success look like?"
echo "   (Metrics, outcomes, or impact)"
echo ""
read -r SUCCESS_METRICS

# Generate VISION.md
cat > docs/product/VISION.md << EOF
# $PROJECT_NAME Vision

## Problem Statement
$PROBLEM_STATEMENT

## Value Proposition
$VALUE_PROP

## Target Users
$TARGET_USERS

## Success Metrics
$SUCCESS_METRICS

## Core Principles
- User-focused development
- Iterative improvement
- Data-driven decisions

---
*Generated through project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created docs/product/VISION.md"
```

#### B. Current Architecture

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  ARCHITECTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Based on the analysis, I found:"
echo "$ANALYSIS_SUMMARY"
echo ""

echo "Let's document your architecture:"
echo ""
echo "1. What is the high-level architecture?"
echo "   (e.g., 'SwiftUI app with Core Data', 'Next.js + Postgres API', etc.)"
echo ""
read -r ARCH_OVERVIEW

echo ""
echo "2. What are the main components/modules?"
echo "   (e.g., 'Auth, Dashboard, Reports, Admin')"
echo ""
read -r MAIN_COMPONENTS

echo ""
echo "3. What key technologies/frameworks do you use?"
echo "   (Confirm or expand on what was detected)"
echo ""
read -r KEY_TECH

echo ""
echo "4. Any important architectural decisions or constraints?"
echo "   (e.g., 'Must work offline', 'No external dependencies')"
echo ""
read -r ARCH_DECISIONS

# Generate architecture documentation
cat > docs/architecture/README.md << EOF
# Architecture Overview

## High-Level Architecture
$ARCH_OVERVIEW

## Main Components
$MAIN_COMPONENTS

## Technology Stack
$KEY_TECH

### Detected Stack
$ANALYSIS_SUMMARY

## Key Architectural Decisions
$ARCH_DECISIONS

## Directory Structure
\`\`\`
$(tree -L 2 -I 'node_modules|.git|build|dist' 2>/dev/null || ls -la)
\`\`\`

---
*Generated through project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created docs/architecture/README.md"

# Create initial ADR for tech stack
cat > docs/architecture/decisions/001-initial-stack.md << EOF
# Initial Technology Stack

## Status
Accepted

## Context
This documents the existing technology stack of $PROJECT_NAME as discovered during onboarding.

## Decision
The project uses:
$KEY_TECH

## Consequences
- Team is already familiar with this stack
- Existing code follows these patterns
- Future additions should align with current choices unless there's a strong reason to diverge

---
*Generated through project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created docs/architecture/decisions/001-initial-stack.md"
```

#### C. Project Knowledge System

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PROJECT KNOWLEDGE SYSTEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Let's establish your project's knowledge system."
echo "This creates PLATFORM.md (strategic principles), CLAUDE.md (non-negotiable"
echo "rules), and initial .claude/rules/ for coding standards."
echo ""

echo "1. What are your core principles? (2-4 strategic beliefs that guide decisions)"
echo "   (e.g., 'Server-first rendering', 'Type safety everywhere', 'Security by default')"
echo ""
read -r CORE_PRINCIPLES

echo ""
echo "2. What are your non-negotiable coding rules?"
echo "   (e.g., 'No eslint-disable', 'No magic numbers', 'Always handle errors')"
echo ""
read -r NON_NEGOTIABLES

echo ""
echo "3. What are your code style guidelines?"
echo "   (e.g., 'SwiftLint rules', 'ESLint + Prettier', 'Follow PEP 8')"
echo ""
read -r CODE_STYLE

echo ""
echo "4. What's your testing approach?"
echo "   (e.g., 'Unit tests required', 'TDD preferred', '80% coverage minimum')"
echo ""
read -r TESTING_APPROACH

echo ""
echo "5. Git workflow and PR rules?"
echo "   (e.g., 'Feature branches, squash merge', 'Require reviews')"
echo ""
read -r GIT_WORKFLOW

echo ""
echo "6. Any project-specific technical patterns?"
echo "   (e.g., 'No force unwrapping', 'Dependency injection', 'Mobile-first UI')"
echo ""
read -r PATTERNS

# Generate PLATFORM.md for strategic principles
cat > PLATFORM.md << EOF
# $PROJECT_NAME Platform Principles

Strategic beliefs that guide architectural and technical decisions.

## Core Principles

$CORE_PRINCIPLES

---
*Generated through project onboarding on $(date +%Y-%m-%d). Evolve as the project matures.*
EOF

echo "✓ Created PLATFORM.md with strategic principles"

# Generate CLAUDE.md for non-negotiable rules
if [ -f "CLAUDE.md" ]; then
    cat >> CLAUDE.md << EOF

## Non-Negotiable Rules

$NON_NEGOTIABLES

## Code Style
$CODE_STYLE

## Testing
$TESTING_APPROACH

## Git Workflow
$GIT_WORKFLOW

## Project-Specific Patterns
$PATTERNS
EOF
    echo "✓ Updated CLAUDE.md with project rules"
else
    cat > CLAUDE.md << EOF
# $PROJECT_NAME

## Non-Negotiable Rules

$NON_NEGOTIABLES

## Code Style
$CODE_STYLE

## Testing
$TESTING_APPROACH

## Git Workflow
$GIT_WORKFLOW

## Project-Specific Patterns
$PATTERNS

---
*Created during project onboarding on $(date +%Y-%m-%d). Add rules with \`/project:knowledge:add\` as patterns emerge.*
EOF
    echo "✓ Created CLAUDE.md with non-negotiable rules"
fi

# Create initial .claude/rules/ structure
mkdir -p .claude/rules

cat > .claude/rules/README.md << EOF
# Rules

Coding instructions that Claude auto-loads based on file path patterns.

Rules use YAML frontmatter with \`globs:\` to scope to specific files.
Rules without globs apply globally.

Add new rules with: \`/project:knowledge:add "pattern" --destination rule\`

---
*Created during project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created .claude/rules/ directory"

# Create initial .claude/skills/ structure
mkdir -p .claude/skills

cat > .claude/skills/README.md << EOF
# Skills

On-demand knowledge loaded by intent, not file path. Each skill has a
\`SKILL.md\` with a description field that determines when it's loaded.

Skills contain deeper pattern knowledge for specific domains (e.g., testing
patterns, data access patterns, UI design).

Add new skills with: \`/project:knowledge:add "workflow" --destination skill\`

---
*Created during project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created .claude/skills/ directory"

echo ""
echo "7. What are your user roles?"
echo "   (e.g., 'Admin, Editor, Viewer' or 'Studio Owner, Teacher, Student')"
echo ""
read -r USER_ROLES

echo ""
echo "8. Any domain terminology to standardize?"
echo "   (e.g., 'Use student not member, class not lesson')"
echo ""
read -r TERMINOLOGY

# Append domain context to PLATFORM.md
cat >> PLATFORM.md << EOF

## Product Context

### User Roles

$USER_ROLES

### Domain Terminology

$TERMINOLOGY

### Business Rules

<!-- Add business constraints as they emerge -->

EOF

echo "✓ Added domain context to PLATFORM.md"
```

### 4. Generate Initial Stories

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 USER STORIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "What are the main features currently in your app?"
echo "(List 3-5 key features, one per line. Press Enter twice when done)"
echo ""

FEATURES=""
while IFS= read -r line; do
    [ -z "$line" ] && break
    FEATURES="${FEATURES}${line}\n"
done

# Create initial story map
cat > docs/story-map.md << EOF
# Story Map

## Current Features
$(echo -e "$FEATURES" | sed 's/^/- /')

## Upcoming Priorities
- [ ] To be determined based on user feedback
- [ ] Performance optimizations
- [ ] Enhanced user experience

## Backlog Ideas
- [ ] Feature requests from users
- [ ] Technical debt items
- [ ] Future enhancements

---
*Generated through project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created docs/story-map.md"
```

### 5. Create Minimal Brand Guide

```bash
# Create minimal brand guide
cat > docs/brand/BRAND_GUIDE.md << EOF
# Brand Guide

## Product Name
$PROJECT_NAME

## Tagline
*To be defined*

## Voice & Tone
- Professional yet approachable
- Clear and concise
- User-focused

## Design Principles
*To be defined based on current UI/UX*

---
*Generated through project onboarding on $(date +%Y-%m-%d)*
EOF

echo "✓ Created docs/brand/BRAND_GUIDE.md"
```

### 6. Create Default Configuration

```bash
# Always create a default config.json with GitHub source
mkdir -p .workflow
cat > .workflow/config.json << 'EOF'
{
  "github": {},
  "packageManager": "npm",
  "update": {
    "sources": [
      {
        "type": "github",
        "url": "https://github.com/alexeigs/agentic-coding",
        "enabled": true
      }
    ]
  }
}
EOF
echo "✓ Created default configuration in .workflow/config.json"
```

### 7. Set Up Extension Structure

```bash
# Create extensions directory for project-specific customizations
mkdir -p .workflow/extensions
cat > .workflow/extensions/README.md << 'EOF'
# Workflow Extensions

This directory contains project-specific extensions that customize workflow commands.

These extensions are:
- ✅ Preserved during workflow updates
- ✅ Optional (commands work without them)
- ✅ Project-specific customizations

See documentation in your workflow commands for available extension points.

## Example Extensions

- `breakdown-feature/pre-format-output.md`: Custom analysis sections
- `breakdown-feature/pre-implementation-phases.md`: Custom planning
- `breakdown-technical/pre-format-output.md`: Technical analysis

EOF
echo "✓ Created extensions directory for project-specific customizations"
```

### 7.5 Clean Up Empty Directories

```bash
# Remove any empty inception-notes if not needed
if [ -d "inception-notes" ] && [ -z "$(ls -A inception-notes)" ]; then
    rmdir inception-notes
    echo "✓ Removed empty inception-notes directory"
fi
```

### 8. GitHub Project Configuration

```bash
# Configure GitHub Project if in a GitHub repository
if gh repo view >/dev/null 2>&1; then
    echo ""
    echo "Would you like to configure a GitHub Project board for issue tracking? (Y/n)"
    read -r CONFIGURE_PROJECT

    if [[ "$CONFIGURE_PROJECT" != "n" && "$CONFIGURE_PROJECT" != "N" ]]; then
        # Check available projects
        OWNER=$(gh repo view --json owner -q .owner.login)
        PROJECT_JSON=$(gh project list --owner "$OWNER" --format json)
        PROJECT_COUNT=$(echo "$PROJECT_JSON" | jq -r '.projects | length')

        if [ "$PROJECT_COUNT" = "0" ]; then
            echo "ℹ️  No GitHub Projects found for $OWNER"
            echo "   You can create one at: https://github.com/$OWNER?tab=projects"
            echo "   Then configure it in .workflow/config.json"
        elif [ "$PROJECT_COUNT" = "1" ]; then
            # Single project - ask if they want to use it
            PROJECT_TITLE=$(echo "$PROJECT_JSON" | jq -r '.projects[0].title')
            echo ""
            echo "Found project: $PROJECT_TITLE"
            echo "Use this project for issue tracking? (Y/n)"
            read -r USE_PROJECT

            if [[ "$USE_PROJECT" != "n" && "$USE_PROJECT" != "N" ]]; then
                # Update workflow config with project_number (faster) and project_title (readable)
                PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.projects[0].number')
                jq '.github.project_number = '"$PROJECT_NUMBER"' | .github.project_title = "'"$PROJECT_TITLE"'"' .workflow/config.json > .workflow/config.json.tmp
                mv .workflow/config.json.tmp .workflow/config.json
                echo "✅ Configured to use project: $PROJECT_TITLE (#$PROJECT_NUMBER)"
            fi
        else
            # Multiple projects - show list and ask which one
            echo ""
            echo "Multiple projects found:"
            echo "$PROJECT_JSON" | jq -r '.projects[] | "  - \(.title)"'
            echo ""
            echo "Enter the name of the project to use (or press Enter to skip):"
            read -r PROJECT_TITLE

            if [ -n "$PROJECT_TITLE" ]; then
                # Verify the project exists and get its number
                PROJECT_DATA=$(echo "$PROJECT_JSON" | jq -r --arg title "$PROJECT_TITLE" '.projects[] | select(.title == $title)')
                if [ -n "$PROJECT_DATA" ]; then
                    # Update workflow config with project_number (faster) and project_title (readable)
                    PROJECT_NUMBER=$(echo "$PROJECT_DATA" | jq -r '.number')
                    jq '.github.project_number = '"$PROJECT_NUMBER"' | .github.project_title = "'"$PROJECT_TITLE"'"' .workflow/config.json > .workflow/config.json.tmp
                    mv .workflow/config.json.tmp .workflow/config.json
                    echo "✅ Configured to use project: $PROJECT_TITLE (#$PROJECT_NUMBER)"
                else
                    echo "⚠️  Project '$PROJECT_TITLE' not found. You can configure it later:"
                    echo "   Create .workflow/config.json with:"
                    echo '   {"github":{"project_number": <number>, "project_title":"Your Project Name"}}'
                fi
            else
                echo "ℹ️  Skipped project configuration. See .workflow/guides/workflow-guide.md for configuration options."
            fi
        fi
    fi
else
    echo "Note: Not in a GitHub repository. Skipping GitHub project configuration."
fi
```

### 9. Final Summary

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ONBOARDING COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Created documentation:"
echo "  📋 docs/product/VISION.md"
echo "  🏗️  docs/architecture/README.md"
echo "  📦 docs/architecture/decisions/001-initial-stack.md"
echo "  🧭 PLATFORM.md (strategic principles + domain context)"
echo "  🔧 CLAUDE.md (non-negotiable rules)"
echo "  📁 .claude/rules/ (coding standards)"
echo "  📁 .claude/skills/ (on-demand knowledge)"
echo "  📚 docs/story-map.md"
echo "  🎨 docs/brand/BRAND_GUIDE.md"

if [ -f ".workflow/config.json" ]; then
    CONFIGURED_PROJECT=$(jq -r '.github.project_title // empty' .workflow/config.json 2>/dev/null)
    if [ -n "$CONFIGURED_PROJECT" ]; then
        echo ""
        echo "GitHub Project configured:"
        echo "  📊 $CONFIGURED_PROJECT"
    fi
fi

echo ""
echo "Next steps:"
echo "1. Review and refine the generated documentation"
echo "2. Add knowledge as you work: claude /project:knowledge:add \"pattern\""
echo "3. Create user stories: claude /project:stories:create \"Feature description\""
echo "4. Create issues: claude /project:issues:create \"Task description\""
echo "5. Set priorities: claude /project:issues:prioritize --review"
echo ""
echo "Your existing project is now ready to use the Agentic Coding workflow!"
```

## Usage

Run this command in an existing project after running setup:

```
claude /onboard-existing-project
```

The command will:

1. Analyze your codebase to detect languages, frameworks, and structure
2. Interactively gather information about your project
3. Generate key documentation files based on your input:
   - `PLATFORM.md` — strategic principles (the WHY)
   - `CLAUDE.md` — non-negotiable rules (always loaded)
   - `.claude/rules/` — path-scoped coding standards (auto-loaded)
   - `.claude/skills/` — on-demand workflow knowledge (intent-triggered)
4. Set up the project for workflow usage

## Important Notes

- This is for existing projects only (not new projects)
- Requires workflow to be set up first (run setup-workflow.md)
- Creates documentation collaboratively, not automatically
- Focuses on current state rather than aspirational planning
- User can refine generated docs after creation
- Add knowledge incrementally with `/project:knowledge:add` as patterns emerge

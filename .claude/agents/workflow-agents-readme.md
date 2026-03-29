---
name: workflow-agents-readme
description:
  Documentation about workflow-provided agents. Not an executable agent.
---

# Workflow Agents

Agents are specialized AI personas with narrow mandates. They're invoked by
commands or other agents to perform focused tasks with fresh context.

## Why Agents?

| Aspect     | Main Session               | Agent                    |
| ---------- | -------------------------- | ------------------------ |
| Context    | Accumulated, may be biased | Fresh, unbiased          |
| Scope      | Broad, many concerns       | Narrow, single focus     |
| Mandate    | Flexible                   | Strict, well-defined     |
| Invocation | User direct                | Commands or other agents |

**Key insight**: An agent that just finished implementing code has "sunk cost
bias" - it's reluctant to simplify what it just wrote. A fresh agent with only
the mandate "simplify without breaking" sees differently.

## Available Agents

### plan-architect-reviewer

**Purpose**: Review technical breakdown plans from a system design perspective.

**When to use**: After creating breakdown plans, before external bounce.

**What it does**:

- Evaluates structural soundness and component boundaries
- Reviews API design and interface quality
- Identifies performance and scalability concerns
- Suggests industry-standard patterns

**Output**: Categorized findings (IMPROVEMENT, TRADEOFF, CONCERN) with
recommendations.

**Invoked by**: `/project:issues:breakdown-technical`,
`/project:issues:breakdown-feature`

### plan-ux-reviewer

**Purpose**: Review technical breakdown plans from a user experience
perspective.

**When to use**: After creating breakdown plans for user-facing features.

**What it does**:

- Checks user journey completeness (all states covered)
- Evaluates interaction design and platform conventions
- Identifies accessibility gaps
- Reviews content and copy specifications

**Output**: Categorized findings (SPECIFY, TASTE, UX_RISK) with recommendations.

**Invoked by**: `/project:issues:breakdown-technical`,
`/project:issues:breakdown-feature`

### code-simplifier

**Purpose**: Simplify code without changing behavior.

**When to use**: After implementation is complete and tests pass.

**What it does**:

- Inlines single-use helpers
- Removes dead code
- Simplifies verbose patterns
- Removes redundant type assertions

**Safety**: Runs tests after each change, rollbacks on failure.

**Invoked by**: `/project:quality:simplify`, `/project:issues:preflight`

### verify-implementation

**Purpose**: Check that implementation is complete (not correct - tests do
that).

**When to use**: After implementation, before PR.

**What it does**:

- Verifies requirements coverage
- Checks cross-boundary completeness (migrations, exports, docs)
- Finds loose ends (TODOs, console.logs)
- Reports findings with severity levels

**Output**: Report only - doesn't block workflow.

**Invoked by**: `/project:issues:preflight`

### test-adequacy

**Purpose**: Evaluate whether tests follow the project's testing philosophy and
provide adequate coverage at the right abstraction level.

**When to use**: During preflight, after verify-implementation has run.

**What it does**:

- Discovers the project's test philosophy (skills, rules, docs, or inferred)
- Evaluates existing tests against that model
- Assesses whether tests are missing for implementation changes
- Reports coverage gaps, wrong-level tests, over-testing, and pattern deviations

**Output**: Assessment with coverage gaps, pattern compliance, and
recommendations.

**Invoked by**: `/project:issues:preflight`

### codebase-compliance-checker

**Purpose**: Assess whether implementation aligns with the project's strategic
direction and foundational principles (PLATFORM.md, CLAUDE.md).

**When to use**: During preflight to check strategic alignment before PR.

**What it does**:

- Reads PLATFORM.md for strategic principles and vision
- Reads CLAUDE.md for non-negotiable rules and domain model
- Consults relevant architecture docs for domain-specific strategic context
- Assesses implementation against the spirit of foundational principles
- Flags genuine violations of non-negotiables
- Suggests evolution of CLAUDE.md or PLATFORM.md based on learnings

**What it does NOT do** (by design):

- Re-check path-scoped rules (loaded during implementation)
- Re-check skill patterns (loaded on-demand during implementation)
- Mechanical rule-by-rule matching (that's what linting + implementation context
  already provide)

**Output**: Strategic compliance report (assessment, violations, evolution
candidates).

**Invoked by**: `/project:issues:preflight`

### ui-critic

**Purpose**: Expert UI/UX design critique for screenshots.

**When to use**: When reviewing UI designs, screenshots, or visual components.

**What it does**:

- Analyzes spatial relationships (spacing, alignment, proximity)
- Evaluates visual hierarchy (size, weight, color, reading order)
- Reviews typography (font selection, scale, line length)
- Checks color and contrast (palette, accessibility, semantics)
- Assesses consistency and patterns (components, icons, interactions)
- Examines layout and structure (grid, cards, responsive)
- Evaluates visual polish (shadows, borders, rounded corners)
- Reviews content and communication (labeling, empty states, density)
- Checks accessibility considerations (color alone, readability, target sizes)

**Output**: Structured feedback with Summary, Major Issues, Minor Issues, What's
Working Well (optional), and Priority Recommendations (if asked).

**Baseline**: Trained on world-class design systems (Apple HIG, Material Design,
Linear, Stripe, Vercel, Airbnb, Figma).

## How Agents Work

Agents are Markdown files containing:

1. **Context** - When and why this agent runs
2. **Philosophy** - What it does and doesn't do
3. **Rules** - Specific patterns to follow/avoid
4. **Process** - Step-by-step workflow
5. **Output format** - How to report results

Commands load agents and pass them:

- Relevant context (files to check, issue number, etc.)
- Configuration (flags, scope, etc.)

The agent follows its instructions and produces output that the command
incorporates into its workflow.

## Creating New Agents

When adding a new agent:

1. **Define a narrow mandate** - What exactly does it do?
2. **Specify what it doesn't do** - Prevent scope creep
3. **Design the process** - Step-by-step, repeatable
4. **Define output format** - Structured, actionable
5. **Add safety protocols** - How to handle failures

Use existing agents as templates.

## Agent vs Command

| Use an Agent when...               | Use a Command when...           |
| ---------------------------------- | ------------------------------- |
| Task benefits from fresh context   | Task needs conversation history |
| Single focused purpose             | Multi-step orchestration        |
| Can be reused by multiple commands | User-facing entry point         |
| Read-heavy or surgical writes      | Broader write operations        |

**Rule of thumb**: Commands orchestrate. Agents execute focused subtasks.

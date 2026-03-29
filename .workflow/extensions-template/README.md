# Extension Templates

This directory contains templates and examples for creating workflow extensions.

## Structure

```
extensions-template/
├── command-name/                    # Generic template (shows the pattern)
│   └── extension-point.example.md  # Replace with actual command/point names
└── examples/                        # Ready-to-use examples
    └── breakdown-feature-ui/        # UI delegation for breakdown-feature
        └── pre-format-output.md     # Actual extension for UI projects
```

## How to Use

### Option 1: Start from Generic Template

1. Copy the generic template:

   ```bash
   cp .workflow/extensions-template/command-name/extension-point.example.md \
      .workflow/extensions/breakdown-feature/pre-format-output.md
   ```

2. Replace placeholders with your content

### Option 2: Use a Specific Example

For UI-heavy projects:

```bash
cp -r .workflow/extensions-template/examples/breakdown-feature-ui/* \
      .workflow/extensions/breakdown-feature/
```

## Available Extension Points

### breakdown-feature Command

- `pre-format-output`: Custom analysis before output tables
- `pre-implementation-phases`: Planning customizations
- `post-breakdown`: Additional documentation

### breakdown-technical Command

- `pre-format-output`: Technical analysis
- `pre-implementation-phases`: Technical planning
- `post-breakdown`: Architecture documentation

## Your Extensions

Place your actual extensions in:

```
.workflow/extensions/[command-name]/[extension-point].md
```

These are preserved during workflow updates.

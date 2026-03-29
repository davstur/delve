---
globs:
  - ".claude/rules/**/*.md"
  - "src/rules/**/*.md"
---

# Rule File Authoring

When creating or editing rule files, invoke the **knowledge-placement** skill
for the full framework. At minimum:

1. **Globs frontmatter** -- Every rule file must start with `globs:` targeting
   relevant file patterns. Without it, the rule loads every session (context
   cost). Default to glob-scoped.
2. **Concise checklist format** -- Rules are actionable checklists, not
   documentation. If it needs decision trees or examples, it belongs in a skill
   reference.
3. **Check existing rules** -- Before creating a new file, check if an existing
   rule in the same domain could be extended.

---
globs:
  - ".claude/skills/**/*.md"
  - "src/skills/**/*.md"
---

# Skill File Authoring

When creating or editing skill files, invoke the **knowledge-placement** skill
for the full framework. At minimum:

1. **Description field** -- Every SKILL.md must have a YAML `description:` with
   trigger phrases and concrete examples. This is what causes loading -- without
   it, the skill never fires.
2. **Body vs description** -- "When to use" sections in the body don't help with
   triggering. Put trigger phrases in the description field.
3. **Supporting files** -- Keep SKILL.md under ~500 lines. Move depth to
   subdirectories: `references/` for docs, `scripts/` for executable code,
   `assets/` for static resources.
4. **Invocation control** -- `user-invocable: false` hides from `/` menu but
   Claude can still auto-invoke. `disable-model-invocation: true` fully prevents
   Claude from triggering it. Choose intentionally.
5. **Check existing skills** -- Before creating a new skill, check if an
   existing skill could be extended or if a reference file would suffice.

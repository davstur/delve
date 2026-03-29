### 5.5 UI Complexity Assessment (For UI-Heavy Features)

<!--
This is a ready-to-use extension for projects with specialized UI agents.
Copy this to .workflow/extensions/breakdown-feature/pre-format-output.md
-->

When the feature involves significant UI work, add delegation recommendations:

## 🎨 UI Development Strategy

### UI Complexity Analysis

- **Component Count**: [Number of new components needed]
  <!-- e.g., 5 new components -->
- **Story Coverage**: [Number of components needing stories]
  <!-- e.g., 8 stories total -->
- **Design System Compliance**: [Token gaps identified]
  <!-- e.g., missing error state colors -->
- **Accessibility Requirements**: [Special considerations]
  <!-- e.g., keyboard navigation for wizard -->

### Recommended Delegation

Based on UI complexity, this feature should use:

- `@ui-component-provider` for [list components > 100 lines]
  <!-- e.g., DataTable, FilterPanel -->
- `@ui-story-creator` for all component stories
  <!-- e.g., 8 component stories -->
- `@ui-quality-validator` for final validation
  <!-- e.g., accessibility & responsive checks -->
- `@ui-perfectionist` for [critical user-facing components]
  <!-- e.g., CheckoutForm, PaymentModal -->

### Predicted UI Work Distribution

- Main Claude: 30% (business logic, integration)
- UI Agents: 70% (components, stories, validation)
- Estimated Time Savings: [X hours] <!-- e.g., 4-6 hours -->

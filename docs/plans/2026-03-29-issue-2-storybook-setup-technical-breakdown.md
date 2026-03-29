<!--
LIVING DOCUMENT — trim as implementation progresses.
GOLDEN RULE: If code exists in repo, remove it from this doc.
-->

# Configure Storybook for React Native — Technical Breakdown

**Issue**: #2
**Started**: 2026-03-29
**Last Updated**: 2026-03-29 by Claude
**Status**: Active

---

## 🎯 Current Focus

**Active Phase**: Not started
**Next Action**: Begin Block 1 (install Storybook)

## 📊 Overall Progress

| Phase | Status | Completion | Key Outcome |
|-------|--------|------------|-------------|
| Phase 1: Install + Config | ❌ Not started | 0% | Storybook renders in simulator |
| Phase 2: Example Story | ❌ Not started | 0% | Co-located story convention proven |
| Phase 3: Dev Toggle | ❌ Not started | 0% | Switch between app and Storybook |

---

## Implementation Blocks Overview

| Block | Purpose | Status | Testable Milestone |
|-------|---------|--------|--------------------|
| **1. Install Storybook** | Core packages + metro config | ❌ None | `npx storybook` init completes |
| **2. Metro Config** | Enable dynamic story imports | ❌ None | Metro bundler starts with Storybook |
| **3. Example Story** | Prove co-located story convention | ❌ None | Story renders in simulator |
| **4. Dev Toggle** | Switch between app and Storybook | ❌ None | Env var toggles modes |

---

## Block Details

### 1. Install Storybook

**Purpose**: Get `@storybook/react-native` v10 installed with Expo compatibility
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: None (issue #1 complete)

**Steps**:
1. Run `npx storybook@latest init` — auto-detects React Native, creates `.rnstorybook/` config dir
2. Verify packages installed: `@storybook/react-native`, related addons
3. Check `.rnstorybook/main.ts` has correct story glob pattern

---

### 2. Metro Config

**Purpose**: Wrap Metro config with `withStorybook` for dynamic story imports
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: Block 1

**Steps**:
1. Create `metro.config.js` wrapping Expo's default config with `withStorybook`
2. Set `enabled` based on env var for production exclusion
3. Verify Metro bundler starts without errors

---

### 3. Example Story

**Purpose**: Prove the story convention works — co-located `.stories.tsx` files
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: Block 2

**Steps**:
1. Create a simple `components/Example/Example.tsx` component
2. Create `components/Example/Example.stories.tsx` with CSF format
3. Update `.rnstorybook/main.ts` glob: `'../components/**/*.stories.?(ts|tsx|js|jsx)'`
4. Verify story renders in simulator

---

### 4. Dev Toggle

**Purpose**: Switch between main app and Storybook mode
**Complexity**: Low
**Priority**: 🟢 MUST
**Dependencies**: Block 3

**📌 Decision: Toggle mechanism** (updated after architect review)
- Toggle must happen BEFORE Expo Router initializes — can't do it in `_layout.tsx`
- Create custom `index.js` entry point that checks env var and either imports `expo-router/entry` or registers Storybook UI
- Update `package.json` `"main"` to `"./index.js"`

**Steps**:
1. Create `index.js` that checks `EXPO_PUBLIC_STORYBOOK` and either loads Expo Router or Storybook
2. Update `package.json` `"main"` from `"expo-router/entry"` to `"./index.js"`
3. Add npm script: `"storybook": "EXPO_PUBLIC_STORYBOOK=true expo start"`
4. Verify: `npm run storybook` shows Storybook, `npm start` shows normal app

---

## Dependency Graph

```
Block 1: Install → Block 2: Metro Config → Block 3: Example Story → Block 4: Dev Toggle
```

All sequential — each depends on the previous.

---

## 🔧 Decision Log

### DEC-001: Toggle mechanism
**Type**: 📌 Technical
**Decision**: Env var `EXPO_PUBLIC_STORYBOOK=true` in entry point
**Rationale**: Standard Storybook RN approach, clean production exclusion via Metro `enabled` flag

---

## 👀 Human Validation

- [ ] Storybook UI renders properly in simulator (visual check)
- [ ] Hot reload works when editing a story file
- [ ] Switching between app and Storybook modes works cleanly

## Post-Implementation

1. `/project:issues:preflight --light`
2. `/project:issues:create-pr`

## 📝 Session Log

### 2026-03-29 - Session 1 (Planning)
- Created technical breakdown
- 4 sequential blocks, all low complexity
- Key decision: env var toggle for Storybook mode
- Next: Begin implementation

---

## 🔄 Next Session Quick Start

### Continue With
1. `npx storybook@latest init` in project root
2. Configure metro.config.js with withStorybook
3. Create example component + story
4. Wire up dev toggle

### Do NOT
- ❌ Don't add Storybook addons or decorators
- ❌ Don't create real component stories yet (that's issue #3)
- ❌ Don't modify existing app screens

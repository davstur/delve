# Claude Conversation Management

Commands for finding and managing Claude conversations within your project
context.

## Overview

These commands help you locate previous Claude conversations and restore them to
your recent conversation list, making it easy to continue work from where you
left off.

## Commands

### `/project:conversations:find`

**Search through Claude conversations in the current repository**

Find conversations by searching their content and preview matches to identify
the right conversation.

```bash
# Basic search
/project:conversations:find "authentication implementation"

# Search with preview options
/project:conversations:find "bug fix" --no-preview --limit 5

# Find and automatically make recent (single result only)
/project:conversations:find "user login" --make-recent
```

**Features:**

- 🔍 Searches all Claude conversation files for the current repository
- 📋 Shows conversation previews with recent messages and matching content
- 🎯 Displays match counts and context for each result
- ⚡ Option to automatically make single results recent
- 🔧 Configurable result limits and preview options

### `/project:conversations:make-recent`

**Make a conversation appear as most recent in Claude**

Add a "ping" message to any conversation file to bring it to the top of your
conversation list.

```bash
# Basic usage
/project:conversations:make-recent "/path/to/conversation.jsonl"

# With custom message
/project:conversations:make-recent "/path/to/conversation.jsonl" "resuming authentication work"
```

**Features:**

- 🚀 Adds a timestamped message to the conversation
- ⏰ Updates file modification time for proper ordering
- 💾 Creates automatic backups before modifying files
- ✅ Validates all changes before applying them
- 🔍 Provides verification of the updated conversation order

## Common Workflows

### 1. Find and Resume Previous Work

```bash
# Step 1: Search for conversations about your topic
/project:conversations:find "authentication system"

# Step 2: Review the preview results and choose the right conversation
/project:conversations:make-recent "/Users/user/.claude/projects/-Users-project/89dded08.jsonl"

# Step 3: Open Claude - your conversation is now at the top
```

### 2. Quick Resume with Auto-Selection

```bash
# If you know your search will find exactly one conversation
/project:conversations:find "issue #123 implementation" --make-recent
```

### 3. Context-Aware Resume

```bash
# Use meaningful messages to track your work context
/project:conversations:make-recent "/path/to/conv.jsonl" "continuing from yesterday's bug fix"
/project:conversations:make-recent "/path/to/conv.jsonl" "back to feature implementation"
```

## How It Works

### Claude Conversation Storage

Claude stores conversations as JSONL files in directories like:

```
~/.claude/projects/
├── -Users-username-Development-project-name/
│   ├── 89dded08-2892-4d3f-a719-fa3269fb1f11.jsonl
│   ├── f2e8a9b1-c4d7-4e8f-9a2b-3c5d6e7f8g9h.jsonl
│   └── c4d7e8f9-a2b3-4c5d-6e7f-8g9h0i1j2k3l.jsonl
└── -Users-username-Development-other-project/
    └── ...
```

### Search Strategy

The `find` command:

1. **Identifies repository context** - Determines which conversation directories
   belong to the current git repository
2. **Searches content** - Uses `grep` to find matching text in conversation JSON
3. **Extracts previews** - Parses recent messages and matching lines for context
4. **Ranks results** - Orders by relevance and match count

### Make Recent Strategy

The `make-recent` command:

1. **Extracts metadata** - Gets session ID, last UUID, and git context from the
   conversation
2. **Generates ping message** - Creates a properly formatted JSON message with
   current timestamp
3. **Updates conversation** - Appends the message and updates file modification
   time
4. **Validates changes** - Ensures the conversation appears at the top of the
   list

## Search Tips

### Effective Search Terms

**Good search patterns:**

- Specific function names: `"createUser"`, `"handlePayment"`
- Error messages: `"TypeError: Cannot read"`, `"failed to compile"`
- Feature names: `"user dashboard"`, `"email notifications"`
- Issue references: `"#123"`, `"bug 456"`
- Unique code snippets: `"const authToken ="`, `"useState(false)"`

**Less effective:**

- Common words: `"function"`, `"component"`, `"error"`
- Single letters: `"a"`, `"x"`
- Very generic terms: `"code"`, `"fix"`

### Search Options

| Flag            | Description                           | Example                                                    |
| --------------- | ------------------------------------- | ---------------------------------------------------------- |
| `--preview`     | Show conversation previews (default)  | `/project:conversations:find "auth" --preview`             |
| `--no-preview`  | Only show file paths and counts       | `/project:conversations:find "auth" --no-preview`          |
| `--limit N`     | Limit results to N conversations      | `/project:conversations:find "auth" --limit 3`             |
| `--make-recent` | Auto-make recent (single result only) | `/project:conversations:find "specific bug" --make-recent` |

## Troubleshooting

### No Conversations Found

If the search returns no results:

1. **Check repository context** - Make sure you're in the correct git repository
2. **Verify conversation directory** - Confirm Claude has been used in this
   project before
3. **Try broader search terms** - Use more general terms initially
4. **Check manual directory** - Look in `~/.claude/projects/` for conversation
   directories

### Conversation Doesn't Appear Recent

If a conversation doesn't appear at the top after `make-recent`:

1. **Refresh Claude interface** - Close and reopen Claude
2. **Check timestamp format** - The command validates this, but verify if issues
   persist
3. **Verify account** - Ensure you're logged into the same Claude account
4. **Check backup** - Use the backup file if the original was corrupted

### Multiple Project Directories

If you have multiple related repositories, the search might find conversations
from related projects:

1. **Review search results** - Check the file paths to identify the correct
   conversation
2. **Use more specific terms** - Include project-specific terminology
3. **Check git branch context** - The command shows git branch information for
   additional context

## Integration with Other Commands

### With Project Issues

```bash
# Find conversations about a specific issue
/project:conversations:find "#123"

# Make recent a conversation about current issue work
/project:conversations:make-recent "/path/to/conv.jsonl" "continuing work on issue #123"
```

### With Git Workflows

```bash
# Find conversations related to your current branch
/project:conversations:find "feature/user-auth"

# Resume conversation with current git context
/project:conversations:make-recent "/path/to/conv.jsonl" "back to $(git branch --show-current)"
```

## File Safety

### Automatic Backups

Every `make-recent` operation:

- ✅ Creates a timestamped backup before any modifications
- ✅ Validates JSON format before appending messages
- ✅ Provides restoration instructions if needed
- ✅ Cleans up old backups automatically (guidance provided)

### Backup Management

```bash
# Manual cleanup of old backups (older than 7 days)
find ~/.claude/projects/ -name "*.backup-*" -mtime +7 -delete

# Restore from backup if needed
cp conversation.jsonl.backup-20250917-143022 conversation.jsonl
```

## Advanced Usage

### Batch Operations

```bash
# Make multiple conversations recent with different timestamps
/project:conversations:make-recent "/path/to/conv1.jsonl" "session 1 - setup"
sleep 2  # Ensure different timestamps
/project:conversations:make-recent "/path/to/conv2.jsonl" "session 2 - implementation"
sleep 2
/project:conversations:make-recent "/path/to/conv3.jsonl" "session 3 - testing"
```

### Scripting Integration

```bash
# Find the most recent conversation about a topic and make it current
latest_conversation() {
  local search_term="$1"
  local result=$(/project:conversations:find "$search_term" --limit 1 --no-preview | grep "Path:" | cut -d' ' -f2)
  if [ -n "$result" ]; then
    /project:conversations:make-recent "$result" "auto-resumed: $search_term"
  fi
}

latest_conversation "authentication bug"
```

# Find Claude Conversations

Search through Claude conversation files in the current repository and preview
their contents to find the conversation you're looking for.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which should include:

- Search term(s) (required): Text content to search for in conversations
- Optional flags:
  - `--preview` or `-p`: Show conversation previews (default: enabled)
  - `--no-preview`: Only show file paths and match counts
  - `--limit N`: Limit results to N conversations (default: 10)
  - `--make-recent`: Automatically make the first match recent (single result
    only)

Examples:

```
# Basic search
/project:conversations:find "authentication implementation"

# Search with different options
/project:conversations:find "2211 - 2067" --limit 5
/project:conversations:find "user login" --no-preview
/project:conversations:find "bug fix" --make-recent
```

## Implementation Process

### 1. Parse Arguments and Validate

```bash
# Parse search terms and flags
SEARCH_TERM="$1"
PREVIEW=true
LIMIT=10
MAKE_RECENT=false

# Process flags
shift
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-preview)
      PREVIEW=false
      shift
      ;;
    --preview|-p)
      PREVIEW=true
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --make-recent)
      MAKE_RECENT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate search term
if [ -z "$SEARCH_TERM" ]; then
  echo "❌ Error: Search term is required"
  echo "Usage: /project:conversations:find \"search term\" [options]"
  exit 1
fi
```

### 2. Identify Claude Conversation Directory

```bash
# Find the Claude project directory for this repository
REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_PATH" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

REPO_NAME=$(basename "$REPO_PATH")
CLAUDE_PROJECTS_DIR="$HOME/.claude/projects"

# Look for conversation directories that match this repo
# Claude creates directories with encoded paths
CONVERSATION_DIRS=()

echo "🔍 Searching for Claude conversation directories..."

# Method 1: Direct pattern matching
if [ -d "$CLAUDE_PROJECTS_DIR" ]; then
  # Look for directories containing the repo name or path components
  while IFS= read -r -d '' dir; do
    if [ -d "$dir" ] && [ "$(ls -1 "$dir"/*.jsonl 2>/dev/null | wc -l)" -gt 0 ]; then
      CONVERSATION_DIRS+=("$dir")
    fi
  done < <(find "$CLAUDE_PROJECTS_DIR" -type d -name "*$(basename "$REPO_PATH")*" -print0 2>/dev/null)

  # Method 2: Look for directories with path-encoded names
  ENCODED_PATH=$(echo "$REPO_PATH" | sed 's/\//-/g' | sed 's/^-//')
  while IFS= read -r -d '' dir; do
    if [ -d "$dir" ] && [ "$(ls -1 "$dir"/*.jsonl 2>/dev/null | wc -l)" -gt 0 ]; then
      # Check if not already in array
      if [[ ! " ${CONVERSATION_DIRS[@]} " =~ " ${dir} " ]]; then
        CONVERSATION_DIRS+=("$dir")
      fi
    fi
  done < <(find "$CLAUDE_PROJECTS_DIR" -type d -name "*$ENCODED_PATH*" -print0 2>/dev/null)
fi

if [ ${#CONVERSATION_DIRS[@]} -eq 0 ]; then
  echo "❌ No Claude conversation directories found for this repository"
  echo "🔍 Searched in: $CLAUDE_PROJECTS_DIR"
  echo "💡 Make sure you've had Claude conversations in this repository before"
  exit 1
fi

echo "📁 Found ${#CONVERSATION_DIRS[@]} conversation director(ies):"
for dir in "${CONVERSATION_DIRS[@]}"; do
  echo "   - $(basename "$dir")"
done
echo ""
```

### 3. Search for Matching Conversations

```bash
# Search through all JSONL files in the conversation directories
echo "🔎 Searching for: \"$SEARCH_TERM\""
echo ""

RESULTS=()
MATCH_COUNT=0

for conv_dir in "${CONVERSATION_DIRS[@]}"; do
  # Search all JSONL files in this directory
  while IFS= read -r -d '' jsonl_file; do
    if [ -f "$jsonl_file" ]; then
      # Count matches in this file
      matches=$(grep -c "$SEARCH_TERM" "$jsonl_file" 2>/dev/null || echo "0")

      if [ "$matches" -gt 0 ]; then
        RESULTS+=("$jsonl_file:$matches")
        MATCH_COUNT=$((MATCH_COUNT + 1))

        # Stop if we've reached the limit
        if [ "$MATCH_COUNT" -ge "$LIMIT" ]; then
          break 2
        fi
      fi
    fi
  done < <(find "$conv_dir" -name "*.jsonl" -print0 2>/dev/null)
done

if [ ${#RESULTS[@]} -eq 0 ]; then
  echo "❌ No conversations found containing: \"$SEARCH_TERM\""
  echo "💡 Try different search terms or check conversation directories manually"
  exit 1
fi

echo "✅ Found $MATCH_COUNT conversation(s) containing \"$SEARCH_TERM\""
echo ""
```

### 4. Display Results with Previews

```bash
display_conversation_preview() {
  local jsonl_file="$1"
  local matches="$2"

  echo "📝 File: $(basename "$jsonl_file")"
  echo "🎯 Matches: $matches"
  echo "📍 Path: $jsonl_file"

  if [ "$PREVIEW" = true ]; then
    echo ""
    echo "🔍 **Context Preview:**"

    # Get the last few messages for context
    echo "   Recent messages:"
    tail -3 "$jsonl_file" | while IFS= read -r line; do
      if [ -n "$line" ]; then
        # Extract message content and role
        message_content=$(echo "$line" | jq -r '.message.content[0].text // .message.content // "No content"' 2>/dev/null | head -c 200)
        role=$(echo "$line" | jq -r '.message.role // "unknown"' 2>/dev/null)
        timestamp=$(echo "$line" | jq -r '.timestamp // "No timestamp"' 2>/dev/null)

        if [ "$role" = "user" ]; then
          echo "   👤 User: $message_content..."
        elif [ "$role" = "assistant" ]; then
          echo "   🤖 Assistant: $message_content..."
        fi
      fi
    done

    echo ""
    echo "🎯 **Matching lines:**"
    # Show lines containing the search term with context
    grep -n "$SEARCH_TERM" "$jsonl_file" | head -3 | while IFS= read -r match_line; do
      line_num=$(echo "$match_line" | cut -d: -f1)
      content=$(echo "$match_line" | cut -d: -f2- | jq -r '.message.content[0].text // .message.content // .' 2>/dev/null | head -c 150)
      echo "   Line $line_num: $content..."
    done
  fi

  echo ""
  echo "$(printf '%.80s' "────────────────────────────────────────────────────────────────────────────────")"
  echo ""
}

# Display all results
for i in "${!RESULTS[@]}"; do
  result="${RESULTS[$i]}"
  jsonl_file="${result%:*}"
  matches="${result#*:}"

  echo "Result $((i + 1))/$MATCH_COUNT:"
  display_conversation_preview "$jsonl_file" "$matches"
done
```

### 5. Handle Make-Recent Option

**🚨 IF IN SANDBOX MODE with `--make-recent`: This writes to
`~/.claude/projects/`. Must run with `dangerouslyDisableSandbox: true`.**

```bash
# If --make-recent was specified and we have exactly one result
if [ "$MAKE_RECENT" = true ]; then
  if [ ${#RESULTS[@]} -eq 1 ]; then
    result="${RESULTS[0]}"
    jsonl_file="${result%:*}"

    echo "🚀 Making conversation recent..."
    echo "📁 File: $jsonl_file"
    echo ""

    # Call the make-recent functionality
    /project:conversations:make-recent "$jsonl_file"

  elif [ ${#RESULTS[@]} -gt 1 ]; then
    echo "⚠️  Cannot use --make-recent with multiple results ($MATCH_COUNT found)"
    echo "💡 Either be more specific with your search term, or choose one manually:"
    echo ""
    for i in "${!RESULTS[@]}"; do
      result="${RESULTS[$i]}"
      jsonl_file="${result%:*}"
      echo "   $((i + 1)). /project:conversations:make-recent \"$jsonl_file\""
    done
    echo ""

  else
    echo "❌ Cannot use --make-recent: no results found"
  fi
else
  # Normal mode - show instructions for making conversations recent
  if [ ${#RESULTS[@]} -gt 0 ]; then
    echo "💡 **To make a conversation recent, run:**"
    echo ""
    for i in "${!RESULTS[@]}"; do
      result="${RESULTS[$i]}"
      jsonl_file="${result%:*}"
      echo "   $((i + 1)). /project:conversations:make-recent \"$jsonl_file\""
    done
    echo ""
    echo "Or search again with --make-recent for single results:"
    echo "   /project:conversations:find \"$SEARCH_TERM\" --make-recent"
    echo ""
  fi
fi
```

## Success Output

```
🔍 Searching for Claude conversation directories...
📁 Found 2 conversation director(ies):
   - -Users-alexeistrasser-Development-Repos-project-name
   - -Users-alexeistrasser-Development-Repos-project-name-feature-181

🔎 Searching for: "authentication implementation"

✅ Found 3 conversation(s) containing "authentication implementation"

Result 1/3:
📝 File: 89dded08-2892-4d3f-a719-fa3269fb1f11.jsonl
🎯 Matches: 7
📍 Path: /Users/alexeistrasser/.claude/projects/-Users-project-name/89dded08.jsonl

🔍 **Context Preview:**
   Recent messages:
   👤 User: Can you help me implement the authentication system?
   🤖 Assistant: I'll help you implement a secure authentication system. Let me start by analyzing your current setup...
   👤 User: Make sure to use JWT tokens and bcrypt for password hashing

🎯 **Matching lines:**
   Line 45: "authentication implementation with JWT tokens"
   Line 67: "Let's start the authentication implementation by creating the user model"
   Line 89: "The authentication implementation is now complete with proper security"

────────────────────────────────────────────────────────────────────────────────

Result 2/3:
[Similar format for other results...]

💡 **To make a conversation recent, run:**

   1. /project:conversations:make-recent "/Users/alexeistrasser/.claude/projects/-Users-project-name/89dded08.jsonl"
   2. /project:conversations:make-recent "/Users/alexeistrasser/.claude/projects/-Users-project-name/f2e8a9b1.jsonl"
   3. /project:conversations:make-recent "/Users/alexeistrasser/.claude/projects/-Users-project-name/c4d7e8f9.jsonl"

Or search again with --make-recent for single results:
   /project:conversations:find "authentication implementation" --make-recent
```

## Error Handling

- **No search term**: Clear usage instructions
- **No git repository**: Inform user they must be in a git repo
- **No conversation directories**: Help user understand the directory structure
- **No matches**: Suggest alternative search terms
- **Multiple results with --make-recent**: Show manual options

## Tips for Users

- Use specific terms from your conversations for better results
- Common search patterns:
  - Function names: `"createUser"`, `"handleAuth"`
  - Error messages: `"TypeError"`, `"failed to connect"`
  - Feature names: `"user dashboard"`, `"payment integration"`
  - Issue numbers: `"#123"`, `"issue 456"`
- Use `--no-preview` for faster searches when you just need file paths
- Use `--limit` to control result size for broad searches

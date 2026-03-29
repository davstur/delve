#!/bin/bash

# Update Agentic Coding workflow in the current project
# Supports both local filesystem and GitHub sources

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to download from GitHub
download_from_github() {
    local github_url=$1
    local temp_dir=$(mktemp -d)
    
    print_status "$BLUE" "Downloading workflow from GitHub..."
    
    # Extract owner/repo from URL
    # Expected format: https://github.com/owner/repo
    local repo_path=$(echo "$github_url" | sed 's|https://github.com/||' | sed 's|/$||')
    
    # Try to get latest release
    local api_url="https://api.github.com/repos/${repo_path}/releases/latest"
    print_status "$BLUE" "Checking for releases at: $api_url"
    local release_info=$(curl -s "$api_url")
    
    if echo "$release_info" | grep -q "Not Found"; then
        print_status "$RED" "Error: No releases found for $repo_path"
        print_status "$YELLOW" "Make sure the repository has published releases"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Get tarball URL
    local tarball_url=$(echo "$release_info" | grep -o '"tarball_url": *"[^"]*"' | sed 's/.*: *"\(.*\)"/\1/')
    
    if [ -z "$tarball_url" ]; then
        # Fallback to archive of main branch
        print_status "$YELLOW" "No release found, using main branch..."
        tarball_url="https://github.com/${repo_path}/archive/main.tar.gz"
    fi
    
    # Download and extract
    cd "$temp_dir"
    print_status "$BLUE" "Downloading from: $tarball_url"
    if ! curl -L -o workflow.tar.gz "$tarball_url"; then
        print_status "$RED" "Error: Failed to download from $tarball_url"
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 1
    fi
    print_status "$GREEN" "✓ Downloaded successfully"
    
    print_status "$BLUE" "Extracting archive..."
    tar -xzf workflow.tar.gz
    
    # Find the src directory (workflow source)
    print_status "$BLUE" "Looking for src directory..."
    local extracted_dir=$(find . -maxdepth 2 -type d -name "src" | head -1)
    
    if [ -z "$extracted_dir" ]; then
        print_status "$RED" "Error: No src directory found in downloaded archive"
        print_status "$YELLOW" "Archive contents:"
        ls -la
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 1
    fi
    print_status "$GREEN" "✓ Found src at: $extracted_dir"
    
    # Return the path to the src directory
    echo "$temp_dir/$extracted_dir"
}

# Function to update from local filesystem
update_from_local() {
    local source_path=$1
    
    if [ ! -d "$source_path" ]; then
        print_status "$RED" "Error: Workflow source directory not found at: $source_path"
        return 1
    fi
    
    echo "$source_path"
}

# Main update logic
main() {
    # Get the directory where this script is located
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # Navigate to project root (one level up from .workflow/)
    PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
    cd "$PROJECT_ROOT"
    
    # Check if we're in a project with workflow installed
    if [ ! -d ".claude/commands/project" ]; then
        print_status "$RED" "Error: No workflow found in project"
        print_status "$YELLOW" "This script should be in .workflow/ of a project with workflow installed"
        exit 1
    fi
    
    # Check for workflow config
    if [ ! -f ".workflow/config.json" ]; then
        print_status "$RED" "Error: .workflow/config.json file not found"
        print_status "$YELLOW" "Please create a .workflow/config.json file with update configuration:"
        print_status "$YELLOW" '{'
        print_status "$YELLOW" '  "update": {'
        print_status "$YELLOW" '    "source": "/path/to/agentic-coding/workflow"'
        print_status "$YELLOW" '  }'
        print_status "$YELLOW" '}'
        exit 1
    fi
    
    # Extract update sources from config.json
    SOURCES=$(jq -r '.update.sources[]? | select(.enabled != false) | .url // .path' .workflow/config.json 2>/dev/null | head -1)
    
    if [ -z "$SOURCES" ]; then
        print_status "$RED" "Error: No update source found in config.json"
        print_status "$YELLOW" "Please add update sources to your config.json:"
        print_status "$YELLOW" '{'
        print_status "$YELLOW" '  "update": {'
        print_status "$YELLOW" '    "sources": ['
        print_status "$YELLOW" '      {"type": "local", "path": "/path/to/workflow", "enabled": true},'
        print_status "$YELLOW" '      {"type": "github", "url": "https://github.com/owner/repo", "enabled": false}'
        print_status "$YELLOW" '    ]'
        print_status "$YELLOW" '  }'
        print_status "$YELLOW" '}'
        exit 1
    fi
    
    WORKFLOW_SOURCE="$SOURCES"
    print_status "$BLUE" "Workflow source: $WORKFLOW_SOURCE"
    
    # Determine source type and get workflow directory
    if [[ "$WORKFLOW_SOURCE" =~ ^https:// ]]; then
        print_status "$BLUE" "Using GitHub source..."
        WORKFLOW_DIR=$(download_from_github "$WORKFLOW_SOURCE")
        if [ $? -ne 0 ]; then
            print_status "$RED" "Error: Failed to download from GitHub"
            exit 1
        fi
        IS_TEMP=true
    else
        print_status "$BLUE" "Using local filesystem source..."
        WORKFLOW_DIR=$(update_from_local "$WORKFLOW_SOURCE")
        if [ $? -ne 0 ]; then
            print_status "$RED" "Error: Failed to access local source"
            exit 1
        fi
        IS_TEMP=false
    fi
    
    if [ -z "$WORKFLOW_DIR" ] || [ ! -d "$WORKFLOW_DIR" ]; then
        print_status "$RED" "Error: Workflow directory not found"
        exit 1
    fi
    
    # Check versions
    local source_version="Unknown"
    local current_version="Unknown"
    
    if [ -f "$WORKFLOW_DIR/VERSION" ]; then
        source_version=$(cat "$WORKFLOW_DIR/VERSION")
    fi
    
    if [ -f ".claude/commands/project/VERSION" ]; then
        current_version=$(cat ".claude/commands/project/VERSION")
    fi
    
    print_status "$GREEN" "Source version: $source_version"
    print_status "$GREEN" "Current version: $current_version"
    
    # Check if backups are enabled (default: true)
    BACKUP_ENABLED=$(jq -r '.update.backup // true' .workflow/config.json 2>/dev/null)

    if [ "$BACKUP_ENABLED" = "true" ]; then
        # Create backup
        BACKUP_DIR=".workflow-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"

        # Backup current commands
        if [ -d ".claude/commands/project" ]; then
            cp -r .claude/commands/project "$BACKUP_DIR/"
            print_status "$GREEN" "✓ Backed up current commands to $BACKUP_DIR"
        fi
        if [ -d ".claude/commands/session" ]; then
            cp -r .claude/commands/session "$BACKUP_DIR/"
        fi
        if [ -d ".claude/commands/scripts" ]; then
            cp -r .claude/commands/scripts "$BACKUP_DIR/"
        fi
        if [ -d ".claude/agents" ]; then
            cp -r .claude/agents "$BACKUP_DIR/"
        fi
        if [ -d ".claude/skills" ]; then
            cp -r .claude/skills "$BACKUP_DIR/"
        fi
        if [ -d ".claude/rules" ]; then
            cp -r .claude/rules "$BACKUP_DIR/"
        fi

        # Backup workflow guides if they exist
        if [ -d ".workflow/guides" ]; then
            cp -r .workflow/guides "$BACKUP_DIR/"
        fi
    else
        BACKUP_DIR=""
        print_status "$YELLOW" "⏭ Backups disabled (update.backup = false)"
    fi
    
    
    # Update command files
    print_status "$BLUE" "Updating command files..."

    # Copy all command files from source (including subdirectories)
    cp -r "$WORKFLOW_DIR/commands/project/"* .claude/commands/project/

    # Copy session commands if they exist
    if [ -d "$WORKFLOW_DIR/commands/session" ]; then
        mkdir -p .claude/commands/session
        cp -r "$WORKFLOW_DIR/commands/session/"* .claude/commands/session/
        print_status "$GREEN" "✓ Updated session commands"
    fi

    # Copy shared scripts if they exist
    if [ -d "$WORKFLOW_DIR/commands/scripts" ]; then
        mkdir -p .claude/commands/scripts
        cp -r "$WORKFLOW_DIR/commands/scripts/"* .claude/commands/scripts/
        print_status "$GREEN" "✓ Updated shared scripts"
    fi

    # Copy agents if they exist
    if [ -d "$WORKFLOW_DIR/agents" ]; then
        mkdir -p .claude/agents
        cp -r "$WORKFLOW_DIR/agents/"* .claude/agents/
        print_status "$GREEN" "✓ Updated agents ($(find .claude/agents -name "*.md" | wc -l | tr -d ' ') files)"
    fi

    # Copy skills if they exist
    if [ -d "$WORKFLOW_DIR/skills" ]; then
        mkdir -p .claude/skills
        cp -r "$WORKFLOW_DIR/skills/"* .claude/skills/
        print_status "$GREEN" "✓ Updated skills ($(find .claude/skills -name "SKILL.md" | wc -l | tr -d ' ') skills)"
    fi

    # Copy generic rules if they exist
    if [ -d "$WORKFLOW_DIR/rules/generic" ]; then
        mkdir -p .claude/rules
        cp -r "$WORKFLOW_DIR/rules/generic/"* .claude/rules/
        print_status "$GREEN" "✓ Updated generic rules"
    fi

    # Copy VERSION file if it exists
    if [ -f "$WORKFLOW_DIR/VERSION" ]; then
        cp "$WORKFLOW_DIR/VERSION" .claude/commands/project/
    fi
    
    print_status "$GREEN" "✓ Updated $(find .claude/commands/project -name "*.md" | wc -l) command files"
    
    # Update documentation
    print_status "$BLUE" "Updating documentation..."
    
    # Update workflow guides to new location
    mkdir -p .workflow/guides
    for doc in workflow-guide.md workflow-diagram.svg; do
        if [ -f "$WORKFLOW_DIR/guides/$doc" ]; then
            cp "$WORKFLOW_DIR/guides/$doc" ".workflow/guides/" 2>/dev/null || true
        fi
    done
    
    
    # Copy this update script to the project
    if [ -f "$WORKFLOW_DIR/update-workflow.sh" ]; then
        mkdir -p .workflow
        cp "$WORKFLOW_DIR/update-workflow.sh" .workflow/
        chmod +x .workflow/update-workflow.sh
        print_status "$GREEN" "✓ Updated update script in .workflow/"
    fi
    
    # Clean up temp directory if from GitHub
    if [ "$IS_TEMP" = true ]; then
        rm -rf "$(dirname "$WORKFLOW_DIR")"
    fi
    
    # Add backup folders to .gitignore if needed
    if [ -n "$BACKUP_DIR" ] && [ -f .gitignore ]; then
        if ! grep -q "^.workflow-backup-\*" .gitignore; then
            echo "" >> .gitignore
            echo "# Workflow update backups (temporary)" >> .gitignore
            echo ".workflow-backup-*" >> .gitignore
        fi
    fi
    
    # Fix permissions on check-commit.sh if it exists and needs fixing
    if [ -f ".claude/check-commit.sh" ] && [ ! -x ".claude/check-commit.sh" ]; then
        chmod +x .claude/check-commit.sh
        print_status "$YELLOW" "✓ Fixed permissions on .claude/check-commit.sh"
    fi
    
    # Report completion
    echo ""
    print_status "$GREEN" "=========================================="
    print_status "$GREEN" "✅ Workflow Update Complete!"
    print_status "$GREEN" "=========================================="
    echo ""
    
    if [ "$current_version" != "$source_version" ]; then
        print_status "$BLUE" "Updated from version $current_version to $source_version"
    fi
    
    echo ""
    echo "What was updated:"
    echo "  - Command files in .claude/commands/project/"
    echo "  - Agents in .claude/agents/"
    echo "  - Skills in .claude/skills/"
    echo "  - Generic rules in .claude/rules/"
    echo "  - Workflow guides in .workflow/guides/"
    echo "  - Documentation in docs/ (if applicable)"
    echo "  - Update script (.workflow/update-workflow.sh)"
    echo ""
    echo "What was preserved:"
    echo "  - Project-specific files (PLATFORM.md, CLAUDE.md, etc.)"
    echo "  - Your custom configurations"
    echo "  - All project content"
    echo ""
    if [ -n "$BACKUP_DIR" ]; then
        echo "Backup location: $BACKUP_DIR"
        echo ""
    fi
    echo "Next steps:"
    echo "1. Review the changes"
    echo "2. Test a few commands to ensure everything works"
    echo "3. Commit the update:"
    echo ""
    echo "   git add -A"
    echo "   git commit -m \"chore: Update workflow to version $source_version\""
    if [ -n "$BACKUP_DIR" ]; then
        echo ""
        echo "4. Delete the backup when satisfied: rm -rf $BACKUP_DIR"
    fi
    echo ""
    
    # Create update log
    echo "$(date): Updated workflow from $current_version to $source_version" >> .workflow-updates.log
}

# Run main function
main
#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="delve-api"
REGION="europe-west1"

# Load .env into associative array
declare -A env_vars
while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    env_vars["$key"]="${value//\"/}"
done < .env

# Validate required vars
required=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY ANTHROPIC_API_KEY)
for var in "${required[@]}"; do
    if [[ -z "${env_vars[$var]:-}" ]]; then
        echo "ERROR: Missing required var: $var"
        exit 1
    fi
done

# Override for production
env_vars["ENVIRONMENT"]="production"

# Generate .env.cloudrun.yaml
ENV_FILE=".env.cloudrun.yaml"
trap 'rm -f "$ENV_FILE"' EXIT

> "$ENV_FILE"
for key in "${!env_vars[@]}"; do
    echo "$key: \"${env_vars[$key]}\"" >> "$ENV_FILE"
done

echo "Deploying $SERVICE_NAME to $REGION..."

# Public API — authentication handled at the application layer
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --env-vars-file "$ENV_FILE" \
    --quiet

URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')
echo ""
echo "Deployed: $URL"
echo "Health:   $URL/health"

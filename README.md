# Transmissions

A web app for collecting and displaying how humans feel about AI. Users have a guided conversation with Claude, and with their permission, their words are stored anonymously and displayed to others.

## Stack

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude API
- **Storage**: AWS DynamoDB (single-table design) + S3
- **Infrastructure**: Terraform (in `terraform/`)

## Setup

```bash
npm install
```

### AWS Infrastructure

Requires AWS CLI credentials configured (`~/.aws/credentials` or SSO).

```bash
cd terraform
terraform init
terraform apply \
  -var="environment=dev" \
  -var="github_repository=https://github.com/youruser/transmissions" \
  -var="github_access_token=ghp_xxxx" \
  -var="anthropic_api_key=sk-ant-xxxx"
```

This creates DynamoDB tables, S3 bucket, Secrets Manager secret, Amplify app with auto-deploy, and IAM roles. Copy the output env vars to `.env.local` for local dev:

```
ANTHROPIC_API_KEY=your-key
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=transmissions-dev
DYNAMODB_STATS_TABLE_NAME=transmissions-stats-dev
S3_BUCKET_NAME=transmissions-conversations-dev
```

### Run

```bash
npm run dev
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/conversation` | POST | Proxies messages to Claude (rate limited) |
| `/api/submit` | POST | Extracts quote, saves to S3 + DynamoDB |
| `/api/conversations` | GET | Paginated, filterable listing (summary + quote) |
| `/api/conversations/:id` | GET | Full conversation from S3 |
| `/api/demographics` | POST | Voluntary demographics (decoupled) |
| `/api/vote` | POST | Increment vote count |
| `/api/stats` | GET | Aggregated counts |

## Architecture

See `docs/schema-and-storage-plan.md` for the full data model and storage design.

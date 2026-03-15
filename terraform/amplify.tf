resource "aws_amplify_app" "transmissions" {
  name       = "transmissions${local.suffix}"
  repository = var.github_repository

  access_token = var.github_access_token

  iam_service_role_arn = aws_iam_role.amplify.arn

  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
  YAML

  platform = "WEB_COMPUTE"

  environment_variables = {
    DYNAMODB_TABLE_NAME       = aws_dynamodb_table.transmissions.name
    DYNAMODB_STATS_TABLE_NAME = aws_dynamodb_table.transmissions_stats.name
    S3_BUCKET_NAME            = aws_s3_bucket.conversations.id
    ANTHROPIC_API_KEY         = aws_secretsmanager_secret_version.anthropic_api_key.secret_string
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.transmissions.id
  branch_name = "main"

  enable_auto_build = true

  stage = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
}

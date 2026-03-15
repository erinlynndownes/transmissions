output "dynamodb_table_name" {
  description = "Main transmissions DynamoDB table name"
  value       = aws_dynamodb_table.transmissions.name
}

output "dynamodb_stats_table_name" {
  description = "Stats DynamoDB table name"
  value       = aws_dynamodb_table.transmissions_stats.name
}

output "s3_bucket_name" {
  description = "Conversations S3 bucket name"
  value       = aws_s3_bucket.conversations.id
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.transmissions.id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.transmissions.default_domain
}

output "env_vars" {
  description = "Copy these to .env.local for local dev"
  value = <<-EOT
    AWS_REGION=${var.region}
    DYNAMODB_TABLE_NAME=${aws_dynamodb_table.transmissions.name}
    DYNAMODB_STATS_TABLE_NAME=${aws_dynamodb_table.transmissions_stats.name}
    S3_BUCKET_NAME=${aws_s3_bucket.conversations.id}
  EOT
}

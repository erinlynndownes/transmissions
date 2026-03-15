data "aws_caller_identity" "current" {}

resource "aws_iam_role" "amplify" {
  name = "transmissions-amplify${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan",
        ]
        Resource = [
          aws_dynamodb_table.transmissions.arn,
          aws_dynamodb_table.transmissions_stats.arn,
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "amplify_s3" {
  name = "s3-access"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
        ]
        Resource = "${aws_s3_bucket.conversations.arn}/*"
      }
    ]
  })
}

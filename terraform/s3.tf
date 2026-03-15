resource "aws_s3_bucket" "conversations" {
  bucket = "transmissions-conversations${local.suffix}"
}

resource "aws_s3_bucket_public_access_block" "conversations" {
  bucket = aws_s3_bucket.conversations.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "conversations" {
  bucket = aws_s3_bucket.conversations.id

  rule {
    id     = "glacier-after-1-year"
    status = "Enabled"

    filter {
      prefix = "conversations/"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

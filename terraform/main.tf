terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket         = "transmissions-terraform-state"
    dynamodb_table = "transmissions-terraform-locks"
    region         = "us-east-1"
    encrypt        = true
    # Override key per environment:
    #   terraform init -backend-config="key=dev/terraform.tfstate"
    #   terraform init -backend-config="key=prod/terraform.tfstate"
    key = "dev/terraform.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  suffix = var.environment == "prod" ? "" : "-${var.environment}"
}

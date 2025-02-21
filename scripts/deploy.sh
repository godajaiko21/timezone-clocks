#!/bin/bash

# Exit on error
set -e

# Check arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <stack-name>"
    exit 1
fi

STACK_NAME=$1
REGION=$(aws configure get region)
if [ -z "$REGION" ]; then
    echo "AWS region is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo "Failed to get AWS Account ID"
    exit 1
fi

echo "Deploying stack: $STACK_NAME in region: $REGION"

# Set CloudFormation template path
TEMPLATE_PATH="cloudformation/template.yaml"

# Check if stack exists (improved check)
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
    # Update existing stack
    echo "Updating existing stack..."
    set +e  # Temporarily disable exit on error
    aws cloudformation deploy \
        --template-file "$TEMPLATE_PATH" \
        --stack-name "$STACK_NAME" \
        --no-fail-on-empty-changeset \
        --capabilities CAPABILITY_NAMED_IAM \
        --no-cli-pager
    
    # Check if there are any updates in progress
    if aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --query 'StackEvents[?ResourceStatus==`UPDATE_IN_PROGRESS`]' \
        --output text | grep -q .; then
        echo "Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
    else
        echo "No stack update in progress. Continuing deployment..."
    fi
    set -e  # Re-enable exit on error
else
    # Create new stack
    echo "Creating new stack..."
    aws cloudformation create-stack \
        --template-body file://"$TEMPLATE_PATH" \
        --stack-name "$STACK_NAME" \
        --capabilities CAPABILITY_NAMED_IAM \
        --no-cli-pager

    echo "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --no-cli-pager
fi

# Get stack outputs
echo "Getting stack outputs..."
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`TimezoneClocksWebsiteBucket`].OutputValue' \
    --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`TimezoneClocksWebUrl`].OutputValue' \
    --output text)

if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_DOMAIN" ]; then
    echo "Failed to get stack outputs"
    exit 1
fi

# Upload website files with correct paths
echo "Uploading website files to S3..."
aws s3 sync src/ s3://$S3_BUCKET/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate"

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='$CLOUDFRONT_DOMAIN'].Id" \
    --output text)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*"
fi

echo "Deployment completed successfully!"
echo "Website URL: $CLOUDFRONT_DOMAIN"
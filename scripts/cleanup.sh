#!/bin/bash

# Exit on error
set -e

# Check arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <stack-name>"
    exit 1
fi

STACK_NAME=$1

# Get stack outputs before deletion
echo "Getting stack resources..."
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`TimezoneClocksWebsiteBucket`].OutputValue' \
    --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`TimezoneClocksWebUrl`].OutputValue' \
    --output text)

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='$CLOUDFRONT_DOMAIN'].Id" \
    --output text)

echo "Found resources to clean up:"
echo "- CloudFormation Stack: $STACK_NAME"
echo "- S3 Bucket: $S3_BUCKET"
echo "- CloudFront Distribution: $DISTRIBUTION_ID"

# Confirm with user
read -p "Are you sure you want to delete these resources? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 1
fi

# Disable CloudFront distribution
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "Disabling CloudFront distribution..."
    aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json > dist-config.json
    ETAG=$(aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --query 'ETag' --output text)
    
    # Update the configuration to disable the distribution
    cat dist-config.json | jq '.DistributionConfig.Enabled = false' > dist-config-updated.json
    
    aws cloudfront update-distribution \
        --id "$DISTRIBUTION_ID" \
        --distribution-config file://dist-config-updated.json \
        --if-match "$ETAG"
        
    echo "Waiting for CloudFront distribution to be disabled..."
    aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"
    
    rm dist-config.json dist-config-updated.json
fi

# Empty S3 bucket
if [ ! -z "$S3_BUCKET" ]; then
    echo "Emptying S3 bucket..."
    aws s3 rm "s3://$S3_BUCKET" --recursive
fi

# Delete CloudFormation stack
echo "Deleting CloudFormation stack..."
aws cloudformation delete-stack --stack-name "$STACK_NAME"

echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"

echo "Cleanup completed successfully!"
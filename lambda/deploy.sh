#!/bin/bash

# Deployment script for AWS Lambda
set -e

echo "🚀 Starting Lambda deployment process..."

# Configuration
FUNCTION_NAME="outlaw-admin"
REGION="us-east-1"
ZIP_FILE="deployment.zip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

print_status "AWS CLI configured properly"

# Install production dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Remove existing zip file
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
    print_status "Removed existing deployment.zip"
fi

# Create deployment package
print_status "Creating deployment package..."
zip -r "$ZIP_FILE" . \
    -x "*.git*" \
    "node_modules/.cache/*" \
    "*.log" \
    "test/*" \
    "*.md" \
    "deploy.sh" \
    ".env*" \
    "*.zip"

print_status "Deployment package created: $ZIP_FILE"

# Get package size
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
print_status "Package size: $ZIP_SIZE"

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    print_status "Updating existing Lambda function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION"
    
    print_status "Function code updated successfully"
    
    # Update function configuration (if needed)
    print_status "Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "nodejs20.x" \
        --handler "index.handler" \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION"
    
    print_status "Function configuration updated"
    
else
    print_warning "Function $FUNCTION_NAME does not exist. You need to create it first."
    print_warning "Use the AWS Console or AWS CLI to create the function with the following settings:"
    echo "  - Runtime: Node.js 20.x"
    echo "  - Handler: index.handler"
    echo "  - Timeout: 30 seconds"
    echo "  - Memory: 512 MB"
    echo "  - Environment variables from your .env file"
fi

# Clean up
rm "$ZIP_FILE"
print_status "Cleanup completed"

print_status "Deployment process completed! 🎉"

echo ""
echo "Next steps:"
echo "1. Configure environment variables in AWS Lambda console"
echo "2. Set up API Gateway (if not already done)"
echo "3. Test your endpoints"
echo ""
echo "Useful commands:"
echo "  - View logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo "  - Test function: aws lambda invoke --function-name $FUNCTION_NAME response.json"
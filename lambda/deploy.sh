#!/bin/bash
# deploy-lambda.sh - Script to deploy your Lambda function

echo "🚀 Starting Lambda deployment..."

# Create deployment directory
mkdir -p lambda-deploy
cd lambda-deploy

# Copy source files
echo "📁 Copying source files..."
cp -r ../backend/src ./
cp ../backend/package.json ./
cp ../lambda/index.js ./

# Install production dependencies
echo "📦 Installing dependencies..."
npm install --production

# Remove unnecessary files
echo "🧹 Cleaning up..."
rm -rf .git
rm -rf node_modules/aws-sdk
rm -rf *.log
rm -rf .env

# Create deployment zip
echo "📦 Creating deployment package..."
zip -r ../admin-lambda.zip . -x "*.git*" "*.DS_Store*" "node_modules/.cache/*"

# Go back to root directory
cd ..
rm -rf lambda-deploy

echo "✅ Deployment package created: admin-lambda.zip"
echo "📤 Upload this file to your AWS Lambda function"

# Optional: Upload using AWS CLI (uncomment if you have AWS CLI configured)
# echo "🚀 Uploading to AWS Lambda..."
# aws lambda update-function-code --function-name AdminLambda --zip-file fileb://admin-lambda.zip

echo "🎉 Deployment complete!"
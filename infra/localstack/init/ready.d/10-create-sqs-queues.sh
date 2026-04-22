#!/usr/bin/env bash
set -euo pipefail

MAIN_QUEUE_NAME="webhook-events"
DLQ_NAME="webhook-events-dlq"

echo "Creating DLQ: ${DLQ_NAME}"
DLQ_URL=$(awslocal sqs create-queue \
  --queue-name "${DLQ_NAME}" \
  --attributes VisibilityTimeout=30 \
  --query 'QueueUrl' \
  --output text)

echo "DLQ_URL=${DLQ_URL}"

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "${DLQ_URL}" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

echo "DLQ_ARN=${DLQ_ARN}"

echo "Creating main queue: ${MAIN_QUEUE_NAME}"
MAIN_QUEUE_URL=$(awslocal sqs create-queue \
  --queue-name "${MAIN_QUEUE_NAME}" \
  --attributes VisibilityTimeout=30,ReceiveMessageWaitTimeSeconds=10 \
  --query 'QueueUrl' \
  --output text)

echo "MAIN_QUEUE_URL=${MAIN_QUEUE_URL}"

echo "Applying redrive policy to main queue"
awslocal sqs set-queue-attributes \
  --queue-url "${MAIN_QUEUE_URL}" \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"

echo "Queues created successfully."
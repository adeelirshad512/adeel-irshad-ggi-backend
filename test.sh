2#!/bin/bash

echo "Testing API Flow..."

# Test 1: Valid chat request
echo "Test 1: POST /api/chat (Valid)"
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "question": "Hello?"}'
echo -e "\nExpected: {\"result\": {\"answer\": \"Mocked response to: Hello?\"}, \"error\": null}\n"

# Test 2: Invalid chat request (question is not a string)
echo "Test 2: POST /api/chat (Invalid question)"
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "question": 111}'
echo -e "\nExpected: {\"result\": null, \"error\": {\"code\": 400, \"message\": \"question must be a non-empty string\"}}\n"

# Test 3: Invalid chat request (invalid userId)
echo "Test 3: POST /api/chat (Invalid userId)"
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "invalid", "question": "Hello?"}'
echo -e "\nExpected: {\"result\": null, \"error\": {\"code\": 400, \"message\": \"userId must be a valid UUID\"}}\n"

# Test 4: Valid subscription creation
echo "Test 4: POST /api/subscriptions (Valid)"
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"userId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "type": "yearly", "autoRenew": true}'
echo -e "\nExpected: {\"result\": {\"message\": \"Subscription created\"}, \"error\": null}\n"

# Test 5: Invalid subscription (invalid type)
echo "Test 5: POST /api/subscriptions (Invalid type)"
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"userId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "type": "invalid", "autoRenew": true}'
echo -e "\nExpected: {\"result\": null, \"error\": {\"code\": 400, \"message\": \"type must be either \\\"monthly\\\" or \\\"yearly\\\"\"}}\n"

# Test 6: Toggle auto-renew
echo "Test 6: PATCH /api/subscriptions/auto-renew (Valid)"
curl -X PATCH http://localhost:3000/api/subscriptions/auto-renew \
  -H "Content-Type: application/json" \
  -d '{"userId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "autoRenew": false}'
echo -e "\nExpected: {\"result\": {\"message\": \"Auto-renew updated\"}, \"error\": null}\n"

# Test 7: Renew subscription (assuming autoRenew is true)
echo "Test 7: POST /api/subscriptions/renew (Valid)"
curl -X POST http://localhost:3000/api/subscriptions/renew \
  -H "Content-Type: application/json" \
  -d '{"userId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"}'
echo -e "\nExpected: {\"result\": {\"message\": \"Payment renewed\"}, \"error\": null}\n"
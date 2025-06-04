#!/bin/bash

# Manual test script for Tomodachi Tours backend functions
BASE_URL="https://us-central1-tomodachitours-f4612.cloudfunctions.net"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🧪 Manual Testing Script for Tomodachi Tours${NC}"
echo -e "${CYAN}==============================================${NC}"

# Test discount codes
echo -e "\n${BLUE}Testing WELCOME10 discount code:${NC}"
curl -X POST -H "Content-Type: application/json" \
    -d '{"code": "WELCOME10", "tourPrice": 10000, "adults": 2, "children": 1}' \
    "$BASE_URL/validateDiscountCode"

echo -e "\n\n${BLUE}Testing invalid discount code:${NC}"
curl -X POST -H "Content-Type: application/json" \
    -d '{"code": "INVALID123", "tourPrice": 10000, "adults": 2, "children": 1}' \
    "$BASE_URL/validateDiscountCode"

echo -e "\n\n${BLUE}Testing booking lookup:${NC}"
curl -X POST -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}' \
    "$BASE_URL/getBookingDetails"

echo -e "\n\n${GREEN}✅ Manual tests completed!${NC}" 
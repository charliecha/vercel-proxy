#!/bin/bash

# Vercel Proxy Test Script
# Usage: ./scripts/test-proxy.sh [HOST] [API_KEY]

HOST=${1:-"http://localhost:3000"}
API_KEY=${2:-"sk-1234"}

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting Vercel Proxy tests on $HOST..."
echo "🔑 Using API Key: $API_KEY"
echo "---------------------------------------"

# Function to run a test case
run_test() {
    local name=$1
    local cmd=$2
    echo -e "🧪 Testing: $name..."
    local start_time=$(date +%s%N)
    
    # Execute the command and capture response + status code
    response=$(eval "$cmd")
    status_code=$?
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    if [ $status_code -eq 0 ]; then
        echo -e "${GREEN}✅ Success${NC} ($duration ms)"
        echo "$response" | head -n 5
        [ $(echo "$response" | wc -l) -gt 5 ] && echo "..."
    else
        echo -e "${RED}❌ Failed${NC} (Exit code: $status_code)"
    fi
    echo "---------------------------------------"
}

# 1. Basic GET Proxy Test (GitHub API)
run_test "Basic GET Proxy (GitHub API)" \
"curl -s -H 'X-API-Key: $API_KEY' '$HOST/api/proxy?url=https://api.github.com/zen'"

# 2. POST Proxy Test (HTTPBin)
run_test "POST Proxy (HTTPBin)" \
"curl -s -X POST -H 'X-API-Key: $API_KEY' -H 'Content-Type: application/json' \
-d '{\"test\":\"hello\"}' '$HOST/api/proxy?url=https://httpbin.org/post'"

# 3. Google Shortcut Test
run_test "Google Shortcut" \
"curl -s -H 'X-API-Key: $API_KEY' '$HOST/api/proxy/google/search?q=Vercel+Edge'"

# 4. Auth Failure Test (Missing Key)
echo -e "🧪 Testing: Auth Failure (Missing Key)..."
status=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/api/proxy?url=https://example.com")
if [ "$status" == "401" ]; then
    echo -e "${GREEN}✅ Correctly blocked (401)${NC}"
else
    echo -e "${RED}❌ Unexpected status: $status (Expected 401)${NC}"
fi
echo "---------------------------------------"

# 5. Auth Failure Test (Invalid Key)
echo -e "🧪 Testing: Auth Failure (Invalid Key)..."
status=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: wrong-key" "$HOST/api/proxy?url=https://example.com")
if [ "$status" == "401" ]; then
    echo -e "${GREEN}✅ Correctly blocked (401)${NC}"
else
    echo -e "${RED}❌ Unexpected status: $status (Expected 401)${NC}"
fi
echo "---------------------------------------"

echo "🏁 Tests completed!"

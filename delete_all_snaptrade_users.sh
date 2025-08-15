#!/bin/bash

# SnapTrade User Deletion Script
# Deletes all SnapTrade users from both production and local testing environments
# Based on SnapTrade API documentation: https://docs.snaptrade.com/reference/Authentication/Authentication_deleteSnapTradeUser

set -e  # Exit on any error

# Configuration
SNAPTRADE_API_BASE="https://api.snaptrade.com/api/v1"
BACKEND_API_BASE="http://localhost:8000"
CREDENTIALS_FILE=".snaptrade_credentials"
USERS_FILE=".snaptrade_users"
USERS_PICKLE_FILE=".snaptrade_users_pickle"

# SnapTrade API credentials (set these environment variables)
SNAPTRADE_CLIENT_ID="${SNAPTRADE_CLIENT_ID:-}"
SNAPTRADE_CONSUMER_KEY="${SNAPTRADE_CONSUMER_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to load credentials from .env file
load_env_credentials() {
    if [[ -f ".env" ]]; then
        print_status $BLUE "📁 Loading credentials from .env file..."
        
        # Export variables from .env file
        export $(grep -v '^#' .env | xargs)
        
        # Verify the credentials were loaded
        if [[ -n "$SNAPTRADE_CLIENT_ID" && -n "$SNAPTRADE_CONSUMER_KEY" ]]; then
            print_status $GREEN "✅ Credentials loaded from .env file"
            print_status $CYAN "   Client ID: ${SNAPTRADE_CLIENT_ID:0:8}..."
            print_status $CYAN "   Consumer Key: ${SNAPTRADE_CONSUMER_KEY:0:8}..."
            echo ""
        else
            print_status $YELLOW "⚠️  Could not find complete credentials in .env file"
            print_status $YELLOW "   Trying manual extraction..."
            
            # Fallback to manual extraction
            if [[ -z "$SNAPTRADE_CLIENT_ID" ]]; then
                SNAPTRADE_CLIENT_ID=$(grep "^SNAPTRADE_CLIENT_ID=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
                export SNAPTRADE_CLIENT_ID
            fi
            
            if [[ -z "$SNAPTRADE_CONSUMER_KEY" ]]; then
                SNAPTRADE_CONSUMER_KEY=$(grep "^SNAPTRADE_CONSUMER_KEY=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
                export SNAPTRADE_CONSUMER_KEY
            fi
            
            if [[ -n "$SNAPTRADE_CLIENT_ID" && -n "$SNAPTRADE_CONSUMER_KEY" ]]; then
                print_status $GREEN "✅ Credentials loaded via manual extraction"
                print_status $CYAN "   Client ID: ${SNAPTRADE_CLIENT_ID:0:8}..."
                print_status $CYAN "   Consumer Key: ${SNAPTRADE_CONSUMER_KEY:0:8}..."
                echo ""
            else
                print_status $RED "❌ Failed to load credentials from .env file"
                echo ""
            fi
        fi
    else
        print_status $YELLOW "⚠️  No .env file found"
        echo ""
    fi
}

# Function to check SnapTrade credentials
check_snaptrade_credentials() {
    if [[ -z "$SNAPTRADE_CLIENT_ID" || -z "$SNAPTRADE_CONSUMER_KEY" ]]; then
        print_status $RED "❌ SnapTrade credentials not found!"
        echo ""
        echo "Please set the following environment variables:"
        echo "export SNAPTRADE_CLIENT_ID=\"your_client_id\""
        echo "export SNAPTRADE_CONSUMER_KEY=\"your_consumer_key\""
        echo ""
        echo "Or run the script with:"
        echo "SNAPTRADE_CLIENT_ID=\"your_client_id\" SNAPTRADE_CONSUMER_KEY=\"your_consumer_key\" ./delete_all_snaptrade_users.sh"
        echo ""
        return 1
    fi
    return 0
}

# Function to check if jq is installed
check_jq_installed() {
    if ! command -v jq &> /dev/null; then
        print_status $RED "❌ jq is not installed!"
        echo ""
        echo "Please install jq:"
        echo "  macOS: brew install jq"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  CentOS/RHEL: sudo yum install jq"
        echo ""
        return 1
    fi
    return 0
}

# Function to list all SnapTrade users
list_all_snaptrade_users() {
    print_status $BLUE "📋 Listing all SnapTrade users..."
    echo "==========================================="
    echo ""
    
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    print_status $CYAN "Making API request to: $SNAPTRADE_API_BASE/snapTrade/listUsers"
    print_status $CYAN "Headers:"
    print_status $CYAN "  Authorization: Bearer ${SNAPTRADE_CONSUMER_KEY:0:8}..."
    print_status $CYAN "  SNAPTRADE-CLIENT-ID: ${SNAPTRADE_CLIENT_ID:0:8}..."
    echo ""
    
    local response=$(curl -s -X GET "$SNAPTRADE_API_BASE/snapTrade/listUsers" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    print_status $CYAN "HTTP Status: $http_status"
    print_status $CYAN "Response: $response_body"
    echo ""
    
    # Check if response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        print_status $RED "❌ Invalid JSON response from SnapTrade API"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    # Check for error responses
    if [[ "$http_status" != "200" ]]; then
        print_status $RED "❌ API request failed with status $http_status"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    local user_count=$(echo "$response_body" | jq 'length // 0')
    
    if [[ "$user_count" -eq 0 ]]; then
        print_status $YELLOW "ℹ️  No users found in SnapTrade"
        return 0
    fi
    
    print_status $GREEN "✅ Found $user_count users in SnapTrade:"
    echo "$response_body" | jq -r '.[]' | while read -r user_id; do
        if [[ -n "$user_id" ]]; then
            print_status $CYAN "   - $user_id"
        fi
    done
    echo ""
    
    return "$user_count"
}

# Function to delete a single SnapTrade user
delete_snaptrade_user() {
    local user_id=$1
    
    print_status $YELLOW "🗑️  Deleting SnapTrade user: $user_id"
    
    local response=$(curl -s -X DELETE "$SNAPTRADE_API_BASE/snapTrade/deleteUser" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -H 'Content-Type: application/json' \
        -d "{\"userId\": \"$user_id\"}" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    print_status $CYAN "HTTP Status: $http_status"
    print_status $CYAN "Response: $response_body"
    
    # Check if response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        print_status $RED "❌ Invalid JSON response when deleting user $user_id"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    # Check for error responses
    if [[ "$http_status" != "200" ]]; then
        print_status $RED "❌ Failed to delete user $user_id (HTTP $http_status)"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    if echo "$response_body" | jq -e '.status' > /dev/null 2>&1; then
        local status=$(echo "$response_body" | jq -r '.status')
        if [[ "$status" == "deleted" ]]; then
            print_status $GREEN "✅ User $user_id queued for deletion successfully"
            return 0
        else
            print_status $RED "❌ Failed to delete user $user_id"
            print_status $RED "Response: $response_body"
            return 1
        fi
    else
        print_status $RED "❌ Failed to delete user $user_id"
        print_status $RED "Response: $response_body"
        return 1
    fi
}

# Function to delete all SnapTrade users
delete_all_snaptrade_users() {
    print_status $PURPLE "🗑️  DELETING ALL SNAPTRADE USERS"
    print_status $PURPLE "================================="
    echo ""
    
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    if ! check_jq_installed; then
        return 1
    fi
    
    # First, get all users
    print_status $BLUE "Step 1: Getting all registered users..."
    local response=$(curl -s -X GET "$SNAPTRADE_API_BASE/snapTrade/listUsers" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    # Check if response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        print_status $RED "❌ Invalid response from SnapTrade API"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    # Check for error responses
    if [[ "$http_status" != "200" ]]; then
        print_status $RED "❌ API request failed with status $http_status"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    local user_count=$(echo "$response_body" | jq 'length // 0')
    
    if [[ "$user_count" -eq 0 ]]; then
        print_status $YELLOW "ℹ️  No users found to delete"
        return 0
    fi
    
    print_status $GREEN "Found $user_count users to delete:"
    echo ""
    
    local deleted_count=0
    local failed_count=0
    
    # Delete each user
    echo "$response_body" | jq -r '.[]' | while read -r user_id; do
        if [[ -n "$user_id" ]]; then
            if delete_snaptrade_user "$user_id"; then
                ((deleted_count++))
            else
                ((failed_count++))
            fi
            echo ""
        fi
    done
    
    echo ""
    print_status $GREEN "🎉 USER DELETION SUMMARY"
    print_status $GREEN "======================="
    print_status $CYAN "Total users found: $user_count"
    print_status $GREEN "Successfully queued for deletion: $deleted_count"
    if [[ $failed_count -gt 0 ]]; then
        print_status $RED "Failed to delete: $failed_count"
    fi
    echo ""
    print_status $YELLOW "ℹ️  Note: User deletion is asynchronous. Users will be deleted shortly."
    print_status $YELLOW "   You can check the status by running this script again."
    echo ""
}

# Function to clean up local user files
cleanup_local_user_files() {
    print_status $BLUE "🧹 Cleaning up local user files..."
    echo "=========================================="
    echo ""
    
    local files_removed=0
    
    # Remove various user files that might exist
    local files_to_remove=(
        "$CREDENTIALS_FILE"
        "$USERS_FILE"
        "$USERS_PICKLE_FILE"
        ".snaptrade_users_pickle"
        ".snaptrade_credentials"
        ".snaptrade_users"
    )
    
    for file in "${files_to_remove[@]}"; do
        if [[ -f "$file" ]]; then
            rm "$file"
            print_status $GREEN "✅ Removed: $file"
            ((files_removed++))
        fi
    done
    
    if [[ $files_removed -eq 0 ]]; then
        print_status $YELLOW "ℹ️  No local user files found to remove"
    else
        print_status $GREEN "✅ Cleaned up $files_removed local user files"
    fi
    echo ""
}

# Function to test SnapTrade API authentication
test_snaptrade_auth() {
    print_status $BLUE "🔐 Testing SnapTrade API Authentication"
    echo "================================================"
    echo ""
    
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    print_status $CYAN "Testing API connection with current credentials..."
    print_status $CYAN "Client ID: ${SNAPTRADE_CLIENT_ID:0:8}..."
    print_status $CYAN "Consumer Key: ${SNAPTRADE_CONSUMER_KEY:0:8}..."
    echo ""
    
    # Test with a simple API call
    local response=$(curl -s -X GET "$SNAPTRADE_API_BASE/snapTrade/listUsers" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    print_status $CYAN "HTTP Status: $http_status"
    print_status $CYAN "Response: $response_body"
    echo ""
    
    if [[ "$http_status" == "200" ]]; then
        print_status $GREEN "✅ Authentication successful!"
        print_status $GREEN "API connection is working properly."
    elif [[ "$http_status" == "401" ]]; then
        print_status $RED "❌ Authentication failed (401 Unauthorized)"
        print_status $RED "Please check your SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY"
        print_status $RED "Make sure they are correct and not expired."
    elif [[ "$http_status" == "403" ]]; then
        print_status $RED "❌ Access forbidden (403 Forbidden)"
        print_status $RED "Your credentials may be valid but you don't have permission for this operation."
    else
        print_status $RED "❌ API request failed with status $http_status"
        print_status $RED "Response: $response_body"
    fi
    echo ""
}

# Function to check backend server status
check_backend_status() {
    print_status $BLUE "🔍 Checking backend server status..."
    echo "====================================="
    echo ""
    
    if curl -s "$BACKEND_API_BASE/health" > /dev/null 2>&1; then
        print_status $GREEN "✅ Backend server is running at $BACKEND_API_BASE"
    else
        print_status $YELLOW "⚠️  Backend server is not running at $BACKEND_API_BASE"
        print_status $YELLOW "   This is normal if you're only cleaning up SnapTrade users"
    fi
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --test-auth         Test SnapTrade API authentication"
    echo "  -l, --list              List all SnapTrade users"
    echo "  -d, --delete            Delete all SnapTrade users"
    echo "  -c, --cleanup           Clean up local user files"
    echo "  -a, --all               Delete all users AND clean up local files"
    echo "  -s, --status            Check backend server status"
    echo ""
    echo "Environment Variables:"
    echo "  SNAPTRADE_CLIENT_ID     Your SnapTrade client ID"
    echo "  SNAPTRADE_CONSUMER_KEY  Your SnapTrade consumer key"
    echo ""
    echo "Examples:"
    echo "  $0 --test-auth          # Test authentication first"
    echo "  $0 --list               # List all users"
    echo "  $0 --delete             # Delete all SnapTrade users"
    echo "  $0 --all                # Delete all users and clean up local files"
    echo ""
}

# Main script execution
main() {
    # Load credentials from .env file
    load_env_credentials
    
    print_status $PURPLE "🔧 SnapTrade User Deletion Script"
    print_status $PURPLE "=================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -t|--test-auth)
            test_snaptrade_auth
            exit $?
            ;;
        -l|--list)
            list_all_snaptrade_users
            exit $?
            ;;
        -d|--delete)
            delete_all_snaptrade_users
            exit $?
            ;;
        -c|--cleanup)
            cleanup_local_user_files
            exit 0
            ;;
        -a|--all)
            delete_all_snaptrade_users
            local delete_result=$?
            echo ""
            cleanup_local_user_files
            exit $delete_result
            ;;
        -s|--status)
            check_backend_status
            exit 0
            ;;
        "")
            # No arguments provided, show interactive menu
            show_interactive_menu
            ;;
        *)
            print_status $RED "❌ Unknown option: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Function to show interactive menu
show_interactive_menu() {
    while true; do
        echo ""
        print_status $PURPLE "🔧 SnapTrade User Management Menu"
        print_status $PURPLE "================================"
        echo ""
        echo "1. Test SnapTrade API authentication"
        echo "2. List all SnapTrade users"
        echo "3. Delete all SnapTrade users"
        echo "4. Clean up local user files"
        echo "5. Delete all users AND clean up local files"
        echo "6. Check backend server status"
        echo "7. Exit"
        echo ""
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                echo ""
                test_snaptrade_auth
                ;;
            2)
                echo ""
                list_all_snaptrade_users
                ;;
            3)
                echo ""
                delete_all_snaptrade_users
                ;;
            4)
                echo ""
                cleanup_local_user_files
                ;;
            5)
                echo ""
                delete_all_snaptrade_users
                local delete_result=$?
                echo ""
                cleanup_local_user_files
                ;;
            6)
                echo ""
                check_backend_status
                ;;
            7)
                print_status $GREEN "👋 Goodbye!"
                exit 0
                ;;
            *)
                print_status $RED "❌ Invalid choice. Please enter a number between 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function with all arguments
main "$@"

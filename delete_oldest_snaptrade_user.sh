#!/bin/bash

# SnapTrade Oldest User Deletion Script
# Manages SnapTrade user limits by tracking creation times and deleting oldest users
# Based on SnapTrade API documentation: https://docs.snaptrade.com/reference/Authentication/Authentication_deleteSnapTradeUser

set -e  # Exit on any error

# Configuration
SNAPTRADE_API_BASE="https://api.snaptrade.com/api/v1"
BACKEND_API_BASE="http://localhost:8000"
USER_TRACKING_FILE=".snaptrade_user_timestamps.json"
MAX_CONNECTIONS=5

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
        echo "SNAPTRADE_CLIENT_ID=\"your_client_id\" SNAPTRADE_CONSUMER_KEY=\"your_consumer_key\" ./delete_oldest_snaptrade_user.sh"
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

# Function to initialize user tracking file
init_user_tracking() {
    if [[ ! -f "$USER_TRACKING_FILE" ]]; then
        print_status $BLUE "📝 Initializing user tracking file..."
        echo '{}' > "$USER_TRACKING_FILE"
        print_status $GREEN "✅ Created user tracking file: $USER_TRACKING_FILE"
    fi
}

# Function to add a new user to tracking
add_user_to_tracking() {
    local user_id=$1
    local timestamp=$(date +%s)
    
    init_user_tracking
    
    print_status $BLUE "📝 Adding user to tracking: $user_id"
    
    # Read current tracking data
    local tracking_data=$(cat "$USER_TRACKING_FILE")
    
    # Add new user with timestamp
    local updated_data=$(echo "$tracking_data" | jq --arg user_id "$user_id" --arg timestamp "$timestamp" '. + {($user_id): $timestamp}')
    
    # Write back to file
    echo "$updated_data" > "$USER_TRACKING_FILE"
    
    print_status $GREEN "✅ Added user $user_id to tracking (timestamp: $timestamp)"
}

# Function to get current user count
get_current_user_count() {
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    local response=$(curl -s -X GET "$SNAPTRADE_API_BASE/snapTrade/listUsers" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [[ "$http_status" != "200" ]]; then
        print_status $RED "❌ Failed to get user count (HTTP $http_status)"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        print_status $RED "❌ Invalid JSON response from SnapTrade API"
        print_status $RED "Response: $response_body"
        return 1
    fi
    
    local user_count=$(echo "$response_body" | jq 'length // 0')
    
    # Validate that user_count is a number
    if ! [[ "$user_count" =~ ^[0-9]+$ ]]; then
        print_status $RED "❌ Invalid user count returned: $user_count"
        return 1
    fi
    
    echo "$user_count"
}

# Function to find the oldest user
find_oldest_user() {
    if [[ ! -f "$USER_TRACKING_FILE" ]]; then
        print_status $YELLOW "⚠️  No user tracking file found"
        return 1
    fi
    
    local tracking_data=$(cat "$USER_TRACKING_FILE")
    
    # Find user with earliest timestamp
    local oldest_user=$(echo "$tracking_data" | jq -r 'to_entries | sort_by(.value) | .[0].key')
    
    if [[ "$oldest_user" == "null" || -z "$oldest_user" ]]; then
        print_status $YELLOW "⚠️  No tracked users found"
        return 1
    fi
    
    echo "$oldest_user"
}

# Function to get user creation timestamp
get_user_timestamp() {
    local user_id=$1
    
    if [[ ! -f "$USER_TRACKING_FILE" ]]; then
        return 1
    fi
    
    local tracking_data=$(cat "$USER_TRACKING_FILE")
    local timestamp=$(echo "$tracking_data" | jq -r --arg user_id "$user_id" '.[$user_id]')
    
    if [[ "$timestamp" == "null" ]]; then
        return 1
    fi
    
    echo "$timestamp"
}

# Function to remove user from tracking
remove_user_from_tracking() {
    local user_id=$1
    
    if [[ ! -f "$USER_TRACKING_FILE" ]]; then
        return 1
    fi
    
    print_status $BLUE "📝 Removing user from tracking: $user_id"
    
    # Read current tracking data
    local tracking_data=$(cat "$USER_TRACKING_FILE")
    
    # Remove user
    local updated_data=$(echo "$tracking_data" | jq --arg user_id "$user_id" 'del(.[$user_id])')
    
    # Write back to file
    echo "$updated_data" > "$USER_TRACKING_FILE"
    
    print_status $GREEN "✅ Removed user $user_id from tracking"
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

# Function to delete the oldest user
delete_oldest_user() {
    print_status $PURPLE "🗑️  DELETING OLDEST SNAPTRADE USER"
    print_status $PURPLE "=================================="
    echo ""
    
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    if ! check_jq_installed; then
        return 1
    fi
    
    # Find the oldest user
    local oldest_user=$(find_oldest_user)
    if [[ $? -ne 0 ]]; then
        print_status $RED "❌ Could not find oldest user"
        return 1
    fi
    
    # Get user creation timestamp
    local timestamp=$(get_user_timestamp "$oldest_user")
    local creation_date=$(date -r "$timestamp" 2>/dev/null || echo "Unknown")
    
    print_status $YELLOW "📅 Oldest user found: $oldest_user"
    print_status $YELLOW "📅 Created: $creation_date"
    echo ""
    
    # Confirm deletion
    if [[ "${AUTO_CONFIRM:-false}" != "true" ]]; then
        read -p "Are you sure you want to delete the oldest user? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            print_status $YELLOW "❌ Deletion cancelled"
            return 1
        fi
    fi
    
    # Delete the user from SnapTrade
    if delete_snaptrade_user "$oldest_user"; then
        # Remove from tracking
        remove_user_from_tracking "$oldest_user"
        print_status $GREEN "✅ Successfully deleted oldest user: $oldest_user"
        return 0
    else
        print_status $RED "❌ Failed to delete oldest user: $oldest_user"
        return 1
    fi
}

# Function to check if we're at the connection limit
check_connection_limit() {
    local current_count=$(get_current_user_count)
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        print_status $RED "❌ Could not get current user count"
        return 1
    fi
    
    # Check if current_count is a valid number
    if ! [[ "$current_count" =~ ^[0-9]+$ ]]; then
        print_status $RED "❌ Invalid user count: $current_count"
        return 1
    fi
    
    print_status $BLUE "📊 Current user count: $current_count / $MAX_CONNECTIONS"
    
    if [[ "$current_count" -ge "$MAX_CONNECTIONS" ]]; then
        print_status $YELLOW "⚠️  Connection limit reached ($current_count/$MAX_CONNECTIONS)"
        return 0  # At limit
    else
        print_status $GREEN "✅ Connection limit not reached ($current_count/$MAX_CONNECTIONS)"
        return 1  # Not at limit
    fi
}

# Function to automatically manage connection limit
auto_manage_connection_limit() {
    print_status $BLUE "🔧 Auto-managing connection limit..."
    echo ""
    
    if check_connection_limit; then
        print_status $YELLOW "⚠️  Connection limit reached. Deleting oldest user..."
        echo ""
        
        if delete_oldest_user; then
            print_status $GREEN "✅ Connection limit managed successfully"
            return 0
        else
            print_status $RED "❌ Failed to manage connection limit"
            return 1
        fi
    else
        print_status $GREEN "✅ No action needed - connection limit not reached"
        return 0
    fi
}

# Function to list tracked users
list_tracked_users() {
    print_status $BLUE "📋 Listing tracked users..."
    echo "============================="
    echo ""
    
    if [[ ! -f "$USER_TRACKING_FILE" ]]; then
        print_status $YELLOW "ℹ️  No user tracking file found"
        return 0
    fi
    
    local tracking_data=$(cat "$USER_TRACKING_FILE")
    local user_count=$(echo "$tracking_data" | jq 'length // 0')
    
    if [[ "$user_count" -eq 0 ]]; then
        print_status $YELLOW "ℹ️  No tracked users found"
        return 0
    fi
    
    print_status $GREEN "✅ Found $user_count tracked users:"
    echo ""
    
    # Sort by timestamp (oldest first)
    echo "$tracking_data" | jq -r 'to_entries | sort_by(.value) | .[] | "\(.key) - \(.value)"' | while read -r line; do
        local user_id=$(echo "$line" | cut -d' ' -f1)
        local timestamp=$(echo "$line" | cut -d' ' -f3)
        local creation_date=$(date -r "$timestamp" 2>/dev/null || echo "Unknown")
        print_status $CYAN "   - $user_id (created: $creation_date)"
    done
    echo ""
}

# Function to sync tracking with actual SnapTrade users
sync_tracking_with_snaptrade() {
    print_status $BLUE "🔄 Syncing tracking with SnapTrade users..."
    echo "============================================="
    echo ""
    
    if ! check_snaptrade_credentials; then
        return 1
    fi
    
    # Get actual SnapTrade users
    local response=$(curl -s -X GET "$SNAPTRADE_API_BASE/snapTrade/listUsers" \
        -H "Authorization: Bearer $SNAPTRADE_CONSUMER_KEY" \
        -H "SNAPTRADE-CLIENT-ID: $SNAPTRADE_CLIENT_ID" \
        -w "\nHTTP_STATUS:%{http_code}")
    
    # Extract HTTP status code
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    local response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [[ "$http_status" != "200" ]]; then
        print_status $RED "❌ Failed to get SnapTrade users (HTTP $http_status)"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response_body" | jq . > /dev/null 2>&1; then
        print_status $RED "❌ Invalid JSON response from SnapTrade API"
        return 1
    fi
    
    local actual_users=$(echo "$response_body" | jq -r '.[]' | sort)
    local tracked_users=$(cat "$USER_TRACKING_FILE" 2>/dev/null | jq -r 'keys[]' 2>/dev/null | sort)
    
    print_status $CYAN "Actual SnapTrade users:"
    echo "$actual_users" | while read -r user; do
        if [[ -n "$user" ]]; then
            print_status $CYAN "   - $user"
        fi
    done
    echo ""
    
    print_status $CYAN "Tracked users:"
    echo "$tracked_users" | while read -r user; do
        if [[ -n "$user" ]]; then
            print_status $CYAN "   - $user"
        fi
    done
    echo ""
    
    # Find users that exist in SnapTrade but not in tracking
    local missing_from_tracking=$(comm -23 <(echo "$actual_users") <(echo "$tracked_users"))
    
    if [[ -n "$missing_from_tracking" ]]; then
        print_status $YELLOW "⚠️  Users in SnapTrade but not tracked:"
        echo "$missing_from_tracking" | while read -r user; do
            if [[ -n "$user" ]]; then
                print_status $YELLOW "   - $user"
            fi
        done
        echo ""
        
        read -p "Add missing users to tracking with current timestamp? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            echo "$missing_from_tracking" | while read -r user; do
                if [[ -n "$user" ]]; then
                    add_user_to_tracking "$user"
                fi
            done
            print_status $GREEN "✅ Added missing users to tracking"
        fi
    else
        print_status $GREEN "✅ All SnapTrade users are tracked"
    fi
    
    # Find users that exist in tracking but not in SnapTrade
    local missing_from_snaptrade=$(comm -13 <(echo "$actual_users") <(echo "$tracked_users"))
    
    if [[ -n "$missing_from_snaptrade" ]]; then
        print_status $YELLOW "⚠️  Users in tracking but not in SnapTrade:"
        echo "$missing_from_snaptrade" | while read -r user; do
            if [[ -n "$user" ]]; then
                print_status $YELLOW "   - $user"
            fi
        done
        echo ""
        
        read -p "Remove missing users from tracking? (yes/no): " confirm
        if [[ "$confirm" == "yes" ]]; then
            echo "$missing_from_snaptrade" | while read -r user; do
                if [[ -n "$user" ]]; then
                    remove_user_from_tracking "$user"
                fi
            done
            print_status $GREEN "✅ Removed missing users from tracking"
        fi
    else
        print_status $GREEN "✅ All tracked users exist in SnapTrade"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -a, --add-user USER_ID  Add a new user to tracking"
    echo "  -d, --delete-oldest     Delete the oldest tracked user"
    echo "  -c, --check-limit       Check if connection limit is reached"
    echo "  -m, --auto-manage       Automatically manage connection limit"
    echo "  -l, --list-tracked      List all tracked users"
    echo "  -s, --sync              Sync tracking with actual SnapTrade users"
    echo "  --auto-confirm          Skip confirmation prompts"
    echo ""
    echo "Environment Variables:"
    echo "  SNAPTRADE_CLIENT_ID     Your SnapTrade client ID"
    echo "  SNAPTRADE_CONSUMER_KEY  Your SnapTrade consumer key"
    echo "  AUTO_CONFIRM            Set to 'true' to skip confirmations"
    echo ""
    echo "Examples:"
    echo "  $0 --add-user user123           # Add user to tracking"
    echo "  $0 --check-limit                # Check connection limit"
    echo "  $0 --auto-manage                # Auto-manage connection limit"
    echo "  $0 --delete-oldest              # Delete oldest user"
    echo "  $0 --sync                       # Sync tracking with SnapTrade"
    echo ""
}

# Main script execution
main() {
    # Load credentials from .env file
    load_env_credentials
    
    print_status $PURPLE "🔧 SnapTrade Connection Limit Manager"
    print_status $PURPLE "====================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -a|--add-user)
            if [[ -z "$2" ]]; then
                print_status $RED "❌ User ID required for --add-user"
                exit 1
            fi
            add_user_to_tracking "$2"
            exit 0
            ;;
        -d|--delete-oldest)
            delete_oldest_user
            exit $?
            ;;
        -c|--check-limit)
            check_connection_limit
            exit $?
            ;;
        -m|--auto-manage)
            auto_manage_connection_limit
            exit $?
            ;;
        -l|--list-tracked)
            list_tracked_users
            exit 0
            ;;
        -s|--sync)
            sync_tracking_with_snaptrade
            exit $?
            ;;
        --auto-confirm)
            export AUTO_CONFIRM=true
            shift
            main "$@"
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
        print_status $PURPLE "🔧 SnapTrade Connection Limit Manager"
        print_status $PURPLE "====================================="
        echo ""
        echo "1. Add user to tracking"
        echo "2. Check connection limit"
        echo "3. Auto-manage connection limit"
        echo "4. Delete oldest user"
        echo "5. List tracked users"
        echo "6. Sync tracking with SnapTrade"
        echo "7. Exit"
        echo ""
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                echo ""
                read -p "Enter user ID to add: " user_id
                if [[ -n "$user_id" ]]; then
                    add_user_to_tracking "$user_id"
                else
                    print_status $RED "❌ User ID cannot be empty"
                fi
                ;;
            2)
                echo ""
                check_connection_limit
                ;;
            3)
                echo ""
                auto_manage_connection_limit
                ;;
            4)
                echo ""
                delete_oldest_user
                ;;
            5)
                echo ""
                list_tracked_users
                ;;
            6)
                echo ""
                sync_tracking_with_snaptrade
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

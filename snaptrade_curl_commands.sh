#!/bin/bash

# SnapTrade Connection Management - Curl Commands
# Make sure your backend is running on localhost:8000

# Configuration
API_BASE="http://localhost:8000"
CREDENTIALS_FILE=".snaptrade_credentials"
USERS_FILE=".snaptrade_users"

echo "🔧 SnapTrade Connection Management - Curl Commands"
echo "=================================================="
echo ""

# Function to save credentials for a specific user
save_credentials() {
    local user_id=$1
    local user_secret=$2
    
    # Save to main credentials file (for backward compatibility)
    echo "$user_id:$user_secret" > "$CREDENTIALS_FILE"
    
    # Save to users file (for multiple users)
    if [[ ! -f "$USERS_FILE" ]]; then
        touch "$USERS_FILE"
    fi
    
    # Check if user already exists
    if grep -q "^$user_id:" "$USERS_FILE"; then
        # Update existing user
        sed -i.bak "s/^$user_id:.*/$user_id:$user_secret/" "$USERS_FILE"
        rm -f "$USERS_FILE.bak" 2>/dev/null
    else
        # Add new user
        echo "$user_id:$user_secret" >> "$USERS_FILE"
    fi
    
    echo "✅ Credentials saved for user: $user_id"
}

# Function to load main credentials (for backward compatibility)
load_credentials() {
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        local credentials=$(cat "$CREDENTIALS_FILE")
        local user_id=$(echo "$credentials" | cut -d: -f1)
        local user_secret=$(echo "$credentials" | cut -d: -f2)
        echo "$user_id:$user_secret"
    else
        echo ""
    fi
}

# Function to list all saved users
list_all_users() {
    echo "📋 Saved Users:"
    echo "==============="
    
    if [[ -f "$USERS_FILE" ]]; then
        local line_number=1
        while IFS=: read -r user_id user_secret; do
            if [[ -n "$user_id" && -n "$user_secret" ]]; then
                echo "$line_number. User ID: $user_id"
                echo "   Secret: ${user_secret:0:8}...${user_secret: -4}"
                echo ""
                ((line_number++))
            fi
        done < "$USERS_FILE"
    else
        echo "No saved users found."
    fi
    
    # Also show main credentials file for backward compatibility
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        local main_credentials=$(cat "$CREDENTIALS_FILE")
        local user_id=$(echo "$main_credentials" | cut -d: -f1)
        local user_secret=$(echo "$main_credentials" | cut -d: -f2)
        if [[ -n "$user_id" && -n "$user_secret" ]]; then
            echo "Main credentials file:"
            echo "User ID: $user_id"
            echo "Secret: ${user_secret:0:8}...${user_secret: -4}"
            echo ""
        fi
    fi
}

# Function to get all users from file
get_all_users() {
    local users=()
    
    if [[ -f "$USERS_FILE" ]]; then
        while IFS=: read -r user_id user_secret; do
            if [[ -n "$user_id" && -n "$user_secret" ]]; then
                users+=("$user_id:$user_secret")
            fi
        done < "$USERS_FILE"
    fi
    
    # Also add main credentials if different
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        local main_credentials=$(cat "$CREDENTIALS_FILE")
        local main_user_id=$(echo "$main_credentials" | cut -d: -f1)
        local main_user_secret=$(echo "$main_credentials" | cut -d: -f2)
        
        # Check if this user is already in the list
        local found=false
        for user in "${users[@]}"; do
            local existing_user_id=$(echo "$user" | cut -d: -f1)
            if [[ "$existing_user_id" == "$main_user_id" ]]; then
                found=true
                break
            fi
        done
        
        if [[ "$found" == false && -n "$main_user_id" && -n "$main_user_secret" ]]; then
            users+=("$main_user_id:$main_user_secret")
        fi
    fi
    
    printf '%s\n' "${users[@]}"
}

# Function to clear saved credentials
clear_credentials() {
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        rm "$CREDENTIALS_FILE"
        echo "✅ Main credentials cleared"
    fi
    
    if [[ -f "$USERS_FILE" ]]; then
        rm "$USERS_FILE"
        echo "✅ All saved users cleared"
    fi
    
    if [[ ! -f "$CREDENTIALS_FILE" && ! -f "$USERS_FILE" ]]; then
        echo "ℹ️  No saved credentials found"
    fi
}

# Function to list connections
list_connections() {
    local user_id=$1
    local user_secret=$2
    
    echo "📋 Listing connections for user: $user_id"
    echo "curl -X POST $API_BASE/api/snaptrade/connections \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\"}'"
    echo ""
    
    curl -X POST "$API_BASE/api/snaptrade/connections" \
        -H 'Content-Type: application/json' \
        -d "{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\"}" \
        | jq '.'
}

# Function to delete a connection
delete_connection() {
    local user_id=$1
    local user_secret=$2
    local auth_id=$3
    
    echo "🗑️  Deleting connection: $auth_id"
    echo "curl -X DELETE $API_BASE/api/snaptrade/connections \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\", \"authorization_id\": \"$auth_id\"}'"
    echo ""
    
    curl -X DELETE "$API_BASE/api/snaptrade/connections" \
        -H 'Content-Type: application/json' \
        -d "{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\", \"authorization_id\": \"$auth_id\"}" \
        | jq '.'
}

# Function to delete all connections for a user
delete_all_connections() {
    local user_id=$1
    local user_secret=$2
    
    echo "🗑️  Deleting ALL connections for user: $user_id"
    echo ""
    
    # First, get all connections
    local connections_response=$(curl -s -X POST "$API_BASE/api/snaptrade/connections" \
        -H 'Content-Type: application/json' \
        -d "{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\"}")
    
    # Check if the response is valid JSON and has connections
    if echo "$connections_response" | jq -e '.success' > /dev/null 2>&1; then
        local count=$(echo "$connections_response" | jq -r '.count // 0')
        
        if [[ "$count" -eq 0 ]]; then
            echo "ℹ️  No connections found for user: $user_id"
            return 0
        fi
        
        echo "Found $count connections to delete:"
        echo "$connections_response" | jq -r '.authorizations[] | "  - \(.id) (\(.brokerage.name // "Unknown"))"'
        echo ""
        
        # Confirm deletion
        read -p "Are you sure you want to delete all $count connections? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            echo "❌ Deletion cancelled"
            return 0
        fi
        
        # Delete each connection
        local deleted_count=0
        local auth_ids=$(echo "$connections_response" | jq -r '.authorizations[].id')
        
        while IFS= read -r auth_id; do
            if [[ -n "$auth_id" ]]; then
                echo "Deleting connection: $auth_id"
                local delete_response=$(curl -s -X DELETE "$API_BASE/api/snaptrade/connections" \
                    -H 'Content-Type: application/json' \
                    -d "{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\", \"authorization_id\": \"$auth_id\"}")
                
                if echo "$delete_response" | jq -e '.success' > /dev/null 2>&1; then
                    echo "  ✅ Deleted successfully"
                    ((deleted_count++))
                else
                    echo "  ❌ Failed to delete:"
                    echo "$delete_response" | jq '.'
                fi
            fi
        done <<< "$auth_ids"
        
        echo ""
        echo "✅ Deletion complete! Deleted $deleted_count connections for user: $user_id"
        echo "$deleted_count"
    else
        echo "❌ Error getting connections:"
        echo "$connections_response" | jq '.'
        echo "0"
    fi
}

# Function to delete all connections for all users
delete_all_connections_for_all_users() {
    echo "🗑️  Deleting ALL connections for ALL users"
    echo "=========================================="
    echo ""
    
    local all_users=$(get_all_users)
    local total_users=0
    local total_connections_deleted=0
    local valid_users=0
    
    if [[ -z "$all_users" ]]; then
        echo "❌ No saved users found. Please save some user credentials first."
        return
    fi
    
    # Count total users
    while IFS= read -r user; do
        if [[ -n "$user" ]]; then
            ((total_users++))
        fi
    done <<< "$all_users"
    
    echo "Found $total_users saved users."
    echo ""
    
    # Confirm deletion
    read -p "Are you sure you want to delete ALL connections for ALL $total_users users? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "❌ Deletion cancelled"
        return
    fi
    
    echo ""
    echo "Starting bulk deletion..."
    echo ""
    
    # Process each user
    while IFS= read -r user; do
        if [[ -n "$user" ]]; then
            local user_id=$(echo "$user" | cut -d: -f1)
            local user_secret=$(echo "$user" | cut -d: -f2)
            
            echo "Processing user: $user_id"
            
            # Test if user credentials are valid by trying to list connections
            local test_response=$(curl -s -X POST "$API_BASE/api/snaptrade/connections" \
                -H 'Content-Type: application/json' \
                -d "{\"user_id\": \"$user_id\", \"user_secret\": \"$user_secret\"}")
            
            if echo "$test_response" | jq -e '.success' > /dev/null 2>&1; then
                # Valid credentials, proceed with deletion
                local deleted_count=$(delete_all_connections "$user_id" "$user_secret" | tail -n1)
                if [[ "$deleted_count" =~ ^[0-9]+$ ]]; then
                    total_connections_deleted=$((total_connections_deleted + deleted_count))
                fi
                ((valid_users++))
            else
                # Invalid credentials
                echo "  ⚠️  Skipping user $user_id - invalid credentials"
                echo "  Error: $(echo "$test_response" | jq -r '.error // "Unknown error"' 2>/dev/null || echo "Invalid response")"
            fi
            echo ""
        fi
    done <<< "$all_users"
    
    echo "🎉 BULK DELETION COMPLETE!"
    echo "=========================="
    echo "Total users found: $total_users"
    echo "Valid users processed: $valid_users"
    echo "Total connections deleted: $total_connections_deleted"
    echo ""
    
    if [[ $valid_users -lt $total_users ]]; then
        echo "⚠️  Some users were skipped due to invalid credentials."
        echo "   You may want to clear invalid users using option 8."
    fi
}

# Function to register a new user
register_user() {
    echo "👤 Registering new user"
    echo "curl -X POST $API_BASE/api/snaptrade/register-user \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{}'"
    echo ""
    
    local response=$(curl -s -X POST "$API_BASE/api/snaptrade/register-user" \
        -H 'Content-Type: application/json' \
        -d '{}')
    
    echo "$response" | jq '.'
    
    # Ask if user wants to save credentials
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        local user_id=$(echo "$response" | jq -r '.user_id')
        local user_secret=$(echo "$response" | jq -r '.user_secret')
        
        read -p "Save these credentials for future use? (yes/no): " save_choice
        if [[ "$save_choice" == "yes" ]]; then
            save_credentials "$user_id" "$user_secret"
        fi
    fi
}

# Function to get credentials (saved or manual input)
get_credentials() {
    local credentials=$(load_credentials)
    
    if [[ -n "$credentials" ]]; then
        local user_id=$(echo "$credentials" | cut -d: -f1)
        local user_secret=$(echo "$credentials" | cut -d: -f2)
        
        echo "📋 Using saved credentials for user: $user_id"
        read -p "Use saved credentials? (yes/no): " use_saved
        
        if [[ "$use_saved" == "yes" ]]; then
            echo "$user_id:$user_secret"
            return
        fi
    fi
    
    # Manual input
    read -p "Enter user ID: " user_id
    read -p "Enter user secret: " user_secret
    echo "$user_id:$user_secret"
}

# Main menu
echo "Available commands:"
echo "1. List connections for a user"
echo "2. Delete a specific connection"
echo "3. Delete ALL connections for a user"
echo "4. Delete ALL connections for ALL users"
echo "5. Register a new user"
echo "6. Save user credentials"
echo "7. List all saved users"
echo "8. Clear saved credentials"
echo "9. Show curl commands only (no execution)"
echo "10. Exit"
echo ""

while true; do
    read -p "Enter your choice (1-10): " choice
    
    case $choice in
        1)
            credentials=$(get_credentials)
            if [[ -n "$credentials" ]]; then
                user_id=$(echo "$credentials" | cut -d: -f1)
                user_secret=$(echo "$credentials" | cut -d: -f2)
                list_connections "$user_id" "$user_secret"
            fi
            ;;
        2)
            credentials=$(get_credentials)
            if [[ -n "$credentials" ]]; then
                user_id=$(echo "$credentials" | cut -d: -f1)
                user_secret=$(echo "$credentials" | cut -d: -f2)
                read -p "Enter authorization ID to delete: " auth_id
                delete_connection "$user_id" "$user_secret" "$auth_id"
            fi
            ;;
        3)
            credentials=$(get_credentials)
            if [[ -n "$credentials" ]]; then
                user_id=$(echo "$credentials" | cut -d: -f1)
                user_secret=$(echo "$credentials" | cut -d: -f2)
                delete_all_connections "$user_id" "$user_secret"
            fi
            ;;
        4)
            delete_all_connections_for_all_users
            ;;
        5)
            register_user
            ;;
        6)
            read -p "Enter user ID: " user_id
            read -p "Enter user secret: " user_secret
            save_credentials "$user_id" "$user_secret"
            ;;
        7)
            list_all_users
            ;;
        8)
            clear_credentials
            ;;
        9)
            echo ""
            echo "📋 Manual Curl Commands:"
            echo "========================"
            echo ""
            echo "# List connections:"
            echo "curl -X POST $API_BASE/api/snaptrade/connections \\"
            echo "  -H 'Content-Type: application/json' \\"
            echo "  -d '{\"user_id\": \"YOUR_USER_ID\", \"user_secret\": \"YOUR_USER_SECRET\"}'"
            echo ""
            echo "# Delete a connection:"
            echo "curl -X DELETE $API_BASE/api/snaptrade/connections \\"
            echo "  -H 'Content-Type: application/json' \\"
            echo "  -d '{\"user_id\": \"YOUR_USER_ID\", \"user_secret\": \"YOUR_USER_SECRET\", \"authorization_id\": \"AUTH_ID_TO_DELETE\"}'"
            echo ""
            echo "# Register new user:"
            echo "curl -X POST $API_BASE/api/snaptrade/register-user \\"
            echo "  -H 'Content-Type: application/json' \\"
            echo "  -d '{}'"
            echo ""
            ;;
        10)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter 1-10."
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read
    echo ""
done

#!/usr/bin/env python3
"""
SnapTrade Connection Manager
Helps manage and flush SnapTrade connections for testing purposes
"""
import os
import json
import pickle
from dotenv import load_dotenv
from utils.snaptrade_utils import SnapTradeManager

# Load environment variables
load_dotenv()

# File to store multiple users
USERS_FILE = ".snaptrade_users_pickle"

def save_user_credentials(user_id: str, user_secret: str):
    """Save user credentials to file"""
    users = load_all_users()
    users[user_id] = user_secret
    
    with open(USERS_FILE, 'wb') as f:
        pickle.dump(users, f)
    
    print(f"✅ Credentials saved for user: {user_id}")

def load_all_users():
    """Load all saved users from file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'rb') as f:
                return pickle.load(f)
        except:
            return {}
    return {}

def list_all_saved_users():
    """List all saved users"""
    users = load_all_users()
    
    if not users:
        print("No saved users found.")
        return
    
    print("📋 Saved Users:")
    print("===============")
    for i, (user_id, user_secret) in enumerate(users.items(), 1):
        print(f"{i}. User ID: {user_id}")
        print(f"   Secret: {user_secret[:8]}...{user_secret[-4:]}")
        print()

def clear_all_users():
    """Clear all saved users"""
    if os.path.exists(USERS_FILE):
        os.remove(USERS_FILE)
        print("✅ All saved users cleared")
    else:
        print("ℹ️  No saved users found")

def list_connections_for_user(user_id: str, user_secret: str):
    """List all connections for a specific user"""
    try:
        manager = SnapTradeManager()
        result = manager.list_brokerage_authorizations(user_id, user_secret)
        
        if result["success"]:
            print(f"✅ Found {result['count']} connections for user {user_id}:")
            for i, auth in enumerate(result["authorizations"], 1):
                print(f"  {i}. Authorization ID: {auth.get('id', 'N/A')}")
                print(f"     Brokerage: {auth.get('brokerage', {}).get('name', 'N/A')}")
                print(f"     Status: {auth.get('status', 'N/A')}")
                print(f"     Created: {auth.get('created', 'N/A')}")
                print()
            return result["authorizations"]
        else:
            print(f"❌ Error listing connections: {result['error']}")
            return []
    except Exception as e:
        print(f"❌ Exception: {e}")
        return []

def delete_connection(user_id: str, user_secret: str, authorization_id: str):
    """Delete a specific connection"""
    try:
        manager = SnapTradeManager()
        result = manager.delete_brokerage_authorization(user_id, user_secret, authorization_id)
        
        if result["success"]:
            print(f"✅ Successfully deleted authorization: {authorization_id}")
            return True
        else:
            print(f"❌ Error deleting authorization: {result['error']}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def delete_all_connections_for_user(user_id: str, user_secret: str):
    """Delete all connections for a specific user"""
    print(f"🗑️  Deleting all connections for user: {user_id}")
    
    # First, list all connections
    connections = list_connections_for_user(user_id, user_secret)
    
    if not connections:
        print("No connections found to delete.")
        return 0
    
    # Confirm deletion
    response = input(f"Are you sure you want to delete all {len(connections)} connections? (yes/no): ")
    if response.lower() != 'yes':
        print("Deletion cancelled.")
        return 0
    
    # Delete each connection
    deleted_count = 0
    for auth in connections:
        auth_id = auth.get('id')
        if auth_id:
            if delete_connection(user_id, user_secret, auth_id):
                deleted_count += 1
    
    print(f"✅ Successfully deleted {deleted_count} out of {len(connections)} connections.")
    return deleted_count

def delete_all_connections_for_all_users():
    """Delete all connections for all saved users"""
    print("🗑️  Deleting ALL connections for ALL users")
    print("==========================================")
    print()
    
    users = load_all_users()
    
    if not users:
        print("❌ No saved users found. Please save some user credentials first.")
        return
    
    print(f"Found {len(users)} saved users.")
    print()
    
    # Confirm deletion
    response = input(f"Are you sure you want to delete ALL connections for ALL {len(users)} users? (yes/no): ")
    if response.lower() != 'yes':
        print("Deletion cancelled.")
        return
    
    print()
    print("Starting bulk deletion...")
    print()
    
    total_connections_deleted = 0
    
    # Process each user
    for user_id, user_secret in users.items():
        print(f"Processing user: {user_id}")
        deleted_count = delete_all_connections_for_user(user_id, user_secret)
        total_connections_deleted += deleted_count
        print()
    
    print("🎉 BULK DELETION COMPLETE!")
    print("==========================")
    print(f"Total users processed: {len(users)}")
    print(f"Total connections deleted: {total_connections_deleted}")
    print()

def register_new_user():
    """Register a new user with SnapTrade"""
    try:
        manager = SnapTradeManager()
        user_id = manager.generate_user_id()
        result = manager.register_user(user_id)
        
        if result["success"]:
            print(f"✅ User registered successfully:")
            print(f"   User ID: {result['user_id']}")
            print(f"   User Secret: {result['user_secret']}")
            
            # Ask if user wants to save credentials
            save_choice = input("Save these credentials for future use? (yes/no): ")
            if save_choice.lower() == 'yes':
                save_user_credentials(result['user_id'], result['user_secret'])
            
            return result
        else:
            print(f"❌ Error registering user: {result['error']}")
            return None
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def get_user_credentials():
    """Get user credentials (from saved or manual input)"""
    users = load_all_users()
    
    if users:
        print("📋 Saved users:")
        user_list = list(users.items())
        for i, (user_id, user_secret) in enumerate(user_list, 1):
            print(f"{i}. {user_id} ({user_secret[:8]}...{user_secret[-4:]})")
        
        choice = input("Select user number or press Enter for manual input: ").strip()
        
        if choice.isdigit():
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(user_list):
                return user_list[choice_idx]
    
    # Manual input
    user_id = input("Enter user ID: ").strip()
    user_secret = input("Enter user secret: ").strip()
    return (user_id, user_secret) if user_id and user_secret else None

def main():
    """Main function to manage SnapTrade connections"""
    print("🔧 SnapTrade Connection Manager")
    print("=" * 40)
    
    # Check if credentials are available
    client_id = os.getenv("SNAPTRADE_CLIENT_ID")
    consumer_key = os.getenv("SNAPTRADE_CONSUMER_KEY")
    
    if not client_id or not consumer_key:
        print("❌ Missing SnapTrade credentials in environment variables")
        print("Please set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY")
        return
    
    print("Available operations:")
    print("1. List connections for a user")
    print("2. Delete a specific connection")
    print("3. Delete all connections for a user")
    print("4. Delete ALL connections for ALL users")
    print("5. Register a new user")
    print("6. Save user credentials")
    print("7. List all saved users")
    print("8. Clear all saved users")
    print("9. Exit")
    print()
    
    while True:
        choice = input("Enter your choice (1-9): ").strip()
        
        if choice == "1":
            credentials = get_user_credentials()
            if credentials:
                user_id, user_secret = credentials
                list_connections_for_user(user_id, user_secret)
            
        elif choice == "2":
            credentials = get_user_credentials()
            if credentials:
                user_id, user_secret = credentials
                auth_id = input("Enter authorization ID to delete: ").strip()
                delete_connection(user_id, user_secret, auth_id)
            
        elif choice == "3":
            credentials = get_user_credentials()
            if credentials:
                user_id, user_secret = credentials
                delete_all_connections_for_user(user_id, user_secret)
            
        elif choice == "4":
            delete_all_connections_for_all_users()
            
        elif choice == "5":
            register_new_user()
            
        elif choice == "6":
            user_id = input("Enter user ID: ").strip()
            user_secret = input("Enter user secret: ").strip()
            if user_id and user_secret:
                save_user_credentials(user_id, user_secret)
            else:
                print("❌ Invalid input")
            
        elif choice == "7":
            list_all_saved_users()
            
        elif choice == "8":
            clear_all_users()
            
        elif choice == "9":
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1-9.")
        
        print()

if __name__ == "__main__":
    main()

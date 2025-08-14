#!/usr/bin/env python3
"""
Comprehensive SnapTrade Cleanup Tool
Helps manage and clean up all SnapTrade users and connections
"""
import os
import json
from dotenv import load_dotenv
from utils.snaptrade_utils import SnapTradeManager

# Load environment variables
load_dotenv()

def show_current_status():
    """Show current status of SnapTrade users and connections"""
    print("📊 Current SnapTrade Status")
    print("=" * 30)
    print()
    
    try:
        manager = SnapTradeManager()
        
        # Get all users
        users_result = manager.list_all_users()
        
        if users_result["success"]:
            users = users_result["users"]
            print(f"📋 Total SnapTrade Users: {len(users)}")
            print()
            
            # Show users we have credentials for
            saved_users = get_saved_users()
            print(f"🔑 Users with saved credentials: {len(saved_users)}")
            for user_id, secret in saved_users:
                print(f"  - {user_id}")
            print()
            
            # Show users without credentials
            users_without_creds = [user for user in users if user not in [u[0] for u in saved_users]]
            print(f"❓ Users without credentials: {len(users_without_creds)}")
            for user_id in users_without_creds:
                print(f"  - {user_id}")
            print()
            
            # Check connections for users we have credentials for
            total_connections = 0
            for user_id, secret in saved_users:
                try:
                    conn_result = manager.list_brokerage_authorizations(user_id, secret)
                    if conn_result["success"]:
                        count = conn_result["count"]
                        total_connections += count
                        print(f"  📊 {user_id}: {count} connections")
                except:
                    print(f"  ❌ {user_id}: Error checking connections")
            
            print()
            print(f"🔗 Total connections (known users): {total_connections}")
            print()
            
            return users, saved_users
            
        else:
            print(f"❌ Error fetching users: {users_result['error']}")
            return [], []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return [], []

def get_saved_users():
    """Get list of saved users from credentials file"""
    saved_users = []
    
    # Check main credentials file
    if os.path.exists('.snaptrade_credentials'):
        with open('.snaptrade_credentials', 'r') as f:
            line = f.read().strip()
            if ':' in line:
                user_id, secret = line.split(':', 1)
                saved_users.append((user_id, secret))
    
    # Check users file
    if os.path.exists('.snaptrade_users'):
        with open('.snaptrade_users', 'r') as f:
            for line in f:
                line = line.strip()
                if ':' in line:
                    user_id, secret = line.split(':', 1)
                    saved_users.append((user_id, secret))
    
    return saved_users

def delete_all_connections_for_saved_users():
    """Delete all connections for users we have credentials for"""
    print("🗑️  Delete All Connections for Saved Users")
    print("=" * 40)
    print()
    
    saved_users = get_saved_users()
    
    if not saved_users:
        print("❌ No saved users found.")
        return
    
    print(f"Found {len(saved_users)} users with saved credentials:")
    for user_id, secret in saved_users:
        print(f"  - {user_id}")
    print()
    
    confirm = input("Delete all connections for these users? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        return
    
    manager = SnapTradeManager()
    total_deleted = 0
    
    for user_id, secret in saved_users:
        print(f"Processing user: {user_id}")
        
        try:
            # Get connections
            conn_result = manager.list_brokerage_authorizations(user_id, secret)
            if conn_result["success"]:
                connections = conn_result["authorizations"]
                print(f"  Found {len(connections)} connections")
                
                # Delete each connection
                for conn in connections:
                    auth_id = conn.get('id')
                    if auth_id:
                        delete_result = manager.delete_brokerage_authorization(user_id, secret, auth_id)
                        if delete_result["success"]:
                            print(f"    ✅ Deleted connection: {auth_id}")
                            total_deleted += 1
                        else:
                            print(f"    ❌ Failed to delete: {auth_id}")
            else:
                print(f"  ❌ Error getting connections: {conn_result['error']}")
        except Exception as e:
            print(f"  ❌ Error processing user: {e}")
        
        print()
    
    print(f"🎉 Deletion complete! Deleted {total_deleted} connections.")

def delete_all_users():
    """Delete all SnapTrade users (nuclear option)"""
    print("☢️  DELETE ALL SNAPTRADE USERS")
    print("=" * 30)
    print("⚠️  WARNING: This will permanently delete ALL users!")
    print("⚠️  This will also delete all their connections!")
    print()
    
    confirm = input("Are you absolutely sure? Type 'DELETE ALL USERS' to confirm: ")
    if confirm != "DELETE ALL USERS":
        print("❌ Deletion cancelled")
        return
    
    try:
        manager = SnapTradeManager()
        result = manager.list_all_users()
        
        if result["success"]:
            users = result["users"]
            print(f"Found {len(users)} users to delete:")
            
            for user in users:
                print(f"  - {user}")
            
            print()
            final_confirm = input("Proceed with deletion? (yes/no): ")
            if final_confirm.lower() != 'yes':
                print("❌ Deletion cancelled")
                return
            
            deleted_count = 0
            for user in users:
                print(f"Deleting user: {user}")
                
                delete_result = manager.delete_user(user)
                if delete_result["success"]:
                    print(f"  ✅ Deleted successfully")
                    deleted_count += 1
                else:
                    print(f"  ❌ Failed: {delete_result['error']}")
            
            print()
            print(f"🎉 Deletion complete! Deleted {deleted_count} out of {len(users)} users.")
        else:
            print(f"❌ Error fetching users: {result['error']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def save_user_credentials():
    """Manually save user credentials"""
    print("💾 Save User Credentials")
    print("=" * 25)
    print()
    
    user_id = input("Enter user ID: ").strip()
    user_secret = input("Enter user secret: ").strip()
    
    if not user_id or not user_secret:
        print("❌ Invalid input")
        return
    
    # Save to users file
    with open('.snaptrade_users', 'a') as f:
        f.write(f"{user_id}:{user_secret}\n")
    
    print(f"✅ Saved credentials for user: {user_id}")

def main():
    """Main function"""
    print("🔧 Comprehensive SnapTrade Cleanup Tool")
    print("=" * 40)
    print()
    
    while True:
        print("Available operations:")
        print("1. Show current status")
        print("2. Delete all connections for saved users")
        print("3. Delete ALL users (☢️  NUCLEAR OPTION)")
        print("4. Save user credentials")
        print("5. Exit")
        print()
        
        choice = input("Enter your choice (1-5): ").strip()
        
        if choice == "1":
            show_current_status()
        elif choice == "2":
            delete_all_connections_for_saved_users()
        elif choice == "3":
            delete_all_users()
        elif choice == "4":
            save_user_credentials()
        elif choice == "5":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-5.")
        
        print()

if __name__ == "__main__":
    main()

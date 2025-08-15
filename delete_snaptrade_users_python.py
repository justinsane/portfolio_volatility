#!/usr/bin/env python3
"""
SnapTrade User Deletion Script (Python Version)
Deletes all SnapTrade users using the working Python client
"""
import os
import sys
from dotenv import load_dotenv
from snaptrade_client import SnapTrade

# Load environment variables
load_dotenv()

def main():
    print("🔧 SnapTrade User Deletion Script (Python)")
    print("==========================================")
    print()
    
    # Get credentials
    client_id = os.getenv('SNAPTRADE_CLIENT_ID')
    consumer_key = os.getenv('SNAPTRADE_CONSUMER_KEY')
    
    if not client_id or not consumer_key:
        print("❌ Missing SnapTrade credentials in environment variables")
        print("Please set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY")
        sys.exit(1)
    
    print(f"✅ Using credentials:")
    print(f"   Client ID: {client_id[:8]}...")
    print(f"   Consumer Key: {consumer_key[:8]}...")
    print()
    
    # Initialize SnapTrade client
    try:
        snaptrade = SnapTrade(client_id=client_id, consumer_key=consumer_key)
        print("✅ SnapTrade client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize SnapTrade client: {e}")
        sys.exit(1)
    
    # List all users
    print("\n📋 Listing all SnapTrade users...")
    print("==================================")
    try:
        response = snaptrade.authentication.list_snap_trade_users()
        users = response.body if hasattr(response, 'body') else response
        
        if not users:
            print("ℹ️  No users found to delete")
            return
        
        print(f"✅ Found {len(users)} users:")
        for i, user_id in enumerate(users, 1):
            print(f"   {i}. {user_id}")
        print()
        
    except Exception as e:
        print(f"❌ Failed to list users: {e}")
        sys.exit(1)
    
    # Confirm deletion
    print("🗑️  DELETING ALL SNAPTRADE USERS")
    print("=================================")
    print()
    
    confirm = input("Are you sure you want to delete ALL users? (yes/no): ").lower().strip()
    if confirm not in ['yes', 'y']:
        print("❌ Deletion cancelled")
        return
    
    # Delete each user
    deleted_count = 0
    failed_count = 0
    
    for user_id in users:
        print(f"🗑️  Deleting user: {user_id}")
        try:
            response = snaptrade.authentication.delete_snap_trade_user(user_id=user_id)
            
            if hasattr(response, 'body'):
                result = response.body
            else:
                result = response
            
            if result.get('status') == 'deleted':
                print(f"   ✅ User {user_id} queued for deletion")
                deleted_count += 1
            else:
                print(f"   ❌ Failed to delete user {user_id}")
                print(f"      Response: {result}")
                failed_count += 1
                
        except Exception as e:
            print(f"   ❌ Error deleting user {user_id}: {e}")
            failed_count += 1
        
        print()
    
    # Summary
    print("🎉 USER DELETION SUMMARY")
    print("=======================")
    print(f"Total users found: {len(users)}")
    print(f"Successfully queued for deletion: {deleted_count}")
    if failed_count > 0:
        print(f"Failed to delete: {failed_count}")
    print()
    print("ℹ️  Note: User deletion is asynchronous. Users will be deleted shortly.")
    print("   You can check the status by running this script again.")

if __name__ == "__main__":
    main()

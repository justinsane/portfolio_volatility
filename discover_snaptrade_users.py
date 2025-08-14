#!/usr/bin/env python3
"""
Discover and manage all SnapTrade users
"""
import os
import json
import re
from dotenv import load_dotenv
from utils.snaptrade_utils import SnapTradeManager

# Load environment variables
load_dotenv()

def find_user_ids_in_logs():
    """Try to find user IDs in application logs or files"""
    user_ids = set()
    
    # Common patterns for SnapTrade user IDs
    patterns = [
        r'user_[a-f0-9]{8}',  # user_xxxxxxxx format
        r'user-[a-f0-9]{8}',  # user-xxxxxxxx format
        r'user_[a-f0-9]{16}', # user_xxxxxxxxxxxxxxxx format
    ]
    
    # Files to search
    search_files = [
        'app.py',
        'utils/snaptrade_utils.py',
        'test_snaptrade_api.py',
        'test_complete_snaptrade_flow.py',
        'manage_snaptrade_connections.py',
        '.snaptrade_credentials',
        '.snaptrade_users'
    ]
    
    print("🔍 Searching for SnapTrade user IDs in files...")
    
    for filename in search_files:
        if os.path.exists(filename):
            try:
                with open(filename, 'r') as f:
                    content = f.read()
                    for pattern in patterns:
                        matches = re.findall(pattern, content)
                        user_ids.update(matches)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
    
    return list(user_ids)

def test_user_credentials(user_id, user_secret):
    """Test if user credentials are valid"""
    try:
        manager = SnapTradeManager()
        result = manager.list_brokerage_authorizations(user_id, user_secret)
        return result["success"]
    except Exception as e:
        return False

def generate_possible_secrets():
    """Generate some common test user secrets to try"""
    # These are common patterns for SnapTrade user secrets
    return [
        "test-secret-123",
        "demo-secret-456", 
        "user-secret-789",
        "snaptrade-test",
        "demo-user-secret"
    ]

def discover_users():
    """Try to discover existing SnapTrade users"""
    print("🔍 SnapTrade User Discovery Tool")
    print("=" * 40)
    print()
    
    try:
        manager = SnapTradeManager()
        
        # Try to get all users from SnapTrade API
        print("📋 Fetching all users from SnapTrade API...")
        result = manager.list_all_users()
        
        if result["success"]:
            users = result["users"]
            print(f"✅ Found {len(users)} users in SnapTrade:")
            
            for i, user in enumerate(users, 1):
                user_id = user.get('id', 'Unknown')
                print(f"  {i}. User ID: {user_id}")
            
            print()
            
            # Ask if user wants to save these
            save_choice = input("Save these users to the credentials file? (yes/no): ")
            if save_choice.lower() == 'yes':
                # Note: We can't get user secrets from the API, so we'll need to add them manually
                print("⚠️  Note: User secrets are not available from the API.")
                print("You'll need to add them manually if you have them.")
                
                # Create a template file
                with open('.snaptrade_users_template', 'w') as f:
                    f.write("# SnapTrade Users Template\n")
                    f.write("# Add user secrets manually if you have them\n")
                    f.write("# Format: user_id:user_secret\n\n")
                    for user in users:
                        user_id = user.get('id', 'Unknown')
                        f.write(f"# {user_id}:ADD_SECRET_HERE\n")
                
                print("✅ Created .snaptrade_users_template file")
                print("Edit it to add user secrets, then rename to .snaptrade_users")
        else:
            print(f"❌ Error fetching users: {result['error']}")
            print("Falling back to file search...")
            discover_users_from_files()
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Falling back to file search...")
        discover_users_from_files()

def discover_users_from_files():
    """Fallback method to find users in files"""
    # Find user IDs in files
    user_ids = find_user_ids_in_logs()
    
    if not user_ids:
        print("❌ No user IDs found in files.")
        print("Try registering a new user or check your application logs.")
        return
    
    print(f"Found {len(user_ids)} potential user IDs:")
    for user_id in user_ids:
        print(f"  - {user_id}")
    print()
    
    # Try to find valid credentials for these users
    print("🔑 Testing user credentials...")
    valid_users = []
    
    # First, try some common test secrets
    test_secrets = generate_possible_secrets()
    
    for user_id in user_ids:
        print(f"Testing user: {user_id}")
        
        # Try common test secrets
        for secret in test_secrets:
            if test_user_credentials(user_id, secret):
                print(f"  ✅ Valid credentials found: {user_id}:{secret}")
                valid_users.append((user_id, secret))
                break
        else:
            print(f"  ❌ No valid credentials found for {user_id}")
    
    print()
    
    if valid_users:
        print("✅ Valid users found:")
        for user_id, secret in valid_users:
            print(f"  - {user_id}: {secret[:8]}...{secret[-4:]}")
        
        # Ask if user wants to save these
        save_choice = input("\nSave these users to the credentials file? (yes/no): ")
        if save_choice.lower() == 'yes':
            save_users_to_file(valid_users)
    else:
        print("❌ No valid user credentials found.")
        print("You may need to:")
        print("1. Check your application logs for user secrets")
        print("2. Register new users")
        print("3. Manually add known user credentials")

def save_users_to_file(users):
    """Save users to the credentials file"""
    try:
        with open('.snaptrade_users', 'w') as f:
            for user_id, secret in users:
                f.write(f"{user_id}:{secret}\n")
        print(f"✅ Saved {len(users)} users to .snaptrade_users")
    except Exception as e:
        print(f"❌ Error saving users: {e}")

def check_dashboard_vs_script():
    """Compare what the dashboard shows vs what our script knows"""
    print("📊 Dashboard vs Script Comparison")
    print("=" * 35)
    print()
    
    # Check our saved users
    saved_users = []
    if os.path.exists('.snaptrade_users'):
        with open('.snaptrade_users', 'r') as f:
            for line in f:
                line = line.strip()
                if ':' in line:
                    user_id, secret = line.split(':', 1)
                    saved_users.append((user_id, secret))
    
    print(f"Script knows about: {len(saved_users)} users")
    for user_id, secret in saved_users:
        print(f"  - {user_id}")
    
    print()
    print("Dashboard shows: 4 users (you mentioned)")
    print()
    print("To sync them up:")
    print("1. Run the discovery tool to find missing users")
    print("2. Check your application logs for user registrations")
    print("3. Manually add known user credentials")

def delete_all_users():
    """Delete all SnapTrade users (use with caution!)"""
    print("🗑️  Delete ALL SnapTrade Users")
    print("=" * 30)
    print("⚠️  WARNING: This will permanently delete all users!")
    print()
    
    confirm = input("Are you absolutely sure? Type 'DELETE ALL' to confirm: ")
    if confirm != "DELETE ALL":
        print("❌ Deletion cancelled")
        return
    
    try:
        manager = SnapTradeManager()
        result = manager.list_all_users()
        
        if result["success"]:
            users = result["users"]
            print(f"Found {len(users)} users to delete:")
            
            for user in users:
                user_id = user.get('id', 'Unknown')
                print(f"  - {user_id}")
            
            print()
            final_confirm = input("Proceed with deletion? (yes/no): ")
            if final_confirm.lower() != 'yes':
                print("❌ Deletion cancelled")
                return
            
            deleted_count = 0
            for user in users:
                user_id = user.get('id', 'Unknown')
                print(f"Deleting user: {user_id}")
                
                delete_result = manager.delete_user(user_id)
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

def main():
    """Main function"""
    print("🔧 SnapTrade User Management")
    print("=" * 30)
    print()
    print("1. Discover existing users")
    print("2. Compare dashboard vs script")
    print("3. Delete ALL users (⚠️  DANGEROUS)")
    print("4. Exit")
    print()
    
    while True:
        choice = input("Enter your choice (1-4): ").strip()
        
        if choice == "1":
            discover_users()
        elif choice == "2":
            check_dashboard_vs_script()
        elif choice == "3":
            delete_all_users()
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-4.")
        
        print()

if __name__ == "__main__":
    main()

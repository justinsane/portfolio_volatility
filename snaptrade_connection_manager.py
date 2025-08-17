#!/usr/bin/env python3
"""
SnapTrade Connection Manager
Python helper for automatically managing SnapTrade connection limits
"""
import os
import json
import subprocess
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SnapTradeConnectionManager:
    """Manages SnapTrade connection limits automatically"""
    
    def __init__(self, script_path: str = "./delete_oldest_snaptrade_user.sh"):
        """Initialize the connection manager"""
        self.script_path = script_path
        self.tracking_file = ".snaptrade_user_timestamps.json"
        self.max_connections = 5
        
        # Verify script exists
        if not os.path.exists(script_path):
            raise FileNotFoundError(f"Script not found: {script_path}")
        
        # Make sure script is executable
        if not os.access(script_path, os.X_OK):
            os.chmod(script_path, 0o755)
    
    def _run_script(self, args: List[str]) -> Tuple[int, str, str]:
        """Run the shell script with given arguments"""
        try:
            cmd = [self.script_path] + args
            logger.debug(f"Running command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            logger.error("Script execution timed out")
            return 1, "", "Script execution timed out"
        except Exception as e:
            logger.error(f"Error running script: {e}")
            return 1, "", str(e)
    
    def add_user_to_tracking(self, user_id: str) -> bool:
        """Add a new user to tracking"""
        try:
            logger.info(f"Adding user to tracking: {user_id}")
            returncode, stdout, stderr = self._run_script(["--add-user", user_id])
            
            if returncode == 0:
                logger.info(f"✅ Successfully added user {user_id} to tracking")
                return True
            else:
                logger.error(f"❌ Failed to add user {user_id} to tracking: {stderr}")
                return False
        except Exception as e:
            logger.error(f"Error adding user to tracking: {e}")
            return False
    
    def check_connection_limit(self) -> Tuple[bool, int]:
        """Check if connection limit is reached"""
        try:
            logger.info("Checking connection limit...")
            returncode, stdout, stderr = self._run_script(["--check-limit"])
            
            if returncode == 0:
                # Parse the output to get current count
                current_count = self._parse_user_count_from_output(stdout)
                at_limit = True
                logger.info(f"Connection limit reached: {current_count}/{self.max_connections}")
            elif returncode == 1:
                # Not at limit
                current_count = self._parse_user_count_from_output(stdout)
                at_limit = False
                logger.info(f"Connection limit not reached: {current_count}/{self.max_connections}")
            else:
                logger.error(f"Error checking connection limit: {stderr}")
                return False, 0
            
            return at_limit, current_count
        except Exception as e:
            logger.error(f"Error checking connection limit: {e}")
            return False, 0
    
    def _parse_user_count_from_output(self, output: str) -> int:
        """Parse user count from script output"""
        try:
            # Look for pattern like "Current user count: X / 5"
            lines = output.split('\n')
            for line in lines:
                if "Current user count:" in line:
                    parts = line.split(':')
                    if len(parts) >= 2:
                        count_part = parts[1].strip()
                        count = int(count_part.split('/')[0].strip())
                        return count
            return 0
        except Exception as e:
            logger.error(f"Error parsing user count: {e}")
            return 0
    
    def auto_manage_connection_limit(self) -> bool:
        """Automatically manage connection limit by deleting oldest user if needed"""
        try:
            logger.info("Auto-managing connection limit...")
            returncode, stdout, stderr = self._run_script(["--auto-manage", "--auto-confirm"])
            
            if returncode == 0:
                logger.info("✅ Connection limit managed successfully")
                return True
            else:
                logger.error(f"❌ Failed to manage connection limit: {stderr}")
                return False
        except Exception as e:
            logger.error(f"Error auto-managing connection limit: {e}")
            return False
    
    def delete_oldest_user(self) -> bool:
        """Delete the oldest user"""
        try:
            logger.info("Deleting oldest user...")
            returncode, stdout, stderr = self._run_script(["--delete-oldest", "--auto-confirm"])
            
            if returncode == 0:
                logger.info("✅ Successfully deleted oldest user")
                return True
            else:
                logger.error(f"❌ Failed to delete oldest user: {stderr}")
                return False
        except Exception as e:
            logger.error(f"Error deleting oldest user: {e}")
            return False
    
    def get_tracked_users(self) -> List[Dict[str, str]]:
        """Get list of tracked users with timestamps"""
        try:
            if not os.path.exists(self.tracking_file):
                return []
            
            with open(self.tracking_file, 'r') as f:
                data = json.load(f)
            
            users = []
            for user_id, timestamp in data.items():
                try:
                    creation_date = datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
                except:
                    creation_date = "Unknown"
                
                users.append({
                    'user_id': user_id,
                    'timestamp': timestamp,
                    'creation_date': creation_date
                })
            
            # Sort by timestamp (oldest first)
            users.sort(key=lambda x: int(x['timestamp']))
            return users
        except Exception as e:
            logger.error(f"Error getting tracked users: {e}")
            return []
    
    def sync_tracking(self) -> bool:
        """Sync tracking with actual SnapTrade users"""
        try:
            logger.info("Syncing tracking with SnapTrade...")
            returncode, stdout, stderr = self._run_script(["--sync"])
            
            if returncode == 0:
                logger.info("✅ Successfully synced tracking")
                return True
            else:
                logger.error(f"❌ Failed to sync tracking: {stderr}")
                return False
        except Exception as e:
            logger.error(f"Error syncing tracking: {e}")
            return False
    
    def handle_connection_limit_error(self) -> bool:
        """Handle connection limit error by automatically managing the limit"""
        logger.warning("Connection limit error detected. Attempting to resolve...")
        return self.auto_manage_connection_limit()
    
    def ensure_connection_available(self) -> bool:
        """Ensure a connection is available by managing limits if needed"""
        try:
            at_limit, current_count = self.check_connection_limit()
            
            if at_limit:
                logger.info(f"Connection limit reached ({current_count}/{self.max_connections}). Managing...")
                return self.auto_manage_connection_limit()
            else:
                logger.info(f"Connection available ({current_count}/{self.max_connections})")
                return True
        except Exception as e:
            logger.error(f"Error ensuring connection available: {e}")
            return False

# Convenience functions for easy integration
def handle_snaptrade_connection_limit() -> bool:
    """Handle SnapTrade connection limit error"""
    try:
        manager = SnapTradeConnectionManager()
        return manager.handle_connection_limit_error()
    except Exception as e:
        logger.error(f"Error handling connection limit: {e}")
        return False

def ensure_snaptrade_connection_available() -> bool:
    """Ensure a SnapTrade connection is available"""
    try:
        manager = SnapTradeConnectionManager()
        return manager.ensure_connection_available()
    except Exception as e:
        logger.error(f"Error ensuring connection available: {e}")
        return False

def add_snaptrade_user_to_tracking(user_id: str) -> bool:
    """Add a SnapTrade user to tracking"""
    try:
        manager = SnapTradeConnectionManager()
        return manager.add_user_to_tracking(user_id)
    except Exception as e:
        logger.error(f"Error adding user to tracking: {e}")
        return False

# Example usage and testing
if __name__ == "__main__":
    import sys
    
    print("🔧 SnapTrade Connection Manager (Python)")
    print("========================================")
    print()
    
    if len(sys.argv) < 2:
        print("Usage: python snaptrade_connection_manager.py <command>")
        print()
        print("Commands:")
        print("  check-limit     - Check if connection limit is reached")
        print("  auto-manage     - Auto-manage connection limit")
        print("  delete-oldest   - Delete oldest user")
        print("  list-users      - List tracked users")
        print("  sync            - Sync tracking with SnapTrade")
        print("  add-user <id>   - Add user to tracking")
        print()
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        manager = SnapTradeConnectionManager()
        
        if command == "check-limit":
            at_limit, count = manager.check_connection_limit()
            if at_limit:
                print(f"⚠️  Connection limit reached: {count}/5")
            else:
                print(f"✅ Connection limit not reached: {count}/5")
        
        elif command == "auto-manage":
            if manager.auto_manage_connection_limit():
                print("✅ Connection limit managed successfully")
            else:
                print("❌ Failed to manage connection limit")
        
        elif command == "delete-oldest":
            if manager.delete_oldest_user():
                print("✅ Oldest user deleted successfully")
            else:
                print("❌ Failed to delete oldest user")
        
        elif command == "list-users":
            users = manager.get_tracked_users()
            if users:
                print(f"📋 Found {len(users)} tracked users:")
                for user in users:
                    print(f"  - {user['user_id']} (created: {user['creation_date']})")
            else:
                print("ℹ️  No tracked users found")
        
        elif command == "sync":
            if manager.sync_tracking():
                print("✅ Tracking synced successfully")
            else:
                print("❌ Failed to sync tracking")
        
        elif command == "add-user":
            if len(sys.argv) < 3:
                print("❌ User ID required for add-user command")
                sys.exit(1)
            user_id = sys.argv[2]
            if manager.add_user_to_tracking(user_id):
                print(f"✅ User {user_id} added to tracking")
            else:
                print(f"❌ Failed to add user {user_id} to tracking")
        
        else:
            print(f"❌ Unknown command: {command}")
            sys.exit(1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

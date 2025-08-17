#!/usr/bin/env python3
"""
Enhanced SnapTrade API utilities with connection limit management
"""
import os
import uuid
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from snaptrade_client import SnapTrade

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedSnapTradeManager:
    """Enhanced SnapTrade manager with automatic connection limit management"""
    
    def __init__(self):
        """Initialize SnapTrade client and connection manager"""
        self.client_id = os.getenv("SNAPTRADE_CLIENT_ID")
        self.consumer_key = os.getenv("SNAPTRADE_CONSUMER_KEY")
        self.max_connections = 5
        self.tracking_file = ".snaptrade_user_timestamps.json"
        
        if not self.client_id or not self.consumer_key:
            raise ValueError("Missing SnapTrade credentials in environment variables")
        
        self.client = SnapTrade(
            client_id=self.client_id,
            consumer_key=self.consumer_key
        )
        
        logger.info("Enhanced SnapTrade client initialized successfully")
    
    def _init_tracking_file(self):
        """Initialize the tracking file if it doesn't exist"""
        if not os.path.exists(self.tracking_file):
            import json
            with open(self.tracking_file, 'w') as f:
                json.dump({}, f)
            logger.info(f"Created tracking file: {self.tracking_file}")
    
    def _load_tracked_users(self) -> Dict[str, str]:
        """Load tracked users from file"""
        self._init_tracking_file()
        import json
        try:
            with open(self.tracking_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading tracked users: {e}")
            return {}
    
    def _save_tracked_users(self, users: Dict[str, str]):
        """Save tracked users to file"""
        import json
        try:
            with open(self.tracking_file, 'w') as f:
                json.dump(users, f)
        except Exception as e:
            logger.error(f"Error saving tracked users: {e}")
    
    def _add_user_to_tracking(self, user_id: str):
        """Add a user to tracking with current timestamp"""
        import time
        users = self._load_tracked_users()
        users[user_id] = str(int(time.time()))
        self._save_tracked_users(users)
        logger.info(f"Added user {user_id} to tracking")
    
    def _remove_user_from_tracking(self, user_id: str):
        """Remove a user from tracking"""
        users = self._load_tracked_users()
        if user_id in users:
            del users[user_id]
            self._save_tracked_users(users)
            logger.info(f"Removed user {user_id} from tracking")
    
    def _get_oldest_user(self) -> Optional[str]:
        """Get the oldest tracked user"""
        users = self._load_tracked_users()
        if not users:
            return None
        
        # Sort by timestamp (oldest first)
        sorted_users = sorted(users.items(), key=lambda x: int(x[1]))
        return sorted_users[0][0] if sorted_users else None
    
    def _get_tracked_user_count(self) -> int:
        """Get the number of tracked users"""
        users = self._load_tracked_users()
        return len(users)
    
    def _sync_tracking_with_snaptrade(self):
        """Sync tracking with actual SnapTrade users"""
        try:
            # Get actual SnapTrade users
            response = self.client.authentication.list_snap_trade_users()
            actual_users = response.body if hasattr(response, 'body') else response
            
            # Get tracked users
            tracked_users = self._load_tracked_users()
            
            # Add missing users to tracking
            for user_id in actual_users:
                if user_id not in tracked_users:
                    logger.info(f"Adding missing user {user_id} to tracking")
                    self._add_user_to_tracking(user_id)
            
            # Remove users that no longer exist in SnapTrade
            tracked_user_ids = set(tracked_users.keys())
            actual_user_ids = set(actual_users)
            missing_from_snaptrade = tracked_user_ids - actual_user_ids
            
            for user_id in missing_from_snaptrade:
                logger.info(f"Removing user {user_id} from tracking (no longer in SnapTrade)")
                self._remove_user_from_tracking(user_id)
                
        except Exception as e:
            logger.warning(f"Could not sync tracking with SnapTrade: {e}")
    
    def _ensure_connection_available(self) -> bool:
        """Ensure a connection is available by managing limits if needed"""
        try:
            # First try to sync with SnapTrade to get accurate count
            self._sync_tracking_with_snaptrade()
            
            # Get current tracked count
            current_count = self._get_tracked_user_count()
            logger.info(f"Current tracked user count: {current_count}/{self.max_connections}")
            
            if current_count >= self.max_connections:
                logger.warning(f"Connection limit reached ({current_count}/{self.max_connections}). Deleting oldest user...")
                
                # Get oldest user
                oldest_user = self._get_oldest_user()
                if not oldest_user:
                    logger.error("No tracked users found to delete")
                    return False
                
                # Delete the oldest user
                try:
                    response = self.client.authentication.delete_snap_trade_user(
                        user_id=oldest_user
                    )
                    
                    # Remove from tracking
                    self._remove_user_from_tracking(oldest_user)
                    
                    logger.info(f"Successfully deleted oldest user: {oldest_user}")
                    return True
                    
                except Exception as e:
                    logger.error(f"Failed to delete oldest user {oldest_user}: {e}")
                    return False
            else:
                logger.info(f"Connection available ({current_count}/{self.max_connections})")
                return True
                
        except Exception as e:
            logger.error(f"Error ensuring connection available: {e}")
            return False
    
    def register_user_with_limit_management(self, user_id: str, auto_manage_limit: bool = True) -> Dict[str, Any]:
        """Register a new user with automatic connection limit management"""
        try:
            logger.info(f"Registering user with limit management: {user_id}")
            
            # Ensure connection is available if auto-manage is enabled
            if auto_manage_limit:
                logger.info("Ensuring connection availability...")
                if not self._ensure_connection_available():
                    logger.error("Could not ensure connection availability")
                    return {
                        "success": False,
                        "error": "Could not ensure connection availability"
                    }
            
            # Try to register the user
            try:
                response = self.client.authentication.register_snap_trade_user(
                    user_id=user_id
                )
                
                if hasattr(response, 'body'):
                    user_data = response.body
                else:
                    user_data = response
                
                # Add user to tracking if registration was successful
                self._add_user_to_tracking(user_id)
                logger.info(f"User {user_id} added to connection tracking")
                
                logger.info(f"User registered successfully: {user_id}")
                return {
                    "success": True,
                    "user_id": user_id,
                    "user_secret": user_data.get("userSecret"),
                    "data": user_data
                }
                
            except Exception as e:
                error_str = str(e)
                
                # Check if this is a connection limit error
                if "Connection Limit Reached" in error_str and auto_manage_limit:
                    logger.warning("Connection limit reached. Attempting to resolve...")
                    
                    # Try to ensure connection availability
                    if self._ensure_connection_available():
                        logger.info("Connection limit resolved. Retrying user registration...")
                        
                        # Retry the registration
                        try:
                            response = self.client.authentication.register_snap_trade_user(
                                user_id=user_id
                            )
                            
                            if hasattr(response, 'body'):
                                user_data = response.body
                            else:
                                user_data = response
                            
                            # Add user to tracking
                            self._add_user_to_tracking(user_id)
                            logger.info(f"User {user_id} added to connection tracking")
                            
                            logger.info(f"User registered successfully after limit resolution: {user_id}")
                            return {
                                "success": True,
                                "user_id": user_id,
                                "user_secret": user_data.get("userSecret"),
                                "data": user_data
                            }
                            
                        except Exception as retry_error:
                            logger.error(f"Error registering user {user_id} after limit resolution: {retry_error}")
                            return {
                                "success": False,
                                "error": f"Failed to register user after limit resolution: {retry_error}"
                            }
                    else:
                        logger.error("Could not resolve connection limit")
                        return {
                            "success": False,
                            "error": "Could not resolve connection limit"
                        }
                
                # If it's not a connection limit error or we couldn't resolve it
                logger.error(f"Error registering user {user_id}: {e}")
                return {
                    "success": False,
                    "error": str(e)
                }
                
        except Exception as e:
            logger.error(f"Unexpected error in register_user_with_limit_management: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def register_user(self, user_id: str) -> Dict[str, Any]:
        """Register a new user with SnapTrade (legacy method)"""
        return self.register_user_with_limit_management(user_id, auto_manage_limit=True)
    
    def register_user_no_limit_management(self, user_id: str) -> Dict[str, Any]:
        """Register a new user without connection limit management"""
        return self.register_user_with_limit_management(user_id, auto_manage_limit=False)
    
    def get_login_url(self, user_id: str, user_secret: str) -> Dict[str, Any]:
        """Generate login URL for SnapTrade connection portal"""
        try:
            logger.info(f"Generating login URL for user: {user_id}")
            response = self.client.authentication.login_snap_trade_user(
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                login_data = response.body
            else:
                login_data = response
                
            logger.info(f"Login URL generated successfully for user: {user_id}")
            return {
                "success": True,
                "redirect_uri": login_data.get("redirectURI"),
                "data": login_data
            }
        except Exception as e:
            logger.error(f"Error generating login URL for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_accounts(self, user_id: str, user_secret: str) -> Dict[str, Any]:
        """List connected accounts for a user"""
        try:
            logger.info(f"Listing accounts for user: {user_id}")
            response = self.client.account_information.list_user_accounts(
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                accounts_data = response.body
            else:
                accounts_data = response
                
            logger.info(f"Found {len(accounts_data)} accounts for user: {user_id}")
            return {
                "success": True,
                "accounts": accounts_data,
                "count": len(accounts_data)
            }
        except Exception as e:
            logger.error(f"Error listing accounts for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def refresh_account_holdings(self, user_id: str, user_secret: str, account_id: str) -> Dict[str, Any]:
        """Refresh holdings for a specific account to get latest data"""
        try:
            logger.info(f"Refreshing holdings for account: {account_id}")
            logger.info(f"User ID: {user_id}")
            
            response = self.client.account_information.refresh_user_account_holdings(
                account_id=account_id,
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                holdings_data = response.body
            else:
                holdings_data = response
                
            logger.info(f"Holdings refreshed successfully for account: {account_id}")
            return {
                "success": True,
                "holdings": holdings_data,
                "account_id": account_id
            }
        except Exception as e:
            logger.error(f"Error refreshing holdings for account {account_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_account_holdings(self, user_id: str, user_secret: str, account_id: str) -> Dict[str, Any]:
        """Get holdings for a specific account"""
        try:
            logger.info(f"Getting holdings for account: {account_id}")
            response = self.client.account_information.get_user_account_holdings(
                account_id=account_id,
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                holdings_data = response.body
            else:
                holdings_data = response
                
            logger.info(f"Retrieved holdings for account: {account_id}")
            return {
                "success": True,
                "holdings": holdings_data,
                "account_id": account_id
            }
        except Exception as e:
            logger.error(f"Error getting holdings for account {account_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_brokerage_authorizations(self, user_id: str, user_secret: str) -> Dict[str, Any]:
        """List brokerage authorizations for a user"""
        try:
            logger.info(f"Listing brokerage authorizations for user: {user_id}")
            response = self.client.account_information.list_user_brokerage_authorizations(
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                auth_data = response.body
            else:
                auth_data = response
                
            logger.info(f"Found {len(auth_data)} brokerage authorizations for user: {user_id}")
            return {
                "success": True,
                "authorizations": auth_data,
                "count": len(auth_data)
            }
        except Exception as e:
            logger.error(f"Error listing brokerage authorizations for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_brokerage_authorization(self, user_id: str, user_secret: str, authorization_id: str) -> Dict[str, Any]:
        """Delete a brokerage authorization"""
        try:
            logger.info(f"Deleting brokerage authorization: {authorization_id}")
            response = self.client.account_information.delete_user_brokerage_authorization(
                authorization_id=authorization_id,
                user_id=user_id,
                user_secret=user_secret
            )
            
            logger.info(f"Successfully deleted brokerage authorization: {authorization_id}")
            return {
                "success": True,
                "authorization_id": authorization_id
            }
        except Exception as e:
            logger.error(f"Error deleting brokerage authorization {authorization_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def list_all_users(self) -> Dict[str, Any]:
        """List all SnapTrade users for this client"""
        try:
            logger.info("Listing all SnapTrade users")
            response = self.client.authentication.list_snap_trade_users()
            
            if hasattr(response, 'body'):
                users_data = response.body
            else:
                users_data = response
                
            logger.info(f"Found {len(users_data)} SnapTrade users")
            return {
                "success": True,
                "users": users_data,
                "count": len(users_data)
            }
        except Exception as e:
            logger.error(f"Error listing SnapTrade users: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_user(self, user_id: str) -> Dict[str, Any]:
        """Delete a SnapTrade user"""
        try:
            logger.info(f"Deleting SnapTrade user: {user_id}")
            response = self.client.authentication.delete_snap_trade_user(
                user_id=user_id
            )
            
            # Remove from tracking
            self._remove_user_from_tracking(user_id)
            
            logger.info(f"Successfully deleted SnapTrade user: {user_id}")
            return {
                "success": True,
                "message": f"User {user_id} deleted successfully"
            }
        except Exception as e:
            logger.error(f"Error deleting SnapTrade user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Connection limit management methods
    def check_connection_limit(self) -> tuple[bool, int]:
        """Check if connection limit is reached"""
        try:
            self._sync_tracking_with_snaptrade()
            current_count = self._get_tracked_user_count()
            at_limit = current_count >= self.max_connections
            return at_limit, current_count
        except Exception as e:
            logger.error(f"Error checking connection limit: {e}")
            return False, 0
    
    def auto_manage_connection_limit(self) -> bool:
        """Automatically manage connection limit"""
        return self._ensure_connection_available()
    
    def get_tracked_users(self) -> List[Dict[str, str]]:
        """Get list of tracked users"""
        try:
            users = self._load_tracked_users()
            result = []
            for user_id, timestamp in users.items():
                result.append({
                    'user_id': user_id,
                    'timestamp': timestamp,
                    'creation_date': str(timestamp)  # Simplified for now
                })
            return result
        except Exception as e:
            logger.error(f"Error getting tracked users: {e}")
            return []
    
    def sync_tracking(self) -> bool:
        """Sync tracking with SnapTrade"""
        try:
            self._sync_tracking_with_snaptrade()
            return True
        except Exception as e:
            logger.error(f"Error syncing tracking: {e}")
            return False

def generate_user_id() -> str:
    """Generate a unique user ID for SnapTrade"""
    return f"user_{uuid.uuid4().hex[:8]}"

# Example usage
if __name__ == "__main__":
    # Test the enhanced manager
    manager = EnhancedSnapTradeManager()
    
    # Check connection limit
    at_limit, count = manager.check_connection_limit()
    print(f"Connection limit reached: {at_limit}, Count: {count}")
    
    # List tracked users
    users = manager.get_tracked_users()
    print(f"Tracked users: {len(users)}")
    
    # Generate a test user ID
    test_user_id = generate_user_id()
    print(f"Test user ID: {test_user_id}")
    
    # Note: Uncomment the following lines to test user registration
    # result = manager.register_user_with_limit_management(test_user_id)
    # print(f"Registration result: {result}")

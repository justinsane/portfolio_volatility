#!/usr/bin/env python3
"""
Production-ready SnapTrade API utilities with connection limit management
Uses a simple, stateless approach that works with Render and Vercel
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

class ProductionSnapTradeManager:
    """Production-ready SnapTrade manager with stateless connection limit management"""
    
    def __init__(self):
        """Initialize SnapTrade client"""
        self.client_id = os.getenv("SNAPTRADE_CLIENT_ID")
        self.consumer_key = os.getenv("SNAPTRADE_CONSUMER_KEY")
        self.max_connections = 5
        
        if not self.client_id or not self.consumer_key:
            raise ValueError("Missing SnapTrade credentials in environment variables")
        
        self.client = SnapTrade(
            client_id=self.client_id,
            consumer_key=self.consumer_key
        )
        
        logger.info("Production SnapTrade client initialized successfully")
    
    def _get_all_users_from_snaptrade(self) -> List[str]:
        """Get all users directly from SnapTrade API"""
        try:
            response = self.client.authentication.list_snap_trade_users()
            users = response.body if hasattr(response, 'body') else response
            return users if users else []
        except Exception as e:
            logger.error(f"Error getting users from SnapTrade: {e}")
            return []
    
    def _get_user_count(self) -> int:
        """Get current user count from SnapTrade"""
        users = self._get_all_users_from_snaptrade()
        return len(users)
    
    def _get_oldest_user_from_snaptrade(self) -> Optional[str]:
        """Get the oldest user by trying to delete users in order until one works"""
        try:
            users = self._get_all_users_from_snaptrade()
            if not users:
                return None
            
            # For MVP, we'll use a simple approach: try to delete the first user
            # In a more sophisticated system, you might want to track creation times
            # But for now, this is the simplest approach that works
            return users[0] if users else None
            
        except Exception as e:
            logger.error(f"Error getting oldest user: {e}")
            return None
    
    def _delete_user_from_snaptrade(self, user_id: str) -> bool:
        """Delete a user from SnapTrade"""
        try:
            response = self.client.authentication.delete_snap_trade_user(
                user_id=user_id
            )
            logger.info(f"Successfully deleted user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {e}")
            return False
    
    def _ensure_connection_available(self) -> bool:
        """Ensure a connection is available by deleting oldest user if needed"""
        try:
            current_count = self._get_user_count()
            logger.info(f"Current user count: {current_count}/{self.max_connections}")
            
            if current_count >= self.max_connections:
                logger.warning(f"Connection limit reached ({current_count}/{self.max_connections}). Cleaning up users...")
                
                # Try to delete users until we're under the limit
                max_attempts = 3  # Don't try forever
                attempts = 0
                
                while current_count >= self.max_connections and attempts < max_attempts:
                    attempts += 1
                    logger.info(f"Cleanup attempt {attempts}/{max_attempts}")
                    
                    # Get all users
                    all_users = self._get_all_users_from_snaptrade()
                    logger.info(f"All users before cleanup attempt {attempts}: {all_users}")
                    
                    # Find a user to delete (skip any that end with '_deleted')
                    users_to_delete = [user for user in all_users if not user.endswith('_deleted')]
                    
                    if not users_to_delete:
                        logger.error("No valid users found to delete")
                        return False
                    
                    # Delete the first valid user
                    user_to_delete = users_to_delete[0]
                    logger.info(f"Attempting to delete user: {user_to_delete}")
                    
                    if self._delete_user_from_snaptrade(user_to_delete):
                        logger.info(f"Successfully deleted user: {user_to_delete}")
                        
                        # Wait a moment for the deletion to propagate
                        import time
                        time.sleep(1)
                        
                        # Check the new count
                        current_count = self._get_user_count()
                        logger.info(f"User count after deletion: {current_count}/{self.max_connections}")
                        
                        if current_count < self.max_connections:
                            logger.info("✅ Successfully freed up connection")
                            return True
                    else:
                        logger.error(f"Failed to delete user: {user_to_delete}")
                
                # If we get here, we couldn't get under the limit
                logger.error(f"Could not get under connection limit after {max_attempts} attempts")
                return False
            else:
                logger.info(f"Connection available ({current_count}/{self.max_connections})")
                return True
                
        except Exception as e:
            logger.error(f"Error ensuring connection available: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False
    
    def register_user_with_limit_management(self, user_id: str, auto_manage_limit: bool = True) -> Dict[str, Any]:
        """Register a new user with automatic connection limit management"""
        try:
            logger.info(f"Registering user with limit management: {user_id}")
            
            # Check current connection status first
            status = self.get_connection_status()
            logger.info(f"Current connection status: {status['current_count']}/{status['max_connections']} (at limit: {status['at_limit']})")
            
            # Ensure connection is available if auto-manage is enabled
            if auto_manage_limit:
                logger.info("Ensuring connection availability...")
                if not self._ensure_connection_available():
                    logger.error("Could not ensure connection availability")
                    return {
                        "success": False,
                        "error": "Could not ensure connection availability. Please try again."
                    }
                
                # Double-check we have space after cleanup
                final_status = self.get_connection_status()
                logger.info(f"After cleanup status: {final_status['current_count']}/{final_status['max_connections']}")
                
                if final_status['at_limit']:
                    logger.error("Still at connection limit after cleanup attempt")
                    return {
                        "success": False,
                        "error": "Connection limit reached. Please try again in a few minutes."
                    }
            
            # Try to register the user
            try:
                logger.info(f"Attempting to register user: {user_id}")
                response = self.client.authentication.register_snap_trade_user(
                    user_id=user_id
                )
                
                if hasattr(response, 'body'):
                    user_data = response.body
                else:
                    user_data = response
                
                logger.info(f"User registered successfully: {user_id}")
                return {
                    "success": True,
                    "user_id": user_id,
                    "user_secret": user_data.get("userSecret"),
                    "data": user_data
                }
                
            except Exception as e:
                error_str = str(e)
                logger.error(f"Error registering user {user_id}: {error_str}")
                
                # Check if this is a connection limit error
                if ("Connection Limit Reached" in error_str or "limit reached" in error_str.lower()) and auto_manage_limit:
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
                            "error": "Could not resolve connection limit. Please try again."
                        }
                
                # If it's not a connection limit error or we couldn't resolve it
                logger.error(f"Error registering user {user_id}: {e}")
                return {
                    "success": False,
                    "error": str(e)
                }
                
        except Exception as e:
            logger.error(f"Unexpected error in register_user_with_limit_management: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
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
    
    def get_account_positions(self, user_id: str, user_secret: str, account_id: str) -> Dict[str, Any]:
        """Get positions for a specific account"""
        try:
            logger.info(f"Getting positions for account: {account_id}")
            logger.info(f"User ID: {user_id}")
            
            response = self.client.account_information.get_user_account_positions(
                account_id=account_id,
                user_id=user_id,
                user_secret=user_secret
            )
            
            if hasattr(response, 'body'):
                positions_data = response.body
            else:
                positions_data = response
                
            logger.info(f"Raw positions response type: {type(positions_data)}")
            logger.info(f"Raw positions response: {positions_data}")
            logger.info(f"Retrieved {len(positions_data)} positions for account: {account_id}")
            
            # Log first position structure for debugging
            if positions_data and len(positions_data) > 0:
                logger.info(f"First position structure: {positions_data[0]}")
            
            return {
                "success": True,
                "positions": positions_data,
                "count": len(positions_data)
            }
        except Exception as e:
            logger.error(f"Error getting positions for account {account_id}: {e}")
            logger.error(f"Exception type: {type(e)}")
            
            # Check if this is a SnapTrade sync error
            error_str = str(e)
            if "Initial holdings sync not yet completed" in error_str or "425" in error_str:
                return {
                    "success": False,
                    "error": "Holdings sync in progress. Please wait a few minutes and try again.",
                    "error_type": "sync_in_progress",
                    "retry_after": 300  # 5 minutes
                }
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def transform_positions_to_portfolio(self, positions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform SnapTrade positions to portfolio format"""
        try:
            portfolio_assets = []
            total_value = 0.0
            
            # Calculate total portfolio value
            for position in positions:
                units = position.get("units", 0)
                price = position.get("price", 0)
                
                if units and price:
                    market_value = float(units) * float(price)
                    total_value += market_value
            
            # Transform positions to portfolio format
            for position in positions:
                # Extract symbol from nested structure
                symbol_obj = position.get("symbol", {})
                if isinstance(symbol_obj, dict):
                    # Get the nested symbol object
                    nested_symbol = symbol_obj.get("symbol", {})
                    if isinstance(nested_symbol, dict):
                        ticker = nested_symbol.get("symbol", "")
                        description = nested_symbol.get("description", "")
                    else:
                        ticker = str(nested_symbol) if nested_symbol else ""
                        description = ""
                else:
                    ticker = str(symbol_obj) if symbol_obj else ""
                    description = ""
                
                units = float(position.get("units", 0))
                price = float(position.get("price", 0))
                market_value = units * price
                
                if market_value > 0 and ticker:
                    weight = (market_value / total_value) * 100 if total_value > 0 else 0
                    
                    # Get security type from nested structure
                    security_type = "Unknown"
                    if isinstance(symbol_obj, dict):
                        nested_symbol = symbol_obj.get("symbol", {})
                        if isinstance(nested_symbol, dict):
                            type_obj = nested_symbol.get("type", {})
                            if isinstance(type_obj, dict):
                                security_type = type_obj.get("description", "Unknown")
                    
                    portfolio_assets.append({
                        "Ticker": ticker.upper(),
                        "Weight": round(weight, 2),
                        "Quantity": units,
                        "Price": price,
                        "MarketValue": market_value,
                        "AssetType": security_type,
                        "Description": description
                    })
            
            logger.info(f"Transformed {len(portfolio_assets)} positions to portfolio format")
            logger.info(f"Total portfolio value: ${total_value:,.2f}")
            return portfolio_assets
            
        except Exception as e:
            logger.error(f"Error transforming positions to portfolio format: {e}")
            logger.error(f"Positions data: {positions}")
            return []
    
    def list_brokerage_authorizations(self, user_id: str, user_secret: str) -> Dict[str, Any]:
        """List brokerage authorizations for a user"""
        try:
            logger.info(f"Listing brokerage authorizations for user: {user_id}")
            response = self.client.connections.list_brokerage_authorizations(
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
            response = self.client.connections.remove_brokerage_authorization(
                authorization_id=authorization_id,
                user_id=user_id,
                user_secret=user_secret
            )
            
            logger.info(f"Successfully deleted brokerage authorization: {authorization_id}")
            return {
                "success": True,
                "message": f"Authorization {authorization_id} deleted successfully"
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
            current_count = self._get_user_count()
            at_limit = current_count >= self.max_connections
            return at_limit, current_count
        except Exception as e:
            logger.error(f"Error checking connection limit: {e}")
            return False, 0
    
    def auto_manage_connection_limit(self) -> bool:
        """Automatically manage connection limit"""
        return self._ensure_connection_available()
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get detailed connection status"""
        try:
            users = self._get_all_users_from_snaptrade()
            current_count = len(users)
            at_limit = current_count >= self.max_connections
            
            return {
                "current_count": current_count,
                "max_connections": self.max_connections,
                "at_limit": at_limit,
                "users": users,
                "available_slots": max(0, self.max_connections - current_count)
            }
        except Exception as e:
            logger.error(f"Error getting connection status: {e}")
            return {
                "current_count": 0,
                "max_connections": self.max_connections,
                "at_limit": False,
                "users": [],
                "available_slots": self.max_connections,
                "error": str(e)
            }

def generate_user_id() -> str:
    """Generate a unique user ID for SnapTrade"""
    return f"user_{uuid.uuid4().hex[:8]}"

# Example usage
if __name__ == "__main__":
    # Test the production manager
    manager = ProductionSnapTradeManager()
    
    # Check connection status
    status = manager.get_connection_status()
    print(f"Connection Status: {status['current_count']}/{status['max_connections']}")
    print(f"At limit: {status['at_limit']}")
    print(f"Available slots: {status['available_slots']}")
    
    # Generate a test user ID
    test_user_id = generate_user_id()
    print(f"Test user ID: {test_user_id}")
    
    # Note: Uncomment the following lines to test user registration
    # result = manager.register_user_with_limit_management(test_user_id)
    # print(f"Registration result: {result}")

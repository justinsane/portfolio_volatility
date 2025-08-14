#!/usr/bin/env python3
"""
SnapTrade API utilities for portfolio volatility app
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

class SnapTradeManager:
    """Manages SnapTrade API operations"""
    
    def __init__(self):
        """Initialize SnapTrade client"""
        self.client_id = os.getenv("SNAPTRADE_CLIENT_ID")
        self.consumer_key = os.getenv("SNAPTRADE_CONSUMER_KEY")
        
        if not self.client_id or not self.consumer_key:
            raise ValueError("Missing SnapTrade credentials in environment variables")
        
        self.client = SnapTrade(
            client_id=self.client_id,
            consumer_key=self.consumer_key
        )
        logger.info("SnapTrade client initialized successfully")
    
    def register_user(self, user_id: str) -> Dict[str, Any]:
        """Register a new user with SnapTrade"""
        try:
            logger.info(f"Registering user: {user_id}")
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
            logger.error(f"Error registering user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
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
                refresh_data = response.body
            else:
                refresh_data = response
                
            logger.info(f"Holdings refresh response: {refresh_data}")
            return {
                "success": True,
                "data": refresh_data
            }
        except Exception as e:
            logger.error(f"Error refreshing holdings for account {account_id}: {e}")
            logger.error(f"Exception type: {type(e)}")
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
        """List all brokerage authorizations for a user"""
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
        """Delete a specific brokerage authorization"""
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
    
    def list_all_users_authorizations(self) -> Dict[str, Any]:
        """List all users and their authorizations (for admin purposes)"""
        try:
            logger.info("Listing all users and their authorizations")
            # Note: This would require admin-level access or iterating through known users
            # For now, we'll return a message about the limitation
            return {
                "success": False,
                "error": "This method requires admin access or known user list. Use list_brokerage_authorizations for specific users."
            }
        except Exception as e:
            logger.error(f"Error listing all users authorizations: {e}")
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

def generate_user_id() -> str:
    """Generate a unique user ID for SnapTrade"""
    return f"user_{uuid.uuid4().hex[:8]}"

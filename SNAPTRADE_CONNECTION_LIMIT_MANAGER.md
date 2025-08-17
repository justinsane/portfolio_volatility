# SnapTrade Connection Limit Manager

This system automatically manages SnapTrade connection limits by tracking user creation times and deleting the oldest user when the 5-connection limit is reached.

## Overview

The SnapTrade free tier allows only 5 connections. This system provides:

1. **Automatic tracking** of user creation times
2. **Connection limit monitoring** 
3. **Automatic cleanup** of oldest users when limit is reached
4. **Easy integration** with your application code

## Files

- `delete_oldest_snaptrade_user.sh` - Main shell script for managing connections
- `snaptrade_connection_manager.py` - Python helper for easy integration
- `.snaptrade_user_timestamps.json` - Local tracking file (created automatically)

## Quick Start

### 1. Setup

Make sure you have the required dependencies:

```bash
# Install jq (JSON processor)
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### 2. Configure Credentials

Set your SnapTrade credentials in a `.env` file:

```bash
SNAPTRADE_CLIENT_ID="your_client_id"
SNAPTRADE_CONSUMER_KEY="your_consumer_key"
```

Or set environment variables:

```bash
export SNAPTRADE_CLIENT_ID="your_client_id"
export SNAPTRADE_CONSUMER_KEY="your_consumer_key"
```

### 3. Initial Setup

Sync your existing SnapTrade users with the tracking system:

```bash
# Sync existing users (adds them to tracking with current timestamp)
./delete_oldest_snaptrade_user.sh --sync
```

## Usage

### Shell Script Commands

```bash
# Check connection limit
./delete_oldest_snaptrade_user.sh --check-limit

# Auto-manage connection limit (delete oldest if needed)
./delete_oldest_snaptrade_user.sh --auto-manage

# Delete oldest user manually
./delete_oldest_snaptrade_user.sh --delete-oldest

# Add new user to tracking
./delete_oldest_snaptrade_user.sh --add-user "user123"

# List tracked users
./delete_oldest_snaptrade_user.sh --list-tracked

# Sync tracking with actual SnapTrade users
./delete_oldest_snaptrade_user.sh --sync

# Interactive menu
./delete_oldest_snaptrade_user.sh
```

### Python Integration

```python
from snaptrade_connection_manager import (
    SnapTradeConnectionManager,
    handle_snaptrade_connection_limit,
    ensure_snaptrade_connection_available,
    add_snaptrade_user_to_tracking
)

# Initialize manager
manager = SnapTradeConnectionManager()

# Add user to tracking when creating new SnapTrade user
add_snaptrade_user_to_tracking("user123")

# Check if connection limit is reached
at_limit, count = manager.check_connection_limit()
if at_limit:
    print(f"Connection limit reached: {count}/5")

# Auto-manage connection limit
manager.auto_manage_connection_limit()

# Ensure connection is available before creating new user
if manager.ensure_connection_available():
    # Proceed with creating new SnapTrade user
    pass
```

### Python Command Line

```bash
# Check connection limit
python snaptrade_connection_manager.py check-limit

# Auto-manage connection limit
python snaptrade_connection_manager.py auto-manage

# Delete oldest user
python snaptrade_connection_manager.py delete-oldest

# List tracked users
python snaptrade_connection_manager.py list-users

# Sync tracking
python snaptrade_connection_manager.py sync

# Add user to tracking
python snaptrade_connection_manager.py add-user "user123"
```

## Integration with Your Application

### Option 1: Proactive Management

Before creating a new SnapTrade user, ensure a connection is available:

```python
from snaptrade_connection_manager import ensure_snaptrade_connection_available

def create_snaptrade_user(user_id):
    # Ensure connection is available
    if ensure_snaptrade_connection_available():
        # Create SnapTrade user
        result = snaptrade_manager.register_user(user_id)
        
        if result["success"]:
            # Add to tracking
            add_snaptrade_user_to_tracking(user_id)
            return result
    else:
        raise Exception("Could not ensure connection availability")
```

### Option 2: Reactive Management

Handle connection limit errors when they occur:

```python
from snaptrade_connection_manager import handle_snaptrade_connection_limit

def create_snaptrade_user(user_id):
    try:
        # Try to create SnapTrade user
        result = snaptrade_manager.register_user(user_id)
        
        if result["success"]:
            # Add to tracking
            add_snaptrade_user_to_tracking(user_id)
            return result
    except Exception as e:
        if "Connection Limit Reached" in str(e):
            # Handle connection limit error
            if handle_snaptrade_connection_limit():
                # Retry creating user
                return create_snaptrade_user(user_id)
        raise e
```

### Option 3: Frontend Integration

In your frontend code, you can call the Python script when connection limit errors occur:

```javascript
// In your frontend error handling
if (error.message.includes("Connection Limit Reached")) {
    // Call backend endpoint to handle connection limit
    const response = await fetch('/api/snaptrade/handle-connection-limit', {
        method: 'POST'
    });
    
    if (response.ok) {
        // Retry the original operation
        return retryOriginalOperation();
    }
}
```

## How It Works

### 1. User Tracking

- Users are tracked in `.snaptrade_user_timestamps.json`
- Each user has a creation timestamp
- Users are sorted by creation time (oldest first)

### 2. Connection Limit Monitoring

- Script checks current SnapTrade user count via API
- Compares against maximum limit (5 connections)
- Returns status and current count

### 3. Automatic Cleanup

- When limit is reached, finds oldest tracked user
- Deletes user from SnapTrade API
- Removes user from tracking file
- Provides confirmation and logging

### 4. Synchronization

- Syncs tracking file with actual SnapTrade users
- Adds missing users to tracking
- Removes users that no longer exist in SnapTrade

## Safety Features

- **Confirmation prompts** for destructive operations
- **Error handling** for API failures
- **Logging** of all operations
- **Timeout protection** for API calls
- **Validation** of JSON responses
- **Backup tracking** in case of file corruption

## Troubleshooting

### Common Issues

1. **Script not executable**
   ```bash
   chmod +x delete_oldest_snaptrade_user.sh
   ```

2. **jq not installed**
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

3. **Credentials not found**
   - Check `.env` file exists
   - Verify environment variables are set
   - Ensure credentials are valid

4. **Tracking file out of sync**
   ```bash
   ./delete_oldest_snaptrade_user.sh --sync
   ```

### Debug Mode

Enable debug logging in Python:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Manual Cleanup

If the tracking system gets corrupted:

```bash
# Remove tracking file
rm .snaptrade_user_timestamps.json

# Re-sync with SnapTrade
./delete_oldest_snaptrade_user.sh --sync
```

## Best Practices

1. **Always add users to tracking** when creating new SnapTrade users
2. **Use proactive management** to avoid connection limit errors
3. **Regularly sync tracking** to keep it up to date
4. **Monitor logs** for any issues
5. **Test the system** in development before production

## API Reference

### Shell Script Options

| Option | Description |
|--------|-------------|
| `--add-user USER_ID` | Add user to tracking |
| `--check-limit` | Check connection limit |
| `--auto-manage` | Auto-manage connection limit |
| `--delete-oldest` | Delete oldest user |
| `--list-tracked` | List tracked users |
| `--sync` | Sync with SnapTrade |
| `--auto-confirm` | Skip confirmations |

### Python Methods

| Method | Description |
|--------|-------------|
| `add_user_to_tracking(user_id)` | Add user to tracking |
| `check_connection_limit()` | Check if limit reached |
| `auto_manage_connection_limit()` | Auto-manage limit |
| `delete_oldest_user()` | Delete oldest user |
| `get_tracked_users()` | Get tracked users |
| `sync_tracking()` | Sync with SnapTrade |

## Migration from Existing System

If you have existing SnapTrade users:

1. **Sync existing users**:
   ```bash
   ./delete_oldest_snaptrade_user.sh --sync
   ```

2. **Update your code** to add users to tracking when creating new ones

3. **Test the system** with a few users before going live

4. **Monitor the first few automatic cleanups** to ensure everything works correctly

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Test with the interactive menu: `./delete_oldest_snaptrade_user.sh`
4. Verify your SnapTrade credentials are correct

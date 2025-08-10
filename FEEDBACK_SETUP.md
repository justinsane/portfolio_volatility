# Feedback Email Setup

The feedback form now sends emails to your specified email address. Here's how to set it up:

## 1. Create Environment File

Create a `.env` file in the root directory with the following configuration:

```bash
# Email Configuration for Feedback
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
FEEDBACK_EMAIL=test@gmail.com

# Frontend URL (optional)
FRONTEND_URL=http://localhost:3000
```

## 2. Gmail App Password Setup

Since you're using Gmail, you'll need to create an App Password:

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled
4. Go to App passwords
5. Generate a new app password for "Mail"
6. Use this password in the `MAIL_PASSWORD` field

## 3. Configuration Details

- `MAIL_USERNAME`: Your Gmail address
- `MAIL_PASSWORD`: Your Gmail app password (not your regular password)
- `MAIL_FROM`: Your Gmail address (same as MAIL_USERNAME)
- `FEEDBACK_EMAIL`: The email address where feedback will be sent (test@gmail.com)

## 4. Security Notes

- The `.env` file is already in `.gitignore` to keep your credentials secure
- Never commit your actual email credentials to version control
- Use app passwords instead of your main Gmail password

## 5. Testing

After setting up the environment variables:

1. Restart your development server
2. Go to the feedback page
3. Submit a test message
4. Check your email (test@gmail.com) for the feedback

## Troubleshooting

If emails aren't being sent:

1. Check that all environment variables are set correctly
2. Verify your Gmail app password is correct
3. Ensure 2-Step Verification is enabled on your Google account
4. Check the server logs for any error messages

# Help & Support Email Integration - Setup Guide

## Overview
The Help & Support page now includes a contact form that sends emails to your support address. When users submit the form, both the support team and the user receive confirmation emails.

## What Changed

### Frontend Updates
- **`client/app/[locale]/help-support/page.tsx`** (UPDATED)
  - Added embedded contact form with better styling
  - Integrated with backend email service
  - Real-time form validation and error handling
  - Success/error feedback messages
  - Form automatically resets after successful submission

### Backend Setup
- **`server/src/controllers/contactController.ts`** (NEW)
  - Handles form submissions
  - Sends two emails: one to support, one to user
  - Email validation and error handling
  - Professional HTML email templates

- **`server/src/routes/contact.ts`** (NEW)
  - POST `/api/contact/send` - Submit contact form

- **`server/src/index.ts`** (UPDATED)
  - Added contact routes to express app

- **`server/package.json`** (UPDATED)
  - Added `nodemailer` dependency for email sending

## Email Configuration Setup

### Step 1: Get Email Credentials

#### Option A: Using Gmail (Recommended)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Scroll down and click **App passwords**
5. Select "Mail" and "Windows Computer" (or your device)
6. Google will generate a 16-character password - copy this
7. Use this password as `EMAIL_PASS` (not your Gmail password)

#### Option B: Using Other Email Services
- Gmail SMTP: `smtp.gmail.com`
- Outlook: `smtp.office365.com` with port 587
- Other services: Check your email provider's SMTP settings

### Step 2: Update .env File

Edit `server/.env` and add/update:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
SUPPORT_EMAIL=support@vaanikaam.com
```

**Important Notes:**
- `EMAIL_USER`: Your email address (sender)
- `EMAIL_PASS`: App password from Step 1 (NOT your regular password)
- `SUPPORT_EMAIL`: Where support emails will be sent (can be same or different from EMAIL_USER)
- `EMAIL_SERVICE`: Service provider (gmail, outlook, etc.)

### Step 3: Restart Server

```bash
# Stop the running server (Ctrl+C)
# Then restart it
npm run dev
```

## Email Templates

### Support Team Email
Includes:
- User's full name, email, phone, and reason
- Complete message
- Reply-to set to user's email
- Professional formatting

### User Confirmation Email
Includes:
- Acknowledgment of message receipt
- Message summary
- Support contact information
- Expected response time (1 business day)

## Testing the Form

1. Navigate to the Help & Support page
2. Fill in the contact form with test data:
   - Full name: "Test User"
   - Email: "test@example.com"
   - Reason: "General inquiry"
   - Message: "This is a test message"
3. Click "Send message"
4. Check your inbox for:
   - Confirmation email at your EMAIL_USER address (support email)
   - Confirmation email at the form's email address (user email)

## Troubleshooting

### "Failed to send email" Error
- **Cause**: Email credentials are incorrect or not configured
- **Solution**: 
  1. Verify EMAIL_USER and EMAIL_PASS in `.env`
  2. If using Gmail, ensure you used App Password (not regular password)
  3. Check that 2-Step Verification is enabled on Gmail

### Form sends but emails don't arrive
- **Cause**: Email might be in spam folder or service is rate-limited
- **Solution**:
  1. Check spam/junk folder
  2. Add sending email to contacts
  3. Wait a few minutes and retry

### "Network error" when submitting form
- **Cause**: Client can't reach backend API
- **Solution**:
  1. Ensure backend server is running (`npm run dev`)
  2. Check `NEXT_PUBLIC_API_URL` in client `.env.local`
  3. Verify CORS settings allow frontend domain

### "This email account is not allowed"
- **Cause**: Gmail security settings blocking the app
- **Solution**:
  1. Use App Password instead of regular password
  2. Enable 2-Step Verification if not already enabled
  3. Check Gmail account security settings for blocked apps

## Email Limitations

### Gmail Free Account Limits
- Up to 500 emails per day
- Subject to Gmail's daily limits
- Recommended: Use business email or upgrade for higher limits

### Best Practices
1. **Monitor Sending Rate**: Don't send more than 100+ emails per day from free account
2. **Use Business Email**: For production, use a business email account or email service
3. **Monitor Logs**: Check server logs for email sending errors
4. **Error Handling**: Form includes error feedback for users

## Production Recommendations

For production environments:
1. **Use Email Service**: Consider SendGrid, Mailgun, or AWS SES
2. **Scale Infrastructure**: These services can handle thousands of emails
3. **Add Email Tracking**: Monitor opens, bounces, etc.
4. **Implement Queuing**: Queue emails for reliability
5. **Rate Limiting**: Add rate limiting to prevent abuse

### Alternative Email Services Setup

#### Using SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Update `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-api-key
   ```

#### Using Mailgun
1. Sign up at [mailgun.com](https://mailgun.com)
2. Get API credentials
3. Update `.env`:
   ```env
   EMAIL_SERVICE=mailgun
   MAILGUN_API_KEY=your-api-key
   MAILGUN_DOMAIN=your-domain
   ```

## File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── contactController.ts          (NEW)
│   ├── routes/
│   │   └── contact.ts                    (NEW)
│   └── index.ts                          (UPDATED)
├── .env                                  (UPDATED)
└── package.json                          (UPDATED)

client/
└── app/
    └── [locale]/
        └── help-support/
            └── page.tsx                  (UPDATED)
```

## Security Notes

1. **Don't commit .env**: Ensure `.env` file is in `.gitignore`
2. **Email Validation**: Form validates email format before sending
3. **CORS Protected**: API endpoint respects CORS settings
4. **User Privacy**: Emails sent from user's provided email address only
5. **Error Handling**: Sensitive error details only in server logs, not shown to users

## Monitoring & Logs

Check server logs for email issues:
- Successful sends: Logged to console
- Failures: Detailed error messages in console
- Enable debug logging by adding to `.env`:
  ```env
  DEBUG=nodemailer*
  ```

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review server logs for detailed error messages
3. Verify email credentials are correct
4. Test with different email addresses
5. Ensure backend server is running and accessible

## Next Steps

1. ✅ Install nodemailer (`npm install nodemailer`)
2. ✅ Get email credentials (Gmail App Password)
3. ✅ Update `.env` with email configuration
4. ✅ Restart server
5. ✅ Test contact form submission
6. ✅ Verify emails in inbox

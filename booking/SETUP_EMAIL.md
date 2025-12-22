# 📧 Setup Email Notifications

## What This Does
Sends email notifications to **myosotisbymo@gmail.com** (the spa owner) every time someone makes a booking.

---

## Step 1: Create Gmail App Password

### 1.1 Go to Google Account Security
https://myaccount.google.com/apppasswords

**⚠️ IMPORTANT: Sign in with myosotisbymo@gmail.com**

### 1.2 Create App Password
1. Click "App passwords" (you may need to re-enter your password)
2. In "Select app", choose **"Other (Custom name)"**
3. Enter: `Myosotis Spa Booking System`
4. Click **"Generate"**

### 1.3 Copy the Password
- You'll see a 16-character password like: `abcd efgh ijkl mnop`
- Copy it (remove the spaces): `abcdefghijklmnop`
- **Save it somewhere safe** - you won't be able to see it again!

---

## Step 2: Add to Local Environment (Optional - for testing)

Edit `/Users/pedro/Documents/Websites/miosotys-spa/booking/.env.local`:

```bash
EMAIL_USER=myosotisbymo@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

---

## Step 3: Add to Vercel (Production)

### 3.1 Go to Vercel Environment Variables
https://vercel.com/hello-ubushicoms-projects/miosotys-spa/settings/environment-variables

### 3.2 Add EMAIL_PASSWORD
1. Click "Add New"
2. **Key**: `EMAIL_PASSWORD`
3. **Value**: Your 16-character app password (no spaces)
4. **Environments**: Select all (Production, Preview, Development)
5. Click "Save"

### 3.3 Add EMAIL_USER (if not exists)
1. Click "Add New"
2. **Key**: `EMAIL_USER`
3. **Value**: `myosotisbymo@gmail.com`
4. **Environments**: Select all
5. Click "Save"

---

## Step 4: Redeploy

After adding the environment variables:

1. Go to https://vercel.com/hello-ubushicoms-projects/miosotys-spa/deployments
2. Click the 3 dots on the latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes

---

## Step 5: Test

1. Make a test booking on https://spamyosotis.com
2. Check **myosotisbymo@gmail.com** inbox
3. You should receive an email like:

   **Subject:** 🆕 Nueva Reserva: [Service Name] - [Date]

   With all booking details, customer info, and payment amounts.

---

## Troubleshooting

### "Invalid credentials" error in logs
- The app password is incorrect
- Remove spaces from the password
- Make sure you're using an **App Password**, not your regular Gmail password

### No email received
- Check spam folder
- Check Vercel logs for email errors
- Verify EMAIL_USER and EMAIL_PASSWORD are set correctly
- Make sure you redeployed after adding variables

### Gmail App Passwords not available
- You need 2-Step Verification enabled on the account
- Go to https://myaccount.google.com/security
- Enable "2-Step Verification" first
- Then you can create App Passwords

---

## What Emails Are Sent?

### To Spa Owner (myosotisbymo@gmail.com)
- **When**: Every new booking
- **Includes**: Customer name, phone, email, service, date, time, prices

### To Customer
- **When**: Every new booking (if customer provided email)
- **Includes**: Booking confirmation with all details

---

## Notes

- Emails are sent **in addition to** Google Calendar invitations
- Emails are sent **in addition to** WhatsApp/SMS notifications
- If email fails, the booking still completes (email failure won't block bookings)

---

Ready to set up? Start with Step 1!

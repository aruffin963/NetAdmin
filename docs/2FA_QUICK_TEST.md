# 2FA Quick Start Testing Guide

## 📱 Prerequisites

### Download Authenticator Apps
- **Google Authenticator** (iOS/Android) - https://support.google.com/accounts/answer/1066447
- **Authy** (iOS/Android) - https://authy.com/
- **Microsoft Authenticator** (iOS/Android) - https://www.microsoft.com/security/mobile-authenticator
- **FreeOTP** (iOS/Android) - https://freeotp.github.io/

Choose one and install on your phone.

## 🚀 Testing Steps

### 1. Enable 2FA (First Time Setup)

**Navigate**: Click "2FA Security" in sidebar menu
```
Home → Sidebar → 🔐 2FA Security
```

**Steps**:
1. Click blue "Enable 2FA" button
2. See QR Code displayed on screen
3. Open authenticator app on your phone
4. Tap "+" or "Scan QR Code"
5. Point camera at QR code on screen
6. App should add "NetAdmin" entry
7. You'll see 6-digit code that changes every 30 seconds

**Verification**:
8. Copy the 6-digit code from authenticator app
9. Paste in "Enter the 6-digit code" field
10. Click "Verify & Enable"
11. See success message ✅
12. Backup codes display

### 2. Save Backup Codes

**Important**: Do this immediately!

**Steps**:
1. See list of 10 backup codes (format: XXXX-XXXX-XXXX)
2. Click "Download Codes" to save as file
3. OR Click "Copy All" to copy and paste to text editor
4. Store in secure location (password manager, encrypted file, etc.)

**Why**: If you lose your phone, you need these to recover account access.

### 3. Verify 2FA is Enabled

**Navigate**: Back to 2FA page

**Check**:
- Status card shows "2FA Enabled ✅"
- Buttons changed to "New Codes" and "Disable"
- Shows "Backup Codes: 10 remaining"

### 4. Test Login with 2FA

**Log Out**:
1. Click your profile in top right
2. Click "Logout"

**Log Back In**:
1. Enter username/email
2. Enter password
3. Click "Se connecter"
4. See new screen: "Vérification 2FA"
5. Open authenticator app on phone
6. Copy current 6-digit code
7. Paste in "Code d'authentification" field
8. Click "Vérifier le code"
9. ✅ Should redirect to dashboard

### 5. Test Backup Code Recovery

**Scenario**: Authenticator app not available

**Steps**:
1. Log out again
2. Enter credentials
3. On 2FA screen, click "Utiliser un code de secours"
4. Screen changes to backup code field
5. Enter one of your saved codes (format: XXXX-XXXX-XXXX)
6. Click "Vérifier le code"
7. ✅ Should redirect to dashboard
8. Note: This code can't be used again

### 6. Generate New Backup Codes

**Navigate**: 2FA Security page

**Steps**:
1. Click "New Codes" button
2. Confirm popup "Generate new backup codes? Old codes will be invalidated."
3. New codes display (old ones no longer work)
4. Download new codes
5. Count shows "10 remaining" again

### 7. Check Login History

**Navigate**: 2FA Security page

**Steps**:
1. Scroll to "📊 Login History" section
2. Click "Show" button
3. See table with recent 2FA verifications
   - Date & Time
   - Method (🔐 TOTP or 📄 Backup Code)
   - Status (Success/Failed)
   - IP Address
4. Verify your recent logins are listed

### 8. Disable 2FA (Optional)

**Navigate**: 2FA Security page

**Steps**:
1. Click red "Disable" button
2. Confirm action
3. Status changes to "2FA Disabled"
4. Buttons return to "Enable 2FA"
5. Next login only needs credentials

## ⚠️ Common Issues & Fixes

### "QR Code Not Loading"
- **Issue**: QR image doesn't appear
- **Fix**: 
  - Refresh page
  - Check console for errors (F12)
  - Try manual entry with secret key instead

### "Code Always Invalid"
- **Issue**: TOTP code keeps failing
- **Cause**: Time sync issue between phone and server
- **Fix**:
  - Check phone date/time is correct
  - Try previous/next code from authenticator
  - Disable/re-enable 2FA with fresh code

### "Can't Copy QR Code"
- **Issue**: Copy button not working
- **Fix**:
  - Click copy button next to secret key
  - Manually enter secret key in app
  - Use QR code scanner instead

### "Backup Codes All Used"
- **Issue**: No backup codes remaining
- **Fix**:
  - Click "New Codes" to generate fresh ones
  - Old codes automatically invalidated
  - Download/save new codes

### "Lost All Backup Codes"
- **Issue**: Can't recover without authenticator or codes
- **Fix**:
  - Log in with TOTP if you have app access
  - Click "New Codes" to generate fresh ones
  - **Critical**: If you have neither TOTP nor codes:
    - Contact admin for account recovery
    - Disable 2FA via admin panel
    - Re-enable with fresh setup

## 🔍 Verification Checklist

- [ ] QR code displays correctly
- [ ] Authenticator app shows TOTP codes
- [ ] 6-digit codes change every 30 seconds
- [ ] Code verification works
- [ ] Backup codes display
- [ ] Can download codes as file
- [ ] Can copy codes to clipboard
- [ ] Login shows 2FA verification screen
- [ ] TOTP code works on login
- [ ] Backup code works on login
- [ ] Codes can't be reused
- [ ] Login history records attempts
- [ ] Can generate new codes
- [ ] Can disable 2FA

## 📊 Expected Behavior

### First Login After Enable
```
1. Email/Password screen
2. Enter credentials
3. 2FA Verification screen appears (NEW)
4. Enter 6-digit TOTP code
5. Dashboard loads
```

### Subsequent Logins
```
Same as above - 2FA required every login
```

### After Generating New Codes
```
- 10 new codes available
- Old codes no longer work
- Code count resets to 10
- History shows "New codes generated"
```

### Disable 2FA
```
- Next login only needs email/password
- 2FA verification screen doesn't appear
- Status shows "2FA Disabled"
```

## 🎬 Video Test Scenario (5 minutes)

1. **Enable 2FA** (1 min)
   - Navigate to 2FA Security
   - Click Enable, scan QR code
   - Verify code, download backup codes

2. **Test Login** (1 min)
   - Log out
   - Log in with email/password
   - Enter TOTP code
   - Verify dashboard loads

3. **Test Recovery** (1 min)
   - Log out
   - Log in, use backup code instead
   - Verify it works
   - Check history

4. **New Codes** (1 min)
   - Generate new codes
   - Verify old codes don't work
   - Verify new codes in history

5. **Disable** (1 min)
   - Disable 2FA
   - Log out
   - Log in without 2FA
   - Re-enable for production

## 📞 Support

If issues persist:
1. Check browser console (F12) for errors
2. Check server logs for API errors
3. Verify authenticator app has internet access
4. Verify phone date/time is correct
5. Try different authenticator app
6. Clear browser cache and try again

---

**Time to Complete**: ~15 minutes
**Difficulty**: Easy
**Status**: All features ready for testing

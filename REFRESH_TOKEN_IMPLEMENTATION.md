# Refresh Token Implementation

This document describes the refresh token functionality added to the authentication system.

## Overview

The authentication system now supports refresh tokens alongside access tokens for improved security and user experience:

- **Access Token**: Short-lived token (24 hours) used for API authentication
- **Refresh Token**: Long-lived token (7 days) used to obtain new access tokens without re-login

## Database Changes

### Prisma Schema Updates

Added two new fields to the `Users` model:

```prisma
refreshToken     String?   @unique
refreshTokenExpiry DateTime?
```

Migration: `20251209104958_add_refresh_token`

## API Endpoints

### 1. POST `/login`

**Updated Behavior**: Now returns both access and refresh tokens

**Request Body**:
```json
{
  "socialId": "string",
  "loginType": "guest|google|apple|telegram",
  "referralCode": "string (optional)"
}
```

**Response**:
```json
{
  "status": 200,
  "success": true,
  "message": "User login successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
}
```

### 2. POST `/refresh-token` (NEW)

**Description**: Generates a new access token using a valid refresh token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "status": 200,
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
}
```

**Features**:
- Validates the refresh token from the database
- Checks token expiry
- Generates new access token
- Rotates the refresh token (issues a new one for security)
- Updates user's last active timestamp
- Logs the activity

**Error Responses**:
- `400`: Refresh token is required
- `401`: Invalid or expired refresh token
- `401`: User not found
- `401`: User blocked by admin

### 3. POST `/logout` (NEW)

**Description**: Invalidates the user's refresh token

**Headers**:
```
Authentication: Bearer <access-token>
```

**Response**:
```json
{
  "status": 200,
  "success": true,
  "message": "Logged out successfully"
}
```

**Features**:
- Requires valid access token (UserMiddleware)
- Removes refresh token from database
- Logs the logout activity

## Token Service Updates

### New Functions in `tokenAuthService.js`

#### `generateRefreshToken(payload)`
- Creates a JWT with 7-day expiration
- Uses the same secret as access tokens
- Payload includes `userId`

#### `verifyRefreshToken(token)`
- Verifies JWT signature
- Checks token exists in database
- Validates token hasn't expired
- Checks user status (blocked/active)
- Throws descriptive errors for different failure scenarios

## Security Features

1. **Token Rotation**: Each refresh generates a new refresh token, invalidating the old one
2. **Database Validation**: Refresh tokens are validated against stored values
3. **Expiry Checking**: Both JWT expiry and database expiry are verified
4. **User Status Checking**: Blocked users cannot refresh tokens
5. **Activity Logging**: All refresh and logout actions are logged

## Client Implementation Guide

### Login Flow
```javascript
// 1. Login
const loginResponse = await fetch('/login', {
  method: 'POST',
  body: JSON.stringify({
    socialId: 'user123',
    loginType: 'google'
  })
});

const { token, refreshToken } = loginResponse.data;

// Store both tokens securely
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

### API Request with Auto-Refresh
```javascript
async function apiRequest(url, options = {}) {
  let token = localStorage.getItem('accessToken');
  
  // Add token to request
  options.headers = {
    ...options.headers,
    'Authentication': `Bearer ${token}`
  };
  
  let response = await fetch(url, options);
  
  // If token expired, refresh and retry
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const refreshResponse = await fetch('/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;
      
      // Update stored tokens
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Retry original request with new token
      options.headers.Authentication = `Bearer ${newToken}`;
      response = await fetch(url, options);
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

### Logout Flow
```javascript
async function logout() {
  const token = localStorage.getItem('accessToken');
  
  await fetch('/logout', {
    method: 'POST',
    headers: {
      'Authentication': `Bearer ${token}`
    }
  });
  
  // Clear stored tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login
  window.location.href = '/login';
}
```

## Token Lifetimes

- **Access Token**: 24 hours (configurable in `generateToken`)
- **Refresh Token**: 7 days (configurable in `generateRefreshToken`)

## Migration Instructions

### For Existing Users

Existing users will have `null` values for `refreshToken` and `refreshTokenExpiry`. This is handled gracefully:

1. On their next login, they will receive both tokens
2. Old sessions using only access tokens will continue to work
3. Once their access token expires, they'll need to login again (one-time inconvenience)

### Database Migration

Already applied via Prisma Migrate:
```bash
npx prisma migrate dev --name add_refresh_token
```

## Testing Checklist

- [ ] Login returns both tokens
- [ ] Refresh token endpoint generates new tokens
- [ ] Refresh token rotation works (old token becomes invalid)
- [ ] Expired refresh tokens are rejected
- [ ] Invalid refresh tokens are rejected
- [ ] Logout invalidates refresh token
- [ ] Blocked users cannot refresh tokens
- [ ] Guest to social upgrade includes refresh token
- [ ] Activity logs are created for refresh and logout

## Future Enhancements

1. **Token Revocation List**: Maintain a blacklist of revoked access tokens
2. **Multiple Device Support**: Store multiple refresh tokens per user
3. **Token Fingerprinting**: Bind tokens to device/IP for added security
4. **Configurable Expiry**: Allow different token lifetimes per user role
5. **Refresh Token Sliding Window**: Extend refresh token expiry on each use

# Firebase Integration

This project integrates with Firebase for authentication token verification and user management. Firebase Admin SDK is used on the backend to verify ID tokens issued by Firebase Auth on the client side.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Authentication](#authentication)
4. [Token Verification](#token-verification)
5. [User Management](#user-management)
6. [Security Rules](#security-rules)
7. [Swapping Providers](#swapping-providers)

## Overview

Firebase provides authentication services used by client applications. The backend uses **Firebase Admin SDK** to:

| Service | Purpose | Abstraction |
|---------|---------|-------------|
| **Firebase Admin Auth** | Verify ID tokens, manage users | `AuthService` interface |
| **Token Verification** | Validate client tokens on API requests | Middleware / Guard |
| **User Management** | Create, update, delete users on the server | `UserRepository` + Admin SDK |

### Why Firebase for Authentication?

- **Client-side SDKs**: Firebase Auth provides ready-to-use client SDKs for web and mobile
- **Multiple providers**: Email/password, Google, Apple, and other OAuth providers
- **Token-based**: Issues JWTs that the backend can verify without session storage
- **Free tier**: Generous free tier suitable for development and small-scale production

### Why Abstraction Matters

The project abstracts Firebase behind domain interfaces, enabling:

- **Provider swapping**: Switch to Auth0, Supabase, or custom JWT without changing application code
- **Testing**: Mock authentication services easily in unit tests
- **Gradual migration**: Replace authentication provider independently of other services

## Configuration

### Environment Setup

Firebase Admin SDK configuration is provided via environment variables:

```bash
# .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Admin SDK Initialization

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const adminAuth = getAuth(app);
```

## Authentication

### Authentication Flow

1. **Client**: User signs in via Firebase Auth SDK (email/password, Google, etc.)
2. **Client**: Firebase Auth issues an ID token (JWT)
3. **Client**: Sends ID token in `Authorization: Bearer <idToken>` header
4. **Backend**: Middleware verifies the ID token using Firebase Admin SDK
5. **Backend**: Extracts user information from the verified token
6. **Backend**: Proceeds with the request using authenticated user context

### Authentication Middleware

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { adminAuth } from '@app/application/config/firebase-config';

export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid authorization header' });
    return;
  }

  const idToken = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  request.auth = {
    userId: decodedToken.uid,
    email: decodedToken.email,
    emailVerified: decodedToken.email_verified,
  };
}
```

## Token Verification

### Verifying ID Tokens

Firebase Admin SDK verifies ID tokens and returns decoded claims:

```typescript
import { getAuth } from 'firebase-admin/auth';

export class FirebaseAuthService implements AuthService {
  async verifyToken(idToken: string): Promise<DecodedToken> {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified ?? false,
    };
  }
}
```

### Token Claims

ID tokens contain standard claims:

| Claim | Description |
|-------|-------------|
| `uid` | Firebase user unique identifier |
| `email` | User email address |
| `email_verified` | Whether email is verified |
| `auth_time` | Time of authentication |
| `iat` | Token issued at |
| `exp` | Token expiration |

### Custom Claims

You can set custom claims for role-based access control:

```typescript
// Set custom claims (e.g., admin role)
await getAuth().setCustomUserClaims(uid, { role: 'admin' });

// Claims will appear in subsequent tokens
const decodedToken = await getAuth().verifyIdToken(idToken);
const role = decodedToken.role; // 'admin'
```

## User Management

### Creating Users

```typescript
import { getAuth } from 'firebase-admin/auth';

export class FirebaseUserService {
  async createUser(email: string, password: string): Promise<string> {
    const userRecord = await getAuth().createUser({
      email,
      password,
      emailVerified: false,
    });
    return userRecord.uid;
  }
}
```

### Looking Up Users

```typescript
// By UID
const user = await getAuth().getUser(uid);

// By email
const user = await getAuth().getUserByEmail(email);
```

### Updating Users

```typescript
await getAuth().updateUser(uid, {
  email: 'new@example.com',
  displayName: 'Updated Name',
  disabled: false,
});
```

### Deleting Users

```typescript
await getAuth().deleteUser(uid);
```

## Security Rules

### Backend Security Best Practices

1. **Always verify tokens**: Never trust client-provided user information without verification
2. **Check token expiration**: Firebase Admin SDK automatically checks expiration
3. **Validate email verification**: For sensitive operations, check `email_verified`
4. **Use custom claims for RBAC**: Set roles via custom claims, verify on each request
5. **Rotate service account keys**: Regularly rotate Firebase Admin SDK credentials
6. **Environment variables**: Never commit Firebase credentials to version control

### Rate Limiting

Apply rate limiting to authentication endpoints:

```typescript
app.register(rateLimit, {
  max: 10,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
});
```

## Swapping Providers

The architecture abstracts authentication behind interfaces, making provider swapping straightforward.

### Authentication Service Interface

```typescript
// src/modules/auth/domain/interfaces/services/auth-service.ts
export interface AuthService {
  verifyToken(token: string): Promise<DecodedToken>;
  createUser(email: string, password: string): Promise<string>;
  deleteUser(uid: string): Promise<void>;
}
```

### Swapping to Another Provider

To replace Firebase with another provider (e.g., Auth0, Supabase, custom JWT):

1. **Create new implementation**: Implement the `AuthService` interface with the new provider
2. **Update DI registration**: Change the implementation in `module-configuration.ts`
3. **Update environment variables**: Replace Firebase credentials with new provider credentials
4. **No application code changes**: Command handlers and query handlers remain unchanged

```typescript
// Before: Firebase
container.register({
  authService: asClass(FirebaseAuthService).scoped(),
});

// After: Custom JWT
container.register({
  authService: asClass(CustomJwtAuthService).scoped(),
});
```

### What to Keep in Mind

- The `AuthService` interface defines the contract — any implementation must satisfy it
- Domain layer and application layer are completely unaware of the authentication provider
- Only the infrastructure layer and DI registration need to change
- Tests that mock `AuthService` will continue to work without modification

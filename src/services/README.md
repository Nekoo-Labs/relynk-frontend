# Type-Safe API Utility for Next.js dApp

This directory contains a comprehensive, type-safe API utility built for Next.js applications with React Query integration. It's specifically designed for dApps with features like automatic retries, error handling, authentication, and caching.

## 📁 Files Overview

- **`api.ts`** - Core API utility with fetch wrapper and React Query configuration
- **`api-examples.ts`** - Usage examples and patterns
- **`../hooks/useApi.ts`** - React Query hooks for common API operations
- **`../components/providers/QueryProvider.tsx`** - React Query provider component

## 🚀 Quick Start

### 1. Setup the Provider

The API utility is already integrated with your existing `Web3Provider` in `/src/app/provider.tsx`. The provider includes:

- **Wagmi** for Web3 functionality
- **React Query** with our optimized configuration
- **XellarKit** for wallet connections
- **NextAuth** for authentication
- **React Query Devtools** (development only)

Your provider is already set up correctly and includes our API QueryClient!

### 2. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Basic Usage

```tsx
import { api } from '@/services/api';
import { useProfile } from '@/hooks/useApi';

// Direct API calls
const profile = await api.get<Profile>('/profiles/0x123');

// React Query hooks
function ProfileComponent({ address }: { address: string }) {
  const { data, isLoading, error } = useProfile(address);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.data.owner}</div>;
}
```

## 🔧 Core Features

### Type Safety
- Full TypeScript support with generic types
- Automatic type inference for responses
- Custom error types with status codes

### Error Handling
- Custom `ApiRequestError` class with status codes
- Automatic retry logic with exponential backoff
- Comprehensive error categorization

### Authentication
- Automatic token injection
- Configurable auth skipping
- Support for multiple auth strategies

### Caching & Performance
- React Query integration
- Intelligent cache invalidation
- Query key factories for consistency
- Optimistic updates support

### Next.js Compatibility
- SSR/SSG friendly
- Client-side and server-side support
- Environment-based configuration

## 📚 API Reference

### Core Functions

#### `apiFetch<T>(endpoint, options)`
Main fetch function with full configuration options.

```tsx
const response = await apiFetch<User>('/users/123', {
  method: 'GET',
  timeout: 10000,
  retries: 2,
  params: { include: 'profile' },
  skipAuth: false,
});
```

#### `api` Object
Convenience methods for HTTP verbs:

```tsx
// GET request
const users = await api.get<User[]>('/users');

// POST request
const newUser = await api.post<User>('/users', userData);

// PUT request
const updatedUser = await api.put<User>('/users/123', updates);

// PATCH request
const patchedUser = await api.patch<User>('/users/123', partialUpdates);

// DELETE request
await api.delete('/users/123');
```

### Configuration Options

```tsx
interface ApiRequestConfig {
  timeout?: number;           // Request timeout in ms
  retries?: number;          // Number of retry attempts
  baseURL?: string;          // Override base URL
  params?: Record<string, any>; // Query parameters
  skipAuth?: boolean;        // Skip authentication
  headers?: HeadersInit;     // Custom headers
}
```

### React Query Hooks

#### Basic Hooks

```tsx
// Generic query hook
const { data, isLoading, error } = useApiQuery<User>(
  ['users', userId],
  `/users/${userId}`
);

// Generic mutation hook
const mutation = useApiMutation<User, UserData>(
  (userData) => api.post<User>('/users', userData)
);
```

#### Profile-Specific Hooks

```tsx
// Fetch profile
const { data: profile } = useProfile(address);

// Fetch profile data
const { data: profileData } = useProfileData(address);

// Fetch earnings
const { data: earnings } = useProfileEarnings(address);

// Create profile
const createProfile = useCreateProfile();

// Update profile
const updateProfile = useUpdateProfile(address);
```

### Query Keys

Consistent query key factory for cache management:

```tsx
import { queryKeys } from '@/services/api';

// Profile keys
queryKeys.profiles.all()                    // ['api', 'profiles']
queryKeys.profiles.detail(address)         // ['api', 'profiles', 'detail', address]
queryKeys.profiles.data(address)           // ['api', 'profiles', 'detail', address, 'data']
```

## 🎯 Usage Patterns

### 1. Simple Data Fetching

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useApiQuery<User>(
    ['users', userId],
    `/users/${userId}`
  );

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UserCard user={data.data} />;
}
```

### 2. Mutations with Optimistic Updates

```tsx
function EditProfile({ address }: { address: string }) {
  const updateProfile = useApiMutation<Profile, Partial<ProfileData>>(
    (updates) => api.put(`/profiles/${address}`, updates),
    {
      onMutate: async (updates) => {
        // Optimistic update
        queryClient.setQueryData(
          queryKeys.profiles.detail(address),
          (old: any) => ({ ...old, data: { ...old?.data, ...updates } })
        );
      },
      onError: (error, variables, context) => {
        // Rollback on error
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.profiles.detail(address) 
        });
      },
    }
  );

  const handleSubmit = (formData: Partial<ProfileData>) => {
    updateProfile.mutate(formData);
  };

  return <ProfileForm onSubmit={handleSubmit} />;
}
```

### 3. Dependent Queries

```tsx
function ProfileWithEarnings({ address }: { address: string }) {
  const profileQuery = useProfile(address);
  
  const earningsQuery = useApiQuery(
    queryKeys.profiles.earnings(address),
    `/profiles/${address}/earnings`,
    {},
    { 
      enabled: !!profileQuery.data // Only fetch if profile exists
    }
  );

  return (
    <div>
      {profileQuery.data && <ProfileCard profile={profileQuery.data.data} />}
      {earningsQuery.data && <EarningsCard earnings={earningsQuery.data.data} />}
    </div>
  );
}
```

### 4. Error Handling

```tsx
import { useApiError } from '@/hooks/useApi';

function RobustComponent() {
  const { data, error } = useProfile(address);
  const { isUnauthorized, isNotFound, isServerError } = useApiError();

  if (error) {
    if (isUnauthorized(error)) {
      return <LoginPrompt />;
    }
    if (isNotFound(error)) {
      return <CreateProfilePrompt />;
    }
    if (isServerError(error)) {
      return <ServerErrorMessage />;
    }
    return <GenericErrorMessage error={error} />;
  }

  return <ProfileDisplay data={data} />;
}
```

### 5. File Uploads

```tsx
function AvatarUpload() {
  const uploadFile = useUploadFile();

  const handleFileSelect = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const result = await uploadFile.mutateAsync(formData);
      console.log('Upload successful:', result.data.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      disabled={uploadFile.isPending}
    />
  );
}
```

## 🔒 Authentication

The utility supports flexible authentication strategies. Update the `getAuthToken()` function in `api.ts`:

```tsx
// For NextAuth
async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
}

// For localStorage
async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

// For cookies
async function getAuthToken(): Promise<string | null> {
  const token = cookies().get('authToken');
  return token?.value || null;
}
```

## 🐛 Debugging

### React Query Devtools

The devtools are automatically included in development mode. Access them via the floating button in the bottom-right corner.

### Error Logging

All API errors are logged with detailed information:

```tsx
try {
  await api.get('/endpoint');
} catch (error) {
  if (error instanceof ApiRequestError) {
    console.log('Status:', error.status);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
  }
}
```

## 🚀 Performance Tips

1. **Use Query Keys Consistently**: Always use the `queryKeys` factory
2. **Enable/Disable Queries**: Use the `enabled` option for conditional queries
3. **Prefetch Data**: Use `usePrefetch()` for anticipated user actions
4. **Optimistic Updates**: Implement for better UX on mutations
5. **Cache Invalidation**: Be strategic about when to invalidate cache

## 🔧 Customization

### Custom Base URL

```tsx
const response = await apiFetch('/endpoint', {
  baseURL: 'https://api.external-service.com'
});
```

### Custom Headers

```tsx
const response = await api.get('/endpoint', {
  headers: {
    'X-Custom-Header': 'value',
    'Authorization': 'Bearer custom-token'
  }
});
```

### Skip Authentication

```tsx
const response = await api.get('/public-endpoint', {
  skipAuth: true
});
```

This API utility provides a robust foundation for building type-safe, performant dApps with excellent developer experience and user experience.
# One Wallet Per Chain Type Restriction

## Overview
Implemented a restriction to ensure each user can only create **one server wallet per chain type** (Ethereum, Solana, or Bitcoin).

## Changes Made

### 1. Backend Validation (`/app/api/wallets/create/route.ts`)

Added server-side validation to check if a user already has a wallet for the requested chain type before creating a new one:

```typescript
// Check if user already has a server wallet for this chain type
const existingWallet = userData.linked_accounts?.find(
    (account: any) => account.wallet_client === 'privy' && account.chain_type === chainType
);

if (existingWallet) {
    return NextResponse.json({
        success: false,
        error: `You already have a server wallet for ${chainType}. Each user can only create one server wallet per chain type.`,
        existingWallet: {
            id: existingWallet.id,
            address: existingWallet.address,
            chainType: existingWallet.chain_type,
            createdAt: existingWallet.created_at,
        }
    }, { status: 400 });
}
```

**Benefits:**
- ✅ Prevents duplicate wallet creation at the API level
- ✅ Returns clear error message with existing wallet details
- ✅ HTTP 400 status code for proper error handling

### 2. Frontend Validation (`/components/server-wallet-manager.tsx`)

#### a. Auto-load Wallets on Authentication
```typescript
useEffect(() => {
    if (authenticated) {
        handleLoadWallets();
    }
}, [authenticated]);
```

**Benefits:**
- ✅ Automatically loads existing wallets when user logs in
- ✅ Ensures UI always shows current wallet state

#### b. Visual Warning Message
```tsx
{wallets.some(w => w.chainType === chainType) && (
    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-500">
            ⚠️ You already have a server wallet for {chainType}. 
            Each user can only create one wallet per chain type.
        </p>
    </div>
)}
```

**Benefits:**
- ✅ Shows clear warning when user selects a chain type they already have
- ✅ Prevents confusion before attempting to create

#### c. Disabled Create Button
```tsx
<Button 
    onClick={handleCreateWallet} 
    disabled={loading || wallets.some(w => w.chainType === chainType)} 
    className="w-full"
>
    {loading ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
        </>
    ) : wallets.some(w => w.chainType === chainType) ? (
        'Wallet Already Exists'
    ) : (
        'Create Wallet'
    )}
</Button>
```

**Benefits:**
- ✅ Button is disabled when wallet exists for selected chain
- ✅ Button text changes to "Wallet Already Exists" for clarity
- ✅ Prevents accidental duplicate creation attempts

## User Experience Flow

1. **User logs in** → Wallets automatically load
2. **User selects chain type** → UI checks if wallet exists
3. **If wallet exists:**
   - ⚠️ Warning message appears
   - 🚫 Create button is disabled
   - 📝 Button text shows "Wallet Already Exists"
4. **If wallet doesn't exist:**
   - ✅ Create button is enabled
   - 📝 Button text shows "Create Wallet"
5. **If user tries to create via API:**
   - Backend validates and returns error if duplicate
   - Error message shown to user

## Supported Chain Types

Each user can have **one wallet** for each of these chain types:
- 🔷 **Ethereum** (EVM-compatible networks)
- 🟣 **Solana**
- 🟠 **Bitcoin**

**Total possible wallets per user: 3** (one per chain type)

## Error Messages

### Backend Error (API Response)
```json
{
  "success": false,
  "error": "You already have a server wallet for ethereum. Each user can only create one server wallet per chain type.",
  "existingWallet": {
    "id": "wallet_id",
    "address": "0x...",
    "chainType": "ethereum",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Frontend Warning
```
⚠️ You already have a server wallet for ethereum. Each user can only create one wallet per chain type.
```

## Testing

To test the restriction:

1. Login to the application
2. Create a wallet for Ethereum
3. Try to create another Ethereum wallet:
   - ✅ Warning message should appear
   - ✅ Create button should be disabled
   - ✅ Button should show "Wallet Already Exists"
4. Select a different chain type (e.g., Solana)
   - ✅ Warning should disappear
   - ✅ Create button should be enabled
5. Create wallet for Solana
6. Verify you now have 2 wallets (one Ethereum, one Solana)

## Benefits of This Implementation

1. **Data Integrity**: Prevents duplicate wallets in the database
2. **User Clarity**: Clear messaging about wallet limits
3. **Better UX**: Auto-loading wallets and real-time validation
4. **Security**: Server-side validation ensures restriction can't be bypassed
5. **Flexibility**: Users can still create wallets for different chain types

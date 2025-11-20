// // In pages/api/set-spending-limit.js

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { amount } = req.body;
//   if (amount == null || amount <= 0) {
//     return res.status(400).json({ error: 'Invalid amount' });
//   }

//   // Convert ETH amount to Wei and then to a hexadecimal string
//   const valueInWei = (amount * 1e18).toString(16);
//   const policyValue = '0x' + valueInWei;

//   const policyBody = {
//     version: '1.0',
//     name: `Max Spend ${amount} ETH`,
//     chain_type: 'ethereum',
//     rules: [{
//       name: 'Restrict ETH transfers to a maximum value',
//       method: 'eth_sendTransaction',
//       conditions: [{
//         field_source: 'ethereum_transaction',
//         field: 'value',
//         operator: 'lte',
//         value: policyValue,
//       }],
//       action: 'ALLOW'
//     }]
//   };

//   try {
//     const response = await fetch('https://api.privy.io/v1/policies', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Basic ${Buffer.from(`${process.env.PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`).toString('base64')}`,
//         'privy-app-id': process.env.PRIVY_APP_ID,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(policyBody),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to create policy');
//     }
    
//     // The user does not create their own policy ID. Privy generates it.
//     // You should save this ID to manage the policy later.
//     const policyId = data.id;

//     // You would now associate this policyId with a user's wallet.
//     // For example, by updating the wallet's `policy_ids` array.

//     res.status(200).json({ policyId: policyId });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).end();
//   }

//   const { walletId, policyId } = req.body;

//   try {
//     const response = await fetch(`https://api.privy.io/v1/wallets/${walletId}`, {
//       method: 'PATCH',
//       headers: {
//         'Authorization': `Basic ${Buffer.from(`${process.env.PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`).toString('base64')}`,
//         'privy-app-id': process.env.PRIVY_APP_ID,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         policy_ids: [policyId],
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to apply policy');
//     }

//     const data = await response.json();
//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }
"use client";
import { Button } from "@/components/ui/button";

import { ExecuteTask, Signer } from "fluidsdk";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { BrowserProvider } from "ethers";


const Page = () => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.address === user?.wallet?.address);

  const callMCPData = async () => {
    if (!wallet) {
      console.error("Wallet not connected");
      return;
    }

    const provider = await wallet.getEthereumProvider();
    const browserProvider = new BrowserProvider(provider);
    const signer = await browserProvider.getSigner();

    const execute = new ExecuteTask();
    await execute.executeAgentTask({
      agentEndpoint: "/weather",
      mcpServerUrl: "https://fluidmcpserver.vercel.app/mcp",
      parameters: { location: "New York", unit: "celsius" },
      signer: signer as unknown as Signer,
    });

    await execute.giveFeedback({
      feedbackParams: {
        agentId: "84532:12",
        score: 85,
        tags: ["test", "sdk"],
        capability: "test-capability",
        name: "Test Agent",
        task: "test-task",
        context: {
          testType: "sdk-test",
          timestamp: Date.now(),
        },
      },
      contractConfig: {
        chainId: 84532, // Base Sepolia
        rpcUrl: "https://sepolia.base.org",
      },
      signer: signer as unknown as Signer,
    });
  };

  return (
    <div>
      <Button onClick={callMCPData}>Click</Button>
    </div>
  );
};

export default Page;

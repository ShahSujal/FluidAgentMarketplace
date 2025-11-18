"use client";
import { Button } from "@/components/ui/button";
import { useWalletClient } from "wagmi";
import { ExecuteTask, Signer } from "fluidsdk";


const Page = () => {
  const { data: walletClient } = useWalletClient();

  const callMCPData = async () => {
    if (!walletClient) {
      console.error("Wallet not connected");
      return;
    }
    const execute = new ExecuteTask();
    await execute.executeAgentTask({
      agentEndpoint: "/weather",
      mcpServerUrl: "https://fluidmcpserver.vercel.app/mcp",
      parameters: { location: "New York", unit: "celsius" },
      signer: walletClient as Signer,
    });

    await execute.giveFeedback({
      feedbackParams: {
        agentId:"84532:12",
        score:85,
        tags:["test", "sdk"],
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
      signer: walletClient as Signer,
    });
  };

  return (
    <div>
      <Button onClick={callMCPData}>Click</Button>
    </div>
  );
};

export default Page;

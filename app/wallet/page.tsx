"use client";

import { executeTask } from "@/actions/executeTask";
import { Button } from "@/components/ui/button";
import { useWalletClient } from "wagmi";
import { Signer } from "x402-axios";

const Page = () => {
  const { data: walletClient } = useWalletClient();

  const callMCPData = async () => {
    if (!walletClient) {
      console.error("Wallet not connected");
      return;
    }

    await executeTask({
      endpoint: "/weather",
      mcpServerUrl: "https://fluidmcpserver.vercel.app/mcp",
      parameters: { location: "New York", unit: "celsius" },
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

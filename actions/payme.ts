import { Wallet } from "ethers";
import { X402Client } from "./pay2";

export const testlelo = async () => {
  const wallet = new Wallet(
    "PRIVATE KEY HERE"
  );

  const client = new X402Client(wallet);

  const res = await client.get("https://fluidmcpserver.vercel.app/mcp/weather", {
    params: {
      location: "New York",
      unit: "celsius"
    }
  });

  console.log("Response:", res.data);
}
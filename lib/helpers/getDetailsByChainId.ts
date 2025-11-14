const chainDetails = [
  {
    rpc: "https://sepolia.base.org",
    chainId: "84532",
  },
];

export const getDeatailsByChainId = (chainId: number) => {
    return chainDetails.find((details) => details.chainId === chainId.toString());
};

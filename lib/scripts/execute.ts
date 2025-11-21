import { WrapFetchWithPayment } from "@privy-io/react-auth";

export const executeTask = async ({
  wrapFetchWithPayment,
  endpoint,
  mcpServerUrl,
  parameters,
}: {
  wrapFetchWithPayment: WrapFetchWithPayment,
  endpoint: string;
  mcpServerUrl: string;
  parameters: Record<string, any>;
}) => {
  try {
    console.log("Payment started");

    const fetchWithPayment = wrapFetchWithPayment({
      fetch,
      maxValue: BigInt(2000000)
    });

    const url = new URL(`/mcp${endpoint}`, mcpServerUrl);
    console.log("Url we created :",url)

    for (const key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        url.searchParams.append(key, String(parameters[key]));
      }
    }
    console.log("url : ", url.toString());

    const response = await fetchWithPayment(url.toString());
    const data = await response.json();
    console.log("Data : ", data);
    return {
      success: true,
      data: data,
    };;
  } catch (error: any) {
    console.error("X402 Request Failed:", error?.response?.data || error);

    return {
      success: false,
      error: error?.response?.data || error?.message,
    };
  }
};

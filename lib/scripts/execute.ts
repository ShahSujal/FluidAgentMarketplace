import axios from "axios";
import {
  decodeXPaymentResponse,
  Signer,
  withPaymentInterceptor,
} from "x402-axios";

export const executeTask = async ({
  endpoint,
  mcpServerUrl,
  parameters,
  signer,
}: {
  endpoint: string;
  mcpServerUrl: string;
  parameters: Record<string, any>;
  signer: Signer;
}) => {
  try {
    // Wrap axios with payment interceptor
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: mcpServerUrl,
      }),
      signer
    );

    // ❗ WAIT for the paid request to finish
    const response = await api.get(endpoint, { params: parameters });

    // x402 payment header (optional)
    const rawHeader = response.headers["x-payment-response"];

    console.log(rawHeader);
    
    console.log(response);
    

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("X402 Request Failed:", error?.response?.data || error);

    return {
      success: false,
      error: error?.response?.data || error?.message,
    };
  }
};

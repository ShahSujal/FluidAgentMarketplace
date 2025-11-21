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
    console.log("Hellp");
    // Create an Axios instance with payment handling
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: mcpServerUrl,
        // Suppress 402 errors in console since they're handled by interceptor
        validateStatus: (status) => status < 500,
      }),
      signer
    );

    console.log(`Making request to: ${mcpServerUrl}${endpoint}`);
    console.log("Parameters:", parameters);

    const response = await api.get(endpoint, { params: parameters });

    console.log("✅ Response received:", response.data);

    const paymentResponse = decodeXPaymentResponse(
      response.headers["x-payment-response"]
    );
    
    if (paymentResponse) {
      console.log("💳 Payment details:", paymentResponse);
    }

    return {
      success: true,
      data: response.data,
      paymentResponse,
      status: response.status,
    };
  } catch (error: any) {
    console.error("❌ Error executing task:", error.message);
    console.error("Error details:", error.response?.data);
    
    return {
      success: false,
      error: error.message || "Unknown error",
      details: error.response?.data,
    };
  }
};

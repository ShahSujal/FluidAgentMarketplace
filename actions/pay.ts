import {
  createSigner,
  decodeXPaymentResponse,
  withPaymentInterceptor,
} from "x402-axios";
import axios from "axios";




export const performOperation = async ({
  parameters,
  endpoint,
  mcpServerUrl,
  signer
}: {
  parameters?: any,
  endpoint: string,
  mcpServerUrl: string,
  signer: any
}) => {
  try {

    
    console.log("Starting payment operation:", {
      endpoint,
      mcpServerUrl,
      parameters,
      signerAddress: await signer.getAddress?.()
    });

    // Create axios instance with payment interceptor
    const api = withPaymentInterceptor(
      axios.create({
        baseURL: mcpServerUrl,
      }),
      signer
    );

    console.log("Making request with payment interceptor...");
    console.log("Full URL:", mcpServerUrl + endpoint);
    console.log("Parameters:", JSON.stringify(parameters, null, 2));

    // Make the request - the payment interceptor will automatically:
    // 1. Make an initial request
    // 2. Receive the 402 response with payment requirements
    // 3. Create and sign the payment
    // 4. Retry the request with X-PAYMENT header
    const response = await api.get(endpoint, {
      params: parameters,
      validateStatus: (status) => {
        // Accept both success and 402 status codes
        return status >= 200 && status < 300 || status === 402;
      }
    });

    console.log("Response received:", {
      status: response.status,
      headers: Object.keys(response.headers).reduce((acc, key) => {
        acc[key] = response.headers[key];
        return acc;
      }, {} as Record<string, any>),
      data: response.data
    });

    // Decode payment response if available
    const paymentResponseHeader = response.headers["x-payment-response"];
    let paymentResponse = null;
    
    console.log("Payment response header:", paymentResponseHeader);
    
    if (paymentResponseHeader && typeof paymentResponseHeader === 'string' && paymentResponseHeader.trim()) {
      try {
        paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log("✅ Payment processed successfully:", paymentResponse);
      } catch (decodeError) {
        console.warn("Failed to decode payment response:", decodeError);
      }
    } else {
      console.log("ℹ️ No payment response header (payment may have been cached or not required)");
    }

    // Return the actual API response data
    return {
      success: true,
      data: response.data,
      paymentInfo: paymentResponse
    };
    
  } catch (error: any) {
    console.error("Operation failed:", error);
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        params: error.config?.params,
        baseURL: error.config?.baseURL
      }
    });
    
    // Check if it's a 402 Payment Required error
    if (error.response?.status === 402) {
      const paymentRequired = error.response.data;
      console.error("Payment Required:", paymentRequired);
      
      return {
        success: false,
        error: "Payment required",
        paymentDetails: paymentRequired
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Unknown error occurred",
      details: error.response?.data
    };
  }
};

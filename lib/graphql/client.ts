import { GET_AGENTS_QUERY, GET_AGENT_BY_ID_QUERY } from './queries';

const GRAPHQL_ENDPOINT = "https://api.studio.thegraph.com/query/1715584/fluidsdk/version/latest";

export interface AgentDataType {
  id: string;
  chainId: string;
  agentId: string;
  agentURI: string;
  agentURIType: string;
  owner: string;
  operators: string[];
  createdAt: string;
  updatedAt: string;
  registrationFile: {
    id: string;
    cid: string;
    name: string;
    description: string;
    agentId: string;
    mcpTools: string[];
    mcpPrompts: string[];
    mcpResources: string[];
    mcpEndpoint: string;
    image: string;
    active: boolean;
    mcpVersion: string;
    agentWalletChainId: string;
    createdAt: string;
  };
  feedback: Array<{
    id: string;
    feedbackUri: string;
    score: number;
    tag1: string;
    tag2: string;
  }>;
  validations: Array<{
    validatorAddress: string;
  }>;
  metadata: Array<{
    id: string;
    key: string;
    value: string;
    updatedAt: string;
  }>;
  totalFeedback: string;
  lastActivity: string;
}

export interface AgentsResponse {
  agents: AgentDataType[];
}

export async function fetchAgents(
  first: number = 50,
  orderBy: string = 'totalFeedback',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<AgentDataType[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_AGENTS_QUERY,
        variables: {
          first,
          orderBy,
          orderDirection,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('Failed to fetch agents');
    }

    return result.data.agents;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}

// Helper function to decode hex metadata values
export function decodeHexValue(hexValue: string): string {
  try {
    // Remove 0x prefix
    const hex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue;
    // Convert hex to string
    return Buffer.from(hex, 'hex').toString('utf8');
  } catch (error) {
    console.error('Error decoding hex value:', error);
    return hexValue;
  }
}

// Helper function to get metadata value by key
export function getMetadataValue(agent: AgentDataType, key: string): string | null {
  const metadata = agent.metadata.find(m => m.key === key);
  return metadata ? decodeHexValue(metadata.value) : null;
}

// Helper function to calculate average rating from feedback
export function calculateAverageRating(feedback: AgentDataType['feedback']): number {
  if (!feedback || feedback.length === 0) return 0;
  
  const totalScore = feedback.reduce((sum, item) => sum + item.score, 0);
  return Math.round((totalScore / feedback.length) * 10) / 10; // Round to 1 decimal
}

// Helper function to convert score to 5-star rating
export function scoreToStars(score: number): number {
  return Math.min(5, Math.max(0, score / 20)); // Convert 0-100 score to 0-5 stars
}

// Fetch a single agent by ID
export async function fetchAgentById(agentId: string): Promise<AgentDataType | null> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_AGENT_BY_ID_QUERY,
        variables: {
          agentId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('Failed to fetch agent');
    }

    return result.data.agents[0] || null;
  } catch (error) {
    console.error('Error fetching agent:', error);
    throw error;
  }
}

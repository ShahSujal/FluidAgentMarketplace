export const GET_AGENTS_QUERY = `
  query GetAgents($first: Int!, $orderBy: String!, $orderDirection: String!) {
    agents(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      chainId
      agentId
      agentURI
      agentURIType
      owner
      operators
      createdAt
      updatedAt

      registrationFile {
        id
        cid
        name
        description
        agentId
        mcpTools
        mcpPrompts
        mcpResources
        mcpEndpoint
        image
        active
        mcpVersion
        agentWalletChainId
        createdAt
      }

      feedback {
        id
        feedbackUri
      }

      validations {
        validatorAddress
      }

      metadata {
        id
        key
        value
        updatedAt
      }

      totalFeedback
      lastActivity
    }
  }
`;

export const GET_AGENT_BY_ID_QUERY = `
  query GetAgentById($agentId: BigInt!) {
    agents(
      where: { agentId: $agentId }
      first: 1
    ) {
      id
      chainId
      agentId
      agentURI
      agentURIType
      owner
      operators
      createdAt
      updatedAt

      registrationFile {
        id
        cid
        name
        description
        agentId
        mcpTools
        mcpPrompts
        mcpResources
        mcpEndpoint
        image
        active
        mcpVersion
        agentWalletChainId
        createdAt
      }

      feedback {
        id
        feedbackUri
      }

      validations {
        validatorAddress
      }

      metadata {
        id
        key
        value
        updatedAt
      }

      totalFeedback
      lastActivity
    }
  }
`;

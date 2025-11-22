"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Plus, ExternalLink, Bot, Calendar, Activity, Users, Star } from "lucide-react"
import Image from "next/image"
import { AgentDataType, calculateAverageRating, scoreToStars } from "@/lib/graphql/client"

const GRAPHQL_ENDPOINT = "https://api.studio.thegraph.com/query/1715584/fluidsdk/version/latest";

// Star Rating Component
interface StarRatingProps {
  rating: number;
  className?: string;
}

function StarRating({ rating, className = "" }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-3 w-3 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
      ))}
    </div>
  );
}

const GET_AGENTS_BY_OWNER_QUERY = `
  query GetAgentsByOwner($owner: String!, $first: Int!, $orderBy: String!, $orderDirection: String!) {
    agents(
      where: { owner: $owner }
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
        score
        tag1
        tag2
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

async function fetchAgentsByOwner(owner: string): Promise<AgentDataType[]> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_AGENTS_BY_OWNER_QUERY,
        variables: {
          owner: owner.toLowerCase(),
          first: 20,
          orderBy: "createdAt",
          orderDirection: "desc"
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

    return result.data.agents || [];
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}

import { usePrivy } from "@privy-io/react-auth";

// ...

export default function AgentsPage() {
  const { user, authenticated } = usePrivy()
  const address = user?.wallet?.address;
  const [agents, setAgents] = useState<AgentDataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      setLoading(true);
      setError(null);

      fetchAgentsByOwner(address)
        .then(setAgents)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [address]);

  const openAgentInNewTab = (agentId: string) => {
    window.open(`/marketplace/${agentId}`, '_blank');
  };

  const createNewAgent = () => {
    window.open('/agents/create', '_blank');
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const getChainName = (chainId: string) => {
    const chains: Record<string, string> = {
      '84532': 'Base Sepolia',
      '8453': 'Base',
      '1': 'Ethereum',
      '137': 'Polygon',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  if (!authenticated) {
    return (

          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Please connect your wallet to view your agents
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
  
    );
  }

  return (

        <div className="flex flex-1 flex-col p-6 space-y-6 h-screen">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">My Agents</h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor your AI agents
              </p>
            </div>
            <Button onClick={createNewAgent} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <p className="text-destructive">Error loading agents: {error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && agents.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Bot className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Agents Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                You haven't created any agents yet. Get started by creating your first AI agent.
              </p>
              <Button onClick={createNewAgent} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Agent
              </Button>
            </div>
          )}

          {/* Agents Grid */}
          {!loading && !error && agents.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {agents.length} agent{agents.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent: AgentDataType) => (
                  <Card key={agent.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            {agent.registrationFile?.image ? (
                              <Image
                                src={agent.registrationFile.image}
                                alt={agent.registrationFile?.name || 'Agent'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Bot className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">
                              {agent.registrationFile?.name || `Agent #${agent.agentId}`}
                            </CardTitle>
                            <Badge variant={agent.registrationFile?.active ? "default" : "secondary"} className="text-xs">
                              {agent.registrationFile?.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <CardDescription className="line-clamp-2">
                        {agent.registrationFile?.description || "No description available"}
                      </CardDescription>

                      {/* Rating and Feedback - Fixed height container */}
                      <div className="min-h-[60px] flex items-start">
                        {agent.feedback && agent.feedback.length > 0 ? (() => {
                          const averageScore = calculateAverageRating(agent.feedback);
                          const starRating = scoreToStars(averageScore);

                          return (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full">
                              <div className="flex items-center gap-2">
                                <StarRating rating={starRating} />
                                <span className="text-sm font-medium">
                                  {starRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({averageScore}/100)
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {agent.feedback.length} review{agent.feedback.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg w-full">
                            <span className="text-sm text-muted-foreground">No reviews yet</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm flex-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Created: {formatDate(agent.createdAt)}
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          Chain: {getChainName(agent.chainId)}
                        </div>

                        {parseInt(agent.totalFeedback) > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {agent.totalFeedback} total interaction{parseInt(agent.totalFeedback) !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openAgentInNewTab(agent.agentId)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add More Button */}

            </>
          )}
        </div>

  )
}
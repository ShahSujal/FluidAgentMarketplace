"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface NewsArticle {
  title: string;
  url?: string;
  description?: string;
  publishedAt?: string;
  source?: string;
  snippet?: string;
}

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

export function NewsCard({ article, index }: NewsCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Handle various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try to parse "Month Day, Year" format
        return dateString;
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const handleCardClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card 
        className={`group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 overflow-hidden ${article.url ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              {article.source && (
                <Badge variant="secondary" className="text-xs">
                  {article.source}
                </Badge>
              )}
            </div>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </a>
            )}
          </div>

          {/* Description */}
          {(article.description || article.snippet) && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {article.description || article.snippet}
            </p>
          )}

          {/* Footer */}
          {article.publishedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/30">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface NewsGridProps {
  articles: NewsArticle[];
  title?: string;
}

export function NewsGrid({ articles, title }: NewsGridProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {title && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {articles.length} articles
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {articles.map((article, index) => (
          <NewsCard 
            key={index} 
            article={article} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

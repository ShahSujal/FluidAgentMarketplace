"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, Zap, Cog, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { ChatStatus } from "@/actions/chat/executechat";

interface ChatStatusIndicatorProps {
  status: ChatStatus | null;
}

export function ChatStatusIndicator({ status }: ChatStatusIndicatorProps) {
  if (!status) return null;

  const getStatusConfig = (status: ChatStatus) => {
    switch (status.stage) {
      case "thinking":
        return {
          icon: Sparkles,
          color: "text-[#96A78D]",
          bgColor: "bg-[#96A78D]/10",
          message: status.message,
          detail: status.detail,
        };
      case "tool_search":
        return {
          icon: Search,
          color: "text-[#B6CEB4]",
          bgColor: "bg-[#B6CEB4]/10",
          message: status.message,
          detail: status.detail,
        };
      case "tool_call":
        return {
          icon: Zap,
          color: "text-[#96A78D]",
          bgColor: "bg-[#96A78D]/10",
          message: status.message,
          detail: `${status.price} ${status.network} • ${status.detail || ''}`,
        };
      case "tool_execute":
        return {
          icon: Loader2,
          color: "text-[#B6CEB4]",
          bgColor: "bg-[#B6CEB4]/10",
          message: status.message,
          detail: status.progress,
          spinning: true,
        };
      case "tool_success":
        return {
          icon: CheckCircle2,
          color: "text-[#96A78D]",
          bgColor: "bg-[#96A78D]/10",
          message: status.message,
          detail: status.result?.type ? `Received ${status.result.type} data` : undefined,
        };
      case "processing":
        return {
          icon: Sparkles,
          color: "text-[#B6CEB4]",
          bgColor: "bg-[#B6CEB4]/10",
          message: status.message,
          detail: status.detail,
        };
      case "formatting":
        return {
          icon: FileText,
          color: "text-[#D9E9CF]",
          bgColor: "bg-[#D9E9CF]/20",
          message: status.message,
          detail: status.detail,
        };
      case "complete":
        return {
          icon: CheckCircle2,
          color: "text-[#96A78D]",
          bgColor: "bg-[#96A78D]/10",
          message: status.message,
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          message: status.message,
          detail: status.error,
        };
      default:
        return {
          icon: Sparkles,
          color: "text-[#96A78D]",
          bgColor: "bg-[#96A78D]/10",
          message: "Processing...",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.stage}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3"
      >
        <motion.div
          className={`relative flex items-center justify-center w-8 h-8 rounded-full ${config.bgColor} shrink-0`}
          animate={{
            scale: status.stage !== "complete" && status.stage !== "error" ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: status.stage !== "complete" && status.stage !== "error" ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          <Icon 
            className={`w-4 h-4 ${config.color} ${config.spinning ? 'animate-spin' : ''}`} 
          />
          {status.stage !== "complete" && status.stage !== "error" && status.stage !== "tool_success" && (
            <motion.div
              className={`absolute inset-0 rounded-full ${config.bgColor}`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <motion.p
            className="text-sm font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {config.message}
          </motion.p>
          {config.detail && (
            <motion.p
              className="text-xs text-muted-foreground truncate"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {config.detail}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

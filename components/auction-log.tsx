"use client"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function AuctionLog({ auctionLog }) {
  const logRef = useRef(null)

  useEffect(() => {
    // Scroll to the bottom of the log when new bids come in
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [auctionLog])

  if (!auctionLog || auctionLog.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
        <p className="text-center text-zinc-400">No bids have been placed yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 backdrop-blur-sm shadow-lg">
      <div
        ref={logRef}
        className="max-h-80 overflow-y-auto custom-scrollbar p-4 space-y-3"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4b5563 #1f2937",
        }}
      >
        {auctionLog.map((log, index) => (
          <motion.div
            key={`${log.username}-${log.amount}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeOut",
            }}
            className={`flex items-center justify-between p-3 rounded-lg ${
              log.isLeading ? "bg-emerald-900/20 border border-emerald-800/30" : "bg-zinc-800/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${log.isLeading ? "bg-emerald-400" : "bg-zinc-500"}`}></div>
              <span className="text-sm font-medium">{log.username}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold ${log.isLeading ? "text-emerald-400" : "text-zinc-300"}`}>
                ${log.amount.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500">{log.timestamp}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


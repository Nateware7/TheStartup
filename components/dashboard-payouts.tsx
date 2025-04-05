"use client"
import { Calendar, Download } from "lucide-react"

import { Button } from "@/components/ui/button"

const payouts = [
  {
    id: "1",
    amount: 245.97,
    date: "2023-11-15",
    status: "completed",
    reference: "PAY-2023-11-15-001",
  },
  {
    id: "2",
    amount: 179.97,
    date: "2023-10-15",
    status: "completed",
    reference: "PAY-2023-10-15-001",
  },
  {
    id: "3",
    amount: 329.95,
    date: "2023-09-15",
    status: "completed",
    reference: "PAY-2023-09-15-001",
  },
  {
    id: "4",
    amount: 89.99,
    date: "2023-08-15",
    status: "completed",
    reference: "PAY-2023-08-15-001",
  },
]

export function DashboardPayouts() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-900/20 to-violet-900/20 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Available Balance</h3>
          <Button className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
            Withdraw
          </Button>
        </div>
        <div className="mb-2 text-3xl font-bold">$412.94</div>
        <div className="text-sm text-zinc-400">Next automatic payout: December 15, 2023</div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h3 className="font-medium">Payout History</h3>
          <Button variant="outline" size="sm" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Calendar className="mr-2 h-4 w-4" />
            Filter by Date
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-zinc-800">
                  <td className="px-4 py-3 font-medium">{payout.reference}</td>
                  <td className="px-4 py-3 font-medium">${payout.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{payout.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                      Completed
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      <Download className="mr-2 h-4 w-4" />
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


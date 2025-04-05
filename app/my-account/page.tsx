// Create a redirect from /my-account to /dashboard
import { redirect } from "next/navigation"

export default function MyAccountPage() {
  redirect("/dashboard")
}


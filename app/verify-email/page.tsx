import { Suspense } from "react"
import VerifyEmailPage from "@/components/verifyemailclient"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#E8442A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailPage />
    </Suspense>
  )
}

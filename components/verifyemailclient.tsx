"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { runApi } from "@/lib/api/runtime"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const { error, isLoading, isSuccess, isError } = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => runApi((api) => api.verifyEmail(token!)).then(() => true),
    enabled: !!token,
    retry: false,
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success("Email verified successfully")
      const timer = setTimeout(() => router.push("/sign-in"), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, router])

  useEffect(() => {
    if (isError) {
      toast.error("Email verification failed")
    }
  }, [isError])

  const hasError = !token || isError
  const errorMessage = !token
    ? "Invalid verification link"
    : ((error as any)?.message ?? "Verification failed. The link may have expired.")

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {token && isLoading && (
          <>
            <div className="w-12 h-12 border-4 border-[#E8442A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm">Verifying your email...</p>
          </>
        )}

        {token && isSuccess && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Email verified!</h1>
            <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
          </>
        )}

        {hasError && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✗</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Verification failed</h1>
            <p className="text-sm text-gray-500">{errorMessage}</p>
            <Link href="/sign-in" className="text-sm text-[#E8442A] hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

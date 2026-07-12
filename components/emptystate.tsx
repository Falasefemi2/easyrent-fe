"use client"

interface EmptyStateProps {
  type: "listings" | "favorites" | "search"
  onAction?: () => void
  actionLabel?: string
}

export default function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const config = {
    listings: {
      emoji: "🏠",
      title: "No properties listed yet",
      description: "Start by listing your first property and reach thousands of potential tenants.",
      color: "bg-orange-50",
    },
    favorites: {
      emoji: "🤍",
      title: "No saved properties",
      description: "Browse listings and tap the heart icon to save properties you love.",
      color: "bg-pink-50",
    },
    search: {
      emoji: "🔍",
      title: "No results found",
      description: "Try adjusting your search or filters to find what you're looking for.",
      color: "bg-blue-50",
    },
  }

  const { emoji, title, description, color } = config[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-24 h-24 ${color} rounded-full flex items-center justify-center mb-6`}>
        <span className="text-4xl">{emoji}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-[#E8442A] text-white text-sm font-medium rounded-full hover:bg-[#d03d25] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

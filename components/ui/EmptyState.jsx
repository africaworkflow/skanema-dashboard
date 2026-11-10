import { cn } from '@/lib/utils'

// action ou enfants : les deux s'affichent sous le texte
export function EmptyState({ icon: Icon, title, description, action, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <Icon size={22} className="text-gray-300" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-400 max-w-xs mb-4">{description}</p>}
      {action}
      {children}
    </div>
  )
}

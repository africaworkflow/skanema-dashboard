'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3,
  MapPin, MessageCircle, Settings, LogOut, X, Wifi, WifiOff, Clock, CreditCard, BadgeCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const NAV = [
  { href: '/dashboard',             label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { href: '/dashboard/commandes',   label: 'Commandes',       icon: ShoppingBag    },
  { href: '/dashboard/menu',        label: 'Menu',            icon: UtensilsCrossed },
  { href: '/dashboard/statistiques',label: 'Statistiques',    icon: BarChart3      },
]

const NAV_CONFIG = [
  { href: '/dashboard/zones',      label: 'Zones livraison', icon: MapPin         },
  { href: '/dashboard/paiements',   label: 'Paiements',       icon: CreditCard     },
  { href: '/dashboard/whatsapp',   label: 'WhatsApp',        icon: MessageCircle  },
  { href: '/dashboard/horaires',   label: 'Horaires',        icon: Clock          },
  { href: '/dashboard/parametres', label: 'Paramètres',      icon: Settings       },
  { href: '/dashboard/abonnement', label: 'Abonnement',      icon: BadgeCheck     },
]

function NavItem({ href, label, icon: Icon, onClick }) {
  const pathname = usePathname()
  const active   = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg mx-2 transition-all duration-150',
        active
          ? 'bg-gray-900 text-white font-medium'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.5} />
      {label}
    </Link>
  )
}

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()

  // Bloque le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // whatsappPhoneNumberId chargé une fois dans useAuth via /api/auth/me
  const pid       = user?.whatsappPhoneNumberId
  const botActive = !!(pid && !pid.startsWith('PENDING_') && pid !== 'A_CONFIGURER')

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 w-[220px] bg-white border-r border-gray-100 z-40',
        'flex flex-col transition-transform duration-200',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )} style={{ height: '100dvh' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div>
            <div className="text-base font-semibold tracking-tight text-gray-900">
              Skanema
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {user?.restaurantName || 'Dashboard'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav principale */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-4 pb-2">
            <span className="text-2xs font-medium text-gray-400 uppercase tracking-wider">
              Principal
            </span>
          </div>
          {NAV.map(item => (
            <NavItem key={item.href} {...item} onClick={onClose} />
          ))}

          <div className="px-4 pt-4 pb-2">
            <span className="text-2xs font-medium text-gray-400 uppercase tracking-wider">
              Configuration
            </span>
          </div>
          {NAV_CONFIG.map(item => (
            <NavItem key={item.href} {...item} onClick={onClose} />
          ))}
        </nav>

        {/* Bas sidebar — plan + logout */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Plan actuel</span>
              <span className="text-2xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded-full capitalize">
                {!user?.plan || user.plan === 'basic' ? 'Essai' : user.plan}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {botActive
                ? <Wifi size={12} className="text-green-500" />
                : <WifiOff size={12} className="text-gray-300" />
              }
              <span className="text-2xs text-gray-400">{botActive ? 'Bot actif' : 'Bot en attente'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-400
                       hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  )
}

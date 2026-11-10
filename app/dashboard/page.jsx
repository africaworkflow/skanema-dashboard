'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SetupChecklist } from '@/components/ui/SetupChecklist'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { SmartBanner } from '@/components/ui/SmartBanner'
import { getStats, getOrders } from '@/lib/api'
import { formatFCFA, formatRelative, STATUS_LABELS } from '@/lib/utils'
import {
  ShoppingBag, TrendingUp, Users, CreditCard, Plus,
  ArrowRight, Loader2, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'


const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

function generateWeekData(revenueByDay = []) {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const found   = revenueByDay.find(r => r._id === dateStr)
    return {
      day    : DAYS_FR[d.getDay()],
      CA     : found?.CA    || 0,
      cmds   : found?.count || 0,
      isToday: i === 6,
    }
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs shadow-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-gray-500">{formatFCFA(payload[0]?.value)}</p>
      <p className="text-gray-400">{payload[0]?.payload?.cmds} commandes</p>
    </div>
  )
}

// Comparaison avec hier à la même heure (calculée par le serveur). Sans commande hier : pas de pourcentage.
function vsYesterday(stats) {
  const t = stats?.todayOrders ?? 0, y = stats?.yesterdayOrders
  if (y === undefined || y === null) return { deltaLabel: 'depuis minuit' }
  if (y === 0) return { deltaLabel: `hier à cette heure : ${y}` }
  return { delta: Math.round(((t - y) / y) * 100), deltaLabel: 'vs hier à cette heure' }
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [orders,  setOrders]  = useState([])
  const [weekData,setWeekData]= useState(generateWeekData([]))
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [sRes, oRes] = await Promise.all([
          getStats(),
          getOrders({ limit: 6, page: 1 }),
        ])
        setStats(sRes.data.data)
        setOrders(oRes.data.data || [])
        setWeekData(generateWeekData(sRes.data.data?.revenueByDay || []))
      } catch (_) {}
      finally { setLoading(false) }
    }
    load()
  }, [refresh])

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <DashboardLayout
      title="Vue d'ensemble"
      subtitle={today}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefresh(r => r + 1)}
            className="btn-ghost flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <Link href="/dashboard/menu" className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span className="hidden sm:inline">Ajouter un plat</span>
          </Link>
        </div>
      }
    >
      {loading && !stats ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="space-y-5">
        <SmartBanner />
        <SetupChecklist />

          {/* Métriques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Commandes aujourd'hui"
              value={stats?.todayOrders ?? 0}
              {...vsYesterday(stats)}
              icon={ShoppingBag}
              accent
            />
            <MetricCard
              label="Chiffre d'affaires"
              value={formatFCFA(stats?.totalRevenue ?? 0)}
              deltaLabel="total cumulé"
              icon={TrendingUp}
            />
            <MetricCard
              label="Total commandes"
              value={stats?.totalOrders ?? 0}
              deltaLabel="depuis le début"
              icon={CreditCard}
            />
            <MetricCard
              label="Plats populaires"
              value={stats?.topItems?.[0]?.count ?? 0}
              deltaLabel={stats?.topItems?.[0]?._id ?? 'commandes'}
              icon={Users}
            />
          </div>

          {/* Graphique + Commandes récentes */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* Graphique CA semaine */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-medium text-gray-900">CA cette semaine</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatFCFA(weekData.reduce((s, d) => s + d.CA, 0))} total
                  </p>
                </div>
                <span className="text-xs text-gray-400">7 derniers jours</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                  <Bar
                    dataKey="CA"
                    radius={[4, 4, 0, 0]}
                    fill="#111827"
                    opacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Commandes récentes */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-900">Commandes récentes</p>
                <Link
                  href="/dashboard/commandes"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingBag size={28} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Aucune commande pour l'instant</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {orders.map((order, i) => {
                    const s = STATUS_LABELS[order.status] || STATUS_LABELS.PAID
                    const badgeVariant = s.badge.replace('badge-', '')
                    return (
                      <div
                        key={order._id}
                        className={`flex items-center justify-between py-3 ${i < orders.length - 1 ? 'border-b border-gray-50' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.customerPhone} · {formatRelative(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <Badge variant={badgeVariant}>{s.label}</Badge>
                          <span className="text-xs font-medium text-gray-900">
                            {formatFCFA(order.total)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top plats */}
          {stats?.topItems?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-900 mb-4">Plats les plus commandés</p>
              <div className="space-y-3">
                {stats.topItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-300 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900 truncate">{item._id}</span>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.count} fois</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((item.count / stats.topItems[0].count) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

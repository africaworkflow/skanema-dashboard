'use client'
import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { PlanGate } from '@/components/ui/PlanGate'
import { getMenu, createItem, updateItem, deleteItem, toggleItem } from '@/lib/api'
import { formatFCFA } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, UtensilsCrossed,
  Loader2, X, Clock, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const CATEGORIES  = ['Plats principaux','Entrées','Desserts','Boissons','Accompagnements']
const PLAN_LIMITS = { basic: 10, pro: 25, premium: 999 }

const EMPTY_FORM = {
  name:'', description:'', price:'', category:'Plats principaux',
  imageUrl:'', preparationTime:'30', available:true,
  optionGroups: [],
}

const EMPTY_GROUP = { name:'', required:false, multiple:false, choices:[] }
const EMPTY_CHOICE = { label:'', extraPrice:'' }

export default function MenuPage() {
  const { user }    = useAuth()
  const currentPlan = user?.plan || 'basic'
  const maxItems    = PLAN_LIMITS[currentPlan] || 10

  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const [toggling,   setToggling]   = useState(null)
  const [error,      setError]      = useState('')
  const [deleteConf, setDeleteConf] = useState(null)
  const [showOptions,setShowOptions]= useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const [newCatInput,   setNewCatInput]   = useState('')
  const firstInput                  = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getMenu()
      setItems(res.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (modal) setTimeout(() => firstInput.current?.focus(), 120) }, [modal])

  const atLimit = items.length >= maxItems

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowOptions(false)
    setModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name           : item.name,
      description    : item.description,
      price          : String(item.price),
      category       : item.category,
      imageUrl       : item.imageUrl,
      preparationTime: String(item.preparationTime),
      available      : item.available,
      optionGroups   : item.optionGroups || [],
    })
    setShowOptions((item.optionGroups || []).length > 0)
    setError('')
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.imageUrl.trim()) {
      setError('Nom, prix et image sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        price          : Number(form.price),
        preparationTime: Number(form.preparationTime),
        optionGroups   : form.optionGroups.map(g => ({
          ...g,
          choices: g.choices.map(c => ({
            label     : c.label,
            extraPrice: Number(c.extraPrice) || 0,
          })).filter(c => c.label.trim()),
        })).filter(g => g.name.trim() && g.choices.length > 0),
      }
      editing ? await updateItem(editing._id, payload) : await createItem(payload)
      setModal(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item) => {
    setToggling(item._id)
    try {
      await toggleItem(item._id, !item.available)
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, available: !i.available } : i))
    } catch (_) {}
    finally { setToggling(null) }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteItem(id)
      setItems(prev => prev.filter(i => i._id !== id))
      setDeleteConf(null)
    } catch (_) {}
    finally { setDeleting(null) }
  }

  // ── Gestion groupes d'options ──────────────────────────────────
  const addGroup = () => {
    setForm(f => ({ ...f, optionGroups: [...f.optionGroups, { ...EMPTY_GROUP, choices: [] }] }))
  }

  const updateGroup = (gi, field, val) => {
    setForm(f => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) => i === gi ? { ...g, [field]: val } : g)
    }))
  }

  const removeGroup = (gi) => {
    setForm(f => ({ ...f, optionGroups: f.optionGroups.filter((_, i) => i !== gi) }))
  }

  const addChoice = (gi) => {
    setForm(f => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? { ...g, choices: [...g.choices, { ...EMPTY_CHOICE }] } : g
      )
    }))
  }

  const updateChoice = (gi, ci, field, val) => {
    setForm(f => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? {
          ...g,
          choices: g.choices.map((c, j) => j === ci ? { ...c, [field]: val } : c)
        } : g
      )
    }))
  }

  const removeChoice = (gi, ci) => {
    setForm(f => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? { ...g, choices: g.choices.filter((_, j) => j !== ci) } : g
      )
    }))
  }

  // Ordre basé sur l'apparition réelle des items, pas une liste fixe
  const allCats = [...new Set(items.map(i => i.category).filter(Boolean))]
  const grouped = allCats.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat)
    if (catItems.length) acc[cat] = catItems
    return acc
  }, {})

  return (
    <DashboardLayout
      title="Menu"
      subtitle={`${items.length} / ${maxItems === 999 ? '∞' : maxItems} plats · Plan ${currentPlan}`}
      actions={
        <PlanGate
          currentPlan={currentPlan}
          requiredPlan={atLimit && currentPlan !== 'premium' ? (currentPlan === 'pro' ? 'premium' : 'pro') : 'basic'}
          feature={`Ajouter plus de ${maxItems} plats`}
        >
          <button
            onClick={openCreate}
            disabled={atLimit && currentPlan === 'premium'}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Ajouter un plat</span>
          </button>
        </PlanGate>
      }
    >
      {/* Barre de progression plan */}
      {maxItems !== 999 && (
        <div className="mb-5 bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Plats utilisés</span>
            <span className="text-xs font-medium text-gray-900">{items.length} / {maxItems}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all"
              style={{ width: `${Math.min(100, (items.length / maxItems) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Liste des plats */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={22} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Aucun plat" description="Ajoutez votre premier plat pour commencer.">
          <button onClick={openCreate} className="btn-primary mt-4 flex items-center gap-1.5">
            <Plus size={14} /> Ajouter un plat
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {catItems.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {(item.optionGroups || []).length > 0 && (
                          <span className="text-2xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {item.optionGroups.length} option{item.optionGroups.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-gray-900">{formatFCFA(item.price)}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />{item.preparationTime} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Toggle
                        checked={item.available}
                        onChange={() => handleToggle(item)}
                        disabled={toggling === item._id}
                      />
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConf(item)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ maxHeight: '92dvh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">
                {editing ? 'Modifier le plat' : 'Ajouter un plat'}
              </h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Formulaire */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom du plat *</label>
                <input ref={firstInput} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Ex: Thiéboudienne Rouge" className="input" maxLength={100} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Décrivez le plat en quelques mots…" rows={3} maxLength={500} className="input resize-none" />
                <p className="text-2xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Prix (FCFA) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
                    placeholder="3500" min={0} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Préparation (min)</label>
                  <input type="number" value={form.preparationTime} onChange={e => setForm(f => ({...f, preparationTime: e.target.value}))}
                    placeholder="30" min={1} className="input" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Catégorie</label>
                <button
                  type="button"
                  onClick={() => setShowCatPicker(!showCatPicker)}
                  className="input text-left flex items-center justify-between w-full"
                >
                  <span className={form.category ? 'text-gray-900' : 'text-gray-400'}>
                    {form.category || 'Choisir une catégorie…'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${showCatPicker ? 'rotate-180' : ''}`} />
                </button>

                {showCatPicker && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Catégories existantes */}
                    <div className="max-h-44 overflow-y-auto">
                      {[...new Set([...CATEGORIES, ...items.map(i => i.category).filter(Boolean)])].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setForm(f => ({...f, category: c})); setShowCatPicker(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            form.category === c ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Ajouter une nouvelle catégorie */}
                    <div className="border-t border-gray-100 p-2 flex gap-2">
                      <input
                        value={newCatInput}
                        onChange={e => setNewCatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newCatInput.trim()) {
                            const val = newCatInput.trim()
                            const allCatsList = [...new Set([...CATEGORIES, ...items.map(i => i.category).filter(Boolean)])]
                            const existing = allCatsList.find(c => c.toLowerCase() === val.toLowerCase())
                            setForm(f => ({...f, category: existing || val}))
                            setNewCatInput('')
                            setShowCatPicker(false)
                          }
                        }}
                        placeholder="Nouvelle catégorie…"
                        style={{ fontSize: '16px' }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newCatInput.trim()
                          if (!val) return
                          // Cherche si une catégorie existante correspond (insensible casse)
                          const allCatsList = [...new Set([...CATEGORIES, ...items.map(i => i.category).filter(Boolean)])]
                          const existing = allCatsList.find(c => c.toLowerCase() === val.toLowerCase())
                          setForm(f => ({...f, category: existing || val}))
                          setNewCatInput('')
                          setShowCatPicker(false)
                        }}
                        className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Image du plat *</label>
                <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({...f, imageUrl: url}))} />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-900">Disponible</p>
                  <p className="text-xs text-gray-400">Visible dans le menu</p>
                </div>
                <Toggle checked={form.available} onChange={v => setForm(f => ({...f, available: v}))} />
              </div>

              {/* Section options */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 text-left">Options et variantes</p>
                    <p className="text-xs text-gray-400 text-left">
                      {form.optionGroups.length > 0
                        ? `${form.optionGroups.length} groupe${form.optionGroups.length > 1 ? 's' : ''} configuré${form.optionGroups.length > 1 ? 's' : ''}`
                        : 'Sauces, tailles, cuissons…'}
                    </p>
                  </div>
                  {showOptions ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {showOptions && (
                  <div className="border-t border-gray-100 p-4 space-y-4">

                    {form.optionGroups.map((group, gi) => (
                      <div key={gi} className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={group.name}
                            onChange={e => updateGroup(gi, 'name', e.target.value)}
                            placeholder="Ex: Choisir une sauce"
                            style={{ fontSize: '16px' }}
                            className="input flex-1 text-sm"
                          />
                          <button onClick={() => removeGroup(gi)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={group.required}
                              onChange={e => updateGroup(gi, 'required', e.target.checked)}
                              className="w-4 h-4 accent-gray-900 rounded" />
                            <span className="text-xs text-gray-600">Obligatoire</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={group.multiple}
                              onChange={e => updateGroup(gi, 'multiple', e.target.checked)}
                              className="w-4 h-4 accent-gray-900 rounded" />
                            <span className="text-xs text-gray-600">Choix multiple</span>
                          </label>
                        </div>

                        {/* Choix */}
                        <div className="space-y-2">
                          {group.choices.map((choice, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                              <input
                                value={choice.label}
                                onChange={e => updateChoice(gi, ci, 'label', e.target.value)}
                                placeholder="Ex: Sauce pimentée"
                                className="input flex-1 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                              <input
                                type="number"
                                value={choice.extraPrice}
                                onChange={e => updateChoice(gi, ci, 'extraPrice', e.target.value)}
                                placeholder="+0"
                                min={0}
                                className="input w-20 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                              <button onClick={() => removeChoice(gi, ci)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addChoice(gi)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-1 transition-colors">
                            <Plus size={12} /> Ajouter un choix
                          </button>
                        </div>
                      </div>
                    ))}

                    <button onClick={addGroup}
                      className="w-full border border-dashed border-gray-200 rounded-xl py-3 text-xs text-gray-500
                                 hover:border-gray-300 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors">
                      <Plus size={13} /> Ajouter un groupe d'options
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={13} className="animate-spin" />}
                {saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteConf && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Supprimer ce plat ?</h3>
            <p className="text-xs text-gray-400 mb-5">
              <strong className="text-gray-700">{deleteConf.name}</strong> sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConf(null)} className="btn-ghost flex-1">Annuler</button>
              <button onClick={() => handleDelete(deleteConf._id)} disabled={deleting === deleteConf._id}
                className="btn-danger flex-1 flex items-center justify-center gap-2">
                {deleting === deleteConf._id && <Loader2 size={12} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

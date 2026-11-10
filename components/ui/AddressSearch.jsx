'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, Search, X } from 'lucide-react'

// prominentGps : gros bouton « Je suis au restaurant » en premier, coordonnées brutes masquées (parcours de démarrage)
export function AddressSearch({ latitude, longitude, onSelect, prominentGps = false }) {
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [searching,   setSearching]   = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [coords,      setCoords]      = useState({ lat: latitude || '', lng: longitude || '' })
  const [gpsLoading,  setGpsLoading]  = useState(false)
  const [gpsError,    setGpsError]    = useState('')
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // Ferme le dropdown si on clique ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); return }
    setSearching(true)
    try {
      // Nominatim OpenStreetMap — gratuit, pas de clé API
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data = await res.json()
      setResults(data)
      setShowResults(true)
    } catch (_) {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleInput = (val) => {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 500)
  }

  const handleSelect = (place) => {
    const lat = parseFloat(place.lat)
    const lng = parseFloat(place.lon)
    setCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) })
    setQuery(place.display_name.split(',').slice(0, 3).join(', '))
    setShowResults(false)
    onSelect?.({ latitude: lat, longitude: lng, address: place.display_name })
  }

  const handleGPS = () => {
    setGpsError('')
    if (!navigator.geolocation) { setGpsError('Ce téléphone ne permet pas la localisation : recherchez l\'adresse.'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) })
        setQuery(`Ma position actuelle (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
        onSelect?.({ latitude: lat, longitude: lng })
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(err?.code === 1
          ? 'Localisation refusée. Autorisez-la dans votre navigateur, ou recherchez l\'adresse.'
          : 'Position introuvable pour le moment. Réessayez, ou recherchez l\'adresse.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-3" ref={wrapperRef}>
      {prominentGps && (
        <>
          <button type="button" onClick={handleGPS} disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 px-4 text-sm font-semibold hover:bg-gray-800 disabled:opacity-60">
            {gpsLoading ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {gpsLoading ? 'Localisation…' : 'Je suis au restaurant : utiliser ma position'}
          </button>
          {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
          <div className="flex items-center gap-2 text-2xs text-gray-300"><div className="flex-1 h-px bg-gray-100" />ou<div className="flex-1 h-px bg-gray-100" /></div>
        </>
      )}
      {/* Recherche adresse */}
      <div className="relative">
        <label className={prominentGps ? 'sr-only' : 'block text-xs font-medium text-gray-700 mb-1.5'}>
          Adresse du restaurant
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder={prominentGps ? 'Rechercher l\'adresse…' : 'Recherchez l\'adresse de votre restaurant…'}
            className="input pl-8 pr-8 text-base sm:text-sm"
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
          {query && !searching && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setShowResults(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Résultats */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            {results.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700 leading-relaxed">
                  {place.display_name.split(',').slice(0, 4).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bouton GPS auto */}
      {!prominentGps && <>
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="btn-ghost flex items-center gap-2 text-xs py-2"
      >
        {gpsLoading
          ? <Loader2 size={13} className="animate-spin" />
          : <MapPin size={13} className="text-gray-500" />
        }
        {gpsLoading ? 'Localisation…' : 'Utiliser ma position GPS'}
      </button>
      {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
      </>}

      {/* Coordonnées affichées */}
      {!prominentGps && (coords.lat || coords.lng) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Latitude</label>
            <input
              value={coords.lat}
              onChange={e => {
                setCoords(c => ({ ...c, lat: e.target.value }))
                onSelect?.({ latitude: parseFloat(e.target.value), longitude: parseFloat(coords.lng) })
              }}
              className="input font-mono text-xs"
              placeholder="14.6937"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Longitude</label>
            <input
              value={coords.lng}
              onChange={e => {
                setCoords(c => ({ ...c, lng: e.target.value }))
                onSelect?.({ latitude: parseFloat(coords.lat), longitude: parseFloat(e.target.value) })
              }}
              className="input font-mono text-xs"
              placeholder="-17.4441"
            />
          </div>
        </div>
      )}
    </div>
  )
}

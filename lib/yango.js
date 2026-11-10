// Lien qui ouvre l'appli Yango avec la course déjà remplie : départ = restaurant, arrivée = point exact du client,
// service Express Moto (identifiant « courier », testé à Dakar le 10/11/2026 : tariffClass=courier ouvre bien Express Moto).
// Sans l'appli, le lien ouvre la page web de Yango.
export const YANGO_TARIFF = 'courier'

const ok = (p) => p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))

export function yangoDeliveryLink(from, to) {
  if (!ok(from) || !ok(to)) return null
  const params = new URLSearchParams({
    'start-lat'      : String(from.latitude),
    'start-lon'      : String(from.longitude),
    'end-lat'        : String(to.latitude),
    'end-lon'        : String(to.longitude),
    tariffClass      : YANGO_TARIFF,
    ref              : 'skanema',
    lang             : 'fr',
    adj_t            : 'vokme8e_nd9s9z9',
    adj_deeplink_js  : '1',
  })
  return `https://yango.go.link/route?${params}`
}

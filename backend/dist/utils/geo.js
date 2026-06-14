"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
exports.geocodeAddress = geocodeAddress;
// Haversine — distância em km entre dois pontos geográficos
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) {
    return deg * (Math.PI / 180);
}
// Geocodifica endereço via OpenStreetMap Nominatim (gratuito, sem API key)
async function geocodeAddress(address) {
    try {
        const query = encodeURIComponent(address + ', Brasil');
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'TechChurras/1.0 (contato@techchurras.com.br)' },
        });
        if (!res.ok)
            return null;
        const data = await res.json();
        if (!data.length)
            return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=geo.js.map
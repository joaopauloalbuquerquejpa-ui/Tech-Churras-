'use client'
import { useState } from 'react'

export default function PriceCalculator() {
  const [guests, setGuests] = useState(20)
  const [hours, setHours] = useState(4)

  // R$100/h reflete a diaria real do Team Jota (unico GM ativo hoje);
  // R$35/pessoa reflete o preco medio dos kits Acessiveis do Boutique FireBox
  const gmCost = hours * 100
  const meatCost = guests * 35
  const total = gmCost + meatCost

  return (
    <section className="max-w-4xl mx-auto px-4 pb-16">
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
        <p className="text-center text-sm text-orange-400 font-semibold uppercase tracking-wide mb-1">Calculadora rápida</p>
        <p className="text-center text-xs text-gray-500 mb-5">Quanto vai custar meu churrasco?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Convidados</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(g => Math.max(5, g - 5))}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center shrink-0">−</button>
              <span className="flex-1 text-center text-xl font-black text-white">{guests}</span>
              <button onClick={() => setGuests(g => Math.min(300, g + 5))}
                className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">+</button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-1">pessoas</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Duração</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setHours(h => Math.max(2, h - 1))}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center shrink-0">−</button>
              <span className="flex-1 text-center text-xl font-black text-white">{hours}</span>
              <button onClick={() => setHours(h => Math.min(12, h + 1))}
                className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">+</button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-1">horas</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Estimativa total</p>
            <p className="text-3xl font-black text-orange-400">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Grillmaster + carnes</p>
          </div>
        </div>
        <div className="text-center">
          <a
            href={`https://wa.me/5511970593650?text=${encodeURIComponent('Quero montar meu churrasco com a Tech Churras')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
            Quero montar meu churrasco no WhatsApp →
          </a>
          <p className="text-xs text-gray-600 mt-2">Estimativa baseada em preços médios. Valor exato combinado com você.</p>
        </div>
      </div>
    </section>
  )
}

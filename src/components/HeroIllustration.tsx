const HeroIllustration = () => (
  <div className="relative w-full max-w-sm mx-auto select-none" aria-hidden="true">
    {/* Decorative blobs */}
    <div className="absolute top-6 right-6 w-32 h-32 bg-violet-200 rounded-full filter blur-2xl opacity-60" />
    <div className="absolute bottom-10 left-4 w-24 h-24 bg-emerald-200 rounded-full filter blur-2xl opacity-60" />

    {/* Floating card — cobrado */}
    <div className="absolute -top-4 -left-6 bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 z-10 border border-emerald-100">
      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm">✅</div>
      <div>
        <p className="text-xs font-semibold text-emerald-700">¡Wena, el Rodo pagó!</p>
        <p className="text-xs text-muted-foreground">$12.500</p>
      </div>
    </div>

    {/* Floating card — recordatorio */}
    <div className="absolute -bottom-4 -right-6 bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 z-10 border border-orange-100">
      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm">🔔</div>
      <div>
        <p className="text-xs font-semibold text-orange-700">Recordatorio enviado</p>
        <p className="text-xs text-muted-foreground">al Coto y la Katy</p>
      </div>
    </div>

    {/* Phone frame */}
    <div className="relative mx-auto w-64 bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden">
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-20 h-1.5 bg-gray-200 rounded-full" />
      </div>

      {/* App header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3">
        <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Cuenta</p>
        <p className="text-white font-bold text-sm">Asado del sábado 🍖</p>
        <p className="text-white/80 text-xs mt-0.5">Total: $48.500</p>
      </div>

      {/* Participants */}
      <div className="px-3 py-3 space-y-2">
        {[
          { name: "Camila",  amount: "$15.200", paid: true,  color: "bg-violet-100 text-violet-600" },
          { name: "Rodrigo", amount: "$18.800", paid: false, color: "bg-blue-100 text-blue-600" },
          { name: "Katerine", amount: "$14.500", paid: false, color: "bg-rose-100 text-rose-600" },
        ].map((p) => (
          <div key={p.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${p.color}`}>
                {p.name[0]}
              </div>
              <span className="text-xs font-medium text-gray-800">{p.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-700">{p.amount}</span>
              {p.paid
                ? <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">Pagado</span>
                : <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">Pendiente</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Items preview */}
      <div className="px-3 pb-3 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Ítems</p>
        {[
          { name: "Carne al palo",   amount: "$24.000" },
          { name: "Bebidas y hielo", amount: "$18.500" },
          { name: "Propina (10%)",   amount: "$4.250"  },
        ].map((item) => (
          <div key={item.name} className="flex justify-between px-1">
            <span className="text-[11px] text-gray-500">{item.name}</span>
            <span className="text-[11px] font-medium text-gray-700">{item.amount}</span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 flex justify-between items-center">
        <span className="text-white/80 text-[11px]">Cobrar al tiro</span>
        <div className="bg-white/20 rounded-full px-3 py-1">
          <span className="text-white text-[11px] font-semibold">🔔 Enviar</span>
        </div>
      </div>

      {/* Home bar */}
      <div className="flex justify-center py-2">
        <div className="w-24 h-1 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

export default HeroIllustration;

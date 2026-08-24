const NEWS = [
  {
    source: "Milenio",
    title: "Senado propone creación de expediente clínico único",
    description: "La iniciativa busca que todos los mexicanos cuenten con un expediente clínico electrónico único.",
    url: "https://www.milenio.com/salud/senado-proponen-creacion-expediente-clinico-unico",
    color: "bg-red-600",
    icon: "📰",
  },
  {
    source: "ExpoMed Hub",
    title: "El reto de la digitalización de expedientes electrónicos",
    description: "La digitalización del expediente clínico es uno de los mayores retos del sistema de salud.",
    url: "https://www.expomedhub.com/nota/innovacion/reto-digitalizacion-expedientes-electronicos",
    color: "bg-blue-600",
    icon: "💻",
  },
  {
    source: "DOF — Gobierno de México",
    title: "NOM-004-SSA3-2012 — Del expediente clínico",
    description: "Norma Oficial Mexicana que establece los criterios para la integración y uso del expediente clínico.",
    url: "https://dof.gob.mx/normasOficiales/8305/salud11_C/salud11_C.html",
    color: "bg-green-700",
    icon: "⚖️",
  },
];

// Duplicamos para efecto infinito
const ITEMS = [...NEWS, ...NEWS];

export function NewsCarousel() {
  return (
    <div className="overflow-hidden">
      <div className="flex animate-marquee gap-5">
        {ITEMS.map((item, i) => (
          <a
            key={`${item.url}-${i}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-80 shrink-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            {/* Miniatura */}
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${item.color} text-2xl`}>
              {item.icon}
            </div>
            {/* Contenido */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.source}</p>
                <h3 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2">{item.title}</h3>
              </div>
              <p className="mt-1 text-xs font-semibold text-blue-700">Leer nota →</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

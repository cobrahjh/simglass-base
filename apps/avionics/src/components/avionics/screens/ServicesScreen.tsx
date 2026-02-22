import { useState } from "react";
import { Fuel, Phone, Clock, MapPin } from "lucide-react";

interface FboData {
  name: string;
  airport: string;
  phone: string;
  hours: string;
  fuelTypes: { type: string; price: string }[];
  services: string[];
}

const fboDatabase: FboData[] = [
  {
    name: "Del Monte Aviation",
    airport: "KMRY",
    phone: "(831) 373-1945",
    hours: "06:00 – 22:00 LCL",
    fuelTypes: [
      { type: "100LL", price: "$6.89" },
      { type: "Jet-A", price: "$5.45" },
    ],
    services: [
      "Full Service",
      "Crew Cars",
      "GPU Available",
      "Hangar Space",
      "De-ice",
      "Oxygen Service",
      "WSC Lavatory",
      "Rental Cars",
    ],
  },
  {
    name: "Monterey Jet Center",
    airport: "KMRY",
    phone: "(831) 372-8092",
    hours: "07:00 – 21:00 LCL",
    fuelTypes: [
      { type: "100LL", price: "$7.15" },
      { type: "Jet-A", price: "$5.72" },
    ],
    services: [
      "Full Service",
      "Pilot Lounge",
      "Crew Cars",
      "Catering",
      "Hangar Space",
      "Rental Cars",
    ],
  },
  {
    name: "Salinas Jet Center",
    airport: "KSNS",
    phone: "(831) 422-2725",
    hours: "07:00 – 19:00 LCL",
    fuelTypes: [
      { type: "100LL", price: "$6.45" },
      { type: "Jet-A", price: "$5.10" },
    ],
    services: [
      "Self Service",
      "Pilot Lounge",
      "Tiedown",
      "Maintenance",
    ],
  },
  {
    name: "Star Aviation",
    airport: "KSNS",
    phone: "(831) 758-2500",
    hours: "08:00 – 17:00 LCL",
    fuelTypes: [
      { type: "100LL", price: "$6.35" },
    ],
    services: [
      "Self Service",
      "Flight Training",
      "Aircraft Rental",
      "Maintenance",
      "Tiedown",
    ],
  },
];

const airports = ["ALL", "KMRY", "KSNS"] as const;

export const ServicesScreen = () => {
  const [filterAirport, setFilterAirport] = useState<string>("ALL");
  const [expandedFbo, setExpandedFbo] = useState<string | null>(fboDatabase[0].name);

  const filtered = filterAirport === "ALL"
    ? fboDatabase
    : fboDatabase.filter((f) => f.airport === filterAirport);

  return (
    <div className="flex-1 flex flex-col bg-avionics-inset avionics-inset-shadow overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-avionics-panel border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">SERVICES / FBO</span>
        <div className="flex gap-1">
          {airports.map((a) => (
            <button
              key={a}
              onClick={() => setFilterAirport(a)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                filterAirport === a
                  ? "bg-avionics-cyan/20 text-avionics-cyan"
                  : "text-avionics-label hover:text-avionics-white"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* FBO list */}
      <div className="flex-1 overflow-auto px-2 py-1.5 space-y-1.5">
        {filtered.map((fbo) => {
          const isOpen = expandedFbo === fbo.name;
          return (
            <div
              key={fbo.name}
              className="bg-avionics-panel rounded border border-avionics-divider overflow-hidden"
            >
              {/* FBO header */}
              <button
                onClick={() => setExpandedFbo(isOpen ? null : fbo.name)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-avionics-button-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-avionics-cyan" />
                  <span className="font-mono text-[10px] text-avionics-white">{fbo.name}</span>
                </div>
                <span className="font-mono text-[9px] text-avionics-amber">{fbo.airport}</span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-avionics-divider px-2 py-1.5 space-y-2">
                  {/* Contact & hours */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-avionics-label" />
                      <span className="font-mono text-[9px] text-avionics-white">{fbo.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-avionics-label" />
                      <span className="font-mono text-[9px] text-avionics-white">{fbo.hours}</span>
                    </div>
                  </div>

                  {/* Fuel prices */}
                  <div className="border border-avionics-divider rounded overflow-hidden">
                    <div className="px-2 py-0.5 bg-avionics-panel-dark border-b border-avionics-divider flex items-center gap-1">
                      <Fuel className="w-2.5 h-2.5 text-avionics-green" />
                      <span className="text-[8px] text-avionics-green font-mono">FUEL PRICES</span>
                    </div>
                    {fbo.fuelTypes.map((fuel) => (
                      <div
                        key={fuel.type}
                        className="flex items-center justify-between px-2 py-1 border-b border-avionics-divider/30 last:border-0"
                      >
                        <span className="font-mono text-[10px] text-avionics-white">{fuel.type}</span>
                        <span className="font-mono text-[10px] text-avionics-green">{fuel.price}/gal</span>
                      </div>
                    ))}
                  </div>

                  {/* Services */}
                  <div className="border border-avionics-divider rounded overflow-hidden">
                    <div className="px-2 py-0.5 bg-avionics-panel-dark border-b border-avionics-divider">
                      <span className="text-[8px] text-avionics-cyan font-mono">SERVICES</span>
                    </div>
                    <div className="flex flex-wrap gap-1 px-2 py-1.5">
                      {fbo.services.map((svc) => (
                        <span
                          key={svc}
                          className="px-1.5 py-0.5 rounded bg-avionics-button text-[8px] font-mono text-avionics-white"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

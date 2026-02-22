import { useState } from "react";
import { useGtn } from "./GtnContext";

export const XpdrPanel = () => {
  const { xpdrCode, xpdrMode, setXpdrCode, setXpdrMode, toggleXpdrPanel } = useGtn();
  const [inputCode, setInputCode] = useState("");
  const [identActive, setIdentActive] = useState(false);

  const handleDigit = (d: string) => {
    if (inputCode.length >= 4) return;
    // Only 0-7 valid for transponder
    if (parseInt(d) > 7) return;
    setInputCode(s => s + d);
  };

  const handleBackspace = () => setInputCode(s => s.slice(0, -1));

  const handleVfr = () => {
    setXpdrCode("1200");
    setInputCode("");
  };

  const handleIdent = () => {
    if (inputCode.length === 4) {
      setXpdrCode(inputCode);
      setInputCode("");
    }
    setIdentActive(true);
    setTimeout(() => setIdentActive(false), 3000);
  };

  const displayCode = inputCode.length > 0 ? inputCode.padEnd(4, "_") : xpdrCode;

  return (
    <div className="absolute inset-0 z-20 bg-avionics-panel flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white font-medium">XPDR Control</span>
        <button onClick={toggleXpdrPanel} className="text-[10px] text-avionics-cyan hover:text-avionics-white transition-colors">✕</button>
      </div>

      {/* Active XPDR + Code display */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-avionics-divider">
        <div className="flex flex-col">
          <span className="text-[9px] text-avionics-label">Active</span>
          <span className="font-mono text-xs text-avionics-green">XPDR 1</span>
        </div>
        <span className="font-mono text-2xl text-avionics-green avionics-glow-green font-bold tracking-wider">
          {displayCode}
        </span>
        <button
          onClick={handleBackspace}
          className="px-3 py-1.5 bg-avionics-button avionics-bezel rounded text-[10px] text-avionics-amber font-mono hover:bg-avionics-button-hover transition-colors"
        >
          ⌫
        </button>
      </div>

      {/* Keypad - octal digits 0-7 */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {["0", "1", "2", "3", "4", "5", "6", "7"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="py-4 rounded-full bg-avionics-button avionics-bezel font-mono text-lg text-avionics-white hover:bg-avionics-button-hover active:bg-avionics-button-active transition-colors"
          >
            {d}
          </button>
        ))}
      </div>

      {/* VFR button */}
      <div className="px-3 pb-2">
        <button
          onClick={handleVfr}
          className="w-full py-2.5 rounded bg-avionics-button avionics-bezel font-mono text-xs text-avionics-green hover:bg-avionics-button-hover transition-colors"
        >
          VFR (1200)
        </button>
      </div>

      {/* IDENT */}
      <div className="px-3 pb-3">
        <button
          onClick={handleIdent}
          className={`w-full py-2.5 rounded avionics-bezel font-mono text-xs transition-colors ${
            identActive
              ? "bg-avionics-green/30 text-avionics-green"
              : "bg-avionics-button text-avionics-cyan hover:bg-avionics-button-hover"
          }`}
        >
          {identActive ? "IDENT ACTIVE" : inputCode.length === 4 ? "ENT + IDENT" : "IDENT"}
        </button>
      </div>

      {/* Mode selection */}
      <div className="border-t border-avionics-divider px-3 py-3">
        <span className="text-[9px] text-avionics-label block mb-2">Mode</span>
        <div className="grid grid-cols-3 gap-2">
          {(["STBY", "ON", "ALT"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setXpdrMode(mode)}
              className={`py-2.5 rounded avionics-bezel font-mono text-[11px] transition-colors ${
                xpdrMode === mode
                  ? "bg-avionics-green/20 text-avionics-green border border-avionics-green/30"
                  : "bg-avionics-button text-avionics-label hover:bg-avionics-button-hover"
              }`}
            >
              {mode === "STBY" ? "Standby" : mode === "ON" ? "On" : "Altitude"}
              <div className={`w-full h-0.5 mt-1 rounded ${xpdrMode === mode ? "bg-avionics-green" : "bg-avionics-divider"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

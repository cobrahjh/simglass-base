import { useState } from "react";
import { useGtn } from "./GtnContext";

export const ComPanel = () => {
  const { com, swapComFreqs, setComStandby, toggleComPanel } = useGtn();
  const [inputFreq, setInputFreq] = useState("");

  const handleDigit = (d: string) => {
    if (inputFreq.length >= 6) return;
    const next = inputFreq + d;
    setInputFreq(next);
  };

  const handleBackspace = () => {
    setInputFreq(s => s.slice(0, -1));
  };

  const handleEnter = () => {
    if (inputFreq.length >= 5) {
      // Format as xxx.xx
      const raw = inputFreq.replace(".", "");
      const formatted = raw.slice(0, 3) + "." + raw.slice(3, 5);
      setComStandby(formatted);
      setInputFreq("");
      toggleComPanel();
    }
  };

  const handleXfer = () => {
    swapComFreqs();
  };

  const displayFreq = inputFreq.length > 0
    ? (inputFreq.length <= 3 ? inputFreq : inputFreq.slice(0, 3) + "." + inputFreq.slice(3))
    : com.standbyFreq;

  return (
    <div className="absolute inset-0 z-20 bg-avionics-panel flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white">COM Standby</span>
        <button onClick={toggleComPanel} className="text-[10px] text-avionics-cyan hover:text-avionics-white transition-colors">
          ✕
        </button>
      </div>

      {/* Frequency display */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-avionics-divider">
        <div className="flex flex-col">
          <span className="text-[9px] text-avionics-label">ACTIVE</span>
          <span className="font-mono text-lg text-avionics-green avionics-glow-green font-bold">{com.activeFreq}</span>
        </div>
        <button
          onClick={handleXfer}
          className="px-3 py-1.5 bg-avionics-button avionics-bezel rounded text-[10px] text-avionics-cyan font-mono hover:bg-avionics-button-hover active:bg-avionics-button-active transition-colors"
        >
          ⇆ XFER
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-avionics-label">STBY</span>
          <span className="font-mono text-lg text-avionics-cyan font-bold">{displayFreq}</span>
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-1 grid grid-cols-3 gap-px p-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "BKSP", "0", "ENT"].map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === "BKSP") handleBackspace();
              else if (key === "ENT") handleEnter();
              else handleDigit(key);
            }}
            className={`flex items-center justify-center py-3 rounded font-mono text-sm transition-colors avionics-bezel ${
              key === "ENT"
                ? "bg-avionics-green/20 text-avionics-green hover:bg-avionics-green/30"
                : key === "BKSP"
                ? "bg-avionics-button text-avionics-amber hover:bg-avionics-button-hover"
                : "bg-avionics-button text-avionics-white hover:bg-avionics-button-hover active:bg-avionics-button-active"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Quick frequencies */}
      <div className="flex items-stretch border-t border-avionics-divider">
        {["121.50", "122.80", "123.45"].map((freq) => (
          <button
            key={freq}
            onClick={() => {
              setComStandby(freq);
              toggleComPanel();
            }}
            className="flex-1 py-2 text-center font-mono text-[10px] text-avionics-cyan hover:bg-avionics-button-hover border-r border-avionics-divider last:border-r-0 transition-colors"
          >
            {freq}
          </button>
        ))}
      </div>

      {/* Monitor */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-avionics-divider">
        <button className="text-[10px] text-avionics-label hover:text-avionics-white transition-colors font-mono">Monitor</button>
        <span className="text-[10px] text-avionics-label font-mono">Find</span>
      </div>
    </div>
  );
};

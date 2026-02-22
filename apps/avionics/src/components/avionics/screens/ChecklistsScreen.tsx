import { useState, useCallback } from "react";
import { CheckSquare, Square, ChevronRight } from "lucide-react";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface Checklist {
  name: string;
  items: ChecklistItem[];
}

interface ChecklistGroup {
  name: string;
  checklists: Checklist[];
}

const defaultGroups: ChecklistGroup[] = [
  {
    name: "Normal Procedures",
    checklists: [
      { name: "Preflight Inspection", items: [
        "Fuel quantity—CHECK", "Oil level—CHECK (6 qts min)", "Control surfaces—FREE & CORRECT",
        "Fuel selector—BOTH", "Pitot cover—REMOVED", "Tie-downs—REMOVED",
        "Cowl flaps—OPEN", "Antennas—CHECK", "Static port—CLEAR", "Overall condition—CHECK"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Before Engine Start", items: [
        "Seats & belts—ADJUST & LOCK", "Brakes—TEST & SET", "Fuel selector—BOTH",
        "Avionics—OFF", "Circuit breakers—CHECK IN", "Mixture—RICH", "Carb heat—COLD"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Engine Start", items: [
        "Mixture—RICH", "Throttle—OPEN ¼ INCH", "Master switch—ON",
        "Beacon—ON", "Primer—AS REQUIRED", "Starter—ENGAGE",
        "Oil pressure—CHECK", "Throttle—1000 RPM", "Alternator—CHECK"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Before Takeoff", items: [
        "Parking brake—SET", "Flight controls—FREE & CORRECT", "Flight instruments—CHECK & SET",
        "Fuel selector—BOTH", "Mixture—RICH (below 3000')", "Throttle—1800 RPM",
        "Magnetos—CHECK (max 175 RPM drop)", "Carb heat—CHECK", "Engine instruments—GREEN",
        "Suction—CHECK", "Throttle—1000 RPM", "Radios & avionics—SET", "Nav lights—AS REQUIRED",
        "Flaps—SET", "Trim—SET FOR TAKEOFF"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Normal Takeoff", items: [
        "Flaps—0° to 10°", "Throttle—FULL OPEN", "Mixture—RICH",
        "Airspeed—60 KIAS rotate", "Climb speed—74 KIAS", "Flaps—RETRACT", "Engine gauges—GREEN"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Cruise", items: [
        "Altitude—MAINTAIN", "Throttle—SET", "Mixture—LEAN as required",
        "Engine gauges—MONITOR", "Fuel selector—BOTH"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Descent", items: [
        "ATIS/AWOS—OBTAIN", "Altimeter—SET", "Mixture—ENRICHEN as required",
        "Carb heat—AS REQUIRED", "Fuel selector—BOTH", "Landing light—ON"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Before Landing", items: [
        "Seats & belts—SECURE", "Mixture—RICH", "Carb heat—ON",
        "Flaps—AS REQUIRED", "Airspeed—65 KIAS final", "Landing light—ON"
      ].map(t => ({ text: t, checked: false })) },
      { name: "After Landing", items: [
        "Flaps—UP", "Carb heat—COLD", "Transponder—STBY", "Landing light—OFF"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Engine Shutdown", items: [
        "Parking brake—SET", "Throttle—IDLE", "Avionics—OFF",
        "Mixture—IDLE CUT-OFF", "Magnetos—OFF", "Master switch—OFF",
        "Fuel selector—LEFT or RIGHT", "Control lock—INSTALL"
      ].map(t => ({ text: t, checked: false })) },
    ],
  },
  {
    name: "Emergency Procedures",
    checklists: [
      { name: "Engine Fire During Start", items: [
        "Cranking—CONTINUE", "If engine starts: Throttle—1800 RPM",
        "Inspect for damage", "If fire continues: Mixture—IDLE CUT-OFF",
        "Throttle—FULL OPEN", "Master switch—OFF", "Fuel selector—OFF",
        "Fire extinguisher—USE", "Evacuate—AS REQUIRED"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Engine Fire In Flight", items: [
        "Mixture—IDLE CUT-OFF", "Fuel selector—OFF", "Master switch—OFF",
        "Cabin heat & air—OFF", "Airspeed—100 KIAS (sideslip if needed)",
        "Forced landing—EXECUTE"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Engine Failure", items: [
        "Airspeed—65 KIAS (best glide)", "Mixture—RICH", "Carb heat—ON",
        "Fuel selector—BOTH", "Primer—IN & LOCKED", "Magnetos—BOTH (then L, then R)",
        "If no restart: Transponder—7700", "Mayday—121.5 MHz",
        "Forced landing—EXECUTE"
      ].map(t => ({ text: t, checked: false })) },
      { name: "Electrical Fire", items: [
        "Master switch—OFF", "All switches—OFF", "Vents—CLOSED",
        "Fire extinguisher—USE", "If fire out: Master—ON, check circuits",
        "Ventilate cabin", "Land ASAP"
      ].map(t => ({ text: t, checked: false })) },
    ],
  },
];

export const ChecklistsScreen = () => {
  const [groups, setGroups] = useState<ChecklistGroup[]>(defaultGroups);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [selectedChecklistIdx, setSelectedChecklistIdx] = useState(0);

  const group = groups[selectedGroupIdx];
  const checklist = group?.checklists[selectedChecklistIdx];

  const checkedCount = checklist?.items.filter(i => i.checked).length || 0;
  const totalCount = checklist?.items.length || 0;
  const isFinished = checkedCount === totalCount && totalCount > 0;

  const toggleItem = useCallback((itemIdx: number) => {
    setGroups(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[selectedGroupIdx].checklists[selectedChecklistIdx].items[itemIdx].checked =
        !next[selectedGroupIdx].checklists[selectedChecklistIdx].items[itemIdx].checked;
      return next;
    });
  }, [selectedGroupIdx, selectedChecklistIdx]);

  const clearCurrent = useCallback(() => {
    setGroups(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[selectedGroupIdx].checklists[selectedChecklistIdx].items.forEach((i: ChecklistItem) => i.checked = false);
      return next;
    });
  }, [selectedGroupIdx, selectedChecklistIdx]);

  const goNext = useCallback(() => {
    const nextIdx = selectedChecklistIdx + 1;
    if (nextIdx < group.checklists.length) {
      setSelectedChecklistIdx(nextIdx);
    }
  }, [selectedChecklistIdx, group]);

  return (
    <div className="flex-1 flex flex-col bg-avionics-panel-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-avionics-divider bg-avionics-panel">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-avionics-cyan" />
          <span className="font-mono text-[10px] text-avionics-cyan tracking-wider">CHECKLISTS</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearCurrent} className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-avionics-divider text-avionics-label hover:text-avionics-white">CLEAR</button>
          <button onClick={goNext} className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-avionics-divider text-avionics-label hover:text-avionics-white">NEXT</button>
        </div>
      </div>

      {/* Group selector */}
      <div className="flex items-center bg-avionics-panel border-b border-avionics-divider overflow-x-auto">
        {groups.map((g, i) => (
          <button
            key={i}
            onClick={() => { setSelectedGroupIdx(i); setSelectedChecklistIdx(0); }}
            className={`px-3 py-1.5 text-[9px] font-mono whitespace-nowrap border-b-2 transition-colors ${
              i === selectedGroupIdx ? "text-avionics-cyan border-avionics-cyan" : "text-avionics-label border-transparent hover:text-avionics-white"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Checklist selector */}
      <div className="flex items-center gap-1 px-3 py-1 bg-avionics-panel/50 border-b border-avionics-divider overflow-x-auto">
        {group?.checklists.map((cl, i) => {
          const done = cl.items.every(it => it.checked);
          return (
            <button
              key={i}
              onClick={() => setSelectedChecklistIdx(i)}
              className={`px-2 py-0.5 text-[8px] font-mono whitespace-nowrap rounded transition-colors ${
                i === selectedChecklistIdx
                  ? "bg-avionics-cyan/20 text-avionics-cyan"
                  : done
                    ? "text-avionics-green"
                    : "text-avionics-label hover:text-avionics-white"
              }`}
            >
              {done ? "✓ " : ""}{cl.name}
            </button>
          );
        })}
      </div>

      {/* Status bar */}
      <div className={`px-3 py-1 border-b border-avionics-divider ${isFinished ? "bg-avionics-green/10" : "bg-avionics-panel/50"}`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[9px] font-bold ${isFinished ? "text-avionics-green" : "text-avionics-amber"}`}>
            {isFinished ? "✓ LIST IS FINISHED" : "LIST NOT FINISHED"}
          </span>
          <span className="font-mono text-[9px] text-avionics-label">{checkedCount}/{totalCount}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-avionics-inset mt-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${isFinished ? "bg-avionics-green" : "bg-avionics-cyan"}`}
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto">
        {checklist?.items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggleItem(i)}
            className={`flex items-center gap-2 px-3 py-2 w-full text-left border-b border-avionics-divider/30 transition-colors ${
              item.checked ? "bg-avionics-green/5" : "hover:bg-avionics-button-hover"
            }`}
          >
            {item.checked ? (
              <CheckSquare className="w-3.5 h-3.5 text-avionics-green flex-shrink-0" />
            ) : (
              <Square className="w-3.5 h-3.5 text-avionics-label flex-shrink-0" />
            )}
            <span className={`font-mono text-[9px] leading-relaxed ${
              item.checked ? "text-avionics-green line-through opacity-70" : "text-avionics-white"
            }`}>
              {item.text}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-3 py-1 border-t border-avionics-divider">
        <span className="font-mono text-[10px] text-avionics-cyan">CHKLIST</span>
      </div>
    </div>
  );
};

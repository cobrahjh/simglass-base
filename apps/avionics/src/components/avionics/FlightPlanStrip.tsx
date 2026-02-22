import { useFlightData } from "./FlightDataContext";
import { useGtn } from "./GtnContext";

export const FlightPlanStrip = () => {
  const { navigation } = useFlightData();
  const { flightPlan, activeWaypointIndex } = useGtn();

  // Build a condensed waypoint strip centered on active leg
  const activeLeg = navigation.activeLegIndex > 0 ? navigation.activeLegIndex : activeWaypointIndex;
  const stripWaypoints = flightPlan.slice(
    Math.max(0, activeLeg - 1),
    Math.min(flightPlan.length, activeLeg + 3)
  );

  // Calculate progress through flight plan
  const progress = navigation.totalDistance > 0
    ? ((navigation.totalDistance - navigation.distanceRemaining) / navigation.totalDistance)
    : 0;
  const filledDots = Math.round(progress * 8);

  return (
    <div className="bg-avionics-panel border-y border-avionics-divider">
      {/* Waypoint strip */}
      <div className="flex items-center border-b border-avionics-divider">
        <button className="px-3 py-1 text-[10px] text-avionics-white hover:bg-avionics-button-hover transition-colors border-r border-avionics-divider">
          Play Back
        </button>
        <div className="flex items-center gap-3 px-3 py-1 flex-1">
          {stripWaypoints.map((wp, i) => {
            const globalIdx = Math.max(0, activeLeg - 1) + i;
            const isActive = globalIdx === activeLeg;
            const isCurrent = wp.name === navigation.currentWaypoint;
            const isNext = wp.name === navigation.nextWaypoint;
            return (
              <span
                key={wp.id}
                className={`font-mono text-xs ${
                  isActive || isNext
                    ? "text-avionics-magenta"
                    : isCurrent
                    ? "text-avionics-green"
                    : "text-avionics-white"
                }`}
              >
                <span className="mr-0.5">●</span>
                {wp.name}
              </span>
            );
          })}
          {activeLeg + 3 < flightPlan.length && (
            <span className="font-mono text-xs text-avionics-label">→ {flightPlan[flightPlan.length - 1].name}</span>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 px-3 py-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < filledDots ? "bg-avionics-green" : "bg-avionics-divider"
            }`}
          />
        ))}
        <span className="ml-auto font-mono text-[9px] text-avionics-cyan">
          {navigation.eta}
        </span>
      </div>
    </div>
  );
};

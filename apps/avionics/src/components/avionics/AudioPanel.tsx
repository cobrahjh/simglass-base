import { useGtn } from "./GtnContext";

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ToggleButton = ({ label, active, onClick }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded text-[10px] font-mono font-medium transition-colors avionics-bezel ${
      active
        ? "bg-avionics-green/20 text-avionics-green border border-avionics-green/30"
        : "bg-avionics-button text-avionics-label hover:bg-avionics-button-hover"
    }`}
  >
    {label}
    <div className={`w-full h-0.5 mt-1 rounded ${active ? "bg-avionics-green" : "bg-avionics-divider"}`} />
  </button>
);

interface RadioToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const RadioToggle = ({ label, active, onClick }: RadioToggleProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 rounded font-mono text-xs transition-colors avionics-bezel ${
      active
        ? "bg-avionics-button-active text-avionics-green"
        : "bg-avionics-button text-avionics-label hover:bg-avionics-button-hover"
    }`}
  >
    {label}
  </button>
);

export const AudioPanel = () => {
  const { audio, toggleAudioSetting, toggleAudioPanel } = useGtn();

  return (
    <div className="absolute inset-0 z-20 bg-avionics-panel flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-avionics-divider">
        <span className="font-mono text-xs text-avionics-white font-medium">Audio Panel</span>
        <button onClick={toggleAudioPanel} className="text-[10px] text-avionics-cyan hover:text-avionics-white transition-colors">✕</button>
      </div>

      <div className="flex-1 flex flex-col gap-3 p-3">
        {/* Left column controls */}
        <div className="grid grid-cols-2 gap-2">
          <ToggleButton label="Split Mode" active={audio.splitMode} onClick={() => toggleAudioSetting("splitMode")} />
          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-avionics-label text-center">Crew Intercom</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ToggleButton label="Cabin Speaker" active={audio.cabinSpeaker} onClick={() => toggleAudioSetting("cabinSpeaker")} />
          <ToggleButton label="Speaker Volume" active={true} onClick={() => {}} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ToggleButton label="MRKR Audio" active={audio.markerAudio} onClick={() => toggleAudioSetting("markerAudio")} />
          <ToggleButton label="High Sense" active={audio.highSense} onClick={() => toggleAudioSetting("highSense")} />
          <ToggleButton label="MRKR Volume" active={true} onClick={() => {}} />
        </div>

        <ToggleButton label="3D Audio" active={audio.audio3d} onClick={() => toggleAudioSetting("audio3d")} />

        {/* Radio selection */}
        <div className="border-t border-avionics-divider pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] text-avionics-label block mb-2 text-center">Pilot Radios</span>
              <div className="flex flex-col gap-1.5">
                {(["COM 1", "COM 2", "COM 3", "NAV 1", "NAV 2"] as const).map((radio, i) => {
                  const keys = ["com1", "com2", "com3", "nav1", "nav2"] as const;
                  return (
                    <RadioToggle
                      key={radio}
                      label={radio}
                      active={audio.pilotRadios[keys[i]]}
                      onClick={() => {}}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <span className="text-[9px] text-avionics-label block mb-2 text-center">Co-Pilot Radios</span>
              <div className="flex flex-col gap-1.5">
                {(["COM 1", "COM 2", "COM 3", "NAV 1", "NAV 2"] as const).map((radio, i) => {
                  const keys = ["com1", "com2", "com3", "nav1", "nav2"] as const;
                  return (
                    <RadioToggle
                      key={radio}
                      label={radio}
                      active={audio.coPilotRadios[keys[i]]}
                      onClick={() => {}}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

export interface AdvancedSettings {
    timeLimitMs: number;
    maxDepth: number;
    useHeuristics: boolean;
}

interface Props {
    settings: AdvancedSettings;
    onUpdate: (newSettings: AdvancedSettings) => void;
}

export const AdvancedSettingsPanel: React.FC<Props> = ({ settings, onUpdate }) => {
    return (
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', color: '#ccc' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Advanced AI Settings</h4>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Time Limit (ms):
                </label>
                <input
                    type="number"
                    value={settings.timeLimitMs}
                    onChange={(e) => onUpdate({ ...settings, timeLimitMs: parseInt(e.target.value) || 100 })}
                    style={{ padding: '5px', borderRadius: '4px', width: '100px' }}
                />
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                    Max Search Depth:
                </label>
                <input
                    type="number"
                    value={settings.maxDepth}
                    onChange={(e) => onUpdate({ ...settings, maxDepth: parseInt(e.target.value) || 1 })}
                    style={{ padding: '5px', borderRadius: '4px', width: '100px' }}
                />
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={settings.useHeuristics}
                        onChange={(e) => onUpdate({ ...settings, useHeuristics: e.target.checked })}
                        style={{ marginRight: '8px' }}
                    />
                    Use Advanced Heuristics (Minimize Hand Value)
                </label>
            </div>

            <p style={{ fontSize: '0.8em', color: '#888' }}>
                Note: "Time Limit" stops the `MinMax` search early. "Max Depth" controls how many turns ahead to look (1 = My turn, 2 = My + Opponent).
            </p>
        </div>
    );
};

// Save/Load utilities for persisting layouts to localStorage

import type { GameGrid, TrackPiece, TerrainType } from '../types';

const STORAGE_KEY = 'kai-train-track-builder-saves';
const CURRENT_VERSION = '1.0';

// Saved layout format
export interface SavedLayout {
  id: string;
  name: string;
  version: string;
  timestamp: number;
  grid: {
    width: number;
    height: number;
    cells: Array<Array<{ elevation: number; terrainType: string }>>;
  };
  tracks: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    rotation: number;
    elevation: number;
    switchState?: string;
    signalState?: string;
  }>;
}

// Storage format
interface StorageData {
  version: string;
  layouts: SavedLayout[];
}

/**
 * Generate a unique ID for saves
 */
function generateSaveId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Serialize game state to saveable format
 */
export function serializeLayout(
  name: string,
  grid: GameGrid,
  tracks: Map<string, TrackPiece>
): SavedLayout {
  return {
    id: generateSaveId(),
    name,
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    grid: {
      width: grid.width,
      height: grid.height,
      cells: grid.cells.map((row) =>
        row.map((cell) => ({
          elevation: cell.elevation,
          terrainType: cell.terrainType,
        }))
      ),
    },
    tracks: Array.from(tracks.values()).map((track) => ({
      id: track.id,
      type: track.type,
      position: { x: track.position.x, y: track.position.y },
      rotation: track.rotation,
      elevation: track.elevation,
      switchState: track.switchState,
      signalState: track.signalState,
    })),
  };
}

/**
 * Deserialize saved layout back to game state
 */
export function deserializeLayout(saved: SavedLayout): {
  grid: GameGrid;
  tracks: TrackPiece[];
} {
  const grid: GameGrid = {
    width: saved.grid.width,
    height: saved.grid.height,
    cells: saved.grid.cells.map((row) =>
      row.map((cell) => ({
        elevation: cell.elevation,
        terrainType: cell.terrainType as TerrainType,
      }))
    ),
  };

  const tracks: TrackPiece[] = saved.tracks.map((t) => ({
    id: t.id,
    type: t.type as TrackPiece['type'],
    position: { x: t.position.x, y: t.position.y },
    rotation: t.rotation as 0 | 90 | 180 | 270,
    elevation: t.elevation,
    connections: [],
    switchState: t.switchState as 'left' | 'right' | undefined,
    signalState: t.signalState as 'green' | 'red' | undefined,
  }));

  return { grid, tracks };
}

/**
 * Get all saved layouts from localStorage
 */
export function getSavedLayouts(): SavedLayout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed: StorageData = JSON.parse(data);
    return parsed.layouts || [];
  } catch (e) {
    console.error('Failed to load saved layouts:', e);
    return [];
  }
}

/**
 * Save a layout to localStorage
 */
export function saveLayout(layout: SavedLayout): boolean {
  try {
    const existing = getSavedLayouts();

    // Check if updating existing save
    const existingIndex = existing.findIndex((l) => l.id === layout.id);
    if (existingIndex >= 0) {
      existing[existingIndex] = layout;
    } else {
      existing.push(layout);
    }

    const data: StorageData = {
      version: CURRENT_VERSION,
      layouts: existing,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save layout:', e);
    return false;
  }
}

/**
 * Delete a saved layout
 */
export function deleteLayout(id: string): boolean {
  try {
    const existing = getSavedLayouts();
    const filtered = existing.filter((l) => l.id !== id);

    const data: StorageData = {
      version: CURRENT_VERSION,
      layouts: filtered,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to delete layout:', e);
    return false;
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

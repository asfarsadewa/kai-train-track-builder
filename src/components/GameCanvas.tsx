// Main game canvas component

import { useRef, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { setupCanvas, createRenderLoop, type RenderContext } from '../rendering';
import { findGridCellAtScreenPoint } from '../rendering/isometric';
import { drawTrain, drawSmoke, drawCarriage } from '../rendering/trainRenderer';
import { calculateGridOrigin, calculateCanvasSize } from '../constants';
import {
  findTrackAtPosition,
  calculateBestRotation,
  canPlaceTrack,
  findConnectableNeighbors,
} from '../logic/connections';
import {
  findBestPath,
  type TrainPath,
} from '../logic/pathfinding';
import {
  calculateTrainPosition,
  advanceTrainPosition,
  type TrainPosition,
} from '../logic/trainMovement';
import { generateId } from '../utils/uuid';
import { SoundManager } from '../audio';
import type { TrackPiece } from '../types';

/**
 * A point in the train's path history, used for snake-game style carriage following
 */
interface PathHistoryPoint {
  segment: number;
  progress: number;
  direction: 1 | -1;
  distance: number; // Cumulative distance traveled when at this point
}

/**
 * Snake-game style carriage positioning:
 * - Track the history of positions the engine has visited
 * - Each carriage looks back in the history by its offset distance
 * - This correctly handles direction changes, curves, and reversals
 */
function findPositionInHistory(
  history: PathHistoryPoint[],
  currentDistance: number,
  offsetDistance: number
): PathHistoryPoint | null {
  const targetDistance = currentDistance - offsetDistance;

  if (targetDistance < 0 || history.length === 0) {
    return null; // Carriage would be before the start of recorded history
  }

  // Binary search for the closest history point at or before targetDistance
  let left = 0;
  let right = history.length - 1;

  while (left < right) {
    const mid = Math.ceil((left + right) / 2);
    if (history[mid].distance <= targetDistance) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }

  // Interpolate between history[left] and history[left+1] if possible
  const point = history[left];

  if (left + 1 < history.length) {
    const nextPoint = history[left + 1];
    const segmentLength = nextPoint.distance - point.distance;
    if (segmentLength > 0) {
      const t = (targetDistance - point.distance) / segmentLength;
      // Interpolate progress within the same segment
      if (point.segment === nextPoint.segment && point.direction === nextPoint.direction) {
        return {
          segment: point.segment,
          progress: point.progress + t * (nextPoint.progress - point.progress),
          direction: point.direction,
          distance: targetDistance,
        };
      }
    }
  }

  return point;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderCtxRef = useRef<RenderContext | null>(null);
  const renderLoopRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const { state, dispatch, undo, redo } = useGame();

  // Keep state ref updated for render loop to access
  const stateRef = useRef(state);
  stateRef.current = state;

  // Train movement state (stored in refs for animation loop access)
  const trainPathRef = useRef<TrainPath | null>(null);
  const trainSegmentRef = useRef(0);
  const trainProgressRef = useRef(0);
  const trainDirectionRef = useRef<1 | -1>(1);
  const trainPositionRef = useRef<TrainPosition | null>(null);
  const trainTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const carriagePositionsRef = useRef<TrainPosition[]>([]);

  // Snake-game style path history for carriage following
  const pathHistoryRef = useRef<PathHistoryPoint[]>([]);
  const totalDistanceRef = useRef(0);

  // Set up canvas and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up canvas with correct dimensions
    const renderCtx = setupCanvas(canvas, state.grid.width, state.grid.height);
    if (!renderCtx) return;

    renderCtxRef.current = renderCtx;

    // Create render loop - uses stateRef to always get latest state
    const renderLoop = createRenderLoop(
      renderCtx,
      () => stateRef.current,
      (deltaTime) => {
        const currentState = stateRef.current;
        const { originX, originY } = renderCtx;

        // Check if play state changed
        if (currentState.isPlaying && !wasPlayingRef.current) {
          // Just started playing - build path
          const path = findBestPath(currentState.tracks);
          trainPathRef.current = path;
          trainDirectionRef.current = 1;
          trainTimeRef.current = 0;

          // Reset path history for snake-game carriage following
          pathHistoryRef.current = [];
          totalDistanceRef.current = 0;

          // Find station segment to spawn train there
          let startSegment = 0;
          if (path) {
            const stationIndex = path.segments.findIndex(seg => seg.track.type === 'station');
            if (stationIndex !== -1) {
              startSegment = stationIndex;
            }
          }
          trainSegmentRef.current = startSegment;
          trainProgressRef.current = 0;

          if (path && path.segments.length > 0) {
            trainPositionRef.current = calculateTrainPosition(
              path,
              startSegment,
              0,
              originX,
              originY,
              1
            );

            // Initialize path history with starting position
            pathHistoryRef.current.push({
              segment: startSegment,
              progress: 0,
              direction: 1,
              distance: 0,
            });
          }
        } else if (!currentState.isPlaying && wasPlayingRef.current) {
          // Just stopped - reset train
          trainPathRef.current = null;
          trainPositionRef.current = null;
          trainSegmentRef.current = 0;
          trainProgressRef.current = 0;
          trainDirectionRef.current = 1;
          carriagePositionsRef.current = [];
          pathHistoryRef.current = [];
          totalDistanceRef.current = 0;
        }
        wasPlayingRef.current = currentState.isPlaying;

        // Update train position if playing
        if (currentState.isPlaying && trainPathRef.current) {
          trainTimeRef.current += deltaTime;

          const result = advanceTrainPosition(
            trainPathRef.current,
            trainSegmentRef.current,
            trainProgressRef.current,
            1.5, // Speed: 1.5 segments per second
            deltaTime,
            trainDirectionRef.current
          );

          trainSegmentRef.current = result.segmentIndex;
          trainProgressRef.current = result.progress;
          trainDirectionRef.current = result.direction;

          // Calculate distance traveled this frame
          // This is approximate but good enough for smooth carriage following
          const speed = 1.5; // segments per second
          const distanceTraveled = speed * deltaTime;
          totalDistanceRef.current += distanceTraveled;

          // Add current position to path history
          // Only add if position has changed meaningfully
          const history = pathHistoryRef.current;
          const lastPoint = history[history.length - 1];
          if (
            !lastPoint ||
            lastPoint.segment !== result.segmentIndex ||
            lastPoint.direction !== result.direction ||
            Math.abs(lastPoint.progress - result.progress) > 0.01
          ) {
            history.push({
              segment: result.segmentIndex,
              progress: result.progress,
              direction: result.direction,
              distance: totalDistanceRef.current,
            });

            // Limit history size to prevent memory issues
            // Keep enough history for max carriages + buffer
            const maxHistoryLength = 1000;
            if (history.length > maxHistoryLength) {
              // Remove old entries but adjust distances
              const removeCount = history.length - maxHistoryLength;
              history.splice(0, removeCount);
            }
          }

          trainPositionRef.current = calculateTrainPosition(
            trainPathRef.current,
            result.segmentIndex,
            result.progress,
            originX,
            originY,
            result.direction
          );

          // Calculate carriage positions using snake-game style history lookup
          const CARRIAGE_SPACING = 0.5; // Segments worth of distance between carriages
          const path = trainPathRef.current;
          const newCarriagePositions: TrainPosition[] = [];

          for (let i = 0; i < currentState.carriageConfig.length; i++) {
            const offsetDistance = (i + 1) * CARRIAGE_SPACING;
            const historyPoint = findPositionInHistory(
              pathHistoryRef.current,
              totalDistanceRef.current,
              offsetDistance
            );

            if (historyPoint) {
              const carriagePos = calculateTrainPosition(
                path,
                historyPoint.segment,
                historyPoint.progress,
                originX,
                originY,
                historyPoint.direction
              );
              newCarriagePositions.push(carriagePos);
            }
          }
          carriagePositionsRef.current = newCarriagePositions;
        }
      },
      // Custom draw callback for train and carriages
      (ctx: CanvasRenderingContext2D) => {
        if (trainPositionRef.current && stateRef.current.isPlaying) {
          // Draw smoke first (behind everything)
          drawSmoke(ctx, trainPositionRef.current, trainTimeRef.current);

          // Draw carriages from back to front (so front carriages overlap back ones)
          const carriageConfig = stateRef.current.carriageConfig;
          for (let i = carriagePositionsRef.current.length - 1; i >= 0; i--) {
            const pos = carriagePositionsRef.current[i];
            const config = carriageConfig[i];
            if (pos && config) {
              drawCarriage(ctx, pos, config.type);
            }
          }

          // Draw engine last (in front)
          drawTrain(ctx, trainPositionRef.current);
        }
      }
    );

    renderLoopRef.current = renderLoop;
    renderLoop.start();

    return () => {
      renderLoop.stop();
    };
  }, [state.grid.width, state.grid.height]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        // Rotate track under cursor
        if (stateRef.current.hoveredCell) {
          const { x, y } = stateRef.current.hoveredCell;
          const track = findTrackAtPosition(stateRef.current.tracks, { x, y });
          if (track) {
            const newRotation = ((track.rotation + 90) % 360) as 0 | 90 | 180 | 270;
            const updatedTrack: TrackPiece = {
              ...track,
              rotation: newRotation,
            };
            dispatch({ type: 'REMOVE_TRACK', trackId: track.id });
            dispatch({ type: 'PLACE_TRACK', track: updatedTrack });
            SoundManager.play('click');
          }
        }
      }
      // Space bar to toggle play/pause (only if station exists)
      if (e.key === ' ') {
        e.preventDefault();
        const hasStation = Array.from(stateRef.current.tracks.values()).some(
          (track) => track.type === 'station'
        );
        if (hasStation || stateRef.current.isPlaying) {
          dispatch({ type: 'TOGGLE_PLAY' });
        }
      }
      // Arrow keys for camera pan
      const panSpeed = 20;
      if (e.key === 'ArrowLeft') {
        dispatch({ type: 'SET_CAMERA', camera: { offsetX: stateRef.current.camera.offsetX + panSpeed } });
      }
      if (e.key === 'ArrowRight') {
        dispatch({ type: 'SET_CAMERA', camera: { offsetX: stateRef.current.camera.offsetX - panSpeed } });
      }
      if (e.key === 'ArrowUp') {
        dispatch({ type: 'SET_CAMERA', camera: { offsetY: stateRef.current.camera.offsetY + panSpeed } });
      }
      if (e.key === 'ArrowDown') {
        dispatch({ type: 'SET_CAMERA', camera: { offsetY: stateRef.current.camera.offsetY - panSpeed } });
      }
      // + / - for zoom
      if (e.key === '=' || e.key === '+') {
        const newZoom = Math.min(2, stateRef.current.camera.zoom + 0.1);
        dispatch({ type: 'SET_CAMERA', camera: { zoom: newZoom } });
      }
      if (e.key === '-') {
        const newZoom = Math.max(0.5, stateRef.current.camera.zoom - 0.1);
        dispatch({ type: 'SET_CAMERA', camera: { zoom: newZoom } });
      }
      // 0 to reset camera
      if (e.key === '0') {
        dispatch({ type: 'SET_CAMERA', camera: { offsetX: 0, offsetY: 0, zoom: 1 } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, undo, redo]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(2, state.camera.zoom + zoomDelta));
      dispatch({ type: 'SET_CAMERA', camera: { zoom: newZoom } });
    },
    [dispatch, state.camera.zoom]
  );

  // Handle middle mouse drag for panning
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Middle mouse button or right click for panning
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Handle mouse move for hover detection and panning
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Handle panning
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastMousePosRef.current.x;
        const deltaY = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        dispatch({
          type: 'SET_CAMERA',
          camera: {
            offsetX: state.camera.offsetX + deltaX,
            offsetY: state.camera.offsetY + deltaY,
          },
        });
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Get mouse position in canvas coordinates
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      // Adjust for camera
      const adjustedX = (mouseX - state.camera.offsetX) / state.camera.zoom;
      const adjustedY = (mouseY - state.camera.offsetY) / state.camera.zoom;

      // Calculate grid origin
      const { width } = calculateCanvasSize(state.grid.width, state.grid.height);
      const { originX, originY } = calculateGridOrigin(
        width,
        state.grid.width,
        state.grid.height
      );

      // Find the grid cell under the mouse (pass grid for elevation-aware detection)
      const cell = findGridCellAtScreenPoint(
        adjustedX,
        adjustedY,
        state.grid.width,
        state.grid.height,
        originX,
        originY,
        state.grid
      );

      dispatch({ type: 'SET_HOVERED_CELL', cell });
    },
    [dispatch, state.camera, state.grid]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    dispatch({ type: 'SET_HOVERED_CELL', cell: null });
  }, [dispatch]);

  // Handle click
  const handleClick = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!state.hoveredCell) return;

      const { x, y } = state.hoveredCell;

      // Handle different tool actions
      switch (state.selectedTool) {
        case 'terrain_raise': {
          const currentElevation = state.grid.cells[y][x].elevation;
          dispatch({
            type: 'SET_TERRAIN_ELEVATION',
            x,
            y,
            elevation: currentElevation + 1,
          });
          break;
        }
        case 'terrain_lower': {
          const currentElevation = state.grid.cells[y][x].elevation;
          dispatch({
            type: 'SET_TERRAIN_ELEVATION',
            x,
            y,
            elevation: Math.max(0, currentElevation - 1),
          });
          break;
        }
        case 'terrain_paint': {
          if (!state.selectedTerrainType) break;
          dispatch({
            type: 'SET_TERRAIN_TYPE',
            x,
            y,
            terrainType: state.selectedTerrainType,
          });
          SoundManager.play('place');
          break;
        }
        case 'place_track': {
          if (!state.selectedTrackType) break;

          // Check if we can place here
          const validation = canPlaceTrack(
            { x, y },
            state.tracks,
            state.grid.width,
            state.grid.height
          );

          if (!validation.canPlace) {
            console.log('Cannot place:', validation.reason);
            break;
          }

          // Get terrain elevation at this position
          const terrainElevation = state.grid.cells[y][x].elevation;

          // Calculate best rotation for auto-connect
          const { rotation, elevation } = calculateBestRotation(
            state.selectedTrackType,
            { x, y },
            state.tracks,
            terrainElevation
          );

          // For bridges and tunnels, use neighbor track/terrain elevation instead of local terrain
          // This allows bridges to span gaps at elevated height
          let finalElevation = elevation;
          if (state.selectedTrackType === 'bridge' || state.selectedTrackType === 'tunnel_entrance') {
            const neighbors = findConnectableNeighbors({ x, y }, state.tracks);
            if (neighbors.length > 0) {
              // Use the elevation of the first connecting neighbor track
              finalElevation = neighbors[0].track.elevation;
            } else {
              // No neighbor tracks - check neighbor terrain elevations
              // Use the maximum elevation of adjacent terrain tiles
              let maxNeighborElevation = terrainElevation;
              const offsets = [
                { dx: 0, dy: -1 }, // N
                { dx: 1, dy: 0 },  // E
                { dx: 0, dy: 1 },  // S
                { dx: -1, dy: 0 }, // W
              ];
              for (const { dx, dy } of offsets) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < state.grid.width && ny >= 0 && ny < state.grid.height) {
                  const neighborTerrain = state.grid.cells[ny][nx].elevation;
                  maxNeighborElevation = Math.max(maxNeighborElevation, neighborTerrain);
                }
              }
              finalElevation = maxNeighborElevation;
            }
          }

          // Create new track piece
          const newTrack: TrackPiece = {
            id: generateId(),
            type: state.selectedTrackType,
            position: { x, y },
            rotation,
            elevation: finalElevation,
            connections: [],
          };

          dispatch({ type: 'PLACE_TRACK', track: newTrack });
          SoundManager.play('place');
          break;
        }
        case 'remove': {
          // Find track at this position
          const trackToRemove = findTrackAtPosition(state.tracks, { x, y });
          if (trackToRemove) {
            dispatch({ type: 'REMOVE_TRACK', trackId: trackToRemove.id });
            SoundManager.play('remove');
          }
          break;
        }
        case 'select': {
          // Toggle switch or signal state
          const trackToToggle = findTrackAtPosition(state.tracks, { x, y });
          if (trackToToggle) {
            if (
              trackToToggle.type === 'switch_left' ||
              trackToToggle.type === 'switch_right'
            ) {
              // Toggle switch
              const newState =
                trackToToggle.switchState === 'left' ? 'right' : 'left';
              const updatedTrack: TrackPiece = {
                ...trackToToggle,
                switchState: newState,
              };
              dispatch({ type: 'REMOVE_TRACK', trackId: trackToToggle.id });
              dispatch({ type: 'PLACE_TRACK', track: updatedTrack });
              SoundManager.play('click');
            } else if (trackToToggle.type === 'signal') {
              // Toggle signal
              const newState =
                trackToToggle.signalState === 'green' ? 'red' : 'green';
              const updatedTrack: TrackPiece = {
                ...trackToToggle,
                signalState: newState,
              };
              dispatch({ type: 'REMOVE_TRACK', trackId: trackToToggle.id });
              dispatch({ type: 'PLACE_TRACK', track: updatedTrack });
              SoundManager.play('click');
            }
          }
          break;
        }
      }
    },
    [
      state.hoveredCell,
      state.selectedTool,
      state.selectedTrackType,
      state.selectedTerrainType,
      state.grid.cells,
      state.grid.width,
      state.grid.height,
      state.tracks,
      dispatch,
    ]
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        cursor: isDraggingRef.current ? 'grabbing' : state.hoveredCell ? 'pointer' : 'default',
      }}
    />
  );
}

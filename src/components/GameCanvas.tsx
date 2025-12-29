// Main game canvas component

import { useRef, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { setupCanvas, createRenderLoop, type RenderContext } from '../rendering';
import { findGridCellAtScreenPoint } from '../rendering/isometric';
import { drawTrain, drawSmoke } from '../rendering/trainRenderer';
import { calculateGridOrigin, calculateCanvasSize } from '../constants';
import {
  findTrackAtPosition,
  calculateBestRotation,
  canPlaceTrack,
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
          trainSegmentRef.current = 0;
          trainProgressRef.current = 0;
          trainDirectionRef.current = 1;
          trainTimeRef.current = 0;

          if (path && path.segments.length > 0) {
            trainPositionRef.current = calculateTrainPosition(
              path,
              0,
              0,
              originX,
              originY,
              1
            );
          }
        } else if (!currentState.isPlaying && wasPlayingRef.current) {
          // Just stopped - reset train
          trainPathRef.current = null;
          trainPositionRef.current = null;
          trainSegmentRef.current = 0;
          trainProgressRef.current = 0;
          trainDirectionRef.current = 1;
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

          trainPositionRef.current = calculateTrainPosition(
            trainPathRef.current,
            result.segmentIndex,
            result.progress,
            originX,
            originY,
            result.direction
          );
        }
      },
      // Custom draw callback for train
      (ctx: CanvasRenderingContext2D) => {
        if (trainPositionRef.current && stateRef.current.isPlaying) {
          drawSmoke(ctx, trainPositionRef.current, trainTimeRef.current);
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
      // Space bar to toggle play/pause
      if (e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PLAY' });
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

      // Find the grid cell under the mouse
      const cell = findGridCellAtScreenPoint(
        adjustedX,
        adjustedY,
        state.grid.width,
        state.grid.height,
        originX,
        originY
      );

      dispatch({ type: 'SET_HOVERED_CELL', cell });
    },
    [dispatch, state.camera, state.grid.width, state.grid.height]
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

          // Calculate best rotation for auto-connect (also determines elevation for slopes)
          const { rotation, elevation } = calculateBestRotation(
            state.selectedTrackType,
            { x, y },
            state.tracks,
            terrainElevation
          );

          // Create new track piece
          const newTrack: TrackPiece = {
            id: generateId(),
            type: state.selectedTrackType,
            position: { x, y },
            rotation,
            elevation,
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

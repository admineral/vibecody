import { useEffect, useCallback } from 'react';

export interface KeyboardControls {
  onArrowLeft: () => void;
  onArrowRight: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSpace: () => void;
  onEscape: () => void;
  onNumber: (num: number) => void;
}

export function useKeyboardControls(controls: KeyboardControls) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default behavior for navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
      event.preventDefault();
    }

    switch (event.code) {
      case 'ArrowLeft':
        controls.onArrowLeft();
        break;
      case 'ArrowRight':
        controls.onArrowRight();
        break;
      case 'ArrowUp':
        controls.onArrowUp();
        break;
      case 'ArrowDown':
        controls.onArrowDown();
        break;
      case 'Space':
        controls.onSpace();
        break;
      case 'Escape':
        controls.onEscape();
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        const num = parseInt(event.code.replace('Digit', ''));
        controls.onNumber(num - 1); // Convert to 0-based index
        break;
      case 'Digit0':
        controls.onNumber(9); // 0 key maps to index 9
        break;
    }
  }, [controls]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export interface WASDControls {
  onW: () => void;
  onA: () => void;
  onS: () => void;
  onD: () => void;
  onShift: (pressed: boolean) => void;
}

export function useWASDControls(controls: WASDControls) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        controls.onW();
        break;
      case 'KeyA':
        controls.onA();
        break;
      case 'KeyS':
        controls.onS();
        break;
      case 'KeyD':
        controls.onD();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        controls.onShift(true);
        break;
    }
  }, [controls]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        controls.onShift(false);
        break;
    }
  }, [controls]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
} 
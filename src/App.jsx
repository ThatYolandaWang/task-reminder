import { useEffect, useRef } from 'react';
import { moveWindow, Position } from '@tauri-apps/plugin-positioner';
import { TaskList } from './tasklist';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const isInitial = useRef(false);

  async function handleMove() {
    try {
      const setting = await invoke('load_setting');
      if (setting.position === 0) {
        moveWindow(Position.TopLeft);
      } else if (setting.position === 1) {
        moveWindow(Position.BottomLeft);
      } else if (setting.position === 2) {
        moveWindow(Position.TopRight);
      } else if (setting.position === 3) {
        moveWindow(Position.BottomRight);
      }
    } catch (error) {
      console.error(error);
      moveWindow(Position.BottomRight);
    }
  }
  useEffect(() => {
    if (!isInitial.current) {
      isInitial.current = true;
      handleMove();
    }
  }, []);

  return (
    <div className='w-full h-full'>
      <TaskList />
    </div>
  );
}

export default App;

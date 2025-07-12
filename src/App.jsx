import { useEffect } from 'react';
import { getCurrentWindow, currentMonitor } from '@tauri-apps/api/window';
import { moveWindow, Position } from '@tauri-apps/plugin-positioner';
import { TaskList } from './tasklist';

function App() {


  useEffect(() => {
    getCurrentWindow().onMoved(async (payload) => {
      console.log(payload);

      
    });

    

    moveWindow(Position.TopRight);
    // let unlisten;

    // getCurrentWindow().onMoved(async () => {
    //   const win = getCurrentWindow();
    //   const winPos = await win.outerPosition();
    //   const winSize = await win.outerSize();
    //   const screen = await currentMonitor(); // 修正：用全局方法

    //   if (!screen) return;
    //   const { x, y } = winPos;
    //   const { width, height } = winSize;
    //   const { size: screenSize } = screen;

    //   const edgeThreshold = 100;

    //   if (x < edgeThreshold && y < edgeThreshold) {
    //     moveWindow(Position.TopLeft);
    //   }else if (x + width > screenSize.width - edgeThreshold && y < edgeThreshold) {
    //     moveWindow(Position.TopRight);
    //   }else if (x < edgeThreshold && y + height > screenSize.height - edgeThreshold) {
    //     moveWindow(Position.BottomLeft);
    //   }else if (x + width > screenSize.width - edgeThreshold && y + height > screenSize.height - edgeThreshold) {
    //     moveWindow(Position.BottomRight);
    //   }
    // }).then((un) => {
    //   unlisten = un;
    // });

    // return () => {
    //   if (unlisten) unlisten();
    // };
  }, []);

  return (
    <div className='w-full h-full'>
      <TaskList />
    </div>
  );
}

export default App;

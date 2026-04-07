import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { resizeColumnPair } from "./workspaceColumnWidths";

type UseWorkspaceColumnResizeInput = {
  getWidths: (leftKey: string, rightKey: string) => { leftWidth: number; rightWidth: number } | null;
  onCommit: (leftKey: string, rightKey: string, widths: { leftWidth: number; rightWidth: number }) => void;
};

export function useWorkspaceColumnResize(input: UseWorkspaceColumnResizeInput) {
  const [guideX, setGuideX] = useState<number | null>(null);

  const startResize = (event: ReactMouseEvent<HTMLElement>, leftKey: string, rightKey: string) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    setGuideX(startX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setGuideX(moveEvent.clientX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setGuideX(null);

      const widths = input.getWidths(leftKey, rightKey);
      if (!widths) {
        return;
      }

      input.onCommit(leftKey, rightKey, resizeColumnPair({ ...widths, delta: upEvent.clientX - startX }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return {
    guideX,
    startResize,
  };
}

import { useCallback } from "react";

type SavedViewState = {
  createNamedView: (name: string) => Promise<void>;
  renameCurrentView: (name: string) => Promise<void>;
  duplicateCurrentView: (name: string) => Promise<void>;
  deleteCurrentView: () => Promise<void>;
};

export function useWorkspaceSavedViewActions(savedViewState: SavedViewState, currentViewName: string | undefined, setWorkspaceMessage: (message: string) => void) {
  const handleCreateSavedView = useCallback(async (name: string) => {
    await savedViewState.createNamedView(name);
    setWorkspaceMessage(`已创建视图“${name.trim()}”。`);
  }, [savedViewState, setWorkspaceMessage]);

  const handleRenameSavedView = useCallback(async (name: string) => {
    await savedViewState.renameCurrentView(name);
    setWorkspaceMessage(`已重命名视图为“${name.trim()}”。`);
  }, [savedViewState, setWorkspaceMessage]);

  const handleDuplicateSavedView = useCallback(async (name: string) => {
    await savedViewState.duplicateCurrentView(name);
    setWorkspaceMessage(`已复制视图为“${name.trim()}”。`);
  }, [savedViewState, setWorkspaceMessage]);

  const handleDeleteSavedView = useCallback(async () => {
    await savedViewState.deleteCurrentView();
    if (currentViewName) {
      setWorkspaceMessage(`已删除视图“${currentViewName}”。`);
    }
  }, [currentViewName, savedViewState, setWorkspaceMessage]);

  return {
    handleCreateSavedView,
    handleRenameSavedView,
    handleDuplicateSavedView,
    handleDeleteSavedView,
  };
}

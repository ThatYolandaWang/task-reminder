import { createContext, useContext } from "react";

export const NotionContext = createContext({
    authInfo: null,
    state: "not_start",
    startPolling: () => { },
    stopPolling: () => { },
    logout: () => { },
    pages: [],
    selectPage: () => { },
    version: "",
    latestVersion: null,
    updateVersion: () => { },

    // 标签列表
    tagOptions: [],
    isTagsLoading: false,
    createTag: () => { },
    deleteTag: () => { },
});

export function useNotionContext() {
    const context = useContext(NotionContext);
    if (!context) {
        throw new Error("useNotionContext must be used within a NotionProvider");
    }
    return context;
}
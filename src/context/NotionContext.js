import { createContext, useContext } from "react";

export const NotionContext = createContext({
    authInfo: null,
    state: "not_start",
    startPolling: () => { },
    stopPolling: () => { },
    logout: () => { },
    selectPage: () => { },
});

export function useNotionContext() {
    const context = useContext(NotionContext);
    if (!context) {
        throw new Error("useNotionContext must be used within a NotionProvider");
    }
    return context;
}
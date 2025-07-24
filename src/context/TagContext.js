import { createContext, useContext } from "react";

export const TagContext = createContext({
    tagOptions: [],
    createTag: () => Promise.resolve(false),
    isTagsLoading: false,
});

export function useTagContext() {
    const context = useContext(TagContext);
    if (!context) {
        throw new Error("useTagContext must be used within a TagProvider");
    }
    return context;
}
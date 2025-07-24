import { TagContext } from './TagContext';
import { useNotionContext } from './NotionContext';
import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { toast } from "sonner";

export default function TagProvider({ children }) {
    const { state, authInfo } = useNotionContext();  // 获取Notion状态

    const [tagOptions, setTagOptions] = useState([]);
    const [isTagsLoading, setIsTagsLoading] = useState(false);

    useEffect(() => {
        if (state === "success" && authInfo?.duplicated_template_id) {
            loadTags();
        }
    }, [state, authInfo]);

    const loadTags = async () => {
        try {
            setIsTagsLoading(true);
            const res = await invoke("load_tags")
            if (res.success) {
                setTagOptions(res.tags)
                console.log(res.tags)
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIsTagsLoading(false);
        }
    }

    const createTag = async (tag) => {
        try {
            setIsTagsLoading(true);
            const newTags = [...tagOptions, tag]
            const res = await invoke("update_tags", { tags: newTags })
            if (res.success) {
                if (res.tags) {
                    setTagOptions(res.tags)
                    return true
                }
            } else {
                toast.error("创建标签失败: " + res.error)
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setIsTagsLoading(false);
        }
        return false
    }

    const contextValue = {
        tagOptions,
        createTag,
        isTagsLoading,
    };

    return (
        <TagContext.Provider value={contextValue}>
            {children}
        </TagContext.Provider>)
}
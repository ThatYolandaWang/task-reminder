import { useState } from "react";
import { useNotionContext } from "@/context/NotionContext";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { X } from "lucide-react";

export default function NotionTag({ open, setOpen, handleSelect = () => { } }) {

    const { tagOptions, isTagsLoading, deleteTag, createTag } = useNotionContext();

    const [commandQuery, setCommandQuery] = useState("");


    const selectTag = (tag) => {
        handleSelect(tag);
        setCommandQuery("");
    }

    const newTag = async (tag) => {
        const success = await createTag(tag);
        if (!success) return;
        handleSelect(tag);
        setCommandQuery("");
    }

    const removeTag = async (tag) => {
        await deleteTag(tag);

    }

    return (
        <CommandDialog open={open} onOpenChange={setOpen} >
            <CommandInput
                placeholder="输入标签..."
                value={commandQuery}
                onValueChange={setCommandQuery}
                onKeyDown={e => {
                    if (e.key === "Enter" && commandQuery.trim() !== "") {
                        e.preventDefault();

                        if (tagOptions.includes(commandQuery.trim())) {
                            selectTag(commandQuery.trim());
                        } else {
                            newTag(commandQuery.trim());
                        }
                    }
                }}
            />
            <CommandList >
                {isTagsLoading && <CommandItem className="flex justify-center items-center text-gray-300 animate-pulse text-center px-2">加载中...</CommandItem>}
                <CommandEmpty>
                    <p className="text-muted-foreground text-sm">
                        新增标签
                        <kbd className="bg-muted text-muted-foreground pointer-events-none  rounded border px-1 font-mono font-medium opacity-100 select-none">
                            <span className="text-xs">↵</span>
                        </kbd>
                    </p>
                </CommandEmpty>

                {tagOptions.length > 0 && tagOptions.map((opt, idx) => (

                    <CommandItem key={idx} className="flex flex-row justify-between items-center flex-1 " onSelect={() => selectTag(opt)}>
                        <div className="px-2" >{opt}</div>
                        <div className="px-2 cursor-pointer" onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // 阻止冒泡，防止触发 CommandItem 的 onSelect
                            removeTag(opt);
                        }}>
                            <X className="flex-shrink-0" size={16} />
                        </div>
                    </CommandItem>

                ))}

            </CommandList>
        </CommandDialog >
    )
}
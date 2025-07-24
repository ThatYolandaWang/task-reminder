import { useTagContext } from "@/context/TagContext";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { CommandDialog, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { X } from "lucide-react";

export const TextareaCommand = forwardRef(({ value, tags, onChange, disabled, ...props }, ref) => {
    const { tagOptions, createTag, isTagsLoading } = useTagContext();


    const [taskTags, setTaskTags] = useState(tags || []);
    const [text, setText] = useState(value);
    const [open, setOpen] = useState(false);
    const [commandQuery, setCommandQuery] = useState("");
    const textareaRef = useRef();
    // 记录当前触发的#的起始位置
    const [triggerPos, setTriggerPos] = useState(null);


    // 监听text变化，更新tags和textarea高度
    useEffect(() => {
        // // 正则表达式提取文本
        // const regex = /#([\w\u4e00-\u9fa5\-]+)\s/g;

        // const matches = [];
        // let match;
        // while ((match = regex.exec(text)) !== null) {
        //     matches.push(match[0].trim()); // match[0] 是带#和空格的整体
        //     // matches.push(match[1]); // match[1] 是不带#的内容
        // }
        // setTaskTags(matches);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    const handleInputChange = e => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;
        setText(val);
        onChange(val);

        // 查找光标前最近的 #
        const beforeCursor = val.slice(0, cursor);
        const hashIdx = beforeCursor.lastIndexOf("#");

        // 判断#后是否为合法字符
        if (
            hashIdx !== -1 &&
            (hashIdx === 0 || /\s/.test(beforeCursor[hashIdx - 1])) // #前是空格或开头
        ) {
            // 取#后到光标的内容
            const afterHash = beforeCursor.slice(hashIdx + 1, cursor);
            // 只允许字母数字下划线
            if (/^\w*$/.test(afterHash)) {
                setOpen(true);
                setCommandQuery(afterHash);
                setTriggerPos({ start: hashIdx, end: cursor });
                return;
            }
        }

        setOpen(false);
        setCommandQuery("");
        setTriggerPos(null);
    };



    const filteredOptions = tagOptions.filter(opt =>
        opt.startsWith(commandQuery)
    ).slice(0, 5);

    const handleCreateTag = async (tag) => {
        const success = await createTag(tag);
        if (!success) return;
        if (!triggerPos) return;
        // 替换#xxx为#option
        const before = value.slice(0, triggerPos.start);
        const after = value.slice(triggerPos.end);
        const newValue = `${before}${after}`;

        setText(newValue);


        const newTags = [...taskTags, tag];
        setTaskTags(newTags);
        onChange(newValue, newTags);


        setOpen(false);
        setCommandQuery("");
        setTriggerPos(null);

        // 恢复光标到插入后的位置
        setTimeout(() => {
            if (textareaRef.current) {
                const pos = before.length + tag.length + 2; // # + option + 空格
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleSelect = option => {
        if (!triggerPos) return;
        // 替换#xxx为#option
        const before = value.slice(0, triggerPos.start);
        const after = value.slice(triggerPos.end);
        const newValue = `${before}${after}`;
        setText(newValue);

        const newTags = [...taskTags, option];
        setTaskTags(newTags);
        onChange(newValue, newTags);

        setOpen(false);
        setCommandQuery("");
        setTriggerPos(null);

        // 恢复光标到插入后的位置
        setTimeout(() => {
            if (textareaRef.current) {
                const pos = before.length + option.length + 2; // # + option + 空格
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleRemoveTag = tag => {
        if (disabled) return;
        const newTags = taskTags.filter(t => t !== tag) || [];
        setTaskTags(newTags);
        onChange(text, newTags);
    };

    useImperativeHandle(ref, () => ({
        focusTextarea: () => {
            textareaRef.current?.focus();
        }
    }));

    return (
        <div className="w-full flex flex-col gap-1">
            <textarea rows={1} className="focus:outline-none focus:ring-0 resize-none overflow-hidden" type="textarea" ref={textareaRef} value={text}
                onChange={handleInputChange} disabled={disabled} {...props}
            />
            {taskTags.length > 0 &&
                <div className="text-gray-500 text-sm flex flex-row gap-2">
                    {taskTags.map((tag, idx) => (
                        <div key={idx} className={`text-xs px-2 py-0.5 rounded-md relative flex flex-row items-center  ${disabled ? "" : "group cursor-pointer bg-green-500/10 "}`} onClick={() => handleRemoveTag(tag)}>
                            <span className={`${disabled ? "text-gray-500" : "text-green-700"}`}># {tag}</span>
                            <div className="bg-muted rounded-full p-1 absolute right-0 top-0 translate-y-[-20%] translate-x-[50%] group-hover:block hidden">
                                <X size={8} />
                            </div>
                        </div>
                    ))}
                </div>
            }
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="输入标签..."
                    value={commandQuery}
                    onValueChange={setCommandQuery}
                    onKeyDown={e => {
                        if (e.key === "Enter" && commandQuery.trim() !== "") {
                            e.preventDefault();

                            if (filteredOptions.includes(commandQuery.trim())) {
                                handleSelect(commandQuery.trim());
                            } else {
                                handleCreateTag(commandQuery.trim());
                            }
                        }
                    }}
                />
                <CommandList>
                    {isTagsLoading && <CommandEmpty className="text-gray-300 animate-pulse text-center">加载中...</CommandEmpty>}
                    {filteredOptions.length === 0 && <CommandEmpty>新增标签</CommandEmpty>}
                    {filteredOptions.map(opt => (
                        <CommandItem key={opt} onSelect={() => handleSelect(opt)}>
                            {opt}
                        </CommandItem>
                    ))}
                </CommandList>
            </CommandDialog>

        </div>
    )
})







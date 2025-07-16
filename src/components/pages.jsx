import { motion, AnimatePresence } from "motion/react";
import { FileText, Database, ChevronRight, ChevronDown, Check, Ban } from "lucide-react";

function TreeNode({ node, select, onSelect, openMap, toggleOpen }) {
    const hasChildren = node.children && node.children.length > 0;
    const open = openMap[node.id] || false;

    const handleSelect = (id) => {

        if (node.object === "page") {
            return;
        }

        onSelect(id);
    };

    return (
        <li>
            <div className="flex flex-row items-center gap-2 rounded-md hover:bg-gray-200 cursor-pointer px-2 ">
                <div className="flex flex-row items-center gap-1" onClick={() => hasChildren && toggleOpen(node.id)}>
                    {hasChildren ? open ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" /> : <div style={{ width: 12 }} />}
                    {node.object === "page" ? <FileText size={12} className="flex-shrink-0" /> : <Database size={12} className="flex-shrink-0" />}
                </div>
                <div className="group w-full py-1 flex flex-row items-center justify-between gap-1 overflow-hidden" onClick={() => handleSelect(node.id)}>
                    <div className="flex-1 text-xs text-ellipsis whitespace-nowrap overflow-hidden">
                        {node.title}</div>
                    {select === node.id && <Check size={12} className="w-4 flex-shrink-0" />}
                    {select !== node.id && node.object === "page" && <Ban size={12} className="w-4 flex-shrink-0 group-hover:block hidden" />}
                </div>
            </div>
            <AnimatePresence initial={false}>
                {hasChildren && open && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden", paddingLeft: 24 }}
                    >
                        {node.children.map((child) => (
                            <TreeNode
                                node={child}
                                key={child.id}
                                select={select}
                                onSelect={onSelect}
                                openMap={openMap}
                                toggleOpen={toggleOpen}
                            />
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </li>
    );
}

export default function FileTree({ data, select, onSelect, openMap, toggleOpen }) {
    return (
        <ul>
            {data.map((node) => (
                <TreeNode
                    node={node}
                    key={node.id}
                    select={select}
                    onSelect={onSelect}
                    openMap={openMap}
                    toggleOpen={toggleOpen}
                />
            ))}
        </ul>
    );
}

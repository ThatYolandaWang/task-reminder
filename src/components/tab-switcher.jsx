import { motion } from "motion/react";
import Button from "./button";



export function TabSwitcher({label, active, options, onChange}) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm">{label}</label>
            {/* 按钮栏 */}
            <div className="flex space-x-2 rounded-full border border-gray-200 justify-center">
                {options.map((option, idx) => (
                    <Button key={option.id} 
                        size="sm"
                        className="relative rounded-md w-8 h-8 cursor-pointer"
                        onClick={() => onChange(option.id)}>
                        {/* {option.label} */}
                        {active === option.id && (
                            <motion.div
                                layoutId="switcher"
                                className="absolute inset-0 bg-gray-100 rounded-full z-0 w-8 h-8"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                            />
                        )}
                        <div className="relative z-10 flex items-center justify-center">
                            {options[idx].icon}
                        </div>

                    </Button>
                ))}
            </div>
        </div>
    );
}
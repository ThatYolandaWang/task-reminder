import { motion } from "motion/react";

export default function Slider({ label, isOn, setIsOn }) {


    return (

        <div className="flex flex-row  items-center gap-2 justify-between">
            <label className="text-sm">{label}</label>
            <div
                className="toggle-container border-1 border-gray-300 w-10 h-6 rounded-full flex cursor-pointer p-1"
                style={{
                    justifyContent: "flex-" + (isOn ? "start" : "end"),
                }}
                onClick={() => setIsOn(!isOn)}
            >
                <motion.div
                    className="toggle-handle w-4 h-4 rounded-full bg-gradient-to-br from-gray-500 to-gray-700"
                    layout
                    transition={{
                        type: "spring",
                        visualDuration: 0.2,
                        bounce: 0.2,
                    }}
                />
            </div>
        </div>
    )
}
// ProgressCircle.jsx
import React from "react";
import { motion } from "motion/react";

export default function ProgressCircle({
    percent = 0,
    size = 120,
    color = "#000",
    bgColor = "#e0e0e0",
    stroke = 8,
    children,
}) {
    // 动态计算半径
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent / 100);

    return (
        <svg width={size} height={size}>
            {/* 背景圆环 */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={bgColor}
                strokeWidth={stroke}
                fill="none"
            />
            {/* 进度圆环 */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dy=".3em"

                fill={color}
            >
                {/* 百分比文本 */}
                {children}
            </text>
        </svg>
    );
}

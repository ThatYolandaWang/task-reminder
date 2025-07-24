"use client"

import { Bar, BarChart,  XAxis } from "recharts"
import { useState, useEffect } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getDaysInMonth } from 'date-fns'
// const chartData = [
//     { month: "January", finish: 30, unfinish: 30 },
//     { month: "February", finish: 35, unfinish: 35 },
//     { month: "March", finish: 27, unfinish: 37 },
//     { month: "April", finish: 73, unfinish: 73 },
//     { month: "May", finish: 29, unfinish: 29 },
//     { month: "June", finish: 4, unfinish: 24 },
// ]



export default function NotionDashboard({ data }) {



    let chartConfig = {
        option1: {
            label: data.option1,
            color: "var(--chart-3)",
        },
        option2 : {
            label: data.option2 || "",
            color: "var(--chart-5)",
        }
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-[calc(100dvh-130px)] min-h-[200px]">
            <BarChart accessibilityLayer data={data.data}>
                <ChartTooltip content={<ChartTooltipContent  indicator="line" />} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value, index) => {
                        if (data.data.length > 10) {
                            return index % 3 === 0 ? value.slice(0, 3) : ""
                        }
                        return value
                    }}
                />
                {data.option1 && (
                    <Bar dataKey="option1" fill={chartConfig.option1.color} radius={4} stackId="a" maxBarSize={20}  />
                )}

                {data.option2 && (
                    <Bar dataKey="option2" fill={chartConfig.option2.color} radius={4} stackId="a" maxBarSize={20} />
                )}
            </BarChart>
        </ChartContainer>
    )
}

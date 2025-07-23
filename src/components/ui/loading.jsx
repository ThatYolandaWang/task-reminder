import { Loader2 } from "lucide-react";

export default function Loading() {

    return (
        <div className="flex flex-row gap-2 justify-center items-center w-full flex-1 text-sm text-gray-500">
            <Loader2 className="animate-spin" /> 加载中...
        </div>
    )

}
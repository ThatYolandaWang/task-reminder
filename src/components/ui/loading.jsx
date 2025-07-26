import { Loader2 } from "lucide-react";

export default function Loading({className}) {

    return (
        <div className={`flex gap-2 justify-center items-center w-full h-full text-sm ${className}`}>
            <div className="flex flex-row w-30 h-30 rounded-md bg-muted gap-2 justify-center items-center">
                <Loader2 className="animate-spin" /> 加载中...
            </div>
        </div>
    )

}
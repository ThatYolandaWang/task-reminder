
import { useNotionContext } from "@/context/NotionContext";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { ListChecks, Check } from "lucide-react";

export default function NotionPage() {

    const { authInfo, selectPage, pages } = useNotionContext();

    return (

        <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="ghost" >
                    <ListChecks className="flex-shrink-0" size={16} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-1/3 gap-0">
                <SheetHeader className="p-4">
                    <SheetTitle>选择页面</SheetTitle>
                    <SheetDescription  className="sr-only">选择页面</SheetDescription>
                </SheetHeader>

                {pages.map(item => (
                    <Button key={item.id} value={item.id} variant="ghost" className="w-full justify-between p-3" onClick={() => selectPage(item.id)}>
                        <span className="text-ellipsis whitespace-nowrap overflow-hidden ">{item.title}</span>
                        {item.id === authInfo?.duplicated_template_id && <Check className="flex-shrink-0" size={16} />}
                    </Button>
                ))}

            </SheetContent>
        </Sheet>
    )
}
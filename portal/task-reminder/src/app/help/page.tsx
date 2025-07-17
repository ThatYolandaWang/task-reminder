'use client'
import { useSearchParams } from "next/navigation";
import Image from "next/image"
import Link from "next/link";
export default function SuccessPage() {
  const params = useSearchParams();
  const status = params.get("status");
  // 使用 workspaceId 渲染或做其它逻辑

  if (status === "userdefined") {
    const template_url = process.env.NEXT_PUBLIC_NOTION_TEMPLATE_URL || "";
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold py-8">如果第一次使用，请手动创建数据库的副本</h1>
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 flex flex-col items-start justify-center">
                <p>Step1 - 从模板地址选择<span className="font-bold underline"> 重复 </span>创建数据库的副本</p>
                <Link href={template_url} target="_blank" className="text-blue-500">前往模板地址</Link>

            </div>
            <div className="col-span-2 flex items-center justify-center gap-4">
                <Image src="/step1.png" alt="copy_database_template" width={300} height={300} className="object-cover rounded-lg shadow-lg"/>
                <Image src="/step2.png" alt="copy_database_template" width={300} height={300} className="object-cover rounded-lg shadow-lg"/>
            </div>


            <div className="col-span-1 flex flex-col items-start justify-center">
                <p>Step2 - 在task reminder<span className="font-bold underline"> 设置 </span>页面选择需要的数据库</p>
            </div>
            <div className="col-span-2 flex items-center justify-center">
                <Image src="/step3.png" alt="choose_the_database" width={300} height={500} className="object-cover rounded-lg shadow-lg"/>
            </div>

        </div>
      </div>
    )
  }

  if (status === "error") {
    const error = params.get("error");
    const error_description = params.get("error_description");
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold py-8">创建失败</h1>
        <p className="text-lg">{error}</p>
        <p className="text-lg">{error_description}</p>
      </div>
    )
  }

  return (
    
    <div>
      <h1>请尝试重新登陆</h1>
    </div>
  )
}
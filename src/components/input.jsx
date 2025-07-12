export default function Input({ label,  ...props }) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm text-gray-500">{label}</label>
            <input  className="w-full border-1 border-gray-300 rounded-full px-4 py-1 focus:outline-none focus:ring-0 text-sm" {...props} />
        </div>
    )
}
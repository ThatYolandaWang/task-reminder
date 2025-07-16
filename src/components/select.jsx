export default function Select({ label, options, ...props }) {
    return (
        <div className="flex flex-row gap-2 w-full">
            <label className="text-sm ">{label}</label>
            <select  className="w-full  px-4 py-1 focus:outline-none focus:ring-0 text-sm" {...props} >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    )
}
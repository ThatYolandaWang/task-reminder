export default function Button({ children, onClick }) {
    return (
        <button className="flex justify-center items-center gap-2 text-sm hover:bg-gray-100 rounded-full p-2" onClick={onClick}>{children}</button>
    )
}
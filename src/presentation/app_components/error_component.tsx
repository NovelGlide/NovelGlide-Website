export default function ErrorComponent() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h2 className="text-center text-2xl font-semibold text-red-600">An error occurred</h2>
            <p className="max-w-lg text-center text-gray-600">Sorry, something went wrong while loading the content. Please try again later.</p>
        </div>
    );
}
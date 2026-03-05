import SnakeLoader from './SnakeLoader';

export default function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <SnakeLoader size={160} />
        </div>
    );
}

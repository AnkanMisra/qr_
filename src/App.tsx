import { Routes, Route } from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { AdminPage } from "./components/AdminPage";

export default function App() {
    return (
        <div className="h-full w-full">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </div>
    );
}

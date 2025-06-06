import { Routes, Route } from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { AdminPage } from "./components/AdminPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
        </Routes>
    );
}

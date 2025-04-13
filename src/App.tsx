
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/AppSidebar";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;

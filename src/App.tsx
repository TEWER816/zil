import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/Home";
import { Habits } from "@/pages/Habits";
import { Focus } from "@/pages/Focus";
import { Presets } from "@/pages/Presets";
import { Calendar } from "@/pages/Calendar";
import { Settings } from "@/pages/Settings";
import { GreetingModal } from "@/components/common/GreetingModal";
import { useTheme } from "@/hooks/useTheme";

export default function App() {
  useTheme();
  return (
    <Router>
      <GreetingModal />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/presets" element={<Presets />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
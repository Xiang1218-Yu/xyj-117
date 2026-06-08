import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ReactionMechanism from "@/pages/ReactionMechanism";
import SpectrumSimulator from "@/pages/SpectrumSimulator";
import WorkflowEditor from "@/pages/WorkflowEditor";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reaction-mechanism" element={<ReactionMechanism />} />
        <Route path="/spectrum-simulator" element={<SpectrumSimulator />} />
        <Route path="/workflow-editor" element={<WorkflowEditor />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

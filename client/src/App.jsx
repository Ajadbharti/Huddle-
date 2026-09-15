import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import FeaturePage from "./pages/FeaturePage";
import Profile from "./pages/Profile";
import People from "./pages/People";
import DMChat from "./pages/DMChat";
import DirectRoom from "./pages/DirectRoom";
import AddFriend from "./pages/AddFriend";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feature/:featureId" element={<FeaturePage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/people" element={<People />} />
<Route path="/dm/:otherUid" element={<DMChat />} />
<Route path="/with/:otherUid" element={<DirectRoom />} />
<Route path="/add-friend" element={<AddFriend />} />
    </Routes>
  );
}

export default App;
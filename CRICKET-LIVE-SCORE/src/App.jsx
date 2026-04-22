import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MatchDetail from "./pages/MatchDetail";
import NewsPage from "./pages/Newspage";
import Hero from "./components/Hero";
import Header from "./components/Header";
import RecentMatches from "./pages/RecentMatches";
import UpcomingMatch from "./pages/UpcomingMatch";
import LiveMatch from "./pages/LiveMatch";
import Blockchain from "./pages/Blockchain";
import Footer from "./components/Footer";


function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/hero" element={<Hero />} />
        <Route path="/live" element={<LiveMatch />} />
        <Route path="/upcoming" element={<UpcomingMatch />} />
        <Route path="/recent" element={<RecentMatches />} />
        <Route path="/blockchain" element={<Blockchain />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
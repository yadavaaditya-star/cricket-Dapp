import React from 'react';
import { useNavigate } from 'react-router-dom';
import { homeStyles } from '../assets/dummyStyles';
import LiveMatch from './LiveMatch';
import UpcomingMatch from './UpcomingMatch';
import RecentMatches from './RecentMatches';
import Hero from '../components/Hero';


const Home = () => {
  const navigate = useNavigate();
  // LiveMatch and UpcomingMatch call onSelect(id, matchObj) when a card is clicked.
  // RecentMatches handles its own navigation internally via useNavigate.
  // We leave onSelect as a no-op here — if you want LiveMatch/UpcomingMatch cards
  // to also open the detail page, pass the match object from those components too.
  function onSelect(id, matchObj) {
    // No-op — RecentMatches navigates itself.
    // If LiveMatch/UpcomingMatch provide matchObj, you can navigate here too:
    // if (matchObj) {
    //   sessionStorage.setItem(`match_${id}`, JSON.stringify(matchObj));
    //   navigate(`/match/${id}`);
    // }
  }

  return (
    <div className={homeStyles.root}>
      <Hero />

      <section style={{
        maxWidth: 1230,
        margin: '0 auto',
        padding: '28px 24px',
        borderRadius: 28,
        background: '#ffffff80',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        marginTop: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 12, margin: 0 }}>
              Blockchain Rewards
            </p>
            <h2 style={{ fontSize: 32, lineHeight: 1.1, margin: '12px 0 0', color: '#102a43' }}>
              Follow live cricket with blockchain-powered rewards.
            </h2>
          </div>
          <p style={{ color: 'rgba(16, 42, 67, 0.8)', fontSize: 15, lineHeight: 1.8, maxWidth: 780 }}>
            LiveWicket now includes blockchain support so fans can earn secure match rewards, access verified scores, and explore collectible game assets.
          </p>
          <button
            onClick={() => navigate('/blockchain')}
            style={{
              border: 'none',
              borderRadius: 14,
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px 24px',
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            Learn About Blockchain
          </button>
        </div>
      </section>

      <LiveMatch onSelect={onSelect} />
      <UpcomingMatch onSelect={onSelect} />
      <RecentMatches />
    </div>
  );
};

export default Home;
import React, { useState } from 'react'
import './App.css'
import ladyGagaImg from './assets/celeb_pics/ladyGaga.png'
import lewisCapaldiImg from './assets/celeb_pics/lewisCapaldi.jpg'
import cherImg from './assets/celeb_pics/cher.png'
import noelGallagherImg from './assets/celeb_pics/noelGallagher.png'
import blurdleLogo from './assets/Blurdle.png'

// Placeholder image (replace with your own celebrity images later)
const CELEBRITIES = [
  {
    name: 'Lady Gaga',
    image: ladyGagaImg,
    brand: 'https://www.capitalfm.com/',
  },
  {
    name: 'Lewis Capaldi',
    image: lewisCapaldiImg,
    brand: 'https://www.heart.co.uk/',
  },
  {
    name: 'Cher',
    image: cherImg,
    brand: 'https://www.goldradio.com/',
  },
  {
    name: 'Noel Gallagher',
    image: noelGallagherImg,
    brand: 'https://www.radiox.co.uk/',
  },
  // Add more celebrities as needed
];

const MAX_GUESSES = 6;
const BLUR_LEVELS = [20, 16, 12, 8, 4, 0]; // px

function getRandomIndex(exclude) {
  let idx;
  do {
    idx = Math.floor(Math.random() * CELEBRITIES.length);
  } while (idx === exclude && CELEBRITIES.length > 1);
  return idx;
}

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(
          matrix[i - 1][j],    // deletion
          matrix[i][j - 1],    // insertion
          matrix[i - 1][j - 1] // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function App() {
  const [current] = useState(() => getRandomIndex());
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [revealed] = useState(false);
  const [animBlur, setAnimBlur] = useState(BLUR_LEVELS[0]);
  const [shareMsg, setShareMsg] = useState('');

  const celeb = CELEBRITIES[current];
  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1].toLowerCase().trim() : '';
  const answer = celeb.name.toLowerCase().trim();
  const correct =
    guesses.length > 0 &&
    (lastGuess === answer || levenshtein(lastGuess, answer) <= 2);
  const outOfGuesses = guesses.length >= MAX_GUESSES && !correct;
  const blur = correct || revealed || outOfGuesses ? 0 : BLUR_LEVELS[guesses.length];

  // Animate blur reduction only when guesses change
  React.useEffect(() => {
    setAnimBlur((prev) => {
      if (prev === blur) return prev;
      const step = prev > blur ? -1 : 1;
      function animate() {
        setAnimBlur((b) => {
          if (b === blur) return b;
          const next = b + step;
          if ((step < 0 && next < blur) || (step > 0 && next > blur)) return blur;
          requestAnimationFrame(animate);
          return next;
        });
      }
      requestAnimationFrame(animate);
      return prev;
    });
  }, [blur, guesses.length]);

  function handleGuess(e) {
    e.preventDefault();
    if (!guess.trim() || correct || outOfGuesses) return;
    setGuesses([...guesses, guess]);
    setGuess('');
  }

  // Share score handler
  function handleShare() {
    const shareText = `I guessed today's celebrity in ${guesses.length} guesses on Blurdle! Can you beat me? globalplayer.com/blurdle`;
    if (navigator.share) {
      navigator.share({ title: 'Blurdle', text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
      setShareMsg('Score copied to clipboard!');
      setTimeout(() => setShareMsg(''), 3000);
    }
  }

  return (
    <div className="game-container">
      <img className="blurdle-logo" src={blurdleLogo} alt="Blurdle Logo" />
      <div className="image-wrapper">
        <img
          src={celeb.image}
          alt="Blurred celebrity"
          style={{
            filter: `blur(${animBlur}px)`,
            transition: 'filter 0.5s cubic-bezier(0.4,0,0.2,1)',
            width: 320,
            height: 400,
            objectFit: 'cover',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          }}
        />
      </div>
      <form onSubmit={handleGuess} className="guess-form">
        <input
          type="text"
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Enter celebrity name..."
          disabled={correct || outOfGuesses}
          className="guess-input"
        />
        <button className="guess-btn" type="submit" disabled={correct || outOfGuesses || !guess.trim()}>GUESS</button>
      </form>
      <div className="status">
        <p className="status-text">Guesses left: {MAX_GUESSES - guesses.length}</p>
        {guesses.length > 0 && !correct && !outOfGuesses && (
          <p>Last guess: <b>{guesses[guesses.length - 1]}</b></p>
        )}
        {correct && <p className="success">🎉 Correct! It's {celeb.name}!</p>}
        {outOfGuesses && (
          <p className="fail">❌ Out of guesses! It was <b>{celeb.name}</b>.</p>
        )}
        {(correct || outOfGuesses) && (
          <>
            <a
              className="brand-link-btn"
              href={celeb.brand}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`Visit ${(() => {
                if (celeb.name === 'Lady Gaga') return 'Capital FM';
                if (celeb.name === 'Lewis Capaldi') return 'Heart';
                if (celeb.name === 'Cher') return 'Gold Radio';
                if (celeb.name === 'Noel Gallagher') return 'Radio X';
                return 'Brand';
              })()}`}
            </a>
            <div className="share-btn-wrapper">
              <button className="share-btn" onClick={handleShare}>Share Your Score</button>
              {shareMsg && <div className="share-tooltip">{shareMsg}</div>}
            </div>
          </>
        )}
      </div>
        <p className="come-back">Come back tomorrow for another game!</p>
    </div>
  )
}

export default App

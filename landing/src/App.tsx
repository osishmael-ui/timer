import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <>
      {/* Hero Section */}
      <section id="hero">
        <div className="hero-content">
          <div className="eyebrow">For builders who forget to stand</div>
          <h1>Stand up without dropping the thread.</h1>
          <p className="subheadline">
            StandLoop helps coders, founders, and desk workers break up long focus sessions 
            with short, flow-safe movement nudges.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">Add to Chrome</button>
            <button className="btn-secondary">See how it works</button>
          </div>
          <p className="privacy-note">
            No login. No browsing history. Local-first by default.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Start a focus session</h3>
            <p>Tell StandLoop you are building, writing, debugging, or deep in browser work.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Get a movement nudge</h3>
            <p>After a focused stretch, StandLoop suggests a short reset before you stay locked in the chair too long.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Return before drift</h3>
            <p>Breaks are intentionally short, with a gentle nudge when it is time to get back.</p>
          </div>
        </div>
      </section>

      {/* Science-Informed Section */}
      <section id="science">
        <h2>Built around a simple idea: move more, sit less.</h2>
        <p>
          StandLoop is inspired by public health guidance that encourages adults to reduce 
          sedentary time and add light movement into the day. It is not medical advice. 
          It is a practical rhythm tool for long desk sessions.
        </p>
        <p className="disclaimer">
          StandLoop is not a medical device and does not provide medical advice.
        </p>
      </section>

      {/* Chrome Extension Section */}
      <section id="extension">
        <h2>A Chrome extension for browser-based deep work.</h2>
        <p>
          StandLoop works best when you start a focus session. It runs quietly in Chrome, 
          suggests short movement resets, and helps you return before your break turns into a scroll hole.
        </p>
      </section>

      {/* Features Grid */}
      <section id="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>Focus session timer</h3>
            <p>Track your deep work sessions with a simple timer.</p>
          </div>
          <div className="feature">
            <h3>Smart movement nudges</h3>
            <p>Get reminded to move at just the right time.</p>
          </div>
          <div className="feature">
            <h3>Flow-safe breaks</h3>
            <p>Short breaks that don't break your concentration.</p>
          </div>
          <div className="feature">
            <h3>Break drift warning</h3>
            <p>Gentle reminders when your break is getting too long.</p>
          </div>
          <div className="feature">
            <h3>Return-to-work nudge</h3>
            <p>Come back before the idea gets cold.</p>
          </div>
          <div className="feature">
            <h3>Daily Move Score</h3>
            <p>Track your movement habits over time.</p>
          </div>
          <div className="feature">
            <h3>Streaks and badges</h3>
            <p>Stay motivated with gamification that feels good.</p>
          </div>
          <div className="feature">
            <h3>Local-first privacy</h3>
            <p>Your data stays on your device. Always.</p>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy">
        <h2>Privacy First</h2>
        <ul className="privacy-list">
          <li>No browsing history collected</li>
          <li>No page content read</li>
          <li>No login required</li>
          <li>Data stored locally</li>
          <li>No backend for MVP</li>
        </ul>
      </section>

      {/* Footer CTA */}
      <section id="footer-cta">
        <h2>Ready to build healthier habits?</h2>
        <button className="btn-primary">Add to Chrome — It's Free</button>
      </section>
    </>
  )
}

export default App

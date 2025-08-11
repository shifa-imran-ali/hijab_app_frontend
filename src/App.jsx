import React, { useEffect, useState } from "react";
import axios from "axios";
import "./app.css"
import { auth, provider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getIdToken
} from "firebase/auth";
import { FaStar } from "react-icons/fa";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

function StarDisplay({ value }) {
  const v = Math.round(value || 0);
  return (
    <div style={{ display: "flex" }}>
      {[1,2,3,4,5].map(i => (
        <FaStar key={i} color={i <= v ? "#f59e0b" : "#e5e7eb"} style={{ marginRight: 4 }} />
      ))}
    </div>
  );
}

function StarPicker({ value, setValue }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex" }}>
      {[1,2,3,4,5].map(i => (
        <FaStar
          key={i}
          size={24}
          style={{ marginRight: 6, cursor: "pointer" }}
          color={i <= (hover || value) ? "#f59e0b" : "#e5e7eb"}
          onClick={() => setValue(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("auth");
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [styles, setStyles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setMode(u ? "gallery" : "auth");
      if (u) {
        const idToken = await getIdToken(u);
        try {
          await axios.post(`${API_BASE}/auth/session`, { idToken });
        } catch (err) {
          console.error("session sync err", err);
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API_BASE}/styles`);
        setStyles(res.data.styles || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail(""); setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail(""); setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }
  async function handleGoogle() {
    setError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  }
  async function handleLogout() {
    await signOut(auth);
    setSelected(null);
    setMode("auth");
  }

  async function openStyle(s) {
    setSelected(s);
    setMode("style");
    try {
      const res = await axios.get(`${API_BASE}/styles/${s._id || s.id}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avgRating || 0);
    } catch (err) {
      console.error(err);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setError("");
    if (!user) { setError("Sign in to post a review"); return; }
    if (!comment.trim()) { setError("Comment required"); return; }
    try {
      const token = await getIdToken(user);
      const res = await axios.post(`${API_BASE}/styles/${selected._id || selected.id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(prev => [res.data.review, ...prev]);
      setAvgRating(res.data.avgRating);
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message);
    }
  }

  if (mode === "auth") {
    return (
      <div id="auth-container">
        <h2>{isSignup? "Sign Up": "Login"}</h2>
        <form onSubmit={isSignup? handleSignup : handleLogin}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required style={{ width: "95%", padding:8, marginBottom:8 }} />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required style={{ width: "95%", padding:8, marginBottom:8 }} />
          <button type="submit" style={{ width: "100%", padding:8 }}>{isSignup? "Sign Up": "Login"}</button>
        </form>
        <button onClick={handleGoogle} style={{ width:"100%", marginTop:8 }}>Continue with Google</button>
        {error && <div style={{ color: "red", marginTop:8 }}>{error}</div>}
        <p style={{ marginTop: 12 }}>
          {isSignup? "Already have account?" : "Need an account?"}
          <button onClick={()=>{ setIsSignup(!isSignup); setError(""); }} style={{ marginLeft:8 }}>{isSignup? "Login" : "Sign Up"}</button>
        </p>
      </div>
    );
  }

  if (mode === "gallery") {
    return (
      <div id="gallery-container">
        <header id="gallery-header">
          <h1>Hijab Styles</h1>
          <div>
            <span style={{ marginRight:12 }}>{user?.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <div id="style-container">
          {styles.map(s => (
            <div key={s._id || s.id} style={{ border:"1px solid #e5e7eb", padding:12, borderRadius:8 }}>
              <img src={s.imageURL} alt={s.name} style={{ width:"100%", height:160, objectFit:"cover", borderRadius:6 }} />
              <h3 style={{ marginTop:8 }}>{s.name}</h3>
              <p style={{ color:"#374151" }}>{s.description}</p>
              <button onClick={()=>openStyle(s)} style={{ marginTop:8 }}>View</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "style" && selected) {
    return (
      <div id="style-rating">
        <button onClick={()=>{ setMode("gallery"); setSelected(null); }}>← Back</button>
        <div id="rating-container">
          <img src={selected.imageURL} alt={selected.name} id="rating-img" />
          <div style={{ flex:1 }}>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <StarDisplay value={avgRating} />
              <div>{avgRating ? avgRating.toFixed(2) : "No ratings yet"}</div>
            </div>

            <hr style={{ margin: "12px 0" }} />
            <h3>Reviews</h3>
            {user ? (
              <form onSubmit={submitReview} style={{ marginBottom:12 }}>
                <StarPicker value={rating} setValue={setRating} />
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write review..." style={{ width:"100%", minHeight:80, marginTop:8, padding:8 }} />
                <button type="submit" style={{ marginTop:8 }}>Submit</button>
              </form>
            ) : (
              <p>Please sign in to post a review.</p>
            )}
            {error && <div style={{ color:"red" }}>{error}</div>}

            <div>
              {reviews.length === 0 ? <p>No reviews yet</p> : reviews.map(r=>(
                <div key={r._id || r.id} style={{ borderTop:"1px solid #e5e7eb", paddingTop:8, marginTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:600 }}>{r.userEmail || "Anonymous"}</div>
                    <StarDisplay value={r.rating} />
                  </div>
                  <p style={{ marginTop:6 }}>{r.comment}</p>
                  <div style={{ fontSize:12, color:"#6b7280" }}>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return null;
}

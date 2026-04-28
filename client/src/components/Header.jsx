import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthModal from "./AuthModal.jsx";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Hide header inside room views to keep them clean
  if (location.pathname.startsWith("/room/")) return null;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 sm:px-10 py-3 border-b border-white/[0.06]"
        style={{
          background: "rgba(7,7,20,0.88)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <button
          className="flex items-center gap-2 font-black text-white hover:opacity-80 transition-opacity shrink-0"
          onClick={() => navigate("/")}
        >
          <span className="text-xl">🏅</span>
          <div className="leading-none text-left">
            <div
              className="text-base font-black tracking-widest"
              style={{
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PARTY
            </div>
            <div
              className="text-[0.6rem] font-black tracking-[0.3em]"
              style={{
                background: "linear-gradient(90deg, #8b5cf6, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              OLYMPIADE
            </div>
          </div>
        </button>

        {/* Center nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {[
            { label: "Lobby erstellen", path: "/create" },
            { label: "Lobby beitreten", path: "/join" },
            { label: "Game Library", path: "/library" },
          ].map(({ label, path }) => {
            const isActive =
              location.pathname === path ||
              location.pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                className="relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150"
                style={{
                  color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                  background: isActive
                    ? "rgba(139,92,246,0.15)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(139,92,246,0.35)"
                    : "1px solid transparent",
                }}
                onClick={() => navigate(path)}
              >
                {label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm font-semibold text-white hover:border-white/20 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="hidden sm:block">{user.username}</span>
                <span className="text-muted text-xs">▾</span>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 z-20 w-44 rounded-xl border border-white/10 py-1 overflow-hidden"
                    style={{
                      background: "rgba(13,16,36,0.98)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-xs text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                      onClick={() => {
                        navigate("/profile");
                        setShowMenu(false);
                      }}
                    >
                      🏅 My Olympics
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-pink-400 hover:bg-pink-500/10 transition-colors"
                      onClick={() => {
                        logout();
                        setShowMenu(false);
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="btn-primary !py-1.5 !px-4 text-sm"
              onClick={() => setShowModal(true)}
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Spacer so content isn't hidden under fixed header */}
      <div className="h-14" />

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}

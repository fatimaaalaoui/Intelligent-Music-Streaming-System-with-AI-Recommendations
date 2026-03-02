import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoMusic from "../assets/assetes/music.png";

const API = "http://localhost:5000/api";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // step = "login" | "signup" | "setup"
  const [step, setStep] = useState("login");

  useEffect(() => {
    const s = params.get("step");
    if (s === "signup") setStep("signup");
    else setStep("login");
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // user après login/signup
  const [user, setUser] = useState(null);

  // LOGIN
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // SIGNUP
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password2, setPassword2] = useState("");

  // SETUP optionnel
  const [avatar, setAvatar] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState("");

  const title = useMemo(() => {
    if (step === "signup") return "S’inscrire à Music";
    if (step === "setup") return "Finaliser le compte";
    return "Se connecter à Music";
  }, [step]);

  // Normaliser le user pour que Player/Sidebar voient bien _id
  const normalizeUser = (u, fallbackName) => {
    const id = u?._id || u?.id;
    return {
      _id: id,
      id: id,
      name: u?.username || u?.name || u?.email || fallbackName || "User",
      email: u?.email,
      ...u,
    };
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setMsg(null);

    const id = identifier.trim();
    if (!id || !password) {
      setMsg("Merci de remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);

      // 1) vérifier existence
      const ex = await fetch(
        `${API}/users/exists?identifier=${encodeURIComponent(id)}`
      );
      const exData = await ex.json();

      if (!exData.exists) {
        setMsg("Ce compte n'existe pas. Tu dois t’inscrire.");
        if (id.includes("@")) setEmail(id);
        setStep("signup");
        return;
      }

      // 2) login
      const res = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMsg("Mot de passe incorrect. Mot de passe oublié ?");
        return;
      }
      if (res.status === 409 && data?.error === "NO_PASSWORD_SETUP") {
        setMsg(
          "Ce compte n’a pas de mot de passe. Tu dois t’inscrire (créer un nouveau compte)."
        );
        setStep("signup");
        return;
      }
      if (res.status === 404) {
        setMsg("Ce compte n'existe pas. Tu dois t’inscrire.");
        setStep("signup");
        return;
      }
      if (!res.ok) {
        setMsg(data?.error || "Erreur serveur.");
        return;
      }

      setUser(data);

      const normalized = normalizeUser(data);
      if (!normalized._id) {
        console.log("Login response:", data);
        setMsg("Le backend ne renvoie pas _id.");
        return;
      }

      // ✅ Connecte l’app (App.jsx va sauvegarder dans localStorage)
      onLogin?.(normalized);
      navigate("/");
    } catch (err) {
      console.error(err);
      setMsg("Backend inaccessible.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPTION A : register puis auto-login puis onLogin()
  const submitSignup = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password2) {
      setMsg("Merci de remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);

      // 1) REGISTER
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password2,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setMsg("Compte déjà existant. Connecte-toi.");
        setStep("login");
        setIdentifier(email.trim());
        return;
      }
      if (!res.ok) {
        setMsg(data?.error || "Inscription impossible pour l’instant.");
        return;
      }

      // 2) AUTO-LOGIN juste après register
      const loginRes = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email.trim(),
          password: password2,
        }),
      });

      const loginData = await loginRes.json().catch(() => ({}));

      if (!loginRes.ok) {
        // Compte créé mais pas connecté : on garde même UI
        setMsg("Compte créé ✅ Maintenant connecte-toi.");
        setStep("login");
        setIdentifier(email.trim());
        return;
      }

      setUser(loginData);

      const fallbackName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const normalized = normalizeUser(
        { ...loginData, email: loginData?.email || email.trim() },
        fallbackName
      );

      if (!normalized._id) {
        console.log("Auto-login response:", loginData);
        setMsg("Connexion auto impossible (pas de _id). Connecte-toi manuellement.");
        setStep("login");
        setIdentifier(email.trim());
        return;
      }

      // ✅ Maintenant tu es connecté => Player doit devenir “connecté”
      onLogin?.(normalized);

      // Si tu veux passer par la page setup, décommente:
      // setStep("setup");
      // Sinon direct home :
      navigate("/");
    } catch (err) {
      console.error(err);
      setMsg("Inscription impossible pour l’instant.");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!user?._id) return;

    try {
      setLoading(true);

      await fetch(`${API}/users/${user._id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, favoriteGenre }),
      }).catch(() => null);

      const normalized = normalizeUser(user);
      if (!normalized._id) {
        console.log("Setup user:", user);
        setMsg("User invalide (pas de _id).");
        return;
      }

      onLogin?.(normalized);
      navigate("/");
    } catch (err) {
      console.error(err);
      setMsg("Finalisation impossible pour l’instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#010112] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl">
        <div className="w-full rounded-[32px] border border-white/10 bg-[#05051d] shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Colonne gauche */}
            <div className="p-10 md:p-12">
              <div className="flex items-center gap-4">
                <img
                  src={logoMusic}
                  alt="Music"
                  className="w-20 h-20 object-contain mix-blend-multiply"
                />
                <div>
                  <p className="text-white/60 text-sm">Bienvenue sur</p>
                  <p className="text-3xl md:text-4xl font-extrabold text-white">
                    Music<span className="text-violet-500">.</span>
                  </p>
                </div>
              </div>

              <h1 className="mt-10 text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {title.split("Music").map((part, idx, arr) => (
                  <span key={idx}>
                    {part}
                    {idx !== arr.length - 1 ? (
                      <span className="text-violet-500">Music</span>
                    ) : null}
                  </span>
                ))}
              </h1>

              <p className="mt-4 text-base md:text-lg text-white/60">
                {step === "setup"
                  ? "Ajoute une photo / un genre (optionnel), puis continue."
                  : "Crée un compte simple pour garder tes playlists et tes écoutes récentes."}
              </p>
            </div>

            {/* Colonne droite */}
            <div className="p-10 md:p-12 border-t md:border-t-0 md:border-l border-white/10">
              {step === "login" && (
                <form onSubmit={submitLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Nom d’utilisateur (ou email)
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="Fatima..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {msg && <p className="text-sm md:text-base text-red-300">{msg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60
                               py-4 text-base md:text-lg font-bold transition"
                  >
                    {loading ? "Veuillez patienter..." : "Continuer"}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white/60 pt-2">
                    <span>Pas de compte ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMsg(null);
                        setStep("signup");
                      }}
                      className="font-semibold text-violet-400 hover:text-violet-300"
                    >
                      S’inscrire
                    </button>
                  </div>
                </form>
              )}

              {step === "signup" && (
                <form onSubmit={submitSignup} className="space-y-6">
                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Prénom
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="Fatima"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Nom
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="Aharr"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Email
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="fatima@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="••••••••"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                    />
                  </div>

                  {msg && <p className="text-sm md:text-base text-red-300">{msg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60
                               py-4 text-base md:text-lg font-bold transition"
                  >
                    {loading ? "Veuillez patienter..." : "S’inscrire"}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-sm md:text-base text-white/60 pt-2">
                    <span>Déjà un compte ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMsg(null);
                        setStep("login");
                        setIdentifier(email.trim());
                      }}
                      className="font-semibold text-violet-400 hover:text-violet-300"
                    >
                      Se connecter
                    </button>
                  </div>
                </form>
              )}

              {step === "setup" && (
                <form onSubmit={submitSetup} className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-white text-lg md:text-xl font-bold">
                      Bienvenue,{" "}
                      <span className="text-violet-400">
                        {user?.name || user?.username}
                      </span>{" "}
                      🎉
                    </p>
                    <p className="text-white/60 mt-1">
                      (Optionnel) Personnalise ton compte avant d’entrer dans l’app.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      URL photo de profil (optionnel)
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="https://..."
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-white/80 mb-2">
                      Genre préféré (optionnel)
                    </label>
                    <input
                      className="w-full rounded-2xl bg-white/5 border border-white/20 px-5 py-4 text-base md:text-lg
                                 outline-none focus:border-violet-500"
                      placeholder="Hip-Hop, Pop, Rock..."
                      value={favoriteGenre}
                      onChange={(e) => setFavoriteGenre(e.target.value)}
                    />
                  </div>

                  {msg && <p className="text-sm md:text-base text-red-300">{msg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60
                               py-4 text-base md:text-lg font-bold transition"
                  >
                    {loading ? "Finalisation..." : "Entrer dans Music"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full rounded-2xl border border-white/15 bg-transparent hover:bg-white/5
                               py-4 text-base md:text-lg font-semibold transition text-white/80"
                  >
                    Passer
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

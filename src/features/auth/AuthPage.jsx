import { useRef, useState } from "react"
import { CheckersBrand } from "../../components/CheckersBrand"
import { ensureUserProfile, getAuthRedirectUrl } from "../../lib/authProfile"
import { supabase } from "../../lib/supabaseClient"
import "./auth.css"

const usernameRegex = /^[a-zA-Z0-9_]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialPasswordRules = {
  hasMinLength: false,
  hasUppercase: false,
  hasNumber: false,
}

export function AuthPage({ onContinueAsGuest }) {
  const usernameTimeout = useRef(null)
  const [mode, setMode] = useState("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordRules, setPasswordRules] = useState(initialPasswordRules)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmFocused, setConfirmFocused] = useState(false)
  const [formError, setFormError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState({ type: "", message: "" })
  const [confirmStatus, setConfirmStatus] = useState({ type: "", message: "" })

  const isLogin = mode === "login"

  async function checkUsername(value) {
    setUsername(value)
    clearTimeout(usernameTimeout.current)

    if (isLogin || value.length === 0) {
      setUsernameStatus({ type: "", message: "" })
      return
    }

    if (value.length < 6) {
      setUsernameStatus({ type: "error", message: "Minimum 6 characters" })
      return
    }

    if (value.length > 16) {
      setUsernameStatus({ type: "error", message: "Maximum 16 characters" })
      return
    }

    if (!usernameRegex.test(value)) {
      setUsernameStatus({ type: "error", message: "Only letters, numbers and _" })
      return
    }

    usernameTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value)

      if (error) {
        setUsernameStatus({ type: "error", message: "Cannot check username" })
        return
      }

      setUsernameStatus(
        data.length > 0
          ? { type: "error", message: "Username already taken" }
          : { type: "success", message: "Username available" },
      )
    }, 500)
  }

  function checkPassword(value) {
    setPassword(value)
    setPasswordRules({
      hasMinLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    })

    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, value)
    }
  }

  function validateConfirmPassword(value, currentPassword = password) {
    if (value.length === 0) {
      setConfirmStatus({ type: "", message: "" })
      return
    }

    setConfirmStatus(
      value !== currentPassword
        ? { type: "error", message: "Passwords do not match" }
        : { type: "success", message: "Passwords match" },
    )
  }

  function checkConfirmPassword(value) {
    setConfirmPassword(value)
    validateConfirmPassword(value)
  }

  async function signUp() {
    setFormError("")
    setEmailError("")
    setIsSubmitting(true)

    try {
      if (!usernameRegex.test(username) || username.length < 6 || username.length > 16) {
        setUsernameStatus({ type: "error", message: "Choose a valid username" })
        return
      }

      if (!emailRegex.test(email)) {
        setEmailError("Invalid email address")
        return
      }

      if (!passwordRules.hasMinLength || !passwordRules.hasUppercase || !passwordRules.hasNumber) {
        setFormError("Password does not meet the requirements")
        return
      }

      if (password !== confirmPassword) {
        setFormError("Passwords do not match")
        return
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle()

      if (existingProfile) {
        setUsernameStatus({ type: "error", message: "Username already taken" })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      })

      if (error) {
        setFormError(error.message)
        return
      }

      if (data.user) {
        await ensureUserProfile(data.user, { username, email })
      }
    } catch (error) {
      setFormError(error.message ?? "Could not create account")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function login() {
    setFormError("")
    setEmailError("")
    setIsSubmitting(true)

    try {
      let loginEmail = username.trim()

      if (!emailRegex.test(loginEmail)) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", loginEmail)
          .maybeSingle()

        if (error || !profile?.email) {
          setFormError("Enter your email address, or use a valid username with a saved profile.")
          return
        }

        loginEmail = profile.email
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (loginError) {
        setFormError(loginError.message || "Wrong email or password")
        return
      }

      if (data.user) {
        await ensureUserProfile(data.user)
      }
    } catch (error) {
      setFormError(error.message ?? "Could not log in")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signInWithGoogle() {
    setFormError("")
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    })

    if (error) {
      setFormError(error.message)
      setIsSubmitting(false)
    }
  }

  function switchMode() {
    setMode(isLogin ? "signup" : "login")
    setFormError("")
    setEmailError("")
    setUsernameStatus({ type: "", message: "" })
    setConfirmStatus({ type: "", message: "" })
  }

  return (
    <main className="authShell">
      <section className="authLayout">
        <section className="authCard" aria-label={isLogin ? "Login" : "Create account"}>
          <CheckersBrand className="authBrand" />
          <p className="authKicker">{isLogin ? "Back to board" : "Create player"}</p>
          <h2>{isLogin ? "Welcome back" : "Join the arena"}</h2>
          <p className="authText">{isLogin ? "Continue your league climb." : "Your first match is one click away."}</p>

          <input
            type={isLogin ? "email" : "text"}
            placeholder={isLogin ? "Email" : "Username"}
            value={username}
            onChange={(event) => checkUsername(event.target.value)}
          />

          {!isLogin && usernameStatus.message && (
            <p className={usernameStatus.type === "success" ? "successText" : "errorText"}>
              {usernameStatus.message}
            </p>
          )}

          {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          )}

          {emailError && <p className="errorText">{emailError}</p>}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            onChange={(event) => checkPassword(event.target.value)}
          />

          {formError && <p className="errorText">{formError}</p>}

          {!isLogin && passwordFocused && (
            <div className="passwordRules">
              <p className={passwordRules.hasMinLength ? "successText" : "errorText"}>
                Minimum 8 characters
              </p>
              <p className={passwordRules.hasUppercase ? "successText" : "errorText"}>
                One uppercase letter
              </p>
              <p className={passwordRules.hasNumber ? "successText" : "errorText"}>One number</p>
            </div>
          )}

          {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onFocus={() => setConfirmFocused(true)}
            onBlur={() => setConfirmFocused(false)}
            onChange={(event) => checkConfirmPassword(event.target.value)}
          />
          )}

          {confirmFocused && confirmStatus.message && (
            <p className={confirmStatus.type === "success" ? "successText" : "errorText"}>
              {confirmStatus.message}
            </p>
          )}

          <button className="primaryAuthButton" onClick={isLogin ? login : signUp} disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>

          <button className="googleButton" onClick={signInWithGoogle} disabled={isSubmitting}>
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="" />
            Continue with Google
          </button>

          {onContinueAsGuest && (
            <button className="guestButton" onClick={onContinueAsGuest}>
              Continue as guest
            </button>
          )}

          <p className="switchAuth">
            <span className="mutedText">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button type="button" className="authLink" onClick={switchMode}>
              {isLogin ? "Create one" : "Login"}
            </button>
          </p>
        </section>
      </section>
    </main>
  )
}

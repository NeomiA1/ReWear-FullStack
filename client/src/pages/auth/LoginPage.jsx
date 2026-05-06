import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogin = async () => {

    if (!email || !password) {
      alert("יש למלא אימייל וסיסמה");
      return;
    }

    try {

      const response = await fetch(
        "https://rewear-api-ruppin-bkfvbye2fpdtfegm.israelcentral-01.azurewebsites.net/api/Users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!response.ok) {
        alert("אימייל או סיסמה שגויים");
        return;
      }

      const user = await response.json();

      setUser(user);

      navigate("/home");

    } catch (error) {

      console.error(error);
      alert("שגיאה בהתחברות לשרת");

    }
  };

  return (
    <div>

      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

    </div>
  );
}
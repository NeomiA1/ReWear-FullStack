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
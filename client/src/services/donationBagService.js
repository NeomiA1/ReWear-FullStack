import API_BASE_URL from "./api";

function getAuthHeaders() {
  const savedUser = JSON.parse(
    localStorage.getItem("rewear_user") || "null"
  );

  const token = savedUser?.token;

  return {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`
    })
  };
}

/*
 * ללא Content-Type: multipart/form-data דורש שהדפדפן
 * יגדיר בעצמו את ה-boundary.
 */
function getAuthHeaderOnly() {
  const savedUser = JSON.parse(
    localStorage.getItem("rewear_user") || "null"
  );

  const token = savedUser?.token;

  return token ? { Authorization: `Bearer ${token}` } : {};
}


/*
 * יצירת שק חדש
 */
export async function createDonationBag(bag) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bag)
    }
  );

  const data = await response.text();

  if (!response.ok) {
    throw data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}


/*
 * העלאת תמונה לשק קיים
 */
export async function uploadBagMedia(bagId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/DonationBags/${bagId}/media`,
    {
      method: "POST",
      headers: getAuthHeaderOnly(),
      body: formData
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const parsed = JSON.parse(responseText);

      if (parsed?.message) {
        throw parsed.message;
      }
    } catch (error) {
      if (typeof error === "string") {
        throw error;
      }
    }

    throw responseText || "שגיאה בהעלאת התמונה";
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}


/*
 * קבלת כל השקים של המשתמש
 */
export async function getDonationBagsByUserId(userId) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags/user/${userId}`,
    {
      method: "GET",
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw errorText;
  }

  return response.json();
}


/*
 * עריכת פרטי שק קיים
 */
export async function updateDonationBag(bagId, bag) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags/${bagId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        shortDescription: bag.shortDescription ?? "",
        sizes: bag.sizes ?? "",
        targetAges: bag.targetAges ?? "",
        targetGender: bag.targetGender ?? "",
        clothesCondition: bag.clothesCondition ?? "",

        /*
         * ה-Controller לא משנה את הסטטוס דרך PUT,
         * אבל אנחנו שולחים אותו כדי שהמודל יהיה תקין.
         */
        donationStatus:
          bag.donationStatus ||
          bag.status ||
          "Draft"
      })
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const parsed = JSON.parse(responseText);

      if (parsed?.message) {
        throw parsed.message;
      }

      if (Array.isArray(parsed)) {
        throw parsed.join("\n");
      }
    } catch (error) {
      if (typeof error === "string") {
        throw error;
      }
    }

    throw responseText || "שגיאה בעדכון השק";
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}


/*
 * שינוי סטטוס של שק
 */
export async function updateDonationBagStatus(
  bagId,
  status
) {
  const response = await fetch(
    `${API_BASE_URL}/DonationBags/${bagId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),

      /*
       * חשוב:
       * DonationStatus מה-C# מגיע כ-donationStatus
       */
      body: JSON.stringify({
        donationStatus: status
      })
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const parsed = JSON.parse(responseText);

      if (parsed?.message) {
        throw parsed.message;
      }
    } catch (error) {
      if (typeof error === "string") {
        throw error;
      }
    }

    throw responseText || "שגיאה בעדכון סטטוס השק";
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}
import {
  useState,
  useEffect
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useUser
} from "../../context/UserContext";

import BottomNav from "../../components/BottomNav";
import PageContainer from "../../components/PageContainer";
import AssociationRecommendationList from "../../components/AssociationRecommendationList";
import ConfirmDialog from "../../components/ConfirmDialog";

import {
  useConfirmDialog
} from "../../hooks/useConfirmDialog";

import {
  getDonationBagsByUserId,
  updateDonationBagStatus
} from "../../services/donationBagService";

import {
  createDonationRequest
} from "../../services/donationRequestService";

import {
  checkAssociationExists
} from "../../services/associationService";

import {
  getUserDisplayName,
  getUserInitial
} from "../../utils/userDisplay";

import {
  getBagStatusInfo
} from "../../utils/statusLabels";

import {
  getBagCategory
} from "../../utils/associationRecommendation";

import {
  getRecoProfile,
  recordAssociationSelected,
  recordDonatedCategory
} from "../../utils/recommendationHistory";

import {
  recordDonationSent,
  getDonationSendRecord
} from "../../utils/donationSendLog";

import {
  useToast
} from "../../hooks/useToast";


export default function ProfilePage() {
  const navigate = useNavigate();

  const {
    user,
    logout,
    getOrgSettings
  } = useUser();

  const [selectedBag, setSelectedBag] =
    useState(null);

  const [selectedOrg, setSelectedOrg] =
    useState(null);

  const [sent, setSent] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [serverBags, setServerBags] =
    useState([]);

  const [sentBagIds, setSentBagIds] =
    useState([]);

  const [loadingBags, setLoadingBags] =
    useState(false);

  const [bagsError, setBagsError] =
    useState(null);

  const {
    confirm,
    confirmDialogProps
  } = useConfirmDialog();

  const toast = useToast();


  /*
   * טעינת השקים של המשתמש
   */
  useEffect(() => {
    const loadBags = async () => {
      if (!user?.userId) {
        return;
      }

      setLoadingBags(true);
      setBagsError(null);

      try {
        const bagsFromServer =
          await getDonationBagsByUserId(
            user.userId
          );

        setServerBags(
          bagsFromServer
        );

        /*
         * מזהים שקים שכבר נשלחו.
         *
         * הבדיקה מתבצעת גם לפי הסטטוס מהשרת
         * וגם לפי רשומת השליחה המקומית.
         *
         * זה מונע מצב שבו שק שכבר נשלח
         * מופיע שוב אחרי רענון.
         */
        const alreadySentIds =
          bagsFromServer
            .filter((bag) => {
              const status =
                bag.donationStatus ||
                bag.status ||
                "Draft";

              const sendRecord =
                getDonationSendRecord(
                  user.userId,
                  bag.bagId
                );

              const sentByStatus =
                ![
                  "Draft",
                  "Published"
                ].includes(status);

              return (
                sentByStatus ||
                Boolean(sendRecord)
              );
            })
            .map(
              (bag) =>
                bag.bagId
            );

        setSentBagIds(
          alreadySentIds
        );

      } catch (error) {
        console.error(
          "Failed loading bags:",
          error
        );

        setBagsError(
          "לא הצלחנו לטעון את השקים שלך. בדוק/י את החיבור ונסה/י שוב."
        );
      } finally {
        setLoadingBags(false);
      }
    };

    loadBags();

  }, [user]);


  /*
   * שליחת שק לעמותה
   */
  const handleSendToOrg =
    async () => {

      if (
        !selectedBag ||
        !selectedOrg ||
        !user
      ) {
        return;
      }

      /*
       * מונע שליחה חוזרת
       * של אותו שק.
       */
      if (
        sentBagIds.includes(
          selectedBag.id
        )
      ) {
        toast.warning(
          "השק הזה כבר נשלח לעמותה."
        );

        return;
      }

      setSending(true);

      /*
       * משתמשים במשתנה רגיל ולא state
       * כדי לקבל את הערך הנכון מיד.
       */
      let isDemoSend = false;

      try {
        let realAssociation = null;
        let sentRequestId = null;


        /*
         * בדיקה האם העמותה קיימת
         * בפועל בשרת.
         */
        try {
          realAssociation =
            await checkAssociationExists(
              selectedOrg.name,
              selectedOrg.email
            );
        } catch {
          realAssociation = null;
        }


        /*
         * עמותה אמיתית
         */
        if (realAssociation) {

          if (
            !realAssociation.isAvailable
          ) {
            toast.warning(
              "העמותה אינה זמינה לקבלת תרומות כרגע."
            );

            return;
          }


          const request = {
            userId:
              user.userId,

            bagId:
              selectedBag.id,

            associationId:
              realAssociation.associationId,

            deliveryMethod:
              "SelfArrival",

            status:
              "Pending"
          };


          // REWEAR_DEBUG_SUBMIT: temporary, remove after bagId trace is done
          console.log("REWEAR_DEBUG_SUBMIT", {
            selectedBagId: selectedBag.id,
            requestBagId: request.bagId,
            request,
            availableBagIds: availableBags.map((b) => b.id),
            allBagIds: allBags.map((b) => b.id),
            serverBagsCount: serverBags.length,
            serverBagIds: (serverBags || []).map((b) => b.bagId)
          });


          /*
           * יצירת בקשת התרומה
           */
          const result =
            await createDonationRequest(
              request
            );

          sentRequestId =
            result?.requestId ?? null;


          /*
           * עדכון סטטוס השק.
           *
           * לאחר השליחה הוא עובר ל:
           * WaitingForAssociation
           */
          try {
            await updateDonationBagStatus(
              selectedBag.id,
              "WaitingForAssociation"
            );

            /*
             * מעדכנים גם את ה-state המקומי
             * כדי שהשינוי יוצג מיד.
             */
            setServerBags(
              (prev) =>
                prev.map((bag) =>
                  bag.bagId ===
                  selectedBag.id
                    ? {
                        ...bag,

                        donationStatus:
                          "WaitingForAssociation",

                        status:
                          "WaitingForAssociation"
                      }
                    : bag
                )
            );

          } catch (statusError) {
            console.error(
              "bag status update failed:",
              statusError
            );
          }

        }

        /*
         * מצב Demo
         */
        else {

          if (
            !getOrgSettings(
              selectedOrg.name
            ).isAvailable
          ) {
            toast.warning(
              "העמותה אינה זמינה לקבלת תרומות כרגע."
            );

            return;
          }

          isDemoSend = true;
        }


        /*
         * שמירת היסטוריית המלצות
         */
        if (
          user?.userId != null
        ) {
          const activeCauseFilters =
            getRecoProfile(
              user.userId
            ).lastFilters.causes || [];

          recordAssociationSelected(
            user.userId,
            selectedOrg.id,
            activeCauseFilters
          );

          recordDonatedCategory(
            user.userId,
            getBagCategory(
              selectedBag
            )
          );


          /*
           * שמירת השליחה.
           *
           * משמש גם את מסע התרומה
           * וגם כדי לזהות שהשק כבר נשלח.
           */
          recordDonationSent(
            user.userId,
            selectedBag.id,
            {
              associationName:
                selectedOrg.name,

              associationId:
                realAssociation
                  ?.associationId ??
                null,

              requestId:
                sentRequestId
            }
          );
        }


        /*
         * מסמנים את השק כנשלח.
         *
         * ברגע שה-id נכנס לרשימה הזאת,
         * הוא נעלם מהשקים הזמינים לשליחה.
         */
        setSentBagIds(
          (prev) =>
            prev.includes(
              selectedBag.id
            )
              ? prev
              : [
                  ...prev,
                  selectedBag.id
                ]
        );


        setSent(true);


        toast.success(
          "הבקשה נשלחה בהצלחה!",
          {
            description:
              isDemoSend
                ? `${selectedOrg.name} – השליחה נשמרה במצב הדגמה`
                : `${selectedOrg.name} קיבלה את בקשת התרומה שלך`
          }
        );


        /*
         * מנקים את השק והעמותה שנבחרו
         * אחרי השליחה.
         */
        setSelectedBag(null);
        setSelectedOrg(null);


        setTimeout(() => {
          setSent(false);
        }, 2500);

      } catch (error) {
        console.error(
          "Donation request failed:",
          error
        );

        toast.error(
          typeof error === "string"
            ? error
            : "שגיאה בשליחת הבקשה. נסה/י שוב."
        );

      } finally {
        setSending(false);
      }
    };


  /*
   * בחירת עמותה
   */
  const handleSelectOrg = (
    org
  ) => {

    if (
      selectedOrg &&
      selectedOrg.id !== org.id
    ) {

      confirm({
        title:
          "החלפת עמותה",

        message:
          `העמותה שנבחרה תוחלף מ${selectedOrg.name} ל${org.name}.`,

        confirmText:
          "החלף/י עמותה",

        cancelText:
          "ביטול",

        icon:
          "🔁",

        onConfirm: () => {
          setSelectedOrg(org);
        }
      });

      return;
    }

    setSelectedOrg(org);
  };


  /*
   * פתיחת חלון אישור לפני שליחה
   */
  const handleSendClick = () => {

    if (
      !selectedBag ||
      !selectedOrg
    ) {
      return;
    }

    confirm({
      title:
        "שליחת תרומה",

      message:
        `לשלוח את השק ל${selectedOrg.name}?`,

      confirmText:
        "כן, שלח/י",

      cancelText:
        "ביטול",

      icon:
        "📦",

      onConfirm:
        handleSendToOrg
    });
  };


  if (!user) {
    return null;
  }


  /*
   * התאמת הנתונים שמגיעים מהשרת
   * למבנה שבו משתמש ה-UI.
   */
  const allBags =
    (serverBags || []).map(
      (bag, index) => ({
        id:
          bag.bagId,

        size:
          bag.sizes || "",

        age:
          bag.targetAges || "",

        gender:
          bag.targetGender || "",

        condition:
          bag.clothesCondition || "",

        description:
          bag.shortDescription || "",

        /*
         * חשוב:
         * ב-C# השדה הוא DonationStatus
         * ולכן ב-JSON הוא donationStatus.
         */
        status:
          bag.donationStatus ||
          bag.status ||
          "Draft",

        imagePreview:
          null,

        donationDate:
          bag.createdAt
            ? new Date(
                bag.createdAt
              ).toLocaleDateString(
                "he-IL"
              )
            : "",

        index:
          index + 1
      })
    );


  /*
   * רק שקים שעדיין אפשר לשלוח.
   *
   * שק שכבר נשלח לעמותה
   * לא יוצג יותר ברשימה.
   */
  const availableBags =
    allBags.filter(
      (bag) => {

        const sendRecord =
          getDonationSendRecord(
            user.userId,
            bag.id
          );

        const availableStatus =
          [
            "Draft",
            "Published",
            "Rejected"
          ].includes(
            bag.status
          );

        const alreadySent =
          sentBagIds.includes(
            bag.id
          ) ||
          Boolean(
            sendRecord
          );

        return (
          availableStatus &&
          !alreadySent
        );
      }
    );


  return (
    <PageContainer
      className="pb-24 overflow-y-auto"
      wide
    >

      {/* Header */}
      <div className="bg-rw-card px-5 pt-8 pb-6 shadow-sm">

        <div className="flex items-center justify-between mb-4">

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="
              text-xs
              text-rw-sub
              border
              border-rw-border
              rounded-xl
              px-3
              py-1.5
              active:bg-rw-input
            "
          >
            התנתקות
          </button>


          <div className="flex items-center gap-3">

            <div className="flex flex-col items-end">

              <h1 className="font-bold text-rw-title text-lg">
                {getUserDisplayName(
                  user
                )}
              </h1>

              <p className="text-rw-sub text-sm">
                {user.email}
              </p>

              {user.location && (
                <p className="text-rw-sub text-xs mt-0.5">
                  📍 {user.location}
                </p>
              )}

            </div>


            <div
              className="
                w-16
                h-16
                rounded-full
                bg-rw-logo
                flex
                items-center
                justify-center
              "
            >
              <span className="text-white text-2xl font-bold">
                {getUserInitial(
                  user
                )}
              </span>
            </div>

          </div>

        </div>


        <div className="grid grid-cols-2 gap-3">

          <div className="bg-rw-input rounded-xl p-3 text-center">

            <p className="text-2xl font-bold text-rw-title">
              {allBags.length}
            </p>

            <p className="text-xs text-rw-sub mt-1">
              סך הכול שקים
            </p>

          </div>


          <div className="bg-rw-input rounded-xl p-3 text-center">

            <p className="text-2xl font-bold text-rw-title">
              {sentBagIds.length}
            </p>

            <p className="text-xs text-rw-sub mt-1">
              תרומות שנשלחו
            </p>

          </div>

        </div>

      </div>


      <div className="px-5 mt-5 flex flex-col gap-6">

        {/* שלב 1 – בחירת שק */}
        <div>

          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 1 – בחר/י שק לשליחה
          </h2>


          {loadingBags ? (

            <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">

              <p className="text-3xl mb-2">
                ⏳
              </p>

              <p className="text-rw-sub text-sm">
                השקים שלך נטענים...
              </p>

            </div>

          ) : bagsError ? (

            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">

              <p className="text-3xl mb-2">
                ⚠️
              </p>

              <p className="text-red-600 text-sm">
                {bagsError}
              </p>

            </div>

          ) : availableBags.length === 0 ? (

            <div className="bg-rw-card rounded-2xl p-5 text-center shadow-sm">

              <p className="text-3xl mb-2">
                🛍️
              </p>

              <p className="text-rw-sub text-sm">
                אין כרגע שקים זמינים לשליחה
              </p>

              <p className="text-rw-sub text-xs mt-1">
                שקים שכבר נשלחו לעמותה לא מוצגים כאן
              </p>


              <button
                onClick={() =>
                  navigate("/upload")
                }
                className="
                  mt-4
                  bg-rw-btn
                  text-white
                  rounded-xl
                  px-4
                  py-2
                  text-sm
                  font-semibold
                "
              >
                העלאת שק חדש
              </button>

            </div>

          ) : (

            <div
              className="
                flex
                flex-col
                gap-2
                md:grid
                md:grid-cols-2
                xl:grid-cols-3
                md:items-start
              "
            >

              {availableBags.map(
                (bag) => (

                  <div
                    key={bag.id}
                    onClick={() => {
                      // REWEAR_DEBUG_SELECT: temporary, remove after selection trace is done
                      console.log("REWEAR_DEBUG_SELECT", {
                        clickedBagId: bag.id,
                        previousSelectedBagId: selectedBag?.id ?? null,
                        newSelectedBagId: bag.id
                      });
                      setSelectedBag(
                        bag
                      );
                    }}
                    className={`
                      bg-rw-card
                      rounded-2xl
                      p-4
                      shadow-sm
                      border-2
                      transition-all
                      cursor-pointer

                      ${
                        selectedBag?.id ===
                        bag.id
                          ? "border-rw-btn"
                          : "border-transparent"
                      }
                    `}
                  >

                    <div className="flex items-center justify-between">


                      {/* סימון בחירה */}
                      <div className="flex items-center gap-2">

                        {selectedBag?.id ===
                          bag.id && (
                          <span className="text-rw-btn font-bold text-lg">
                            ✓
                          </span>
                        )}

                      </div>


                      <div className="flex items-center gap-3">

                        <div className="flex flex-col items-end gap-1">

                          <div className="flex items-center gap-2">

                            <span
                              className={`
                                text-[10px]
                                font-bold
                                px-2
                                py-0.5
                                rounded-full

                                ${
                                  getBagStatusInfo(
                                    bag.status
                                  ).color
                                }
                              `}
                            >
                              {
                                getBagStatusInfo(
                                  bag.status
                                ).label
                              }
                            </span>


                            <span className="font-semibold text-rw-title text-sm">
                              שק {bag.index}
                            </span>

                          </div>


                          <span className="text-xs text-rw-sub">
                            {[
                              bag.size,
                              bag.gender,
                              bag.condition
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>


                          <span className="text-xs text-rw-sub">
                            {
                              bag.donationDate
                            }
                          </span>

                        </div>


                        <span className="text-2xl">
                          🛍️
                        </span>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* שלב 2 – בחירת עמותה */}
        <div>

          <h2 className="font-bold text-rw-title text-base mb-3">
            שלב 2 – בחר/י עמותה
          </h2>


          <div className="flex justify-end mb-3">

            <button
              onClick={() =>
                navigate("/map")
              }
              className="
                bg-rw-card
                border
                border-rw-border
                rounded-xl
                px-3
                py-2
                flex
                items-center
                gap-1
                text-rw-sub
                text-sm
                active:bg-rw-input
              "
            >
              <span>
                🗺️
              </span>

              <span>
                מפה
              </span>
            </button>

          </div>


          <AssociationRecommendationList
            bag={selectedBag}
            selectedId={
              selectedOrg?.id
            }
            onSelect={
              handleSelectOrg
            }
          />

        </div>


        {/* כפתור שליחה */}
        {selectedBag &&
          selectedOrg &&
          !sent && (

          <div className="bg-rw-card rounded-2xl shadow-sm p-4">

            <div className="flex flex-col gap-1 mb-4 items-end">

              <p className="text-sm text-rw-title font-semibold">
                סיכום:
              </p>

              <p className="text-xs text-rw-sub">
                שק:{" "}
                {[
                  selectedBag.size,
                  selectedBag.gender,
                  selectedBag.condition
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <p className="text-xs text-rw-sub">
                עמותה:{" "}
                {selectedOrg.name}
                {" – "}
                {selectedOrg.city}
              </p>

            </div>


            <button
              onClick={
                handleSendClick
              }
              disabled={
                sending
              }
              className="
                w-full
                bg-rw-btn
                text-white
                rounded-xl
                py-3
                text-sm
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                active:bg-rw-btn-hover
                disabled:opacity-50
              "
            >

              <span>
                {sending
                  ? "⏳"
                  : "📦"}
              </span>

              <span>
                {sending
                  ? "שולח/ת..."
                  : `שלח/י תרומה ל${selectedOrg.name}`}
              </span>

            </button>

          </div>

        )}

      </div>


      <ConfirmDialog
        {...confirmDialogProps}
      />

      <BottomNav
        active="profile"
      />

    </PageContainer>
  );
}